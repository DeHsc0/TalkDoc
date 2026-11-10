FROM node:22-alpine

WORKDIR /app

RUN npm install -g pnpm

COPY . . 

RUN pnpm install && pnpm dlx turbo run build 

EXPOSE 3000 
EXPOSE 3001

CMD [ "turbo" , "run" , "start" ]