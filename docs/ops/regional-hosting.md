# Regional Hosting & Data Transfer Controls (OPS-003 / SEC-006 / SEC-008)

## Overview
Each tenant's data must reside in the region specified by `Tenant.dataRegion`. Cross-border data transfers must comply with GDPR and applicable local regulations.

## Multi-Region Deployment
- **Supported regions**: `eu-west` (Ireland/London), `eu-south` (Portugal/Spain), extensible to additional regions
- **Deployment model**: One database instance per region; application layer routes requests based on `Tenant.dataRegion`
- **Region enforcement**: The ABAC middleware validates that requests are routed to the correct regional deployment

## Data Residency Controls
- Tenant data (matters, persons, assets, documents) must be stored in the tenant's declared region
- Jurisdiction pack content may be replicated across regions (read-only)
- Audit events are stored in the same region as the tenant data they reference

## Cross-Border Transfer Rules
- **EU-to-EU**: Permitted without additional controls (single market)
- **EU-to-UK**: Covered by UK adequacy decision (review annually)
- **EU-to-other**: Requires Standard Contractual Clauses (SCCs) or equivalent safeguard
- **Data transfer impact assessments**: Required before enabling new region pairs

## Implementation Checklist
- [ ] Deploy separate database instances per region
- [ ] Configure application routing based on tenant region
- [ ] Implement data transfer logging in `AuditEvent` for cross-region access
- [ ] Set up region-specific backup and retention policies
- [ ] Configure DNS-based routing (e.g., GeoDNS or CloudFront with origin groups)
- [ ] Document region-to-region data flow in the data processing register
