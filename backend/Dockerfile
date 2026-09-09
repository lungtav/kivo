# build stage
FROM node:22-alpine AS builder

WORKDIR /app

COPY package*.json ./

RUN npm ci

COPY . .

RUN npm run build


# production stage
FROM node:22-alpine AS runner

ENV NODE_ENV=production

WORKDIR /app

COPY package*.json ./

RUN npm ci --omit-dev

COPY --from=builder --chown=node:node /app/dist ./dist

# SQL migrations for the one-shot migrate service (see compose.yaml).
# tsc doesn't emit .sql files, so they are copied explicitly.
COPY --from=builder --chown=node:node /app/src/infrastructure/database/migrations ./migrations

USER node

EXPOSE 5000

CMD ["node", "dist/server.js"]