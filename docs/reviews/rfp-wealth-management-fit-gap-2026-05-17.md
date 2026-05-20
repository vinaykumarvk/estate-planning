# Wealth Management RFP Fit-Gap Audit

Date: 2026-05-17

## Scope

Audited requirement sources:

- `docs/RFP FOR WEALTH MANAGEMENT PLATFORM - EPI.pdf`
- `docs/eProcess Response Sheet - SET 1.pdf`
- `docs/eProcess Response Sheet - SET 2.pdf`
- `docs/eProcess Response Sheet - SET 3.pdf`
- `docs/eProcess Response Sheet - SET 4.pdf`
- `docs/eProcess Response Sheet_5.pdf`
- `docs/eProcess Response Sheet_6.pdf`

Compared against the active application in this repository: React/Vite frontend, Express API, Prisma data model, docs, and active test configuration.

## Executive Verdict

Indicative fitment against the full Ecobank wealth management RFP: **Low to moderate, approximately 30-35%**.

Indicative fitment against the estate-planning subset only: **Moderate, approximately 60-70%**.

Reasoning:

- The developed app is primarily an estate-planning platform. It has solid coverage for matter intake, people/relationships, assets, liabilities, estate balance sheet, IHT, Faraid, lifetime gifts, will coordination, document review/signing, localization scaffolding, audit events, API key auth, and some operational/security evidence.
- The RFP is materially broader: enterprise wealth management and financial planning with goal-based investment planning, CRM/core banking integration, holdings/transaction/pricing ingestion, portfolio analytics, product recommendations, OMS/trade execution integration, omnichannel embedding, LMS integration, AI personalization, and multi-country MESI deployment.
- The most important missing areas are not small UI gaps. They require new domain models, integration contracts, workflow engines, analytics engines, production identity/security architecture, and deployment architecture.

## Existing Implementation Evidence

The current application implements these relevant areas:

| Area | Evidence | Fit Notes |
|---|---|---|
| Matter/client intake | `server/services/matterService.ts:12`, `server/routes/matters.ts:21`, `client/src/components/intake/IntakeWizard.tsx:44` | Estate-planning intake, not wealth onboarding from CRM/core banking. |
| People, relationships, assets, liabilities | `server/services/matterService.ts:68`, `server/services/matterService.ts:122`, `server/services/matterService.ts:166`, `shared/schemas.ts:34`, `server/routes/liabilities.ts:10` | Good estate-planning data capture; not product holdings/transactions. |
| Asset valuation and estate balance sheet | `server/services/balanceSheetService.ts:4`, `client/src/components/assets/AssetValuationForm.tsx:19`, `client/src/components/balance/BalanceSheet.tsx:32` | Manual estate assets, no portfolio accounting. |
| Estate goals | `server/services/goalService.ts:6`, `server/services/goalService.ts:88`, `client/src/components/goals/GoalsDashboard.tsx:34` | Estate goals only; no SMART financial goals, funding plan, target amount/date, micro-successes, or portfolio linkage. |
| Estate scenarios/what-if | `server/services/simulationService.ts:10`, `server/services/scenarioComparisonService.ts:5`, `client/src/components/scenarios/WhatIfSimulation.tsx:7` | Legal/estate disposition simulation, not financial goal simulation or portfolio growth. |
| IHT and gifts | `server/services/ihtCalculationService.ts:18`, `server/services/ihtCalculationService.ts:193`, `server/services/lifetimeGiftService.ts:34`, `server/routes/iht.ts:15` | Strong UK estate-tax subset, not multi-market income tax/CGT/retirement tax. |
| Faraid/Islamic inheritance | `server/services/faraidService.ts:358`, `server/routes/faraid.ts:14` | Relevant to Islamic estate planning, not Islamic finance product planning. |
| Wills/document workflow | `server/services/documentAssemblyService.ts:18`, `server/services/documentAssemblyService.ts:149`, `server/services/willCoordinationService.ts:45`, `server/routes/wills.ts:24` | Will-centric; trust structures and broad succession workflow are incomplete. |
| Compliance/rules/audit | `server/services/ruleEngine.ts:37`, `server/services/auditService.ts:16`, `prisma/schema.prisma:471` | Estate-planning compliance/audit trail; no investment suitability or advice compliance workflow. |
| Localization | `client/src/i18n.ts:5`, `server/services/localizationQaService.ts:10`, `server/services/icuFormattingService.ts:10`, `shared/constants.ts:1` | UI language support exists for en/fr/pt/es, but jurisdiction packs cover only 10 jurisdictions, not all 32 affiliates. |
| APIs and webhooks | `server/app.ts:91`, `server/services/webhookService.ts:7`, `server/routes/openapi.ts:6` | API surface and webhook registry exist, but no bank-system connectors. |
| Security controls | `server/middleware/auth.ts:11`, `server/middleware/abac.ts:9`, `server/middleware/securityHeaders.ts:3`, `server/middleware/rateLimit.ts:3`, `server/services/securityService.ts:21` | Basic API-key auth, ABAC scaffold, headers, rate limits, SOC2/ISO tracking. No OAuth2/SSO user sessions. |
| Deployment docs | `Dockerfile:1`, `docs/ops/dr-runbook.md:1`, `docs/ops/horizontal-scaling.md:1`, `docs/ops/tls-termination.md:1` | Container and runbooks exist; public-cloud HA/DR/MS SQL/OpenShift/AWS target architecture is not implemented. |

Active automated test caveat:

- `vitest.config.ts:6` includes `tests/**/*.test.ts`, but `tests/` currently has 0 test files. Compiled tests exist under `dist-server/tests`, but they are not the active configured test source. `npm test` could not be run in this shell because `node` is not on PATH and `/usr/local/bin/npm` fails with `env: node: No such file or directory`.

## Comprehensive Missing and Partial Requirement List

Legend:

- `PARTIAL`: some related capability exists but not enough for the RFP.
- `NOT_FOUND`: no active implementation evidence found in source.
- `DOC_ONLY`: documentation or placeholder exists, but implementation is not complete.
- `OUTSIDE_APP`: procurement/vendor qualification item that cannot be satisfied by app code alone.

### 1. Financial Planning and Wealth Management Core

| ID | Requirement | Source | Status | Gap |
|---|---|---|---|---|
| WM-001 | One-stop financial planning and wealth management platform, not only estate planning | RFP p10 | PARTIAL | Current app is estate-planning first. It does not implement full wealth planning journeys across investment, risk insurance, retirement, financial planning, and home ownership. |
| WM-002 | Investment management | RFP p10 | NOT_FOUND | No investment account, portfolio, asset allocation, model portfolio, performance, or investment proposal engine. |
| WM-003 | Risk/insurance management | RFP p10 | PARTIAL | Assets can include insurance, but there is no insurance-needs analysis, protection gap, premium, policy, or recommendation workflow. |
| WM-004 | Retirement planning | RFP p10-p11 | NOT_FOUND | No retirement goal projection, retirement income model, pension drawdown, or retirement funding gap analysis. |
| WM-005 | Financial planning beyond estate planning | RFP p10 | NOT_FOUND | No income/expense/cashflow planning, emergency fund, debt service, household budget, or financial plan output. |
| WM-006 | Home ownership planning | RFP p10, eProcess Set 3 p1 | NOT_FOUND | No mortgage affordability, deposit target, property purchase journey, or home-ownership advisory workflow. |
| WM-007 | Risk protection goal planning | RFP p11, eProcess Set 3 p1 | NOT_FOUND | No risk protection goal, protection shortfall calculation, or insurance product recommendation workflow. |
| WM-008 | High Value/Premier/Private Banking/HNWI segmentation | eProcess Set 2 p1, Set 3 p1 | NOT_FOUND | No customer-segment model or differentiated advisory depth for Premier/Private/HNWI clients. |
| WM-009 | Full suite of asset classes: deposits, loans, treasury, fixed income, equities, mutual funds, structured products, insurance, real estate, third-party offshore investments | eProcess Set 2 p1, Set 3 p1 | PARTIAL | Estate asset classes exist (`real_estate`, `bank_account`, `securities`, `pension`, `insurance`, `debt`), but no product taxonomy for deposits/loans/treasury/fixed income/equities/mutual funds/structured products/offshore products. |
| WM-010 | Enrich existing customer information with gathered data | RFP p10 | PARTIAL | The app stores matter/client data, but no writeback/sync to CRM/core banking customer master. |
| WM-011 | Comprehensive overview of investments | RFP p10 | NOT_FOUND | No consolidated holdings, positions, portfolio valuation, market pricing, or transaction history. |
| WM-012 | Product recommendations aligned with client needs and goals | RFP p10-p11 | NOT_FOUND | No product catalog, eligibility, suitability score, or recommendation engine. |

### 2. Dynamic Financial Goal Planning and Simulations

| ID | Requirement | Source | Status | Gap |
|---|---|---|---|---|
| GOAL-001 | Risk planning engine for forward-looking risk figures and what-if scenarios | RFP p11, eProcess Set 1 p1 | NOT_FOUND | eProcess says no existing risk engine; vendor platform must provide it. Current app has estate legal/tax simulations only. |
| GOAL-002 | Set, simulate, and track SMART goals for retirement, education, savings, risk protection | RFP p11 | PARTIAL | `ClientGoal` stores text/category/priority/status only. No target amount, target date, contribution plan, funding status, or SMART validation. |
| GOAL-003 | Visualize goal pathways with dynamic what-if scenarios | RFP p11 | PARTIAL | Scenario comparison exists for estate dispositions; no goal pathway charts or financial projection paths. |
| GOAL-004 | Model life-event impacts such as early retirement and education inflation | RFP p11 | NOT_FOUND | No life-event model, inflation assumptions, retirement age variables, or education cost assumptions. |
| GOAL-005 | Prioritize and adjust goals | RFP p11 | PARTIAL | Goal priority exists, but no financial allocation/prioritization engine. |
| GOAL-006 | Micro-success tracking for savings targets, kid education funds, retirement funds, portfolio milestones, investment automation, timely processing | RFP p11, eProcess Set 1 p1 | NOT_FOUND | No milestones, badges, progress checkpoints, automated savings/investment events, or processing SLA tracking. |
| GOAL-007 | Early warning indicators for underfunded goals or disengagement | RFP p14 | NOT_FOUND | Goal gap analysis is estate-document completeness, not financial underfunding/disengagement prediction. |
| GOAL-008 | Goal-progress alerts and funding gap notifications | eProcess Set 2 p4-p5 | NOT_FOUND | Notifications exist generically, but no goal funding-gap detector or alert scheduler. |

### 3. CRM, Client Lifecycle, and Onboarding

| ID | Requirement | Source | Status | Gap |
|---|---|---|---|---|
| CRM-001 | Real-time CRM sync of onboarding, profiling, goal updates, product holdings | RFP p11 | NOT_FOUND | No CRM connector, sync jobs, conflict handling, Dynamics API, or holdings sync. |
| CRM-002 | MS Dynamics CRM integration for basic customer data and RM competency tracking data consumption | eProcess Set 1 p3 | NOT_FOUND | No Dynamics model or connector found. |
| CRM-003 | Prefilled client information to speed advisory journeys | RFP p11 | NOT_FOUND | Matter creation is manual; no prefill from CRM/core banking. |
| CRM-004 | Single client view across branch, mobile, web, advisor portals | RFP p11 | PARTIAL | Matter workspace gives a single estate-planning view inside this app only. No branch/mobile/web/advisor portal consolidation. |
| CRM-005 | Relationship teams: joint, household, SME client structures | RFP p11 | PARTIAL | Joint matter and relationships exist. No household portfolio aggregation, relationship-team assignment, or SME client structure. |
| CRM-006 | Branch onboarding assisted workflow separate from mobile app | eProcess Set 6 p2 | PARTIAL | Professional intake wizard exists, but no explicit branch-assisted onboarding channel/workflow or handoff model. |
| CRM-007 | Onboarding through branches, RMs, web portals, mobile channels | eProcess Set 6 p2 | PARTIAL | Internal web app exists; no client portal, mobile embedding, branch channel adapters, or RM-specific channel APIs. |

### 4. Personalized Investment and Wealth Management

| ID | Requirement | Source | Status | Gap |
|---|---|---|---|---|
| INV-001 | Tailor asset allocation per goal | RFP p11 | NOT_FOUND | No portfolio allocation engine or model portfolio mapping. |
| INV-002 | Rebalancing strategies per goal | RFP p11 | NOT_FOUND | No rebalancing calculations, tolerance bands, or trade proposal generation. |
| INV-003 | Investment strategy per goal | RFP p11 | NOT_FOUND | No strategy templates, risk-based portfolio construction, or advisor proposal. |
| INV-004 | Simulate portfolio growth against life goals | RFP p11 | NOT_FOUND | No returns, volatility, contribution schedule, Monte Carlo, deterministic projection, or portfolio-growth chart. |
| INV-005 | Product recommendations by goal timeline and risk appetite | RFP p11 | NOT_FOUND | No risk appetite capture, product catalog, or recommendation rules. |
| INV-006 | Recurring investment automation linked to goal tracking | RFP p11, eProcess Set 1 p1 | NOT_FOUND | No standing instruction, recurring investment schedule, payment/order link, or automation status. |
| INV-007 | Portfolio rebalancing prompts | eProcess Set 2 p5 | NOT_FOUND | No rebalancing prompt engine. |
| INV-008 | Suitability-aligned product insights | eProcess Set 2 p5 | NOT_FOUND | No suitability matrix or product insight generation. |

### 5. Portfolio Analytics and Reporting

| ID | Requirement | Source | Status | Gap |
|---|---|---|---|---|
| PORT-001 | Robust portfolio analytics | eProcess Set 2 p2-p3, Set 3 p2 | NOT_FOUND | Current analytics are estate KPIs and balance sheet. No portfolio analytics module. |
| PORT-002 | Consolidated performance reporting | eProcess Set 2 p2 | NOT_FOUND | No time-weighted/money-weighted performance, benchmark comparison, or portfolio return history. |
| PORT-003 | Asset-class performance reporting | eProcess Set 2 p2 | NOT_FOUND | Asset class totals exist; performance over time does not. |
| PORT-004 | Risk metrics | eProcess Set 2 p2, Set 3 p2 | NOT_FOUND | No risk analytics such as volatility, VaR, drawdown, concentration, credit/duration risk, or risk score. |
| PORT-005 | Asset allocation analytics | eProcess Set 3 p2 | PARTIAL | Balance sheet groups estate assets by class, but there is no investment allocation view against targets. |
| PORT-006 | Benchmarking | eProcess Set 3 p2 | NOT_FOUND | No benchmark entity, index data, or benchmark comparison. |
| PORT-007 | Goal-based reporting linking portfolio performance to targets, funding gaps, projected outcomes | eProcess Set 2 p2-p3 | NOT_FOUND | No portfolio-goal linkage or funding gap projections. |
| PORT-008 | Holdings, balances, transactions, pricing source integration from core banking | eProcess Set 2 p2, Set 3 p2 | NOT_FOUND | No holdings/balance/transaction/pricing models or ingestion APIs. |

### 6. Order Management and Trade Execution

| ID | Requirement | Source | Status | Gap |
|---|---|---|---|---|
| OMS-001 | OMS/trade execution in scope or integration where possible | eProcess Set 2 p2, Set 3 p1-p2 | NOT_FOUND | No OMS/trade route, order model, execution status, or broker/OMS connector. |
| OMS-002 | End-to-end advisory-to-execution workflow from goal creation and investment proposal to order execution, approvals, system handoffs | eProcess Set 2 p2 | NOT_FOUND | No investment proposal, approval workflow, order ticket, handoff, or execution callback. |
| OMS-003 | Route orders based on profiling/risk assessment to RMs and via APIs to processing platform | eProcess Set 2 p2, Set 3 p2 | NOT_FOUND | No profiling/risk assessment engine, RM routing workflow, or processing platform API. |
| OMS-004 | Straight-through transaction workflows where geography permits | eProcess Set 3 p1-p2 | NOT_FOUND | No STP capability or country-specific execution toggle. |
| OMS-005 | Native order routing where possible, integration otherwise | eProcess Set 3 p2 | NOT_FOUND | No native or integrated order-routing strategy implemented. |

### 7. Omnichannel Access and Digital Channels

| ID | Requirement | Source | Status | Gap |
|---|---|---|---|---|
| CH-001 | Cross-channel continuity: start with RM, continue digitally | RFP p14 | NOT_FOUND | No session handoff, draft journey continuation, client portal, or channel identity model. |
| CH-002 | Mobile/web progress dashboards | RFP p14 | PARTIAL | Responsive web UI exists; no mobile app integration or customer-facing progress dashboard. |
| CH-003 | Nudges, alerts, proactive engagement at milestones | RFP p14 | PARTIAL | Notifications table/routes exist, but no milestone/nudge engine tied to goals or portfolios. |
| CH-004 | Mobile-first solution for Africa's mobile penetration | RFP p14 | PARTIAL | Web UI exists; no native mobile app or embedded mobile SDK/API contract. |
| CH-005 | Embed wealth capabilities into Ecobank Mobile App rather than building standalone mobile app | eProcess Set 3 p2 | NOT_FOUND | No Ecobank Mobile App integration, SDK, deep link, or embeddable web module contract. |
| CH-006 | Integrate APIs into Ecobank Investor App, Ecobank Mobile App, OMNIPLUS | eProcess Set 1 p3 | NOT_FOUND | No channel-specific APIs, authentication model, or channel adapter. |

### 8. API-First Modular Architecture and Integration

| ID | Requirement | Source | Status | Gap |
|---|---|---|---|---|
| API-001 | REST APIs for CRM, core banking, product engines, risk, channels | RFP p14 | PARTIAL | REST APIs exist for estate-planning resources. No CRM/core banking/product/risk/channel integration endpoints. |
| API-002 | Event-driven architecture | RFP p14 | PARTIAL | Webhook subscription model exists, but dispatch is logged only and no durable event bus/outbox is implemented. |
| API-003 | Webhook support | RFP p14 | PARTIAL | Webhook registration exists, but `dispatchWebhook` does not actually POST to subscribers. |
| API-004 | Middleware and ESB-friendly design | RFP p14 | PARTIAL | API exists but no ESB contracts, canonical integration messages, retries, idempotency, or API gateway policy. |
| API-005 | Microservices structure for continuous deployment and modular innovation | RFP p14 | NOT_FOUND | App is a monolithic Express service and SPA. No service boundaries or independent deployables. |
| API-006 | Core banking integration for customer/holding/balance/transaction data | eProcess Set 2 p2, Set 3 p2, p4 | NOT_FOUND | No core banking connector or data ingestion. |
| API-007 | SharePoint document management integration | eProcess Set 1 p3 | NOT_FOUND | File metadata stores `local:files/...`; no Microsoft SharePoint connector. |
| API-008 | API-based data migration from core banking and investment systems | eProcess Set 3 p4 | NOT_FOUND | No migration framework, staging tables, reconciliation, validation, or source-system connectors. |

### 9. Multi-Country, Multi-Entity Deployment and Localization

| ID | Requirement | Source | Status | Gap |
|---|---|---|---|---|
| MC-001 | Multi-entity single instance (MESI) for 32+ affiliates | RFP p11-p12, eProcess Set 1 p1-p2, Set 3 p3, Set 6 p1-p2 | PARTIAL | Tenant/jurisdiction abstractions exist, but only 10 jurisdictions are seeded and no 32-affiliate entity model exists. |
| MC-002 | Central single instance with country-level access controls | eProcess Set 6 p2 | PARTIAL | Tenant and API-key scoping exist, but no country-level RBAC/ABAC enforcement model across affiliates/regions. |
| MC-003 | Pilot Ghana and Nigeria, possible parallel launch | eProcess Set 6 p1 | PARTIAL | Ghana and Nigeria jurisdiction data exists, but no rollout/pilot configuration or launch-readiness workflow. |
| MC-004 | Priority rollout sequence: Ghana, Nigeria, Cote d'Ivoire, Kenya, Guinea, Cameroon, Uganda, Senegal, Zimbabwe, Togo, Burkina, Benin, Gabon, Tanzania | eProcess Set 6 p1 | PARTIAL | Some countries exist (GH, NG, KE, CM, SN); many priority markets are missing (CI, Guinea, UG, ZW, TG, BF, BJ, GA, TZ). |
| MC-005 | Group entities into 5 regions: Nigeria, UEMOA, AWA, CESA 1, CESA 2 | eProcess Set 6 p1 | NOT_FOUND | No region grouping model or access/control hierarchy. |
| MC-006 | One codebase, multi-instance architecture tailored per country: tax, currency, product, regulation | RFP p11 | PARTIAL | Jurisdiction packs/currency exist, but product and full tax/regulatory localization are missing. |
| MC-007 | Regional configurations for Francophone, Anglophone, Lusophone clusters | RFP p11 | PARTIAL | Language and selected packs exist; no cluster-level configuration, product eligibility, or disclosure set. |
| MC-008 | Legal, cultural, religious workflow customization | RFP p13 | PARTIAL | Faraid and civil-law checks exist, but no configurable advisory workflow engine per culture/religion beyond estate rules. |
| MC-009 | Local product and disclosure logic adaptability | RFP p13 | NOT_FOUND | No product/disclosure rules engine for wealth products. |
| MC-010 | Consistent RM and client experience across all geographies | RFP p12 | PARTIAL | Internal UI is common, but not validated for all affiliates/client channels. |
| MC-011 | Future readiness for regional expansions, divestitures, legal entity adjustments | RFP p12 | PARTIAL | Tenant/jurisdiction model helps, but no legal-entity lifecycle, migration, divestiture, or regional admin workflow. |
| MC-012 | Multi-currency capabilities | RFP p11 | PARTIAL | Currency is captured on assets/liabilities, but no FX rates, base currency, multi-currency portfolio valuation, or currency reporting alignment. |
| MC-013 | Currency and regulatory display alignment by region | RFP p13 | PARTIAL | `Intl` currency formatting exists; no regulatory display packs by region. |
| MC-014 | Local tax rules per market, including income tax, capital gains, retirement | RFP p13 | PARTIAL | UK IHT and selected estate rules exist. No income tax, CGT, retirement tax, or broad country tax packs. |

### 10. Regulatory Compliance and Suitability

| ID | Requirement | Source | Status | Gap |
|---|---|---|---|---|
| REG-001 | Embedded prompts for suitability, affordability, appropriateness | RFP p13 | NOT_FOUND | No investment suitability/affordability/appropriateness workflow or questions. |
| REG-002 | Auto-generated compliance summaries for advice | RFP p13 | PARTIAL | Estate conflict/review memos exist, but no investment advice compliance summary. |
| REG-003 | Audit trail storage | RFP p13-p14 | PARTIAL | Audit events exist; no tamper-proof/immutable log implementation. |
| REG-004 | Region-specific disclosure/documentation/advice logic | RFP p13, Set 2 p5 | PARTIAL | Estate document templates/rules exist; no wealth product disclosure/advice logic. |
| REG-005 | Centrally governed rules at Group level with country-local configuration | eProcess Set 2 p5 | PARTIAL | Pack governance exists, but no Group/country governance workflow for suitability, products, and compliance. |
| REG-006 | Country teams manage local client relationships, product activation, regulatory localization | eProcess Set 2 p5 | NOT_FOUND | No central-vs-country operating model, product activation workflow, or country admin role model. |
| REG-007 | Role-based access and governance controls for central/country teams | eProcess Set 2 p5 | PARTIAL | API scopes and UI role switch exist; no production country/team authorization model. |

### 11. Advisor Enablement, RM Learning, and LMS Integration

| ID | Requirement | Source | Status | Gap |
|---|---|---|---|---|
| ADV-001 | Structured prompts guiding RMs through best-practice advisory engagement | RFP p13 | PARTIAL | Estate intake wizard exists, but no RM wealth-advisory script, suitability prompt, or next-best-action workflow. |
| ADV-002 | Cross-sell/up-sell logic anchored in life goals | RFP p13 | NOT_FOUND | No product recommendation/cross-sell engine. |
| ADV-003 | Visual co-planning dashboards for client engagement | RFP p13 | PARTIAL | Estate dashboard and charts exist; no RM-client co-planning view for financial goals. |
| LMS-001 | Embedded access to structured Financial Planning Certification programs | RFP p13, eProcess Set 1 p2-p3 | NOT_FOUND | No certification content, external LMS link, or embedded learning workflow. |
| LMS-002 | Integrate Oracle cloud My-HR / Ecobank Academy LMS | eProcess Set 1 p2-p3 | NOT_FOUND | No Oracle/My-HR/Ecobank Academy integration. |
| LMS-003 | RM progress tracking across Ethics, Planning, Risk, Investment, Estate Planning | RFP p13, eProcess Set 1 p3 | NOT_FOUND | No RM competency model, training progress, certifications, or scorecard. |
| LMS-004 | Integration with HR L&D platforms and regional career paths | RFP p13, eProcess Set 1 p3 | NOT_FOUND | No HR/L&D connector or career-path mapping. |

### 12. AI Personalization and Insights

| ID | Requirement | Source | Status | Gap |
|---|---|---|---|---|
| AIW-001 | AI-driven recommendations that enhance advisory effectiveness | eProcess Set 2 p4-p5 | NOT_FOUND | Current AI module is safety/evaluation logging, not recommendation generation. |
| AIW-002 | Predictive nudges and financial goal optimization using behavioral data | RFP p14 | NOT_FOUND | No behavioral data model, predictive engine, or goal optimization. |
| AIW-003 | Personalized recommendations and persona segmentation | RFP p14 | NOT_FOUND | No persona segmentation model. |
| AIW-004 | Continuous learning loops from client outcomes | RFP p14 | NOT_FOUND | No outcome tracking or feedback loop. |
| AIW-005 | Robo-advisory AI/ML algorithms for automated tailored investment advice | RFP p14 | NOT_FOUND | No robo-advice engine or regulated automated-advice controls. |
| AIW-006 | AI-driven investment insights tailored to African markets | RFP p14 | NOT_FOUND | No market data, African-market investment insight engine, or model governance for investment insights. |
| AIW-007 | Integrate existing AI/ML system if present | eProcess Set 1 p3 | NOT_FOUND | eProcess says none exists; app does not provide external AI/ML integration. |

### 13. Security, Privacy, IAM, and Compliance Foundation

| ID | Requirement | Source | Status | Gap |
|---|---|---|---|---|
| SECW-001 | Enterprise-grade encryption in transit and at rest | RFP p14 | DOC_ONLY/PARTIAL | TLS and managed encrypted storage are documented; app does not itself enforce production TLS or at-rest encryption. |
| SECW-002 | IAM, RBAC/ABAC controls | RFP p14 | PARTIAL | API-key tenant isolation and ABAC scaffold exist; production IAM/RBAC/ABAC user model is incomplete. |
| SECW-003 | OAuth2 and SSO | RFP p14 | DOC_ONLY | IdP/OIDC replacement is documented as a future production obligation; not implemented. |
| SECW-004 | Secure session handling | RFP p14 | NOT_FOUND | No user session/token validation; frontend uses demo API key headers. |
| SECW-005 | SOC2, ISO 27001, GDPR, POPIA aligned | RFP p14 | PARTIAL | Tracking endpoints/docs exist; certification/control operation is not implemented or evidenced. POPIA-specific controls are not explicit. |
| SECW-006 | Full audit trails and tamper-proof change logs | RFP p14 | PARTIAL | AuditEvent exists; no append-only storage, hashing chain, WORM storage, or tamper-proof guarantee. |
| SECW-007 | Role-based authorizations | RFP p14 | PARTIAL | UI role switch and API scopes exist; route-level enforcement is incomplete and not tied to IdP roles. |
| SECW-008 | Cross-border data hosting permitted with safeguards | eProcess Set 3 p2, Set 6 p2 | DOC_ONLY/PARTIAL | Regional hosting docs exist; enforcement across central/country access and data transfer logging is incomplete. |
| SECW-009 | Vendor cloud infra moved into Ecobank space to conform to data protection guidance | eProcess Set 6 p2 | NOT_FOUND | No deployment automation or tenancy model for Ecobank-managed cloud account/VPC. |

### 14. Deployment, Infrastructure, HA, DR, and Database

| ID | Requirement | Source | Status | Gap |
|---|---|---|---|---|
| INF-001 | Preferred cloud-based deployment | eProcess Set 1 p1, Set 3 p4 | PARTIAL | Dockerfile exists, but no cloud deployment manifests/Terraform/Helm/AWS/GCP implementation. |
| INF-002 | Public cloud first, AWS or GCP | eProcess Set 3 p4, Set 5 p2 | DOC_ONLY/PARTIAL | AWS is mentioned in docs, but no AWS/GCP infrastructure code. |
| INF-003 | Container-based deployment preferred | eProcess Set 3 p4, Set 5 p2 | PARTIAL | Dockerfile exists; no Kubernetes/OpenShift manifests. |
| INF-004 | OpenShift Containers if on-prem/private cloud | eProcess Set 5 p2 | NOT_FOUND | No OpenShift deployment artifacts. |
| INF-005 | Preferred database MS SQL for public cloud and on-prem options | eProcess Set 5 p2 | NOT_FOUND | Prisma datasource is PostgreSQL. No MS SQL adapter/testing/migrations. |
| INF-006 | Production, DR, UAT, SIT, development/pre-production environments | eProcess Set 3 p4 | DOC_ONLY/PARTIAL | Environment concepts exist in docs only; no environment-specific deployment configs. |
| INF-007 | Staging same architecture as production | eProcess Set 3 p4 | NOT_FOUND | No staging architecture enforcement. |
| INF-008 | HA required for production and DR | eProcess Set 3 p5 | DOC_ONLY | DR/HA runbook exists, but no deployed HA topology or config. |
| INF-009 | DR same compute capacity as production, 100% of DC | eProcess Set 3 p5 | NOT_FOUND | No DR compute sizing implementation. |
| INF-010 | Data centers currently Accra-Ghana and Lagos-Nigeria; initial instance in Ghana and DR in Lagos | eProcess Set 6 p1 | NOT_FOUND | No Ghana/Lagos deployment or region mapping. |
| INF-011 | Solution deployable everywhere | eProcess Set 3 p4 | NOT_FOUND | No multi-region/multi-country deployment package. |
| INF-012 | Sizing for 100,000 customers, 200k+ accounts, 150+ RMs initially, 200 internal users first instance, 400 users in 5 years | eProcess Set 1 p3, Set 3 p3, Set 6 p2 | NOT_FOUND | No load/performance sizing, capacity tests, or account/customer scale model. |
| INF-013 | Peak/day transaction volumes to be confirmed but platform must be size-ready | eProcess Set 3 p3, Set 5 p1 | NOT_FOUND | No transaction-volume capacity model. |

### 15. Data Migration and Legacy Systems

| ID | Requirement | Source | Status | Gap |
|---|---|---|---|---|
| MIG-001 | Migrate client profiles | eProcess Set 2 p4, Set 3 p4 | NOT_FOUND | No import/migration pipelines, staging, dedupe, or validation. |
| MIG-002 | Migrate portfolios | eProcess Set 2 p4, Set 3 p4 | NOT_FOUND | No portfolio model. |
| MIG-003 | Migrate balances | eProcess Set 2 p4, Set 3 p4 | NOT_FOUND | No balance model or migration pipeline. |
| MIG-004 | Migrate selected historical data | eProcess Set 2 p4, Set 3 p4 | NOT_FOUND | No historical transaction/valuation model. |
| MIG-005 | Legacy system decommissioning support | eProcess Set 3 p4 | NOT_FOUND | Legacy systems to be confirmed, but no decommissioning/migration playbook exists. |

### 16. Documentation, Testing, PoC, and Procurement Response

| ID | Requirement | Source | Status | Gap |
|---|---|---|---|---|
| DOC-001 | Acceptance tests to confirm quality and completeness | RFP p15 | PARTIAL | Test artifacts exist only under `dist-server/tests`; active `tests/` directory is empty and test command could not run in this shell. |
| DOC-002 | Feasibility reports | RFP p15 | NOT_FOUND | No RFP feasibility report exists for wealth platform scope. |
| DOC-003 | Proof of concept success criteria and reports | RFP p15, Set 2 p4 | NOT_FOUND | No PoC criteria/report for Ecobank scope. |
| DOC-004 | High-level design documentation | RFP p15 | PARTIAL | Some architecture/security docs exist, but not HLD for wealth management platform. |
| DOC-005 | Low-level design documentation | RFP p15 | PARTIAL | API/OpenAPI and code exist, but no LLD for integrations, OMS, portfolio analytics, data migration, MESI. |
| DOC-006 | Capability data sheets | RFP p15 | NOT_FOUND | No capability data sheets. |
| DOC-007 | Reference sites | RFP p15, p18 | OUTSIDE_APP | Requires vendor/commercial evidence, not code. |
| DOC-008 | Technical comparison between bidder and competitors | RFP p15 | NOT_FOUND | No competitor comparison. |
| DOC-009 | Vendor profile and references for wealth deployments | RFP p18 | OUTSIDE_APP | Requires company/vendor evidence. |
| DOC-010 | Financial proposal in USD, quarterly payments, tax-inclusive costs | RFP p19 | OUTSIDE_APP | Commercial response needed. |
| DOC-011 | Completed Ecobank information security questionnaire and third-party due diligence | RFP p20 | NOT_FOUND | No completed questionnaire artifacts found. |
| DOC-012 | G2 or Gartner quadrant in last two years for Financial Need Analysis Tool, with G2 reviews or proven references | RFP p16, eProcess Set 4 p1, Set 6 p2-p3 | OUTSIDE_APP | Product/vendor qualification evidence required. Code cannot satisfy this. |
| DOC-013 | Minimum 5 years verifiable solution deployment experience | RFP p16 | OUTSIDE_APP | Vendor qualification evidence required. |

## Highest Priority Remediation Themes

1. **Define whether this product is being repositioned as full wealth management or kept as estate planning.** The RFP demands much more than estate planning. Without this decision, the delivery scope is ambiguous.
2. **Add core wealth domain models:** customer segment, household, RM/team, financial goals with target amount/date, risk profile, portfolio, holding, transaction, market price, product catalog, recommendation, proposal, order, execution, suitability result.
3. **Build integration architecture:** CRM/Dynamics, core banking, investment systems, pricing, OMS/broker/execution, Ecobank channels, SharePoint, LMS/My-HR, and webhooks with real outbound dispatch.
4. **Implement goal-based planning and portfolio analytics:** projections, funding gaps, what-if life events, portfolio performance, risk, allocation, benchmarks, and goal-linked reporting.
5. **Implement suitability and compliance by design:** suitability/appropriateness/affordability prompts, country-specific disclosure/advice logic, compliance summaries, immutable audit log.
6. **Implement multi-country MESI:** 32-affiliate coverage, region grouping, country-level access controls, local tax/product/disclosure configurations, rollout controls.
7. **Harden production architecture:** IdP/OIDC SSO, MFA tied to identity provider, managed encrypted storage, MS SQL decision or waiver, cloud deployment artifacts, HA/DR topology, capacity tests.
8. **Rebuild active test coverage:** restore source tests under `tests/**/*.test.ts`, add RFP-focused tests, and run CI against Node/npm-enabled environment.

## Fitment by RFP Capability Group

| RFP Capability Group | Fitment | Notes |
|---|---:|---|
| Dynamic financial goal planning and simulations | 20% | Estate goals exist, but no SMART financial planning/projection engine. |
| Seamless client lifecycle and CRM integration | 15% | Manual matter/client intake only; no CRM/core banking sync. |
| Personalized investment and wealth management | 5% | Estate asset inventory exists; no portfolio construction/rebalancing/recommendations. |
| Scalable multi-country, multi-entity deployment | 35% | Tenants/jurisdictions exist for 10 jurisdictions; no 32-affiliate MESI or regional entity model. |
| Localized financial planning | 35% | Languages and some jurisdiction packs exist; tax/product/disclosure localization mostly missing. |
| Regulatory compliance and suitability | 30% | Estate legal compliance exists; investment suitability and advice compliance missing. |
| Advisor enablement and best-practice workflows | 25% | Intake wizard exists; no RM wealth advisory workflow. |
| Integrated learning/certification/RM upliftment | 0% | No LMS/RM certification/progress model. |
| Omnichannel RM/client experience | 15% | Web app exists; no Ecobank mobile/web/channel embedding or continuity. |
| API-first modular architecture | 35% | REST APIs and webhook scaffold exist; integrations/microservices/event bus missing. |
| AI personalization and insights | 10% | AI safety logging exists; no personalization or robo-advice. |
| Security/privacy/compliance foundation | 45% | Good scaffolding and docs; SSO, secure sessions, immutable audit, production controls incomplete. |
| Documentation, PoC, vendor eligibility | 20% | Some architecture docs exist; RFP-specific PoC, HLD/LLD, questionnaires, and vendor proof missing. |

## Bottom Line

The current app can credibly support an **estate-planning demo/workstream** within the RFP, especially for African/UK cross-border estate planning, wills, inheritance tax, Faraid, and legal workflow evidence. It is **not yet a fit for the full Ecobank wealth management platform** without a major expansion into investment/portfolio, banking integrations, channel embedding, suitability, RM enablement, and production-scale multi-entity deployment.
