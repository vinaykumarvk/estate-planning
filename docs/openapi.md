# API Surface

This is a concise OpenAPI-oriented index for the Phase-1 API channel. All endpoints are implemented by the Express API under `/api`.

## Health and Bootstrap

| Method | Path | Purpose |
|---|---|---|
| GET | `/api/health` | Service health with tenant and pack counts |
| GET | `/api/health/live` | Liveness probe (always 200) |
| GET | `/api/health/ready` | Readiness probe (503 if no data or DB unreachable) |
| GET | `/api/bootstrap` | Initial UI payload with tenant, matters, packs, KPI snapshot |

## Matter Management

| Method | Path | Purpose |
|---|---|---|
| GET | `/api/matters` | List matters |
| POST | `/api/matters` | Create B2B planning matter |
| GET | `/api/matters/{matterId}` | Matter workspace bundle |
| GET | `/api/matters/{matterId}/intake-score` | Intake completeness score |
| POST | `/api/matters/{matterId}/people` | Add person |
| POST | `/api/matters/{matterId}/relationships` | Add relationship |
| GET | `/api/matters/{matterId}/relationships` | List relationships for matter |
| DELETE | `/api/matters/{matterId}/relationships/{relationshipId}` | Delete relationship |
| POST | `/api/matters/{matterId}/assets` | Add asset |
| POST | `/api/matters/{matterId}/scenarios` | Add planning scenario |
| POST | `/api/matters/{matterId}/dispositions` | Add disposition |
| GET | `/api/matters/{matterId}/dispositions` | List dispositions for matter |
| DELETE | `/api/matters/{matterId}/dispositions/{dispositionId}` | Delete disposition |
| POST | `/api/matters/{matterId}/consents/{consentId}/acknowledge` | Acknowledge consent/disclaimer |

## Rules, Conflict, Documents

| Method | Path | Purpose |
|---|---|---|
| POST | `/api/planning/matters/{matterId}/rules/evaluate` | Evaluate jurisdiction-pack rules |
| POST | `/api/planning/matters/{matterId}/conflict-of-laws` | Generate conflict-of-laws memo |
| POST | `/api/planning/conflict-of-laws/{memoId}/review` | Record reviewer rationale |
| POST | `/api/planning/matters/{matterId}/documents/will` | Generate will draft |
| GET | `/api/planning/matters/{matterId}/documents` | List documents for matter |
| GET | `/api/planning/documents/{documentId}` | Get single document |
| GET | `/api/planning/matters/{matterId}/reviews` | List reviews for matter |
| POST | `/api/planning/reviews/{reviewId}/approve` | Approve professional review |
| GET | `/api/planning/reviews/{reviewId}/comments` | List review comments |
| POST | `/api/planning/reviews/{reviewId}/comments` | Add review comment |
| PATCH | `/api/planning/reviews/{reviewId}/comments/{commentId}/resolve` | Resolve review comment |
| POST | `/api/planning/documents/{documentId}/finalize` | Finalize document after reviews |

## Tasks

| Method | Path | Purpose |
|---|---|---|
| GET | `/api/tasks` | List tasks (optional `?matterId=`) |
| POST | `/api/tasks` | Create task |
| PATCH | `/api/tasks/{taskId}` | Update task |
| DELETE | `/api/tasks/{taskId}` | Delete task |

## Messages

| Method | Path | Purpose |
|---|---|---|
| GET | `/api/messages` | List messages (optional `?matterId=`) |
| POST | `/api/messages` | Create message |

## Invitations

| Method | Path | Purpose |
|---|---|---|
| GET | `/api/invitations` | List invitations (optional `?matterId=`) |
| POST | `/api/invitations` | Create invitation |
| POST | `/api/invitations/{invitationId}/revoke` | Revoke invitation |

## Notifications

| Method | Path | Purpose |
|---|---|---|
| GET | `/api/notifications` | List notifications (optional `?status=`) |
| POST | `/api/notifications` | Create notification |

## Liabilities

| Method | Path | Purpose |
|---|---|---|
| GET | `/api/liabilities` | List liabilities (optional `?matterId=`) |
| POST | `/api/liabilities` | Create liability |
| PATCH | `/api/liabilities/{liabilityId}` | Update liability |
| DELETE | `/api/liabilities/{liabilityId}` | Delete liability |

## AI Safety

| Method | Path | Purpose |
|---|---|---|
| GET | `/api/ai/policies` | List AI policies |
| GET | `/api/ai/evaluations` | List AI evaluation runs |
| POST | `/api/ai/evaluations` | Record AI release-gate evaluation |
| POST | `/api/ai/interactions` | Log AI prompt/output with refusal and escalation controls |

## Back Office

| Method | Path | Purpose |
|---|---|---|
| GET | `/api/admin/table-catalog` | Operational table catalog |
| GET | `/api/admin/tenants` | Tenant list |
| GET | `/api/admin/tenants/{tenantId}/jurisdictions` | Enabled tenant jurisdictions |
| GET | `/api/admin/packs` | Jurisdiction packs |
| GET | `/api/admin/packs/{packId}/publishable` | Pack release-gate check |
| POST | `/api/admin/packs/{packId}/publish` | Publish pack if gates pass |
| POST | `/api/admin/packs/{packId}/rollback` | Roll back active pack version |
| GET | `/api/admin/feature-gates` | Deferred-module gates |
| GET | `/api/admin/legal-content` | Rules, sources, release gates, UPL, monitors, velocity |
| GET | `/api/admin/security-controls` | Security, privacy, insurance, UPL, and residency control status |
| GET | `/api/admin/compliance-evidence` | SOC2/ISO tracking, gate pass rates, incidents, insurance, UPL |

## Exports and Reports

| Method | Path | Purpose |
|---|---|---|
| GET | `/api/exports/matters/{matterId}` | Matter data, documents, audit, configuration snapshot |
| GET | `/api/reports/phase-1-kpis` | Phase-1 KPI summary |
| GET | `/api/reports/snapshots` | Report snapshot history |

## Deferred Modules

| Method | Path | Purpose |
|---|---|---|
| POST | `/api/deferred/{featureCode}/use` | Returns gated response unless required phase controls are enabled |
