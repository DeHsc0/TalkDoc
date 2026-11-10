FROM node:22-alpine

WORKDIR /app

COPY package.json ./
COPY pnpm-lock.yaml ./
COPY pnpm-workspace.yaml ./

COPY . . 

RUN npm install -g pnpm && pnpm install 

RUN pnpm build 

CMD [ "turbo" , "run" , "start" ]