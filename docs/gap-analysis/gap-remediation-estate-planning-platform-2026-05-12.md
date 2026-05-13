# Gap Remediation Plan: Estate Planning Platform

## Source

- BRD: `Estate_Planning_Platform_BRD_v2.md`
- Coverage pass: `docs/reviews/brd-coverage-estate-planning-platform-brd-v2-2026-05-12.md`
- Date: 2026-05-12

## Gaps Found and Remediated

| Gap | BRD refs | Status before remediation | Fix applied | Verification |
|---|---|---|---|---|
| Route-level API protection missing | SEC-002, SEC-010, FR-047 | PARTIAL | Added `server/middleware/auth.ts` API-key gate and wired it in `server/app.ts`. | `npm test`, `npm run typecheck`, `npm run build` |
| Explicit security response headers missing | SEC-001, SEC-014, NFR-010 | PARTIAL | Added `server/middleware/securityHeaders.ts`. | `npm test`, `npm run typecheck`, `npm run build` |
| Security/privacy control status not exposed to back office | SEC-006, SEC-007, SEC-008, SEC-017 | PARTIAL | Added `server/services/securityService.ts` and `/api/admin/security-controls`. | `tests/back-office-api.test.ts` |
| Infrastructure verification missing | NFR-013, §24, §25.2 | NOT_FOUND | Added `Dockerfile`, `.dockerignore`, and `.github/workflows/ci.yml`. | `docker build -t estate-planning-platform:local .` |
| Mobile navigation/accessibility guardrails incomplete | NFR-006 | PARTIAL | Added hamburger toggle, overlay, Escape handling, focus-visible, status live region, rem breakpoints. | `npm run build` |
| Dependency vulnerabilities | SEC-015, NFR-010 | PARTIAL | Upgraded Vitest to 4.1.6. | `npm audit --audit-level=moderate` |

## Remaining Non-Code Operational Obligations

These are not code gaps in the local implementation. They require production environment evidence before GA:

- TLS termination and encrypted managed database/document storage.
- Tenant identity provider integration with MFA enforcement.
- Third-party penetration test evidence.
- SOC 2 Type II / ISO 27001 program evidence.
- Production backup, RPO/RTO, DR drill evidence.
- Real signed UPL opinions and insurance documents replacing seeded placeholders.

## Verification Results

```text
npm run db:generate        PASS
npm run db:push            PASS
npm run db:seed            PASS
npm run lint:requirements  PASS
npm test                   PASS (16 tests)
npm run typecheck          PASS
npm audit --audit-level=moderate PASS
npm run build              PASS
docker build -t estate-planning-platform:local . PASS
```
