# Third-Party Audits (OPS-006)

## Overview
The platform requires regular third-party assessments for security, accessibility, and compliance validation.

## Penetration Testing
- **Frequency**: Annual (minimum), plus ad-hoc after major releases
- **Scope**: Full API surface, authentication/authorization flows, data isolation, input validation
- **Provider requirements**: CREST-accredited or equivalent certification
- **Deliverables**: Executive summary, detailed findings, remediation recommendations
- **Remediation SLA**:
  - Critical: 48 hours
  - High: 7 days
  - Medium: 30 days
  - Low: Next release cycle
- **Tracking**: Findings tracked as `Incident` records with `incidentClass: "pentest_finding"`

## WCAG Accessibility Audit
- **Standard**: WCAG 2.1 Level AA
- **Frequency**: Annual, plus before major UI releases
- **Scope**: All client-facing pages and interactive components
- **Deliverables**: VPAT (Voluntary Product Accessibility Template), issue list with severity
- **Remediation**: Tracked in the task management system with accessibility label

## Code Security Review
- **Frequency**: Before each production release
- **Scope**: Dependency audit (`npm audit`), SAST scanning, secrets detection
- **Tools**: Dependabot/Snyk for dependencies, CodeQL or Semgrep for SAST
- **Threshold**: Zero critical or high severity findings in production builds

## Compliance Validation
- **SOC 2 readiness assessment**: Pre-audit gap analysis with external auditor
- **GDPR compliance review**: Annual review of data processing activities
- **UPL opinion refresh**: Tracked via `UplOpinion.refreshDueAt` with alerts 60 days before expiry

## Evidence & Reporting
- All audit reports stored in secure document vault with access logging
- Summary metrics available via `/api/admin/compliance-evidence`
- Historical tracking via `ReportSnapshot` with `reportCode: "audit-summary"`
