FROM node:20-bookworm-slim AS base

WORKDIR /app

RUN apt-get update \
  && apt-get install -y --no-install-recommends openssl ca-certificates \
  && rm -rf /var/lib/apt/lists/*

COPY package.json package-lock.json ./
RUN npm ci

COPY . .
RUN npm run db:generate \
  && npm run build

RUN groupadd -r appuser && useradd -r -g appuser -d /app appuser \
  && chown -R appuser:appuser /app
USER appuser

EXPOSE 4000

CMD ["sh", "-c", "npm run db:push && npm run db:seed && npm run start"]
