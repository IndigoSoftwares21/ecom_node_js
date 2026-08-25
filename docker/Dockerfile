FROM node:22-bookworm-slim AS builder

WORKDIR /app

COPY package*.json ./
RUN npm ci

COPY tsconfig.json tsconfig.build.json knexfile.ts ./
COPY src ./src
COPY scripts ./scripts
COPY migrations ./migrations
COPY stubs ./stubs

RUN npm run build


FROM node:22-bookworm-slim AS runner

ENV NODE_ENV=production

WORKDIR /app

COPY package*.json ./
RUN npm ci --omit=dev && npm cache clean --force

COPY --from=builder /app/dist ./dist

RUN mkdir -p /app/dist/uploads && chown -R node:node /app/dist/uploads
USER node

EXPOSE 7070

CMD ["node", "dist/src/app.js"]
