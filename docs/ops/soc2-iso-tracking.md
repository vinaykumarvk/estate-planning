# SOC 2 & ISO 27001 Tracking (OPS-004 / SEC-016)

## Overview
The platform tracks compliance with SOC 2 Type II and ISO 27001 certification requirements. The `/api/admin/compliance-evidence` endpoint provides real-time status.

## SOC 2 Type II
- **Status**: Tracking (pre-production)
- **Target**: Type II report within 12 months of production launch
- **Trust service criteria**: Security, Availability, Confidentiality, Privacy
- **Control mapping**:
  - CC6.1 (Logical Access): API key auth, ABAC middleware, MFA enforcement
  - CC6.6 (System Boundaries): Helmet security headers, CORS, CSP
  - CC7.2 (Monitoring): Audit event logging, release gate tracking
  - CC8.1 (Change Management): Pack versioning, change requests, rollback capability
  - A1.2 (Availability): Health probes, graceful shutdown, DR runbook

## ISO 27001
- **Status**: Tracking (post-launch certification target)
- **Statement of Applicability**: Mapped to Annex A controls
- **Key controls**:
  - A.9 Access Control: ABAC, tenant isolation, scope enforcement
  - A.10 Cryptography: TLS, encrypted storage, hash-based integrity
  - A.12 Operations Security: Audit logging, incident management
  - A.14 System Development: Release gates, AI evaluation thresholds
  - A.18 Compliance: UPL opinions, regulatory monitoring

## Evidence Collection
- Gate pass rates tracked via `ReleaseGate` table
- Insurance records maintained in `InsuranceRecord` table
- UPL opinions tracked with refresh schedules in `UplOpinion` table
- Incident management via `Incident` table with breach notification tracking
- All evidence accessible via `/api/admin/compliance-evidence`

## Audit Schedule
- **Quarterly**: Internal security review, control effectiveness assessment
- **Annually**: External penetration test, SOC 2 audit, insurance renewal
- **Continuous**: Automated gate checks, regulatory monitoring cadence
