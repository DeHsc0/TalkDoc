FROM node:22-alpine

WORKDIR /app

COPY package.json ./
COPY pnpm-lock.json ./
COPY pnpm-workspace.json ./

COPY apps/backend/package.json ./apps/backend/package.json

COPY apps/queue/package.json ./apps/queue/package.json

COPY apps/frontend/package.json ./apps/frontend/package.json

COPY packages/config/package.json ./packages/config/package.json

COPY packages/database/package.json ./packages/database/package.json

RUN npm install -g pnpm && pnpm install 

COPY . . 

RUN pnpm build 

CMD [ "turbo" , "run" , "start" ]