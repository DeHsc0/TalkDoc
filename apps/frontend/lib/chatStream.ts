"use client"

/**
 * Streaming client for POST /api/chats.
 *
 * Verified backend protocol (apps/backend/src/controllers/chat.controller.ts):
 * - Content-Type: text/plain, Transfer-Encoding: chunked
 * - The server writes raw JSON objects back to back with NO delimiter:
 *     {"data":{"agentRes":"…"}}…
 * - The run's structured payload ({ result, references }) arrives as ONE
 *   agentRes event whose value is a JSON string; that event is the completion
 *   signal — the backend never ends the response itself.
 * - Errors arrive as a regular (non-chunked) JSON body with 4xx/5xx status.
 */

const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL ?? "http://localhost:3001/api"

export class ChatStreamError extends Error {
  constructor(
    message: string,
    public readonly status?: number
  ) {
    super(message)
    this.name = "ChatStreamError"
  }
}

/**
 * Incrementally extracts complete JSON objects from a stream that concatenates
 * them without delimiters. Tracks brace depth and string/escape state so
 * braces inside strings never break object boundaries.
 */
export class ConcatenatedJsonParser {
  private buffer = ""

  /** Feeds a decoded chunk and returns every complete object it completes. */
  push(chunk: string): unknown[] {
    this.buffer += chunk
    const events: unknown[] = []
    let depth = 0
    let start = -1
    let inString = false
    let escaped = false

    for (let i = 0; i < this.buffer.length; i++) {
      const char = this.buffer[i]

      if (inString) {
        if (escaped) escaped = false
        else if (char === "\\") escaped = true
        else if (char === '"') inString = false
        continue
      }
      if (char === '"') {
        if (depth > 0) inString = true
        continue
      }
      if (char === "{") {
        if (depth === 0) start = i
        depth++
      } else if (char === "}") {
        if (depth === 0) continue
        depth--
        if (depth === 0 && start >= 0) {
          const raw = this.buffer.slice(start, i + 1)
          try {
            events.push(JSON.parse(raw))
          } catch {
            // A malformed object must not kill the whole stream.
          }
          this.buffer = this.buffer.slice(i + 1)
          // Restart the scan on the remaining buffer.
          i = -1
          start = -1
        }
      }
    }

    // Keep only an incomplete tail in the buffer.
    if (start > 0) this.buffer = this.buffer.slice(start)
    return events
  }
}

export interface CitationReference {
  pageNumber: number
  pageContent: string
}

export interface AgentResult {
  result: string
  references: CitationReference[]
}

export interface ChatStreamEvent {
  toolCalls?: unknown
  /** New protocol: a JSON string of { result, references }. */
  agentRes?: string
  /** Hook point: the backend does not currently emit this (integration blocker). */
  conversationId?: string
  message?: string
  error?: string
}

export interface SendMessageInput {
  searchQuery: string
  docId: string
  /** Omitted entirely for new conversations — never sent as null/undefined. */
  conversationId?: string
}

export interface SendMessageHandlers {
  onTextDelta: (delta: string) => void
  /** Fires when a structured { result, references } payload is parsed. */
  onResult: (payload: AgentResult) => void
  onToolActivity: () => void
  onConversationId: (conversationId: string) => void
}

/**
 * Parses the agent's structured payload. The backend serializes
 * `{ result, references }` to a string inside the agentRes field.
 * Returns null when the payload is a legacy plain-text delta.
 */
export function parseAgentResult(raw: string): AgentResult | null {
  if (!raw.startsWith("{")) return null
  try {
    const parsed = JSON.parse(raw) as { result?: unknown; references?: unknown }
    if (typeof parsed.result !== "string") return null
    const references = Array.isArray(parsed.references)
      ? parsed.references.filter(
          (entry): entry is CitationReference =>
            typeof entry === "object" &&
            entry !== null &&
            typeof (entry as CitationReference).pageNumber === "number" &&
            typeof (entry as CitationReference).pageContent === "string"
        )
      : []
    return { result: parsed.result, references }
  } catch {
    return null
  }
}

/**
 * Sends a chat message and streams the response through the handlers.
 * Resolves when the stream completes (connection close).
 */
export async function streamChatMessage(
  getToken: () => Promise<string | null>,
  input: SendMessageInput,
  handlers: SendMessageHandlers,
  signal?: AbortSignal
): Promise<void> {
  const token = await getToken()
  if (!token) {
    throw new ChatStreamError("Your session has expired. Sign in again to continue.", 401)
  }

  // Build the body explicitly so an absent conversationId is a genuinely
  // absent property — never null, never undefined.
  const body: Record<string, string> = {
    searchQuery: input.searchQuery,
    docId: input.docId,
  }
  if (input.conversationId) {
    body.conversationId = input.conversationId
  }

  const response = await fetch(`${API_BASE_URL}/chats`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${token}`,
    },
    body: JSON.stringify(body),
    signal,
  })

  if (!response.ok) {
    let message = "The assistant could not answer. Try again."
    try {
      const parsed = JSON.parse(await response.text())
      if (typeof parsed.message === "string") message = parsed.message
      else if (typeof parsed.error === "string") message = parsed.error
    } catch {
      // Keep the default message.
    }
    if (response.status === 401) {
      message = "Your session has expired. Sign in again to continue."
    }
    throw new ChatStreamError(message, response.status)
  }

  if (!response.body) {
    throw new ChatStreamError("The assistant response could not be read.")
  }

  const parser = new ConcatenatedJsonParser()
  const reader = response.body.getReader()
  const decoder = new TextDecoder()

  try {
    for (;;) {
      const { done, value } = await reader.read()
      if (done) break

      for (const event of parser.push(decoder.decode(value, { stream: true }))) {
        const typed = event as { data?: ChatStreamEvent }
        const data = typed?.data
        if (!data) continue
        if (typeof data.agentRes === "string" && data.agentRes.length > 0) {
          // The backend may send either the structured payload
          // (JSON.stringify of { result, references }) or legacy plain-text
          // deltas. Detect which and route accordingly.
          const structured = parseAgentResult(data.agentRes)
          if (structured) {
            handlers.onResult(structured)
            // The structured payload is the completion signal — the backend
            // does not end the response, so stop reading and release the
            // connection instead of waiting for a close that never comes.
            await reader.cancel()
            return
          }
          handlers.onTextDelta(data.agentRes)
        }
        if (data.toolCalls !== undefined) {
          handlers.onToolActivity()
        }
        if (typeof data.conversationId === "string" && data.conversationId.length > 0) {
          handlers.onConversationId(data.conversationId)
        }
      }
    }
  } catch (error) {
    if (error instanceof DOMException && error.name === "AbortError") {
      return // User pressed Stop; partial output is kept.
    }
    throw new ChatStreamError("The connection to the assistant was interrupted.")
  }
}
