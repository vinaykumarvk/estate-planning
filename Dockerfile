# ---- Stage 1: Build ----
FROM node:20-bookworm-slim AS build

WORKDIR /app

RUN apt-get update \
  && apt-get install -y --no-install-recommends openssl ca-certificates \
  && rm -rf /var/lib/apt/lists/*

COPY package.json package-lock.json ./
RUN npm ci

COPY prisma ./prisma
RUN npx prisma generate

COPY shared ./shared
COPY client ./client
COPY server ./server
COPY scripts ./scripts
COPY index.html tsconfig.json tsconfig.node.json vite.config.ts ./

ARG VITE_API_KEY=demo-api-key
ARG VITE_USER_ID=user-solicitor
ENV VITE_API_KEY=$VITE_API_KEY
ENV VITE_USER_ID=$VITE_USER_ID

RUN npm run build

# ---- Stage 2: Production ----
FROM node:20-bookworm-slim

WORKDIR /app

RUN apt-get update \
  && apt-get install -y --no-install-recommends openssl ca-certificates \
  && rm -rf /var/lib/apt/lists/*

COPY package.json package-lock.json ./
RUN npm ci --omit=dev

COPY prisma ./prisma
RUN npx prisma generate

COPY --from=build /app/dist/client ./dist/client
COPY --from=build /app/dist-server ./dist-server

RUN groupadd -r appuser && useradd -r -g appuser -d /app appuser \
  && chown -R appuser:appuser /app
USER appuser

ENV NODE_ENV=production
ENV PORT=8080
ENV CLIENT_DIR=/app/dist/client
EXPOSE 8080

CMD ["node", "dist-server/server/index.js"]
