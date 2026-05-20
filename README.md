# Estate Planning Platform

Configuration-first estate-planning platform based on `Estate_Planning_Platform_BRD_v2.md`.

## Stack

- React + Vite front office, middle office, and back office UI
- Express API
- Prisma client with a local SQLite development database
- Vitest service tests

## Local Setup

```bash
npm install
npm run db:generate
npm run db:push
npm run db:seed
npm test
npm run build
npm run dev
```

The web app runs on `http://127.0.0.1:5173`.
The API runs on `http://127.0.0.1:4000`.

## Seeded Roles

- `solicitor@example.test` - E&W solicitor, document approver
- `notary@example.test` - Portugal notary, document approver
- `paralegal@example.test` - intake and matter workflow user

## Seeded Data

- Tenant: `Ecobank Africa`
- Jurisdiction packs: England & Wales wills pack, Portugal wills pack
- Matter: `Morgan family cross-border will`
- Locales: `en-GB`, `pt-PT`
- AI policy/evaluation: local deterministic policy evaluator records
- Back-office governance: UPL opinions, release gates, pack velocity, regulatory monitors, insurance, deferred feature gates

## Verification

```bash
npm run lint:requirements
npm test
npm run typecheck
npm run build
```

`npm run db:push` uses `scripts/db-push.ts` to apply Prisma's datamodel diff through the local `sqlite3` binary. This avoids the opaque Prisma schema-engine failure seen in this environment while keeping schema generation reproducible from `prisma/schema.prisma`.
