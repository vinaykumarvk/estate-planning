# Security Architecture

The local implementation includes code-level controls and explicit production deployment obligations for the Phase-1 BRD.

## Implemented Controls

- **Helmet**: All responses include security headers via `helmet()` – HSTS, X-Content-Type-Options, hide X-Powered-By, CSP, Referrer-Policy (see `server/middleware/securityHeaders.ts`).
- **Rate limiting**: API-wide rate limit of 100 requests/minute per IP via `express-rate-limit` (see `server/middleware/rateLimit.ts`).
- **Request tracing**: Every request receives an `x-request-id` header (forwarded or generated) for correlation (see `server/middleware/requestId.ts`).
- **API-key middleware**: Protects all `/api` routes except health probes. Keys stored as SHA-256 hashes in the `ApiKey` table.
- **ABAC middleware**: `requireAbac()` enforces tenant isolation (body tenantId must match API key tenant), scope enforcement (`TenantUser.scopes`), and data-region compliance. `requireMfa()` gates sensitive operations on `user.mfaEnabled` (see `server/middleware/abac.ts`).
- **Health probes**: `/api/health/live` (liveness), `/api/health/ready` (readiness with DB check, 503 if no data), `/api/health` (backward-compatible).
- **Graceful shutdown**: SIGTERM/SIGINT handlers close the HTTP server and disconnect Prisma before exit (see `server/index.ts`).
- CORS is scoped to `CORS_ORIGIN` or `http://127.0.0.1:5173`.
- Mutating workflows write `AuditEvent` records with BRD requirement references.
- Sensitive operational controls are maintained as tables: `RetentionPolicy`, `Incident`, `InsuranceRecord`, `UplOpinion`, `ReleaseGate`, `AiEvaluationRun`, and `DataSubjectRequest`.
- Deferred regulated modules are blocked by `FeatureGate`.
- **Compliance evidence**: `/api/admin/compliance-evidence` endpoint returns SOC2/ISO tracking, gate pass rates, incidents, insurance, UPL opinions (SEC-016).

## Production Obligations

- **TLS termination**: See [docs/ops/tls-termination.md](ops/tls-termination.md) (OPS-001/SEC-001)
- **IdP & MFA enforcement**: See [docs/ops/idp-mfa-enforcement.md](ops/idp-mfa-enforcement.md) (OPS-002/SEC-003)
- **Regional hosting & data transfer**: See [docs/ops/regional-hosting.md](ops/regional-hosting.md) (OPS-003/SEC-006/SEC-008)
- **SOC 2 & ISO 27001**: See [docs/ops/soc2-iso-tracking.md](ops/soc2-iso-tracking.md) (OPS-004/SEC-016)
- **Disaster recovery**: See [docs/ops/dr-runbook.md](ops/dr-runbook.md) (OPS-005/NFR-013)
- **Third-party audits**: See [docs/ops/third-party-audits.md](ops/third-party-audits.md) (OPS-006)
- Enforce tenant, role, and matter scope in middleware before production launch.
- Maintain cyber insurance of at least GBP 10M and active Tech E&O coverage.
