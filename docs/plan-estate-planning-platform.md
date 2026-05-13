# Development Plan: Estate Planning Platform

## Overview
Build a configuration-first estate-planning intelligence platform from the BRD v2 baseline. The first shipped product is Phase-1 Planning Mode for B2B tenants in England & Wales and Portugal, wills only, en-GB and pt-PT, with durable architecture for later administration, fiduciary, and configuration-studio expansion.

## Assumptions
- The current repository has no application code, package manifest, database schema, migrations, tests, or deployment files; implementation starts from a clean scaffold.
- Phase-1 BRD requirements are treated as build scope. Later-phase administration, fiduciary, KYC/AML, payments, and D2C requirements are represented in the canonical data model and back-office maintenance surfaces, but production workflows remain gated/deferred where the BRD says they are Phase 2+.
- A local SQLite database is acceptable for development. The schema is designed so Postgres can replace SQLite for production without changing the domain contracts.
- External services such as IDV, KYC, tax engines, e-signature, practice-management systems, and AI model providers are implemented behind provider interfaces with deterministic local adapters until credentials are supplied.
- The user asked to continue uninterrupted, so feature-life-cycle approval gates are treated as autonomous execution gates for this turn.

## Codebase Findings
- `Estate_Planning_Platform_BRD_v2.md` - Source-of-truth BRD with Phase-1 scope, deferred scope, NFRs, AI release gates, conflict-of-laws module, localization, security, and legal-content operations.
- Repository root - No `package.json`, source tree, database schema, routes, components, tests, Dockerfile, or CI exists yet.
- Git branch `main` at `366df8a` - clean starting implementation surface except new generated artifacts from this work.

## Architecture Decisions
- **Monorepo-style single package first**: Use one TypeScript package with `server/`, `client/`, `shared/`, `prisma/`, and `tests/` directories to keep the initial build small while preserving clear boundaries.
- **Configuration-first domain core**: Store tenants, jurisdiction packs, rules, workflows, templates, translations, AI policies, UPL opinions, and release gates as governed records, not hardcoded country branches.
- **Prisma + SQLite for development**: Define real relational tables and seed data for E&W and Portugal. Keep schema portable and avoid one table per country.
- **Express API + React UI**: Provide API-first endpoints for tenants, matters, rule evaluation, document generation, exports, pack governance, and back-office tables, plus a professional portal UI for front/middle/back office workflows.
- **Deterministic services before AI**: Rules, conflict-of-laws, document generation, localization lint, release gating, and audit logging are deterministic. AI surfaces are policy/evaluation/audit workflows with provider abstraction.
- **BRD traceability as code**: Add requirement IDs to service tests, seed data, API metadata, and reports so BRD coverage can map features to implementation evidence.

## Dependency Graph
```text
Phase 1 --> Phase 2 --> Phase 4 --> Phase 6 --> Phase 7
Phase 1 --> Phase 3 --> Phase 4 --> Phase 6 --> Phase 7
Phase 1 --> Phase 5 -----------^
```

## Conventions
- Use TypeScript for shared contracts, API services, tests, and React UI.
- Keep business logic in `server/services/`; routes should validate and delegate.
- Keep canonical enums and validation schemas in `shared/`.
- Keep seed legal-content records in `prisma/seed.ts` and test fixtures in `tests/fixtures/`.
- Every mutating workflow writes an audit event.
- UI strings go through locale dictionaries; no user-facing English-only literals in workflow components unless they are source content in the seeded en-GB pack.
- Every phase includes tests for the code it adds.

---

## Phase 1: Platform Scaffold and Canonical Data Model
**Dependencies:** none

**Description:**
Create the application skeleton, database schema, seeded jurisdiction packs, and shared contracts that all feature modules depend on.

**Tasks:**
1. Create package scripts, TypeScript configs, Vite client, Express server, Prisma schema, and Vitest setup.
2. Model canonical tables: tenants, users, roles, people, relationships, matters, jurisdictions, jurisdiction packs, pack versions, pack changes, rules, source notes, workflows, workflow nodes, tasks, assets, liabilities, dispositions, documents, document templates, clauses, reviews, comments, signatures, consents, audit events, invitations, messages, notifications, service packages, exports, AI interactions, AI evaluation runs, UPL opinions, pack velocity records, conflict-of-laws memos, data subject requests, retention policies, incidents, and integration providers.
3. Seed E&W and Portugal Phase-1 packs with active languages, rule metadata, execution policies, glossary terms, translations, workflow definitions, AI policy thresholds, UPL status placeholders, and service package examples.
4. Add typed service contracts and validation schemas for all Phase-1 entities.
5. Add migration/seed verification tests.

**Files to create/modify:**
- `package.json` - scripts and dependencies.
- `tsconfig.json`, `tsconfig.node.json`, `vite.config.ts`, `vitest.config.ts` - build/test configuration.
- `prisma/schema.prisma` - relational data model.
- `prisma/seed.ts` - E&W/PT jurisdiction-pack and back-office seed data.
- `shared/types.ts`, `shared/schemas.ts`, `shared/constants.ts` - shared domain contracts.
- `server/db.ts`, `server/app.ts`, `server/index.ts` - API bootstrap.
- `tests/schema.test.ts` - schema and seed checks.

**Acceptance criteria:**
- `npm run db:generate`, `npm run db:push`, `npm run db:seed`, and `npm test` succeed locally.
- Seed data includes two active Phase-1 packs, en-GB and pt-PT locale records, and back-office governance records.
- Schema contains all canonical entities from BRD Appendix D plus operations tables needed to maintain the platform.

---

## Phase 2: Front Office Planning Workflows
**Dependencies:** Phase 1

**Description:**
Build the professional-facing Planning Mode workflow for B2B tenants and invited clients: matter creation, intake, family graph, asset inventory, scenarios, document review, execution tracking, collaboration, and localized UI.

**Tasks:**
1. Implement matter, person, relationship, asset, disposition, consent, review, document, signing, task, message, notification, and invitation APIs.
2. Implement intake completeness scoring, relationship missing-fact detection, asset evidence tracking, scenario comparison, and plan-impact issue detection.
3. Build React screens for dashboard, matter workspace, intake, family graph, assets, planning scenarios, documents, review, signing, communications, and exports.
4. Add role-aware views for solicitor, notary, paralegal, client guest, tax adviser, and tenant administrator.
5. Add tests covering Phase-1 FR-005 through FR-008, FR-013 through FR-030, FR-042 through FR-044, and CR-001 through CR-012.

**Files to create/modify:**
- `server/routes/matters.ts`, `server/routes/planning.ts`, `server/routes/documents.ts`, `server/routes/collaboration.ts` - front-office APIs.
- `server/services/matterService.ts`, `server/services/intakeService.ts`, `server/services/planningService.ts`, `server/services/documentService.ts`, `server/services/collaborationService.ts` - workflow logic.
- `client/src/App.tsx`, `client/src/pages/MatterWorkspace.tsx`, `client/src/pages/Dashboard.tsx`, `client/src/components/*` - portal UI.
- `tests/front-office.test.ts` - workflow coverage.

**Acceptance criteria:**
- A professional can create a tenant matter, capture consents, complete intake, add family/assets, create scenarios, generate a will draft, route it for review, finalize, and track execution.
- Cross-role access and confidentiality controls are enforced for joint matters.
- UI can switch between en-GB and pt-PT without losing matter state.

---

## Phase 3: Middle Office Rules, Conflict-of-Laws, Documents, AI Safety
**Dependencies:** Phase 1

**Description:**
Implement deterministic decision support and professional-review gates: jurisdiction selection, rule evaluation, conflict-of-laws memo generation, document assembly, localization lint, AI safety evaluation, and mandatory escalation logic.

**Tasks:**
1. Implement jurisdiction selection and multi-jurisdiction fact capture for domicile, habitual residence, nationality, tax residency, asset situs, matrimonial domicile, and law election.
2. Implement E&W and PT Phase-1 rule evaluators for execution formalities, PT reserved-share flags, UK IHT threshold flags, minor beneficiary flags, missing witness/notary flags, and cross-border escalation.
3. Implement EU 650/2012 and Hague 1961 local deterministic conflict-of-laws decision support for BRD Phase-1 scope.
4. Implement will document assembly with template/pack/version metadata, clause-level conditional logic, execution instructions, and localization glossary lint.
5. Implement AI policy registry, prompt/audit logging, evaluation-run scoring, release-gate checks, model-card records, refusal/escalation classifiers, and source-citation validation.
6. Add tests for FR-001 through FR-004, FR-021 through FR-031, CL-001 through CL-006, AI-001 through AI-012, and L10N-001 through L10N-010.

**Files to create/modify:**
- `server/services/ruleEngine.ts`, `server/services/conflictOfLawsService.ts`, `server/services/documentAssemblyService.ts`, `server/services/localizationService.ts`, `server/services/aiSafetyService.ts` - deterministic engines.
- `server/routes/rules.ts`, `server/routes/conflict-of-laws.ts`, `server/routes/ai.ts` - APIs.
- `client/src/pages/RuleWorkbench.tsx`, `client/src/pages/ConflictMemo.tsx`, `client/src/pages/AiSafety.tsx` - middle-office screens.
- `tests/rules-conflict-documents.test.ts`, `tests/ai-localization.test.ts` - coverage.

**Acceptance criteria:**
- Rule evaluations always produce traceable source/rule/pack-version evidence.
- Cross-border cases generate a memo, attach it to review, and block finalization until reviewed.
- Will drafts contain document metadata and execution instructions for E&W/PT.
- AI release is blocked when any BRD threshold fails.

---

## Phase 4: Back Office, Configuration Governance, APIs, and Exports
**Dependencies:** Phase 2, Phase 3

**Description:**
Build the administrative and operational surfaces required to run the platform: tenant setup, jurisdiction pack lifecycle, legal-content operations, UPL/insurance records, service packages, audit, data rights, incident records, OpenAPI-style integration endpoints, and exports.

**Tasks:**
1. Implement tenant/country enablement, pack publish/rollback workflow, change requests, approvals, effective dates, tests evidence, source notes, and rollback plans.
2. Implement back-office tables and UI for legal-content team roles, retained counsel, UPL opinions, insurance posture, regulatory monitoring, pack TCO, pack velocity, KPI decision gates, and localization tasks.
3. Implement secure API endpoints for rule evaluation, document generation, matter management, webhooks, exports, and API-key integration consumers.
4. Implement export bundles for matter data, documents, audit logs, and configuration snapshots.
5. Add audit dashboards, AI safety reports, localization coverage reports, issue/warning reports, and tenant-density KPI reports.
6. Add tests for FR-001, FR-004, FR-045, FR-047, FR-048, SEC-001 through SEC-017, NFR traceability, §18, §21, §23, and §26 operational requirements.

**Files to create/modify:**
- `server/routes/admin.ts`, `server/routes/integrations.ts`, `server/routes/exports.ts`, `server/routes/reports.ts` - back-office/API surfaces.
- `server/services/configurationService.ts`, `server/services/exportService.ts`, `server/services/securityService.ts`, `server/services/reportingService.ts`, `server/services/integrationService.ts` - operations logic.
- `client/src/pages/AdminConsole.tsx`, `client/src/pages/ConfigurationStudio.tsx`, `client/src/pages/Reports.tsx`, `client/src/pages/ApiConsole.tsx` - operational UI.
- `docs/openapi.md`, `docs/back-office-table-catalog.md` - integration and table maintenance documentation.
- `tests/back-office-api.test.ts` - coverage.

**Acceptance criteria:**
- Administrators can maintain every operational table required to run Phase-1 packs and track deferred Phase-2+ entities.
- Pack publication is blocked if required UPL, translations, tests, source references, or approvals are missing.
- API consumers can evaluate rules, create matters, generate documents, and export evidence through authenticated endpoints.

---

## Phase 5: Deferred-Mode Foundations and Guarded Feature Stubs
**Dependencies:** Phase 1

**Description:**
Represent later BRD modes without accidentally shipping regulated workflows. Build explicit gates, read-only planning surfaces, and schema support for administration, fiduciary, KYC/AML, payments, tax engines, e-signature, registry filing, and B2B2C/D2C expansion.

**Tasks:**
1. Add feature flags and entitlement gates for Phase-2 through Phase-5 modules.
2. Add guarded APIs/UI summaries for estate administration, fiduciary management, KYC/AML, payment, e-signature, registry filing, practice-management partnerships, and D2C readiness.
3. Ensure attempts to use deferred workflows return clear gated responses and audit events.
4. Add tests proving deferred modules cannot be activated without required regulatory/configuration gates.

**Files to create/modify:**
- `server/services/featureGateService.ts` - phase/entitlement/regulatory gates.
- `server/routes/deferred.ts` - guarded deferred-mode endpoints.
- `client/src/pages/RoadmapModules.tsx` - operational visibility into gated features.
- `tests/deferred-gates.test.ts` - negative-path coverage.

**Acceptance criteria:**
- Deferred features are visible to operators as configured future modules but cannot be used in production workflows.
- Deferred tables can be maintained for readiness and planning without triggering unauthorized legal, fiduciary, payment, or filing activity.

---

## Phase 6: Integrated Verification, Full Review, and BRD Coverage Loop
**Dependencies:** Phase 4, Phase 5

**Description:**
Validate the implementation through builds, tests, review checks, BRD coverage, gap remediation, and repeat until no material BRD coverage gaps remain.

**Tasks:**
1. Run formatting, type checking, build, unit tests, and service smoke checks.
2. Produce a full-review report covering guardrails, coding standards, UI, quality, security, infrastructure, and sanity checks; fix all high and critical findings.
3. Run BRD coverage at line-item level and produce a traceability/gap report.
4. Convert coverage gaps into a gap-remediation feature-life-cycle plan, implement fixes, and rerun coverage.
5. Repeat until the coverage report has no new implementation gaps for Phase-1 scope and only explicit BRD-deferred items remain.

**Files to create/modify:**
- `docs/reviews/full-review-full-repo-YYYY-MM-DD.md` - consolidated review.
- `docs/reviews/brd-coverage-estate-planning-platform-brd-v2-YYYY-MM-DD.md` - traceability report.
- `docs/gap-analysis/*` - gap reports and remediation notes.
- `tests/*` - additional gap tests as needed.

**Acceptance criteria:**
- `npm run build`, `npm test`, and smoke checks pass.
- Full-review findings targeted for remediation are fixed or explicitly documented with rationale.
- BRD coverage is compliant for Phase-1 implementation scope and clearly marks later-phase requirements as gated/deferred by design.

---

## Phase 7: Local Deployment and Operational Handoff
**Dependencies:** Phase 6

**Description:**
Start the local app, verify front-office/middle-office/back-office workflows, and document how to operate the seeded development environment.

**Tasks:**
1. Run database setup and seed commands from scratch.
2. Start the API and web dev server.
3. Smoke-test dashboard, matter workflow, rule evaluation, document generation, conflict memo, pack publish gate, API export, and reports.
4. Document local URLs, seed credentials/roles, and known constraints.

**Files to create/modify:**
- `README.md` - setup, commands, architecture, seed roles, and local workflow.
- `docs/local-deployment-estate-planning-platform-YYYY-MM-DD.md` - local deployment verification.

**Acceptance criteria:**
- A user can run the documented commands and reach the local app.
- Seeded tenant, E&W pack, PT pack, professional users, and sample matter workflows are available.
- Smoke checks validate the core BRD Phase-1 workflow end to end.
