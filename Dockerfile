FROM node:22-alpine

WORKDIR ./app

COPY package.json ./
COPY package-lock.json ./

COPY apps/backend/package.json ./apps/backend/package.json
COPY apps/backend/package-lock.json ./apps/backend/package-lock.json

COPY apps/queue/package.json ./apps/queue/package.json
COPY apps/queue/package-lock.json ./apps/queue/package-lock.json

COPY apps/frontend/package.json ./apps/frontend/package.json
COPY apps/frontend/package-lock.json ./apps/frontend/package-lock.json

COPY packages/config/package.json ./packages/config/package.json
COPY packages/config/package.json ./packages/config/package.json

COPY packages/database/package.json ./packages/database/package.json
COPY packages/database/package.json ./packages/database/package.json

RUN pnpm install 

COPY . . 

RUN pnpm 