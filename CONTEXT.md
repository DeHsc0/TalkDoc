# TalkDoc — Project Context

> AI-powered "chat with your PDF documents" application (RAG system). Users upload PDFs, the text is extracted/chunked/embedded into Qdrant, and users chat with their documents via an LLM through a LangChain/LangGraph pipeline.

---

## 1. Repository Layout

pnpm (v9) + Turborepo monorepo, TypeScript 5.9, Node ≥ 18.

```
apps/
  frontend/    @repo/frontend — Next.js 16 client app
  backend/     @repo/backend  — Express 5 API (port 3001)
  queue/       @repo/queue    — BullMQ worker process (PDF ingestion + chat persistence)
packages/
  config/            @repo/config   — shared infra clients (embeddings, Qdrant, Redis)
  database/          @repo/database — Drizzle ORM schema + migrations (Postgres)
  ui/                @repo/ui       — shared React components (stub, currently unused by frontend)
  eslint-config/     shared ESLint flat configs
  typescript-config/ shared tsconfigs (base, nextjs, react-library)
turbo.json, pnpm-workspace.yaml, package.json, README.md (stale — still the Turborepo starter readme)
```

### Workspace dependency graph
- `backend` → `config`, `database`, `queue`, `typescript-config`
- `queue` → `config`, `database`
- `frontend` → `typescript-config` (types are duplicated locally, no shared types package)

### Root scripts
| Script | Command |
|---|---|
| `dev` | `turbo run dev dev:worker` (API + worker together) |
| `build` / `lint` / `check-types` | `turbo run …` |
| `db:migrate` / `db:generate` / `db:push` | drizzle-kit via `@repo/database` |
| `format` | prettier |

---

## 2. Tech Stack

- **Monorepo:** pnpm 9 + Turborepo 2.7
- **Frontend:** Next.js 16.1.6 (App Router), React 19.2.3, Tailwind CSS v4, shadcn/ui + Radix, Zustand 5, react-hook-form + zod, GSAP + Three.js (`@react-three/fiber`), next-themes, sonner, lucide-react
- **Backend:** Express 5, `@clerk/express`, svix (Clerk webhooks), multer, zod, tsx (dev)
- **AI/RAG:** LangChain v1 (`createAgent`), ChatDeepSeek LLM, Google GenAI embeddings (`gemini-embedding-001`), Qdrant vector store (`@langchain/qdrant`), LangGraph with Redis checkpointer (`RedisSaver`, TTL 3600s)
- **Async:** BullMQ + Redis (two queues)
- **DB:** Drizzle ORM + PostgreSQL (Supabase, `ssl: require`)
- **Vector DB:** Qdrant Cloud (collection `docs`)

---

## 3. Environment Variables

| Var | Where used | Purpose |
|---|---|---|
| `PORT` (default 3001) | backend | HTTP port |
| `DATABASE_URL` | `@repo/database` | Supabase Postgres |
| `REDIS_URL` | BullMQ, ioredis cache, LangGraph checkpointer | Redis (external, db 2) |
| `GOOGLE_API_KEY` | `@repo/config` embeddings | Gemini embeddings |
| `DEEPSEEK_API_KEY` | `backend/src/config/ai.ts` | Chat LLM |
| `QDRANT_URL`, `QDRANT_API` | `@repo/config` | Qdrant Cloud (⚠️ backend `.env` defines `QDRANT_API_KEY` while config reads `QDRANT_API` — mismatch, Qdrant client likely unauthenticated) |
| `CLERK_PUBLISHABLE_KEY`, `CLERK_SECRET_KEY`, `CLERK_SIGNING_SECRET` | backend + frontend | Clerk auth + webhook signing |
| `NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY` | frontend | Clerk client |

`.env` files live at repo root, `apps/backend`, `apps/frontend`, and `packages/config`. No `.env.example` files exist and live credentials are present in-tree — they should be rotated and gitignored.

---

## 4. Database Schema (`packages/database/src/schema.ts`)

- **users** — uuid PK, unique `clerkId`, `userName`, `email`, timestamps
- **docs** — uuid PK, FK `usersClerkId → users.clerkId` (cascade), `title`, `description`, `pages`, `size`, `createdAt`; indexed on `usersClerkId`
- **conversations** — FK user + `docId → docs.id` (cascade), `title`; indexed on user & doc
- **chats** — FK user + `conversationId → conversations.id` (cascade), `aiResponse`, `usersResponse` (≤600 chars), `createdAt`; indexed on user & conversation

Migrations: `packages/database/drizzle/` (0000–0004), managed with drizzle-kit.

---

## 5. Backend (`apps/backend`)

**Entry:** `src/app.ts` — `dotenv/config`, `clerkMiddleware()`, `express.json()`, CORS, mounts `apiRouter` at `/api`, listens on `PORT || 3001`.

### Routes
| Mount | Endpoints |
|---|---|
| `POST /api/webhook` | Clerk user webhook (svix-verified; handles `user.created` / `user.updated` / `user.deleted`) |
| `POST /api/doc` | `createDoc` — multer upload, enqueues `file-processing` job and **blocks** on `job.waitUntilFinished` |
| `GET /api/doc` | `getDocs` — user's docs list |
| `DELETE /api/doc/:docId` | `deleteDoc` — deletes Qdrant vectors by `metadata.docId`, then the Postgres row |
| `POST /api/chats` | `chatDoc` — streaming RAG chat (text/plain, chunked) |
| `GET /api/chats/:docId/:conversationId` | `getChats` — chat history, newest first |
| `GET /api/conversations/:docId` | `getConversations` |

### Chat flow (`src/controllers/chat.controller.ts`)
1. `getAuth(req)` → userId; zod-validates `chatSchema` (`searchQuery` ≤600, `docId`, optional `conversationId`).
2. Redis cache (key `userId:conversationId`) stores docId + last 10 responses (TTL 3600s). On miss: verifies doc ownership in Postgres, generates a conversation **title via LLM** if no `conversationId` exists, inserts a `conversations` row, loads/caches prior chats.
3. Streams `agent.streamEvents(...)` (LangGraph) with context `{docId, userId}` — writes tool-call info and text deltas as JSON lines.
4. On completion, enqueues `{searchQuery, conversationId, userId, aiResponse}` to `ingestPastResQueue` to persist the Q/A pair.

### AI config (`src/config/ai.ts`)
- `ChatDeepSeek` (model `"deepseek-flash"` — nonstandard; real DeepSeek models are `deepseek-chat`/`deepseek-reasoner`).
- LangChain v1 `createAgent` with a `retrieveContext` tool: Qdrant search in collection `docs` (top 5), filtered by `metadata.docId` + `metadata.userId` from `contextSchema`.
- Structured output `aiResponseSchema` (`id`, `text`); checkpointer `RedisSaver.fromUrl(REDIS_URL, { defaultTTL: 3600 })`.

### Uploads (`src/middlewares/uploads.ts`)
Multer disk storage into `apps/backend/uploads/`, timestamped-random filenames, 5 MB limit. Zod accepts pdf/jpeg/png but **only PDF is actually processed**.

### Validation (`src/types/zod.ts`)
`fileSchema`, `docCreationSchema`, `chatSchema`, `aiResSchema`.

### Auth
Clerk globally via middleware; per-route `getAuth(req)`; every query checks `usersClerkId` for ownership. No roles. User rows synced via svix-verified webhook.

### Error handling
No global error middleware; per-controller try/catch returning `{success, message}` with 400/500 (and some odd 300/301/302 codes). Auth/validation failures in `chatDoc` use `res.end({...})` with an object — a bug.

---

## 6. Queue Worker (`apps/queue`)

BullMQ queues defined in `apps/queue/src/index.ts`; workers in `src/worker/index.ts` (ESM, separate process, `dev:worker` / `start:worker`).

- **`file-processing`** — PDF ingestion pipeline:
  `PDFLoader` (pdfjs legacy, splitPages) → `CharacterTextSplitter` (chunkSize 1500, overlap 200) → insert `docs` row (title/description/pages/size) → tag chunks with `docId`/`userId` metadata → upsert into Qdrant collection `docs` → delete the uploaded temp file.
- **`ingest-past-res`** — persists chat Q/A pairs into the `chats` table after streaming completes.

---

## 7. Shared Config (`packages/config/config.ts`)

- `GoogleGenerativeAIEmbeddings` (`gemini-embedding-001`, `GOOGLE_API_KEY`)
- `QdrantClient` (reads `QDRANT_API` / `QDRANT_PORT` from env)
- `getConnection()` → new ioredis client from `REDIS_URL`

---

## 8. Frontend (`apps/frontend`)

### Pages (App Router)
| Route | Status | Notes |
|---|---|---|
| `/` | Implemented | Landing page: GSAP-animated pill nav (Home / How it Works / SignUp), WebGL "Silk" shader background (`components/Silk.jsx`), dark theme `#0E0E0E`, accent `#CCFF3A` |
| `/dashboard` | Implemented | Authenticated doc dashboard: fetches docs, search, grid/column ToggleGroup, DocCards, "New Doc" dialog, shadcn `SidebarProvider` |
| `/chats/[docId]` | **Empty — not implemented** | Chat view; `ChatSideBar.tsx` is built but unused |

`proxy.ts` — `clerkMiddleware` with `/` as the only public route; everything else redirects to `/`.

### Components
`AppSideBar` (My Collection / Starred / Settings), `ChatSideBar`, `DocCard` (metadata, rename/delete/open-chat menu), `DocCreation` (react-hook-form + zod, multipart POST), `Silk.jsx` (WebGL background), `theme-provider`, `components/ui/` (12 shadcn primitives).

### State & data
- Zustand store `useSideBarMenu` (sidebar selection); otherwise local `useState`. No React Query/SWR.
- **API calls are inline `axios` with hardcoded `http://localhost:3001/api`** (no env var, no axios instance).
- Auth: `Authorization: Bearer ${await getToken()}` from Clerk's `useAuth()`.
- Zod runtime validation in `types/zod.ts`: `docSchema`, `docCreationSchema`, `chatsSchema`, `chatsDataSchema`.
- Fonts: `Space_Mono` + `Rubik` (Tailwind utilities `font-space`, `font-rubik`).

### Realtime
None — no WebSocket/SSE/polling. Chat UI is planned to consume the streaming backend (`chatsDataSchema` already models `aiResponse` / `usersResponse` pairs).

---


## 10. Development Quick Reference

```bash
pnpm install
pnpm dev          # runs backend API + queue worker (turbo)
pnpm dev --filter @repo/frontend   # frontend
pnpm db:generate  # drizzle-kit generate
pnpm db:migrate   # drizzle-kit migrate
pnpm db:push      # drizzle-kit push
pnpm build / lint / check-types / format
```

Required services: Supabase Postgres, Redis, Qdrant Cloud, Clerk app, Google AI API key, DeepSeek API key.
