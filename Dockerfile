FROM node:22-alpine

WORKDIR /app

COPY package*.json ./

RUN npm ci --only=production

COPY .next ./.next
COPY public ./public
COPY package.json ./

EXPOSE 3000

ENV NODE_ENV=production

CMD ["npm", "start"]
