# Deployment Report: estate-planning

**Date**: 2026-05-18
**Target**: estate-planning (full-stack: React SPA + Express API)
**Project**: puda-489215
**Region**: asia-southeast1
**Service URL**: https://estate-planning-40220923312.asia-southeast1.run.app

## Preflight Summary

| Field | Value |
|-------|-------|
| Target | Full-stack (React SPA + Express API + PostgreSQL) |
| Tech Stack | Node 20, TypeScript, Vite, Express, Prisma 5.22 |
| Dockerfile | Dockerfile (multi-stage, node:20-bookworm-slim) |
| Cloud Project | puda-489215 |
| Cloud Region | asia-southeast1 |
| Cloud SQL | puda-db (database: estate_planning) |
| Current Revision | estate-planning-00004-f4k |
| Commit | 98d8efc (branch: chore/codebase-sweep-2026-05-13) |
| Docker Desktop | Not running — cloud-only mode |

## Environment Variable Inventory

| Variable | Required | Default | Cloud Run | Status |
|----------|----------|---------|-----------|--------|
| NODE_ENV | Yes | development | production (env var) | OK |
| PORT | Yes | 4000 | 8080 (Dockerfile) | OK |
| DATABASE_URL | Yes | None | Secret Manager (estate-planning-database-url) | OK |
| CORS_ORIGIN | No | http://127.0.0.1:5173 | * (env var) | OK |
| CLIENT_DIR | No | ../dist/client | /app/dist/client (Dockerfile) | OK |
| WEBHOOK_HMAC_KEY | Yes | None | Secret Manager (estate-planning-webhook-hmac-key) | OK |
| PRISMA_CONNECTION_LIMIT | No | None | Not set | OK |
| PRISMA_LOG | No | None | Not set | OK |

## Readiness Audit Scorecard

| # | Check | Severity | Status | Evidence |
|---|-------|----------|--------|----------|
| 1.1-1.4 | Environment variables | - | PASS | All 6 env vars accounted for |
| 2.1 | Dependency completeness | - | PASS | All runtime deps in dependencies |
| 2.2 | Dockerfile audit | P0 | FIXED | Missing index.html COPY |
| 2.3 | Asset availability | - | PASS | No external assets |
| 2.4 | Version compatibility | - | PASS | React 18.3.1 matches |
| 2.5 | Path mapping | - | PASS | dist/client + dist-server aligned |
| 2.6 | Relative paths | P0 | FIXED | ESM imports missing .js extensions |
| 2.7 | Duplicate config | - | PASS | No conflicts |
| 2.8 | Code cleanup | - | PASS | Build clean |
| 2.9 | Build tool production | - | PASS | vite/vitest in devDependencies |
| 2.10 | Cloud Run PORT | - | PASS | process.env.PORT, binds 0.0.0.0 |
| 2.11 | Docker include/exclude | P3 | FIXED | Added outputs/ to .dockerignore |
| 2.12 | CORS configuration | P1 | FIXED | trust proxy for Cloud Run LB |
| 2.13 | Health check | - | PASS | /api/health, /live, /ready public |
| 2.14 | Local build | - | PASS | Client + server build OK |
| - | Auth middleware | P1 | FIXED | Non-API paths blocked by requireApiKey |

## Fixes Applied

| # | File | Fix | Severity | Verified |
|---|------|-----|----------|----------|
| 1 | Dockerfile:19 | Added `index.html` to COPY | P0 | Yes - build passes |
| 2 | Dockerfile:19 | Added `scripts` to COPY | P0 | Yes - ESM fix runs in Docker |
| 3 | .dockerignore | Added `outputs/`, `.github/` exclusions | P3 | Yes |
| 4 | package.json | Added post-build ESM import fixer | P0 | Yes - 68 files fixed |
| 5 | scripts/fix-esm-imports.mjs | New: adds .js extensions to compiled ESM | P0 | Yes |
| 6 | server/app.ts | Added `trust proxy` for production | P1 | Yes - no rate limit errors |
| 7 | server/middleware/auth.ts | Skip API key check for non-API paths | P1 | Yes - SPA loads |

## Cloud Infrastructure Created

| Resource | Name | Project |
|----------|------|---------|
| Secret | estate-planning-database-url | puda-489215 |
| Secret | estate-planning-webhook-hmac-key | puda-489215 |
| Cloud Run Service | estate-planning | puda-489215 |
| IAM Binding | 40220923312-compute → secretAccessor | puda-489215 |

## Cloud Sanity Results

| Check | Expected | Actual | Status |
|-------|----------|--------|--------|
| Service deployed | Running | Running | PASS |
| Health endpoint | 200 + JSON | `{"status":"ok","tenants":1,"packs":2}` | PASS |
| Health/live | 200 | 200 | PASS |
| Health/ready | 200 | `{"status":"ready","tenants":1}` | PASS |
| Root page | 200 + HTML | 200, 409B | PASS |
| JS bundle | 200 | 200, 859KB | PASS |
| CSS bundle | 200 | 200, 38KB | PASS |
| API bootstrap | Tenant + data | Ecobank Africa, 62 matters, 2 packs | PASS |
| SPA routing | 200 (fallback) | 200 | PASS |
| Cloud logs | No errors | No errors | PASS |

## Rollback Information

- **Revision**: estate-planning-00004-f4k
- **Previous revision**: estate-planning-00003-n27 (DB URL fix only)
- **First deploy**: Yes — no pre-existing rollback target
- **Rollback command**: `gcloud run services update-traffic estate-planning --to-revisions estate-planning-00003-n27=100 --platform managed --region asia-southeast1 --project puda-489215`

## Final Verdict

```
Preflight:           COMPLETE
Env Var Audit:       ALL ACCOUNTED (6 vars)
Readiness Checks:    15/15 PASS (7 FIXED)
Code Fixes:          7 fixes across 5 files
Local Docker Build:  SKIPPED (Docker daemon not running)
Local Sanity:        SKIPPED (cloud-only mode)
Cloud Deploy:        SUCCESS (4 attempts — index.html, ESM imports, trust proxy, auth middleware)
Cloud Sanity:        10/10 PASS
Cloud Logs:          CLEAN
Deployment Status:   DEPLOYED
Service URL:         https://estate-planning-40220923312.asia-southeast1.run.app
Rollback Revision:   estate-planning-00003-n27
```
