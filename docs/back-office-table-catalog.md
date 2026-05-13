# Back-Office Table Catalog

The application maintains these tables from `prisma/schema.prisma`. They support front-office planning workflows, middle-office legal-content operations, and back-office administration.

## Tenant and Access

- `Tenant` - tenant organization, deployment model, enabled countries, data region, security policy
- `User` - professional/admin/client user identity
- `TenantUser` - role membership, scopes, tenant-specific status
- `ApiKey` - API partner credentials and scopes
- `WebhookSubscription` - event delivery for integrations

## Jurisdiction Pack Operations

- `Jurisdiction` - country/sub-jurisdiction metadata
- `JurisdictionPack` - pack status, languages, document types, product modes
- `PackVersion` - effective-dated immutable version metadata
- `PackChangeRequest` - source basis, approvals, rollback plan, test evidence
- `SourceNote` - legal/regulatory source references
- `Rule` - configured legal, tax, execution, review, and warning rules
- `Workflow` - configured product workflows
- `WorkflowNode` - workflow steps, owners, branch/deadline logic
- `ReleaseGate` - UPL, translation, test, source, AI, and counsel sign-off gates
- `RegulatoryMonitor` - quarterly/event-driven regulatory monitoring schedule
- `PackVelocityRecord` - pack elapsed time/cost and configuration-first KPI evidence

## Matter and Planning

- `Matter` - planning matter metadata and jurisdiction context
- `Person` - client, spouse, beneficiary, heir, fiduciary, adviser identity profile
- `Relationship` - family graph, dependency, minor/incapacity flags
- `Consent` - privacy notice, disclaimer, legal-basis acknowledgements
- `Asset` - asset inventory, valuation, situs, ownership, evidence refs
- `Liability` - liabilities and claims, gated for administration mode
- `Scenario` - estate-plan scenario
- `Disposition` - gifts, residue, alternates, survivorship, class/per-stirpes data
- `RuleEvaluation` - traceable outcome per rule/pack/facts hash

## Documents and Review

- `DocumentTemplate` - approved templates by pack, locale, document type
- `Clause` - conditional clauses and source links
- `Document` - generated draft/final document records, hashes, statuses
- `Review` - professional review gates and decisions
- `ReviewComment` - comments, redlines, issue notes
- `SignatureEvent` - signing ceremony, witnesses/notary, signed-copy evidence
- `Task` - checklist and deadline tasks

## Collaboration and Notifications

- `Invitation` - scoped matter invitations with expiry/revocation
- `Message` - matter-specific secure messages
- `NotificationTemplate` - localized notification templates
- `Notification` - notification deliveries

## Security, Privacy, Audit

- `AuditEvent` - immutable activity, rule version, actor, metadata
- `DataSubjectRequest` - access/correction/export/deletion workflows
- `RetentionPolicy` - retention years, legal hold behavior
- `Incident` - breach/UPL/security incident tracking
- `InsuranceRecord` - tech E&O, cyber, tenant indemnity records
- `UplOpinion` - per-jurisdiction legal-opinion status and controls

## AI Safety and Localization

- `AiPolicy` - allowed modes, prohibited intents, escalation, confidence floors
- `AiInteraction` - prompt/output/source/model audit
- `AiEvaluationRun` - grounding, citation, escalation, hallucination, language parity, red-team metrics
- `LocalizationString` - stable content keys and translations
- `LegalGlossaryTerm` - preferred/prohibited legal terms by locale and pack
- `TranslationTask` - review tasks created by source text or locale changes

## Integrations, Billing, Reports, Deferred Modules

- `IntegrationProvider` - modular provider configuration and credential refs
- `ServicePackage` - B2B service packages
- `ExportJob` - matter/document/audit/configuration export jobs
- `ReportSnapshot` - KPI and operational report snapshots
- `FeatureGate` - BRD-deferred module controls
- `BeneficialOwnership` - Phase-4 beneficial-owner records
- `KycAmlRecord` - tenant-supplied Phase-1 and later integrated KYC/AML records
- `PaymentRecord` - Phase-2 billing/payment records
