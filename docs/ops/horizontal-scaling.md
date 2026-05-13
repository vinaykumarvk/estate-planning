# Horizontal Scaling Guide (NFR-003)

## Database Migration: SQLite → PostgreSQL

Phase 1 uses SQLite for rapid development. For production horizontal scaling:

1. **Replace datasource** in `prisma/schema.prisma`:
   ```prisma
   datasource db {
     provider = "postgresql"
     url      = env("DATABASE_URL")
   }
   ```
2. Run `npx prisma migrate dev` to generate PostgreSQL migrations.
3. Use connection pooling (PgBouncer or Prisma Accelerate).

## Stateless Express

The Express API server is stateless by design:
- No in-memory session state
- All state stored in the database
- API key authentication via database lookup
- Any instance can handle any request

To scale horizontally:
- Deploy multiple instances behind a load balancer (e.g., AWS ALB, nginx)
- Use sticky sessions only if WebSocket features are added later

## Redis Rate Limiting

Replace the in-memory rate limiter with Redis:
```typescript
import RedisStore from "rate-limit-redis";
import { createClient } from "redis";

const redisClient = createClient({ url: process.env.REDIS_URL });
const limiter = rateLimit({
  store: new RedisStore({ sendCommand: (...args) => redisClient.sendCommand(args) }),
  windowMs: 60000,
  max: 100
});
```

## External File Storage

Replace base64 file storage with S3-compatible storage:
- Configure `AWS_S3_BUCKET` and `AWS_REGION` environment variables
- Update `fileUploadService.ts` to use `@aws-sdk/client-s3`
- Store only the S3 key in `FileAttachment.storageLocation`

## Monitoring

- Health probes: `/api/health/live` and `/api/health/ready`
- Metrics: Integrate Prometheus via `prom-client`
- Logging: Structured JSON logs to stdout for aggregation
