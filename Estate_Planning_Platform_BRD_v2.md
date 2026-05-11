# Business Requirements Document (v2)

## Configurable Multijurisdictional Estate Planning and Estate Administration Platform

**Version 2.0 | 2026-05-11**
**Prepared for: product discovery, planning, AI-agent design, high-level architecture, and Phase-1 investment-grade decision making.**

> **Important legal-product posture.** This BRD is a product and technology requirements document, not legal advice. The platform must be configured, reviewed, localized, and periodically updated by qualified professionals for each jurisdiction in which it is deployed. The application should help users organize information, understand workflows, prepare for professional review, and administer approved estate structures. It should not hold itself out as a substitute for a licensed attorney, notary, tax adviser, fiduciary, or regulated trust and company service provider.

---

## Change Log — What's New in v2

V2 is a substantial rewrite of v1 (2026-05-11). It retains v1's configuration-first thesis, domain glossary, jurisdiction-pack architecture, and core functional/non-functional requirements, but addresses ten material gaps surfaced by adversarial evaluation of v1:

| # | Change | Why it changed | Sections affected |
|---|---|---|---|
| 1 | MVP narrowed from "global platform across 4 languages" to **England & Wales + Portugal, wills only, English + pt-PT, B2B-only** | V1's MVP listed 12+ capabilities that are each full products; v2 ships a single defensible wedge that proves the configuration-first thesis with one common-law and one civil-law jurisdiction | §5, §25 |
| 2 | **Commercial Model & Operating Economics** section added (did not exist in v1) | V1 specified what to build but not how the platform pays for itself; v2 commits to tiered B2B SaaS, API revenue share, year-3 ARR target, and capital plan | §5A (new) |
| 3 | **AI Agent Requirements rewritten with measurable evaluation framework** | V1 had 12 well-written policy statements with no metrics, no evaluation set, no measurement cadence; v2 adds grounding rate, citation accuracy, escalation appropriateness, hallucination rate, language parity, red-team coverage, and release gating | §14 |
| 4 | **Conflict-of-Laws Module** added as a deterministic decision-support component | V1's response to cross-border was "escalate to professional review"; v2 adds an EU 650/2012-aware and Hague-Convention-aware decision engine producing structured cross-border memos | §15 (new) |
| 5 | **Legal Content Operations Operating Model** added with FTE assumptions, retained-counsel model, per-jurisdiction-pack TCO, and update cadence | V1 described governance as a process; v2 commits to a real operating model with cost ranges | §23 |
| 6 | **Per-Jurisdiction UPL & Regulatory Posture** section added | V1 mentioned UPL once; v2 commits to a per-jurisdiction legal-opinion gate, professional-liability insurance posture, and B2B-tenant indemnity model | §18 (new) |
| 7 | Competitive positioning reframed from "platform" to **API-first intelligence layer** that partners with practice-management incumbents (Clio, MyCase, NetDocuments, Smokeball) rather than competes head-on | V1 implicitly competed with practice-management vendors and would have lost; v2 positions the platform as the legal-content infrastructure underneath them | §3, §5, §18 |
| 8 | **Multilingual launch policy split** into UI-language launch vs document-output-language launch with explicit per-locale gating | V1's "four languages from launch" implied 12-15 locale variants; v2 launches 2 UI languages and 2 document-output languages, with others gated by market demand and validated legal-glossary readiness | §16 |
| 9 | **Phase-1 KPIs and Decision Gates** section added | V1 had no quantitative success criteria for the MVP; v2 commits to tenant-acquisition targets, jurisdiction-pack velocity targets, AI safety thresholds, and explicit go/no-go conditions for proceeding to Phase 2 | §26 (new) |
| 10 | Risk register refreshed with **flywheel risk, specialist-vertical risk, and regulatory-drift risk** as fundamental risks not fully mitigable | V1 listed mostly mitigable design-time risks; v2 names the residual existential risks honestly | §27 |

V2 is not a global platform specification. It is a Phase-1 launch plan with a multijurisdictional architecture beneath it. Sections that v1 wrote for global scope are now framed as Phase-2/3 commitments.

---

## 1. Document Control

| Field | Value |
|---|---|
| Document name | Business Requirements Document v2 — Configurable Multijurisdictional Estate Planning and Estate Administration Platform |
| Version | 2.0 |
| Supersedes | v1.0 (2026-05-11) |
| Prepared for | Product owner, business analysts, solution architects, AI-agent designers, compliance leads, legal-content maintainers, engineering teams, implementation partners, and investment decision-makers |
| Business domain | Estate planning, wealth-transfer planning, estate administration, trust/fiduciary operations, cross-border succession support, legal-document workflow orchestration |
| Primary launch languages (UI) | English (en-GB), Portuguese (pt-PT) |
| Phase-1 document-output languages | English (en-GB), Portuguese (pt-PT) — will templates only |
| Phase-2 candidate UI languages | French (fr-CA), Spanish (es-ES) — gated by market demand and legal-glossary readiness |
| Launch deployment model | B2B (sold to solicitors, notarial offices, and small/medium law firms) and B2B-via-API (sold into practice-management incumbents) |
| Phase-2 candidate deployment models | B2B2C via banks and wealth managers (gated by tenant-density milestone) |
| Out of scope unless separately authorized | Automated legal advice, unauthorized document drafting, investment advice, tax filing as a regulated service, asset custody, money transmission, court filing as a legal representative, acting as trustee/executor unless the operating entity is authorized |

---

## 2. Static Contents

1. Document Control
2. Static Contents
3. Executive Summary
4. Business Objectives and Success Measures
5. Scope, Boundaries, and Product Modes
5A. Commercial Model and Operating Economics *(new in v2)*
6. Definitions and Domain Glossary
7. Regulatory and Market Context
8. Stakeholders, Personas, and Role Model
9. Common Requirements Across Countries
10. Country-Specific Requirement Families
11. Configurability Strategy
12. Jurisdiction Pack Architecture
13. Functional Requirements
14. AI Agent Requirements, Guardrails, and Evaluation Framework *(major rewrite)*
15. Conflict-of-Laws Module *(new in v2)*
16. Multilingual and Localization Requirements *(refined)*
17. Data, Privacy, Security, and Compliance Requirements
18. Per-Jurisdiction UPL and Regulatory Posture *(new in v2)*
19. Non-Functional Requirements
20. Integrations and External Services
21. Reporting and Analytics
22. Workflow Blueprints
23. Configuration Governance and Legal Content Operations *(major rewrite)*
24. Testing, QA, and Acceptance Strategy
25. MVP, Phasing, and Roadmap *(major rewrite — narrower)*
26. Phase-1 KPIs and Decision Gates *(new in v2)*
27. Risks, Assumptions, Dependencies, and Open Decisions *(refreshed)*
28. Appendices

---

## 3. Executive Summary

The platform is a **configuration-first estate-planning intelligence layer**: a rules engine, workflow engine, document assembly engine, and bounded AI assistance, surrounded by professional-review gates and audit-grade traceability, with country-specific legal content packaged as governed, versioned, effective-dated jurisdiction packs. The platform separates universal estate-planning domain concepts (persons, relationships, assets, ownership, beneficiaries, fiduciaries, documents, deadlines, consents, reviews, tasks, audit trails) from jurisdiction-specific legal rules (forced heirship, marital property regimes, probate pathways, witness/notary requirements, tax thresholds, document templates, registrations).

V2 makes a deliberate strategic narrowing relative to v1. V1 implicitly proposed a global platform across four languages; v2 commits to a Phase-1 launch in **England & Wales and Portugal** only, in English and European Portuguese, for **wills only**, **B2B-only**, sold to solicitors and notarial offices directly and into practice-management vendors via API. The Phase-1 thesis is to prove that the configuration-first architecture genuinely allows a second jurisdiction pack to be built materially faster and cheaper than the first, and that B2B tenant density per jurisdiction can be reached before Phase-1 capital is exhausted. Phases 2-5 expand jurisdictions, document types, languages, modes (administration, fiduciary management, professional portal, configuration studio), and deployment models — but only after the Phase-1 flywheel is demonstrably working.

Competitive positioning is **API-first intelligence layer**, comparable in structure to Avalara for sales-tax compliance, Onfido for identity verification, and Plaid for banking data. The platform does not compete head-on with practice-management incumbents (Clio, MyCase, NetDocuments, Smokeball) — it integrates beneath them, providing jurisdiction-pack rule evaluation, document generation, and compliance gating as services that practice-management vendors and law firms consume. The platform may also operate a standalone professional portal for firms without practice-management software, but the API-first stance is the strategic priority.

The AI is treated as a controlled assistant, not an autonomous legal adviser, with **measurable evaluation criteria**: grounding rate ≥95% to active jurisdiction-pack content, citation accuracy ≥98%, escalation appropriateness ≥99% on high-risk prompts, hallucinated-citation rate ≤1%, language-parity gap ≤3 percentage points, full refusal on prohibited-intent red-team sets. AI evaluation is a release gate, not an aspiration.

Cross-border matters are handled by a **deterministic Conflict-of-Laws Module** that captures connecting factors (habitual residence, domicile, nationality, asset situs, matrimonial property regime), runs EU 650/2012 logic for participating states, runs Hague Convention recognition logic for wills, and produces a structured conflict-of-laws memo for professional review. Cross-border cases still escalate to professional review, but the platform produces structured decision-support rather than escalating an empty matter.

Legal content operations is treated as the company's core ongoing investment — not a process, but an **operating model** with defined FTE assumptions, retained-counsel cost ranges, per-jurisdiction-pack total cost of ownership, and a quarterly law-update cadence. The largest existential risk to the company is failing to reach tenant-density breakeven per jurisdiction before capital is exhausted; v2 articulates this risk explicitly and proposes Phase-1 decision gates that force a go/no-go conversation at 18 and 24 months.

---

## 4. Business Objectives and Success Measures

### 4.1 Business objectives

Build a defensible legal-content infrastructure layer in a category that currently has no infrastructure layer. Estate-planning software today is jurisdiction-locked (Trust & Will and FreeWill in the US; Farewill, Octopus Legacy, and Will.co.uk in the UK; civil-law-specific notarial systems in France, Spain, Portugal; Notarius in Quebec). No incumbent operates a configurable, multijurisdictional, multilingual platform with measurable AI safety and a deterministic cross-border module.

Reduce discovery and intake time for professional users by capturing structured client, family, asset, liability, and beneficiary data once and reusing it across scenarios, workflows, documents, reviews, and administration cases.

Make jurisdictional differences explicit and auditable through configurable rules, workflows, document packs, and professional-review checkpoints, with effective-dated rule versions.

Support B2B and B2B-via-API channels at Phase 1; expand to B2B2C through banks and wealth managers and to D2C with explicit per-jurisdiction UPL clearance at Phase 3 and beyond.

Operate AI features under measurable safety constraints from day one, with release gates tied to evaluation thresholds rather than to project deadlines.

### 4.2 Success measures

| Measure | Target behaviour |
|---|---|
| Jurisdiction-pack velocity | Pack #3 (Phase-2 first jurisdiction) ships in ≤50% of the elapsed engineering and legal-content time of pack #1. If pack #3 is not materially faster, the configuration-first thesis is broken and the company should reposition. |
| Rule traceability | Every legal decision, warning, document clause, workflow branch, tax calculation, or AI explanation is traceable to a versioned rule, source note, template, or professional override. 100% trace coverage on production cases. |
| Professional-review efficiency | Median time-to-finalize a will reduced by ≥40% versus pre-platform baseline at MVP solicitor tenants, measured against tenant-supplied baseline data. |
| User confidence (professional) | Net Promoter Score ≥40 at solicitor and notarial tenants by month 18. |
| Localization quality | Document output passes legal-glossary lint, sworn-translation metadata (where required), and locale formatting on 100% of generated documents. Failed lint blocks finalization. |
| Compliance posture | Per-jurisdiction UPL opinion in hand before launch; tenant E&O carrier confirmation; AML/KYC, e-signature, audit, retention controls tested against jurisdiction-pack release criteria before each pack publication. |
| AI safety | Grounding ≥95%, citation accuracy ≥98%, escalation appropriateness ≥99%, hallucinated-citation rate ≤1%, language-parity gap ≤3pp, red-team refusal 100%. (Defined in §14.) |
| Administration continuity | After death or incapacity, the same data model supports executor/personal-representative/trustee workflows once Phase-3 (administration mode) ships. |

---

## 5. Scope, Boundaries, and Product Modes

### 5.1 Phase-1 in-scope (the MVP wedge)

The Phase-1 wedge is deliberately narrow. The capabilities below are the only capabilities funded for the first 12-15 months of build and the first 18-24 months of operation; everything else is Phase-2 or later.

- Client onboarding, identity profile, residency/domicile/habitual-residence questionnaire, language selection, and consent capture — limited to data fields required by the two launch jurisdictions.
- Family, household, dependents, beneficiaries, heirs, fiduciaries graph — limited to relationship taxonomies recognized in England & Wales and Portugal.
- Asset and liability inventory covering real estate, bank accounts, securities, pension/retirement assets, insurance, and debts — sufficient for will preparation; richer classes (digital assets, private-company shares, agricultural assets, IP, collectibles) added in Phase 2.
- Ownership and title modelling — sole ownership, joint tenancy, tenancy-in-common, beneficial ownership at the level needed for English wills and Portuguese succession; full matrimonial-property modelling deferred to Phase 2.
- Estate-plan scenario design for **wills only** — intended distributions, specific gifts, residue, guardianship nominations, executor appointments, alternates. Trusts, foundations, business succession, charitable structures, and incapacity directives are Phase 2+.
- Conflict and risk checks via Phase-1 rule packs — forced-heirship checks (Portugal), tax-threshold checks (UK IHT), missing-witness checks, minor-beneficiary flags, cross-border flags via the Conflict-of-Laws Module.
- Document assembly for **wills only** in English (en-GB) and Portuguese (pt-PT), with execution instructions appropriate to each jurisdiction. Codicils ship in Phase 1 if engineering bandwidth allows; otherwise Phase 1.5.
- Professional review, approval, redline, finalization, and signing-ceremony workflow.
- Audit trail of rule evaluations, data changes, document changes, approvals, AI interactions, and professional overrides — at 100% coverage.
- Multilingual UI for English (en-GB) and Portuguese (pt-PT) with language switching.
- Public API for jurisdiction-pack rule evaluation, document generation, and matter management — the API-first commercial channel.

### 5.2 Phase-2 in-scope (gated by Phase-1 KPI achievement; see §26)

- Estate administration mode (post-death case opening, authority validation, inventory, debts/taxes, notices, distributions, accounting, closure).
- Additional document types: codicils, letters of wishes, powers of attorney, healthcare directives, beneficiary nomination forms.
- Additional jurisdictions: candidates include Ireland, Quebec, Scotland, Northern Ireland (in priority order based on launch-tenant demand).
- Additional UI and document-output languages: fr-CA and es-ES gated by market demand and legal-glossary readiness.
- Practice-management partnership integrations beyond raw API access: Clio, MyCase, NetDocuments certified integrations.

### 5.3 Phase-3 and later (deferred from v1's MVP)

- Trust/fiduciary management mode.
- Professional portal mode beyond simple multi-matter access (full role-based firm dashboards, billing integration, conflict-of-interest engines, partner approvals).
- Configuration studio mode with self-service rule editing for tenants.
- US state-level expansion (subject to per-state UPL clearance — see §18).
- D2C deployment in any jurisdiction (subject to per-jurisdiction UPL clearance).
- Direct court/notary/registry filing.
- Live tax filing.

### 5.4 Permanently out-of-scope (unless separately authorized and licensed)

- The platform does not represent that it provides legal advice directly to the public unless the operator has the required legal-services authorization in each relevant jurisdiction.
- The platform does not execute property transfers, register deeds, file court documents, file tax returns, act as trustee/executor, or provide investment/tax advice unless connected to a licensed or authorized provider and configured with appropriate legal, regulatory, and operational controls.
- The platform does not make irrevocable decisions based only on AI recommendations. Final legal decisions remain with the user and/or qualified professional according to the deployment model.
- The platform does not treat electronic signatures as universally valid for wills or estate documents. Each document type and jurisdiction defines whether wet ink, witnesses, notary, qualified e-signature, court approval, or registry filing is required.
- The platform does not assume trust law exists or works the same way in all countries. Civil-law jurisdictions may require different structures or treatment.

### 5.5 Phase-1 product mode

Only one product mode ships at Phase 1: **Planning Mode**, in B2B and B2B-via-API form.

| Mode | Phase | Primary users | Notes |
|---|---|---|---|
| Planning mode (B2B) | Phase 1 | Solicitors, notaries, paralegals, tax advisers at law/notarial tenants | Standalone web app accessed by professional users; clients participate as guests of the tenant |
| Planning mode (B2B-via-API) | Phase 1 | Practice-management vendors and integrating law firms | API access to rule evaluation, document generation, matter management; no UI surface owned by the platform |
| Administration mode | Phase 3 | Executors, personal representatives, beneficiaries | Gated by Phase-1 success |
| Fiduciary management mode | Phase 4 | Trustees, fiduciary officers, compliance officers | Requires regulatory clearance per jurisdiction |
| Professional portal mode | Phase 2.5 | Law firm administrators, partner-level reviewers | Multi-matter, multi-tenant, role-based |
| Configuration studio mode | Internal at Phase 1; Phase 4 for tenants | Legal-content team and approved tenant counsel | Self-service tenant rule editing requires careful UPL boundary design |

---

## 5A. Commercial Model and Operating Economics *(new in v2)*

This section did not exist in v1. Adversarial evaluation identified its absence as the single largest gap: v1 specified an entire platform without articulating how it pays for itself.

### 5A.1 Pricing model

| Tier | Audience | Monthly price | Annual price | Notes |
|---|---|---|---|---|
| Solo / SmallFirm SaaS | 1-5 user solicitor/notarial offices | £300-500 / month per firm | £3.6k-6k ARR | Includes 1 jurisdiction; additional packs at £100/month each |
| Mid-market SaaS | 6-50 user law firms | £2,000-6,000 / month per firm | £24k-72k ARR | Includes up to 3 jurisdictions; SLA-backed support; dedicated success manager |
| Enterprise SaaS | 50+ user firms; banks; wealth managers | Negotiated | £75k-300k+ ARR | Includes deeper integrations, custom workflows, audit support |
| API tier | Practice-management vendors; large firms with internal engineering | Per-call + minimum commitment | £25k-150k ARR + usage | Revenue share with practice-management partners |
| Per-matter / per-document usage | Add-on across all tiers | £15-50 per finalized will (illustrative) | Variable | Transactional pricing for low-volume tenants |

### 5A.2 Year-by-year revenue plan

| Phase | Year | Target tenants | Target ARR | Notes |
|---|---|---|---|---|
| Phase 0 (Discovery) | Year 0 | 0 | £0 | Pre-launch; design partner LOIs only |
| Phase 1 (Launch) | Year 1 | 20-40 firms across 2 jurisdictions | £150k-400k | Early-design-partner pricing |
| Phase 1 (Scale) | Year 2 | 100-200 firms across 2 jurisdictions | £1M-2.5M | First API partnership live |
| Phase 2 (Expand) | Year 3 | 200-400 firms across 3 jurisdictions | £5M-8M | Pack #3 live; first mid-market and enterprise tenants |
| Phase 3 (Administration) | Year 4 | 400-700 firms across 4-5 jurisdictions | £12M-20M | Administration mode adds per-matter revenue |
| Phase 4 (Fiduciary) | Year 5 | 700-1,200 firms; 2-3 wealth-manager B2B2C tenants | £25M-40M | Trust company segment opens |

These targets are illustrative and conservative; they are intended to make the unit-economics conversation concrete, not to commit the business to specific numbers prior to design-partner validation.

### 5A.3 Capital plan

| Round | Timing | Amount (range) | Use of funds |
|---|---|---|---|
| Pre-seed | Phase 0 | £1.5M-3M | Founding team; Phase-0 discovery; design-partner LOIs; legal-content team hire 1-2 |
| Seed | Pre-launch | £5M-8M | Build through Phase-1 MVP; legal-content team to 4-6 FTE; UPL opinions for first 2 jurisdictions; AI evaluation-set construction; first 5-10 design-partner contracts |
| Series A | Month 18-24 | £15M-25M | Phase-2 expansion; pack #3; administration mode design; API partnership go-to-market; legal-content team to 10-12 FTE |
| Series B | Phase-3 trigger | £40M-75M | Administration mode shipping; fiduciary mode design; 4-5 jurisdictions; international GTM |

### 5A.4 Per-jurisdiction-pack unit economics (illustrative)

| Cost component | Pack #1 (Phase 1) | Pack #2 (Phase 1) | Pack #3 (Phase 2) | Per-pack ongoing |
|---|---|---|---|---|
| Internal legal-content engineering | £180-280k | £100-160k | £60-100k | £30-50k/year/pack |
| Retained local counsel (one-time launch review) | £25-75k | £25-75k | £25-75k | £15-30k/year/pack (quarterly review + event-driven) |
| Translation and legal-glossary review | £15-40k | £15-40k | £15-40k | £5-15k/year/pack |
| UPL legal opinion | £25-75k | £25-75k | £25-75k | £10-20k every 3 years/pack |
| Evaluation-set construction (AI) | £100-180k | £80-150k | £50-100k | £20-40k/year/pack |
| QA, golden-document tests, scenario tests | £40-80k | £30-60k | £20-50k | £10-20k/year/pack |
| **Total launch** | **£385-730k** | **£275-560k** | **£195-440k** | **~£90-175k/year/pack** |

Pack #2 must demonstrably cost less than pack #1; pack #3 must demonstrably cost less than pack #2. If pack-on-pack cost reduction is not 30-50%, the configuration-first thesis is broken and the business should reposition rather than continue funding pack expansion.

### 5A.5 Tenant-density breakeven

A jurisdiction pack reaches operational breakeven when annualized recurring revenue from tenants serving that jurisdiction exceeds the pack's annual ongoing cost. Illustrative breakeven density:

- Pack annual ongoing cost: £100-175k
- Average tenant ARR contributing to pack (blended SmallFirm + MidMarket + enterprise share): £8-15k
- **Breakeven tenant density per pack: 10-20 tenants per jurisdiction**

Phase-1 KPIs (§26) tie pack continuation to achieving this density per pack within 18 months of pack publication. Packs that fall short of density are candidates for sunset or for tenant-co-funded maintenance.

### 5A.6 Competitive positioning — API-first intelligence layer

| Competitive layer | Examples | Platform's stance |
|---|---|---|
| Practice management (matter, billing, time, documents) | Clio, MyCase, NetDocuments, Smokeball, Actionstep | **Partner** — platform integrates as the legal-content engine; revenue share on API tier; practice-management vendor owns the customer relationship |
| Will-writing single-jurisdiction D2C | Trust & Will (US), FreeWill (US), Farewill (UK), Octopus Legacy (UK), Will.co.uk | **Not direct competitor at Phase 1** (we are B2B); becomes relevant at Phase 3+ if D2C launches |
| Civil-law notarial software | National notarial-chamber systems in FR/ES/PT | **Partner where possible; underlying layer otherwise** — notarial offices remain regulated; platform provides the cross-border / multijurisdictional capability they lack |
| Specialist single-jurisdiction legal-tech | Niche France-only or Spain-only trust-and-estate tools | **Local depth competitor** — risk: a France specialist out-depths our France pack in year 2. Mitigation: launch jurisdictions chosen where no dominant specialist exists, and out-breadth specialists across jurisdictions |
| Tax compliance | Avalara, Vertex, TaxJar | **Analogue, not competitor** — Avalara's model is the structural reference for our company |
| Identity infrastructure | Onfido, Persona, Stripe Identity | **Integration vendor** — we use their KYC/ID services; we do not build them |

The competitive thesis is that no incumbent has the combination of (a) configuration-first rules engine, (b) multilingual depth, (c) measurable AI safety, and (d) cross-border decision support. Maintaining this combination as defensible moat is the year 1-3 execution challenge.

---

## 6. Definitions and Domain Glossary

The platform maintains a multilingual, jurisdiction-aware glossary. The following working definitions are for product design and must be mapped to local legal terms in each jurisdiction pack. (Unchanged from v1; condensed presentation.)

| Term | Product meaning |
|---|---|
| Estate | Property, rights, obligations, and liabilities associated with a person, especially at death or during administration |
| Estate planning | Pre-death/pre-incapacity organization of asset ownership, transfer instructions, fiduciary appointments, tax considerations, succession documents |
| Estate administration | Post-death process of proving authority, collecting assets, paying debts/taxes, communicating with heirs/beneficiaries, distributing assets, closing the estate |
| Will | Disposition document stating how property should pass after death; may appoint fiduciaries; formalities vary by jurisdiction |
| Trust | Legal relationship/arrangement in which a trustee holds or manages property for beneficiaries or purposes; recognition and tax treatment vary widely |
| Foundation | Entity/arrangement used in some jurisdictions for asset holding, charitable, family, or succession purposes; alternative to trusts where trust concepts are limited |
| Executor / personal representative / administrator | Person/institution authorized to administer an estate; name, appointment process, and powers vary |
| Trustee / fiduciary | Person/institution with duties to manage assets for beneficiaries or stated purpose |
| Settlor / grantor | Person who creates or funds a trust or similar arrangement |
| Beneficiary | Person, entity, charity, class, or purpose that receives or may benefit from an asset, estate, trust, insurance, retirement account |
| Heir | Person entitled by law to inherit when legal/compulsory succession rules apply; heir status can differ from beneficiary status |
| Legatee | Person/entity receiving a particular asset or amount under a will or succession document |
| Forced heirship / reserved share | Rule family under which certain family members must receive a legally protected part of the estate, limiting testamentary freedom |
| Intestacy | Distribution of an estate when there is no valid will or the will does not dispose of all property |
| Probate | Court/official process to validate a will and/or authorize an estate representative; primarily common-law terminology |
| Succession | Transfer of rights and obligations at death; civil-law umbrella term |
| Domicile | Connecting factor for legal status; not always the same as residence or nationality |
| Habitual residence | Connecting factor used in cross-border legal regimes |
| Situs | Location of an asset; often determinative for real estate, tax, registry, and conflict-of-laws |
| Matrimonial / marital property regime | Rules determining property ownership between spouses or civil partners |
| Usufruct / life interest | Right to use or benefit from property during life; another person may hold bare ownership |
| Power of attorney | Authority given to another person to act for the principal; formalities and durability vary |
| Advance directive / healthcare directive | Instructions/appointments relating to medical or personal decisions |
| Jurisdiction pack | Versioned package of rules, workflows, templates, terminology, calculations, validations, sources, translations, tests configuring the platform for a country or sub-jurisdiction |
| Conflict-of-Laws Module | Deterministic decision-support component (new in v2) that captures connecting factors and runs codified cross-border rule logic (EU 650/2012, Hague Convention) producing structured memos for professional review |

---

## 7. Regulatory and Market Context

Estate planning is jurisdiction-sensitive. The platform assumes countries and sub-jurisdictions differ in legal systems, court/notary processes, succession rules, marital property, recognition of trusts, tax rules, electronic signature validity, data protection, professional regulation, and language conventions. The Phase-1 launch deliberately chooses two jurisdictions where these differences are clearly delineated and well-documented in authoritative public sources, to maximize learning per pound spent on legal-content operations.

### 7.1 Evidence from comparative sources

The European Commission notes succession law varies considerably across EU countries, while EU cross-border succession rules provide certainty for participating states. Denmark and Ireland do not participate. [S1]

The OECD reports inheritance/estate/gift tax design varies widely across OECD countries; many use recipient-based inheritance taxes, a smaller group uses estate taxes on donors' estates. [S7]

In the UK, GOV.UK describes inheritance tax with a standard 40% rate on the portion above the threshold and various reliefs/exemptions. [S6]

France, Spain, and Portugal illustrate civil-law reserved-share patterns and the importance of notarial/registry pathways. [S2] [S3] [S4]

In the US, federal estate-tax filing thresholds are effective-date-specific; the IRS lists a 2026 estate-tax filing threshold of USD 15,000,000. [S5] The ABA notes probate laws differ in every US state. [S15] (US is Phase-3 and later.)

FATF guidance for trust and company service providers emphasizes risk-based CDD and beneficial-ownership verification. [S8]

European data-protection rules include safeguards for transfers of personal data to third countries. [S9]

UNCITRAL's Model Law on Electronic Signatures uses principles of technical reliability, technology neutrality, and functional equivalence; eIDAS establishes an EU framework for electronic identification and trust services. [S10] [S11]

WCAG 2.2 and Unicode CLDR support accessibility and localization design. [S12] [S13]

### 7.2 Product implications (unchanged from v1)

Do not hardcode country-specific legal steps, terminology, thresholds, forms, or calculations into the core application. Support sub-jurisdiction selection where law differs within a country. Store every rule with source notes, effective dates, approval status, version, applicability, and test coverage. When a legal status cannot be confidently determined, flag for professional review rather than silently proceed. Use modular integrations so jurisdiction-specific services can vary.

### 7.3 Why England & Wales and Portugal as Phase-1 jurisdictions

The Phase-1 jurisdiction selection is deliberate. Adversarial evaluation flagged that v1's implicit California + France pair was the *hardest* possible launch combination (California: community property, state-level estate tax, recent case law; France: reserved-share calculations, notarial monopolies, EU 650/2012 cross-border interaction). V2 selects:

- **England & Wales**: common-law; testamentary freedom (no forced heirship); single national legal system (no sub-jurisdictional explosion at Phase 1); well-documented intestacy rules; GOV.UK provides authoritative inheritance-tax documentation as a stable source; no notarial monopoly for wills; English-language native; mature legal-tech market.
- **Portugal**: civil-law; reserved-share present (forces real configuration testing); single national legal system (no autonomous communities, unlike Spain); notarial succession well-codified; EU 650/2012 applies cleanly (Portugal is a participating state); Portuguese (pt-PT) launch language forces real multilingual configuration; civil-law/common-law pairing with E&W proves the configuration-first thesis.

The pair forces real configuration testing across legal systems and languages without the maximum-complexity sub-jurisdictional surface area of California or Spain. Spain, France, US states, and Quebec follow in Phase 2 once pack-on-pack velocity is proven.

---

## 8. Stakeholders, Personas, and Role Model

(Unchanged from v1; condensed presentation. See v1 §8 for full needs/permissions detail.)

| Persona | Role at Phase 1 |
|---|---|
| Individual client / estate owner | Participates as guest of a B2B tenant (solicitor/notarial office); does not have a standalone account at Phase 1 |
| Spouse / civil partner | Co-participant where tenant invites; confidentiality controls enforced |
| Beneficiary / heir | Read-only access where tenant grants and disclosure rules permit; Phase 3 administration mode adds richer beneficiary surface |
| Solicitor (E&W) | **Primary Phase-1 user**; case owner; document drafter; reviewer; finalizer |
| Notary (PT) | **Primary Phase-1 user**; deed authentication; succession declaration handling; specific authorities per Portuguese law |
| Paralegal | Intake; data entry; checklist execution; under solicitor/notary supervision |
| Tax adviser | Phase-1 read access to tax modules; explicit Phase-2 expansion |
| Wealth adviser / banker | Not Phase 1; Phase 3+ for B2B2C |
| Compliance officer | Tenant role; access to compliance dashboards (Phase 2+ AML/KYC) |
| Jurisdiction counsel / legal-content maintainer | **Internal role**; configures and validates packs in sandbox; publication requires approval workflow |
| Localization reviewer | **Internal role**; ensures translations preserve legal meaning |
| System administrator | Internal; tenant management; no default access to client data |
| Practice-management vendor (API consumer) | **Phase-1 API channel**; vendor integrates platform's rule evaluation into their own UI |

Personas not active at Phase 1 (executor/administrator, trustee, fiduciary officer) are designed for in the data model but not surfaced in the Phase-1 UI.

---

## 9. Common Requirements Across Countries

These requirements apply across the Phase-1 launch jurisdictions and continue to apply as new packs are added. (Largely unchanged from v1; presented in compressed form.)

| ID | Requirement | Configurable dimensions | Acceptance criteria |
|---|---|---|---|
| CR-001 | Capture person profiles (legal name, preferred name, DOB, identity document refs, contact, citizenship/nationality, residency, domicile/habitual residence, tax residency, marital/civil status, preferred language) | Fields visible/mandatory per jurisdiction; identity-document types; address formats; tax identifiers; language | Intake completable in any supported language; canonical structured values retained |
| CR-002 | Family/relationship graph (spouse/partner, former spouses, children, adopted, stepchildren, dependents, parents, siblings, guardians, heirs, beneficiaries, fiduciaries, entities) | Relationship taxonomy; local civil-status categories; recognition rules; minor age | Plan can identify affected parties; relationship-based rules evaluable |
| CR-003 | Structured asset/liability inventory (ownership, location, valuation, title, currency, tax category, beneficiary designation, encumbrances, supporting docs) | Asset classes; valuation methods; ownership categories; situs rules; currencies | Estate inventory and gap list producible |
| CR-004 | Model intended transfers, gifts, residue, beneficiary designations, fiduciary appointments, guardianship nominations, alternates | Allowed gift types; beneficiary classes; distribution formulas; minor-beneficiary rules | Intent comparable against configured legal restrictions; planning warnings generated |
| CR-005 | Document records (type, jurisdiction, version, status, signing state, storage location, reviewer, execution date, revocation/supersession) | Document types; mandatory templates; execution statuses; retention periods | History clearly shows active/draft/superseded/revoked/awaiting execution |
| CR-006 | Task, checklist, deadline, reminder management | Deadline formulas; notice periods; review intervals; holiday calendars | Deadlines calculated from rule parameters; source/logic notes displayed |
| CR-007 | Role-based collaboration | Roles; permissions; matter firewalls; language; disclosure rules | Users see only records/actions allowed by role and matter permissions |
| CR-008 | Audit trail of rule evaluations, data changes, document changes, approvals, signatures, notices, exports, AI interactions, professional overrides | Audit retention; export format; legal hold | Administrators can reconstruct who did what, when, under which rule version |
| CR-009 | Legal-disclaimer and professional-review prompts | Disclaimer text; acknowledgement frequency; escalation paths | Users cannot proceed past regulated gates without acknowledgement or review |
| CR-010 | Privacy, consent, retention, data export, data deletion, access requests | Privacy law; retention periods; data residency; processor/controller roles | Privacy obligations met without manual DB intervention |
| CR-011 | Multilingual display and content generation | Locale; dialect; terminology; fallback language; bilingual document setting | Language switch preserves case data and rule outcomes |
| CR-012 | Professional review workflows (comments, approvals, redlines, issue lists, final sign-off) | Reviewer role; approval sequence; mandatory review triggers | Document cannot be finalized when unresolved mandatory issues exist |
| CR-013 | Estate administration workflows (Phase 3) | Probate/succession path; court/notary involvement; inventory rules; creditor claims | Phase 3 requirement; deferred |
| CR-014 | Ongoing fiduciary administration (Phase 4) | Structure types; fiduciary duties; reporting periods; beneficiary rights | Phase 4 requirement; deferred |
| CR-015 | Stale-plan flagging and periodic review (marriage, divorce, birth/adoption, death of fiduciary/beneficiary, relocation, asset change, law change, tax threshold change) | Review triggers; event taxonomy; notification cadence | Review prompts on relevant events or rule-version changes |

---

## 10. Country-Specific Requirement Families

The system supports country-specific and sub-jurisdiction-specific configuration families. Each family is represented by explicit parameters, workflows, templates, validations, language strings, and test cases. (Unchanged from v1; condensed.)

| ID | Family | Examples | Phase-1 status |
|---|---|---|---|
| CS-001 | Legal-system family | Common law (E&W), civil law (PT) | Active at Phase 1 |
| CS-002 | Jurisdiction hierarchy | Country only at Phase 1; sub-jurisdiction at Phase 2+ | Active country-level only |
| CS-003 | Connecting factors | Domicile, habitual residence, nationality, residence, tax residence, asset situs, marital domicile | Active via Conflict-of-Laws Module (§15) |
| CS-004 | Disposition instruments | Will, codicil at Phase 1; broader at Phase 2+ | Will only at Phase 1 |
| CS-005 | Execution formalities | E&W: 2 witnesses; PT: notarial will or holographic; e-signature not permitted for wills in either at Phase 1 | Active |
| CS-006 | Reserved share / forced heirship | PT: legítima | Active for Portugal |
| CS-007 | Intestacy / legal succession | E&W and PT codified | Active for warnings only at Phase 1 (full intestacy workflow in Phase 3) |
| CS-008 | Marital / matrimonial property | E&W: no community property; PT: regime options (comunhão geral, adquiridos, separação) | Basic at Phase 1; full Phase 2 |
| CS-009 | Tax regime | UK IHT; PT no inheritance tax at Phase 1 scope (stamp duty / IMT for property transfer noted) | Active for UK IHT; PT tax check at Phase 2 |
| CS-010 | Lifetime gift treatment | UK 7-year lookback; PT collation rules | Active for warnings |
| CS-011 | Probate / succession process | E&W probate; PT habilitação de herdeiros | Phase 3 |
| CS-012 | Asset transfer and registration | Land Registry (E&W), Conservatória do Registo Predial (PT) | Reference only at Phase 1 |
| CS-013 | Minors and protected adults | Guardianship; trusts for minors; conservatorship | Flagging at Phase 1; workflow Phase 3 |
| CS-014 | Trust/foundation recognition | E&W: trusts central; PT: trusts not recognized natively, foundation alternative | Phase 4 |
| CS-015 | Professional regulation | E&W: SRA, CILEx; PT: Ordem dos Notários, Ordem dos Advogados | Active via UPL section (§18) |
| CS-016 | Data protection and data residency | UK GDPR; EU GDPR | Active |
| CS-017 | KYC/AML obligations | Tenant carries; platform supports | Tenant-side at Phase 1; integrated module Phase 2 |
| CS-018 | Language and official document format | en-GB; pt-PT | Active |
| CS-019 | Cross-border recognition | EU 650/2012; Hague Wills Convention 1961 | Active via Conflict-of-Laws Module (§15) |
| CS-020 | Religious/personal-law modules | Not at Phase 1 | Deferred |

---

## 11. Configurability Strategy

Configurability remains the core architectural requirement. The product separates core domain services from jurisdiction-specific rules, workflows, documents, messages, calculations, and integrations. (Configuration layers unchanged from v1.)

| Layer | What it configures |
|---|---|
| Tenant layer | Client organization, brand, deployment model, enabled countries, professional network, security policy |
| Jurisdiction layer | Country/sub-jurisdiction rules, source references, workflows, templates, role restrictions, tax parameters |
| Product-mode layer | Planning, administration, fiduciary management, professional portal, configuration studio |
| Document layer | Document types, templates, clauses, variable sets, execution rules, bilingual options |
| Workflow layer | Steps, branches, task owners, deadlines, approvals, notifications, required evidence |
| Calculation layer | Thresholds, rates, reserved shares, tax bands, deadlines, valuations, formulas |
| Terminology and localization layer | Locale strings, legal glossary, translations, fallback, regional variants |
| Integration layer | External services enabled and credentialed per jurisdiction/tenant |
| AI policy layer | Allowed AI functions, answer style, citation requirement, escalation triggers, prohibited outputs |

Design principles (unchanged): canonical data with localized display; effective-dated law and policy; source-aware configuration; no silent legal assumptions; sub-jurisdiction first; document formality is rules-driven; professional boundaries are role-driven; AI is subordinate to rules; configuration changes are deployable artifacts.

---

## 12. Jurisdiction Pack Architecture

A jurisdiction pack is a versioned bundle that configures the platform for a legal jurisdiction or sub-jurisdiction. (Components unchanged from v1.) The Phase-1 packs (E&W, PT) are the templates against which pack #3 build velocity is measured.

| Component | Description |
|---|---|
| Metadata | Jurisdiction code, parent jurisdiction, language(s), currency, time zone, effective dates, pack owner, approval status, source list, version history |
| Eligibility and scope | Which product modes, document types, entity types, user roles are enabled |
| Intake model | Required questions, conditional questions, field labels, explanation text, validation rules, sensitive-data flags |
| Relationship rules | Heir classes, spouse/partner recognition, adoption/stepchild treatment, minor age, incapacity categories |
| Asset rules | Asset classes, situs logic, valuation rules, ownership forms, registration requirements, beneficiary-designation treatment |
| Disposition rules | Allowed gift types, residue rules, class gifts, alternate beneficiaries, survivorship periods, lapse/anti-lapse behaviour |
| Reserved-share rules | Enabled/disabled; eligible heirs; fractions; calculation base; lifetime-gift inclusion; waiver rules; abatement workflow |
| Marital-property rules | Community/separate property; matrimonial-regime questionnaire; consent requirements; property classification |
| Tax rules | Tax type; thresholds; rates; relationship bands; exemptions; reliefs; reporting forms; filing deadlines; payment deadlines |
| Workflow definitions | Planning, review, signing, notary/court/registry, probate/succession, estate administration, fiduciary management |
| Document templates | Templates, clauses, variables, conditional clauses, format requirements, execution instructions, bilingual templates |
| Professional boundaries | Which roles can advise, draft, review, approve, file, witness, notarize, administer |
| E-signature policy | Allowed/prohibited documents, required signature assurance level, witness/notary support, audit certificate requirements |
| KYC/AML policy | When due diligence is required, beneficial-owner data, sanctions/PEP checks, source of funds/wealth, review frequency |
| Localization | UI strings, help content, legal glossary, document strings, gender/plural variants, locale formatting |
| AI knowledge and policy | Allowed answers, citations, prompt constraints, refusal/escalation messages, approved explanations |
| Tests | Unit, scenario, golden documents, calculation, workflow, localization, AI evaluation sets |

Sample rule object schema and workflow node schema unchanged from v1 §12.2 and §12.3.

---

## 13. Functional Requirements

Functional requirements are grouped into modules. Each module supports jurisdiction-aware configuration, role-based access, multilingual content, source traceability, and audit logging. Phase-1 functional requirements are tagged below; later-phase requirements are retained for design continuity.

### 13.1 Tenant, country, and jurisdiction setup

| ID | Requirement | Phase |
|---|---|---|
| FR-001 | Administrators can enable countries and sub-jurisdictions per tenant | 1 |
| FR-002 | User/professional can select or confirm relevant jurisdiction(s) and capture facts used for selection | 1 |
| FR-003 | Support multiple jurisdictions in one matter when client/assets/beneficiaries/fiduciaries span jurisdictions | 1 (via Conflict-of-Laws Module §15) |
| FR-004 | Jurisdiction-pack version history and publish/rollback workflow | 1 |

### 13.2 Client intake and matter creation

| ID | Requirement | Phase |
|---|---|---|
| FR-005 | Guided intake questionnaires for planning cases | 1 (planning only) |
| FR-006 | Intake completeness scoring by module; show missing critical information | 1 |
| FR-007 | Capture user consent, privacy notices, service disclaimers, professional-engagement status | 1 |
| FR-008 | Separate and joint matters for couples; confidentiality and conflict controls | 1 |

### 13.3 Identity, KYC, AML, beneficial ownership

| ID | Requirement | Phase |
|---|---|---|
| FR-009 | Identity verification workflows and document capture | 2 (tenant-supplied at Phase 1) |
| FR-010 | Beneficial ownership for trust/company/foundation/nominee | 4 |
| FR-011 | Sanctions/PEP/adverse-media screening via configurable integrations | 2 |
| FR-012 | Source of funds/wealth evidence; risk ratings | 4 |

### 13.4 Family and relationship graph

| ID | Requirement | Phase |
|---|---|---|
| FR-013 | Structured relationship data with dates, legal status, biological/adoptive/step, dependency, incapacity, minor status | 1 |
| FR-014 | Identify missing relationship facts affecting heirship/reserved share/tax/fiduciary eligibility | 1 |
| FR-015 | Alternate/contingent beneficiaries, survivorship conditions, class gifts, per-stirpes/per-capita | 1 |

### 13.5 Asset and liability inventory

| ID | Requirement | Phase |
|---|---|---|
| FR-016 | Configurable asset-class taxonomy and dynamic fields by asset type | 1 (limited classes) |
| FR-017 | Valuations, valuation dates, currencies, appraisal sources, confidence levels | 1 |
| FR-018 | Ownership shares, title type, co-owner info, beneficiary designations, TOD/POD | 1 (limited) |
| FR-019 | Liabilities, guarantees, mortgages, tax liabilities, funeral/admin expenses, contingent claims | Phase 3 (admin mode) |
| FR-020 | Document uploads and evidence linking per asset/liability | 1 |

### 13.6 Planning scenarios and distribution design

| ID | Requirement | Phase |
|---|---|---|
| FR-021 | Multiple estate-plan scenarios; compare outcomes | 1 |
| FR-022 | Evaluate intended distributions against reserved-share, forced-heirship, marital-property, minor-beneficiary, tax, asset-transfer rules | 1 |
| FR-023 | Specific gifts, cash gifts, percentage gifts, residue, class gifts, charitable gifts, business succession plans, conditional gifts | 1 (basic gifts only) |
| FR-024 | Fiduciary appointment workflows (executor, trustee, administrator, guardian, protector, agent, substitute) | 1 (executor/guardian only) |
| FR-025 | Plan-impact analysis on residence/marital/asset/beneficiary changes | 1 |

### 13.7 Document preparation, review, and execution

| ID | Requirement | Phase |
|---|---|---|
| FR-026 | Generate document drafts from approved templates and structured case data | 1 (wills only) |
| FR-027 | Clause-level conditional logic tied to rule outcomes and professional choices | 1 |
| FR-028 | Professional review, comments, redlines, approvals, finalization | 1 |
| FR-029 | Document execution instructions by jurisdiction and document type | 1 |
| FR-030 | Signing ceremony status, witness/notary details, signed copy storage, supersession/revocation | 1 |
| FR-031 | E-signature routing only when jurisdiction pack and document type permit | 1 (not applicable to wills in E&W or PT at Phase 1) |

### 13.8 Estate administration case management (Phase 3)

FR-032 through FR-037 from v1 retained; Phase 3.

### 13.9 Trust and fiduciary management (Phase 4)

FR-038 through FR-041 from v1 retained; Phase 4.

### 13.10 Collaboration, communications, notifications

| ID | Requirement | Phase |
|---|---|---|
| FR-042 | Secure messaging and matter-specific collaboration | 1 |
| FR-043 | Notification templates in all supported languages; jurisdiction/tenant customization | 1 |
| FR-044 | Invitations and access delegation with expiration, scope, revocation | 1 |

### 13.11 Payments, billing, service packaging

| ID | Requirement | Phase |
|---|---|---|
| FR-045 | Configurable service packages | 1 (B2B billing; tenant invoices end-clients) |
| FR-046 | Fee estimates, invoices, payment status, fee approvals | 2 |

### 13.12 APIs and data export

| ID | Requirement | Phase |
|---|---|---|
| FR-047 | Secure APIs for authorized integrations | 1 — **Phase-1 primary channel** |
| FR-048 | Export matter data, documents, audit logs, configuration snapshots | 1 |

---

## 14. AI Agent Requirements, Guardrails, and Evaluation Framework *(major rewrite)*

The AI agent supports users and professionals without creating unacceptable legal, regulatory, privacy, or hallucination risk. The agent is tied to the active jurisdiction pack, configuration status, user role, product mode, and professional-review gates.

V1's AI section was twelve well-written policy statements with no measurement. V2 retains those policies and adds a **measurable evaluation framework that is a release gate** — AI features cannot ship to production until evaluation thresholds are met, and they cannot continue in production if evaluation drifts below thresholds.

### 14.1 AI policy requirements (retained from v1, lightly refined)

| ID | Requirement | Configurable dimensions |
|---|---|---|
| AI-001 | Identify active jurisdiction, sub-jurisdiction, product mode, user role, pack version before giving jurisdiction-specific explanations | Jurisdiction and role |
| AI-002 | Do not provide definitive legal advice or replace qualified professional judgment; use configured disclaimers and escalation | Tenant and jurisdiction policy |
| AI-003 | Cite the applicable configured rule, source note, template, or workflow node for legal/procedural explanations | Source refs; rule refs |
| AI-004 | Ask clarifying questions when necessary facts are missing for rule evaluation | Question dependencies |
| AI-005 | Summarize uploaded documents only within user permissions; do not treat summaries as legal validation | Document types; permissions |
| AI-006 | Flag inconsistencies across will, insurance, trust, account designations | Consistency rules |
| AI-007 | Produce checklists, draft questions, plain-language explanations in supported languages | Language; terminology |
| AI-008 | Do not generate or finalize legal documents unless explicitly allowed by jurisdiction pack, document type, role, workflow | Document policy |
| AI-009 | Refuse/escalate requests to conceal assets, evade taxes, mislead heirs, fabricate evidence, bypass formalities | Prohibited-intent policy |
| AI-010 | Durable audit log of prompts, outputs, sources, model version, user role, case context | Retention; privilege |
| AI-011 | Retrieval from approved legal-content repositories only; no unapproved web content for production legal logic | Knowledge source policy |
| AI-012 | Confidence thresholds; require human review when confidence low, facts conflict, or matter is cross-border/high-value/contested | Thresholds; triggers |

### 14.2 AI evaluation framework (new in v2)

The AI evaluation framework is mandatory and applies to every release. Each metric has a defined evaluation set, target threshold, measurement cadence, and a release-gate behaviour.

| Metric | Definition | Target | Evaluation set | Cadence | Release gate |
|---|---|---|---|---|---|
| Grounding rate | % of AI assertions traceable to a configured rule, source note, or approved template in the active jurisdiction pack | **≥95%** | 500 estate-planning prompts per supported UI language per jurisdiction (curated, legally reviewed, expected-output annotated) | Pre-release for every model/prompt/pack change; quarterly in production | Below threshold blocks release |
| Citation accuracy | % of cited rule IDs that actually exist in the pack and are correctly applicable to the prompt's facts | **≥98%** | Same set; auto-checked plus 50-prompt manual review per release | Pre-release; monthly in production | Below threshold blocks release |
| Escalation appropriateness | % of high-risk prompts (cross-border, contested, minor beneficiary, disinheritance, tax-threshold trigger, fiduciary ineligibility) that trigger professional-review escalation | **≥99%** | 200-prompt high-risk evaluation set per jurisdiction | Pre-release; monthly | Below threshold blocks release |
| Hallucinated-citation rate | % of cited rule IDs / source notes that do not exist or are fabricated | **≤1%** | Auto-checked across all evaluation runs | Continuous in production via spot-check sampling | Above threshold triggers incident |
| Language-parity gap | Difference in grounding rate between English and any other supported UI language on matched prompt set | **≤3 percentage points** | Paired prompt sets translated and legally reviewed | Pre-release | Above threshold blocks non-English release |
| Red-team refusal rate | % refusal on prohibited-intent prompts (tax evasion, asset concealment, evidence fabrication, formality bypass, UPL-trip) | **100%** | 100-prompt red-team set per language; rotated quarterly | Pre-release; quarterly refresh | Below 100% blocks release |
| Sensitive-data leakage | Detection of PII, identity-document numbers, or financial-account numbers in AI outputs when not authorized | **Zero events** | Continuous monitoring; synthetic-PII evaluation set monthly | Continuous | Any event triggers incident |
| Source-stale rate | % of AI responses citing rules whose effective-date or source has been updated more recently than the model's retrieval index | **≤2%** | Continuous; flagged via retrieval-index freshness check | Continuous | Triggers retrieval-index refresh |
| AI assist time savings | Median minutes saved per will draft using AI vs without (paired tenant A/B) | **≥25% saved** | Tenant pilot programs at Phase 1 | Quarterly | Tracked KPI, not release gate |
| Multilingual document quality | Pass rate on legal-glossary lint, sworn-translation metadata, locale formatting | **100%** at finalize | Automated on every generated document | Continuous | Blocks finalization |

### 14.3 Evaluation-set construction

Building the evaluation sets is a substantial Phase-1 investment estimated at £180-360k (see §5A.4). Each evaluation prompt is curated by a legally qualified reviewer in the source language and re-verified after translation. Evaluation sets are versioned alongside jurisdiction packs and refreshed quarterly with new prompts to prevent overfitting.

### 14.4 AI design constraints (retained from v1)

Use deterministic rules for calculations and compliance gates. Use AI for explanation, summarization, drafting assistance, and issue detection — not final legal validity decisions.

Give the agent read-only access to active configuration unless in configuration-studio drafting mode with human approval.

Show source-linked explanations. Do not hide uncertainty or unsupported assumptions.

Separate public-help mode from authenticated case mode. Public-help mode does not ask for unnecessary sensitive data.

Protect privileged and confidential information through strict role-based access, retrieval filters, and tenant-level isolation.

Evaluate AI output in all supported languages. Legal terminology uses approved glossary terms rather than generic translations.

### 14.5 AI release gating

A model, prompt-template, retrieval-index, or pack change cannot be released to production unless: (a) all release-gate metrics pass; (b) red-team refusal is at 100% on the latest rotated set; (c) language-parity gap is within threshold for all enabled languages; (d) a sign-off is recorded from the AI Safety Lead, the Legal Content Lead, and the relevant Jurisdiction Counsel for any pack-specific change. The platform maintains a published model card per release identifying the evaluation results.

---

## 15. Conflict-of-Laws Module *(new in v2)*

This module did not exist in v1. V1's response to cross-border matters was to flag them and escalate to professional review. That posture handles the 80% case but leaves no value-add for the highest-value segment (HNW clients with cross-border assets) — exactly the segment that pays most for estate planning.

V2 introduces a deterministic Conflict-of-Laws Module that produces structured cross-border decision-support memos. Cross-border cases still require professional review; the module ensures that review is well-prepared rather than starting from a blank page.

### 15.1 Module scope

The Conflict-of-Laws Module addresses three categories of cross-border facts:

| Category | Examples | Module behaviour |
|---|---|---|
| Connecting factors | Habitual residence, domicile, nationality, residence, tax residence, asset situs, marital domicile | Captures structured values; resolves applicable-law candidates per fact |
| Treaty and regulation regimes | EU Succession Regulation 650/2012, Hague Convention 1961 on the Conflicts of Laws Relating to Wills, EU Matrimonial Property Regulation 2016/1103 | Applies codified logic; produces applicable-law determinations per regime |
| Recognition and enforcement | European Certificate of Succession, apostille/legalization, foreign trust recognition (where relevant), foreign e-signature certificates | Identifies required evidence and procedural steps |

### 15.2 Module behaviour

For any case in which a connecting factor crosses jurisdictions, or in which assets/beneficiaries/fiduciaries are located in more than one jurisdiction, the module:

1. **Captures** habitual residence, domicile, nationality, residence, tax residence, asset situs per asset, matrimonial property domicile, applicable-law election (where permitted).
2. **Evaluates** each codified regime (EU 650/2012 if any party is in a participating state and the case has cross-border elements; Hague 1961 for wills with cross-border execution; EU 2016/1103 for spouses; future packs add national private-international-law rules).
3. **Produces** a structured Conflict-of-Laws Memo containing: applicable-law determination per matter type (succession, matrimonial property, trusts), required evidence (e.g., habitual-residence proof, applicable-law election clause), procedural steps (e.g., European Certificate of Succession application), and outstanding risk areas (e.g., excluded scope under EU 650/2012 for matrimonial property and tax).
4. **Routes** the matter to mandatory professional review with the memo attached, blocking finalization until reviewed.
5. **Records** professional-reviewer rationale on any decision that diverges from the memo's preliminary determination.

### 15.3 Important scope limitations

EU 650/2012 has explicit scope exclusions (matrimonial property, taxes, certain trust matters). The module flags these as out-of-scope and points to the relevant national private-international-law rules. The Hague 1961 Wills Convention has only 16 ratifying states; the module identifies whether the relevant jurisdictions ratified the Convention and routes accordingly. The module is decision-support, not a substitute for cross-border legal advice — every Conflict-of-Laws Memo carries an explicit "not legal advice" disclaimer and is routed to qualified counsel for review.

### 15.4 Phase-1 Conflict-of-Laws scope

At Phase 1 (E&W + PT), the module handles:
- E&W ↔ PT cross-border cases under EU 650/2012 (PT is a participating state; UK is not, post-Brexit, but UK courts apply common-law conflict-of-laws rules).
- E&W ↔ EU member state cross-border (EU member state is the participating party).
- Hague 1961 recognition of wills executed in E&W (UK is a signatory) for use in PT (PT is a signatory).
- Identification of out-of-scope matrimonial-property and tax matters with referral to qualified counsel.

Additional bilateral cross-border pairs are added as new jurisdictions ship in Phase 2.

### 15.5 Functional requirements

| ID | Requirement | Phase |
|---|---|---|
| CL-001 | Capture structured connecting factors (habitual residence, domicile, nationality, residence, tax residence, asset situs per asset, matrimonial domicile, applicable-law election) | 1 |
| CL-002 | Apply EU 650/2012 codified logic to determine applicable succession law for participating states | 1 |
| CL-003 | Apply Hague 1961 logic to determine recognition of wills executed under foreign formalities | 1 |
| CL-004 | Generate Conflict-of-Laws Memo with applicable-law determinations, required evidence, procedural steps, risk areas | 1 |
| CL-005 | Block finalization on cross-border cases pending mandatory professional review with memo attached | 1 |
| CL-006 | Record reviewer rationale for divergence from preliminary determinations | 1 |
| CL-007 | Apply EU 2016/1103 matrimonial-property logic for participating states | 2 |
| CL-008 | Apply national private-international-law rules for non-EU jurisdictions | Per pack |

---

## 16. Multilingual and Localization Requirements *(refined)*

The product is multilingual from inception. V1's "four languages at launch" framing conflated UI language with document-output language and ignored that pt-PT/pt-BR, es-ES/es-MX, fr-FR/fr-CA are effectively separate locales for legal purposes. V2 separates them explicitly.

### 16.1 Language launch policy

| Language | UI launch | Document-output launch | Notes |
|---|---|---|---|
| English (en-GB) | **Phase 1** | **Phase 1 (wills)** | Primary launch language |
| Portuguese (pt-PT) | **Phase 1** | **Phase 1 (wills)** | Primary launch language; not interchangeable with pt-BR |
| French (fr-CA) | Phase 2 (candidate) | Phase 2 (gated by Quebec pack and legal-glossary readiness) | Distinct from fr-FR for legal purposes |
| Spanish (es-ES) | Phase 2 (candidate) | Phase 2 (gated by Spain pack including autonomous-community sub-packs) | Distinct from es-MX/es-AR etc. |
| Other locales (en-US, en-IE, pt-BR, fr-FR, es-MX, es-AR) | Phase 3+ (demand-gated) | Phase 3+ (each requires its own legal-glossary and document templates) | Each is a separate locale, not a translation of a "parent" locale |

A locale variant launches only when (i) the corresponding jurisdiction pack is approved, (ii) the legal glossary is reviewed and signed off by qualified counsel in that locale, (iii) document templates pass legal-glossary lint, and (iv) AI evaluation language-parity gap is within threshold.

### 16.2 Localization requirements

| ID | Requirement | Phase |
|---|---|---|
| L10N-001 | Support en-GB and pt-PT UI languages at launch | 1 |
| L10N-002 | Support locale variants (en-GB/en-US, fr-CA/fr-FR, pt-PT/pt-BR, es-ES/es-LA) without duplicating core rules — variants differ only in terminology and locale formatting, not in legal-rule outcomes | 1 (architecture); per-locale activation gated |
| L10N-003 | Translations stored by stable content key, not by screen text; source-text change creates translation review task | 1 |
| L10N-004 | No sentence concatenation for legal text; ICU/CLDR-aware plural, gender, date, number, currency formatting | 1 |
| L10N-005 | Legal glossary with jurisdiction-specific preferred terms and prohibited translations | 1 |
| L10N-006 | Bilingual or dual-column document output where required by tenant or jurisdiction | 2 |
| L10N-007 | Sworn/official translation workflow metadata | 2 |
| L10N-008 | Localized address, phone, identity-number, tax-number, civil-status formats | 1 |
| L10N-009 | Language-of-record and language-of-display metadata for documents and acknowledgements | 1 |
| L10N-010 | Localization QA in release management for every jurisdiction pack; missing mandatory translations block publication | 1 |

### 16.3 Translation governance

Legal-content source text is drafted in a controlled source language (English or the jurisdiction's official language) and translated by qualified legal translators with subject-matter expertise in trust-and-estates. Translation reviewers verify grammar and **legal equivalence** — heir, beneficiary, executor, administrator, trustee, reserved share, notary, probate, succession, power of attorney, and similar terms have different legal meanings in different jurisdictions and require separate glossary entries per locale rather than a single translation.

Portuguese for Portugal is not interchangeable with Portuguese for Brazil in legal-document workflows; Spanish for Spain is not interchangeable with Spanish for Latin America; French for France is not interchangeable with French for Quebec or Belgium. Each locale receives its own legal glossary, its own templates, its own AI evaluation set, and its own counsel sign-off before launch.

---

## 17. Data, Privacy, Security, and Compliance Requirements

Estate-planning data is highly sensitive — personal identity, family structures, financial assets, liabilities, health/incapacity information, tax data, signatures, wills, trust instruments, beneficiary information, and potential disputes. Security and privacy are product requirements, not non-functional afterthoughts. (V1 §16 requirements retained; selected items strengthened.)

| ID | Requirement | Phase |
|---|---|---|
| SEC-001 | Encrypt data in transit and at rest (documents, identity data, financial data, AI logs) | 1 |
| SEC-002 | Role-based and attribute-based access control for matters, documents, assets, beneficiaries, communications, configuration | 1 |
| SEC-003 | MFA and configurable session controls for professional and admin users | 1 |
| SEC-004 | Log all access to sensitive documents and data fields; immutable audit | 1 |
| SEC-005 | Data sensitivity classification by field and document type | 1 |
| SEC-006 | Data residency and regional hosting controls by tenant and jurisdiction | 1 (UK-region and EU-region at launch) |
| SEC-007 | Privacy notices, consent records, data-subject access, correction, export, deletion, retention workflows | 1 |
| SEC-008 | Cross-border data-transfer controls and legal-basis metadata | 1 |
| SEC-009 | Legal hold and retention exceptions for disputes, administration, fiduciary records, investigations | 1 |
| SEC-010 | Configurable UPL/professional-boundary gates by jurisdiction and user role | 1 |
| SEC-011 | AML/KYC workflows for trust/company/fiduciary service use cases | 4 |
| SEC-012 | Conflict-of-interest screening for professional tenants | 2 |
| SEC-013 | Document authenticity, tamper-evidence, hash storage, execution certificates, version integrity | 1 |
| SEC-014 | Incident response, breach notification workflow, affected-user identification | 1 |
| SEC-015 *(new)* | Annual third-party penetration test; quarterly internal security review | 1 |
| SEC-016 *(new)* | SOC 2 Type II or equivalent (ISO 27001) certification within 18 months of GA | Phase 1.5 |
| SEC-017 *(new)* | Cyber-insurance coverage of at least £10M covering data breach, business interruption, and regulatory penalties | 1 |

### 17.1 Compliance design notes

Unauthorized practice of law: treated as a feature gate per jurisdiction. ABA Model Rule 5.5 commentary states the definition of practice of law is established by law and varies by jurisdiction; v2 adds explicit per-jurisdiction UPL legal opinions before launch (see §18). [S14]

Trust/company/fiduciary services: when the operator provides these services, AML/KYC and beneficial-owner obligations apply. FATF guidance highlights risk-based CDD and beneficial-ownership verification. [S8] Phase 1 limits to B2B planning mode where the tenant carries regulatory obligations; integrated AML/KYC is Phase 4.

EU and UK GDPR: cross-border data transfer safeguards and data-subject rights built in. [S9]

E-signature: document-type-specific and jurisdiction-specific. General frameworks do not mean wills can be signed electronically. [S10] [S11] At Phase 1, wills in E&W and PT require wet ink with witnesses (E&W) or notarial execution (PT) — e-signature is not available for wills in either jurisdiction at Phase 1.

---

## 18. Per-Jurisdiction UPL and Regulatory Posture *(new in v2)*

This section did not exist in v1. V1 referenced UPL once. V2 commits to an explicit per-jurisdiction regulatory posture before each pack launches.

### 18.1 UPL clearance per launch jurisdiction

Before any jurisdiction pack is activated for production tenants, the operator commissions a written legal opinion from qualified counsel in that jurisdiction addressing:

- Whether the platform's intended functions (intake questionnaire, asset inventory, scenario design, document assembly, professional-review routing) constitute the unauthorized practice of law in that jurisdiction.
- Which functions specifically must be performed by, or supervised by, a qualified professional (solicitor, notary, etc.).
- Whether the B2B / B2B-via-API model materially changes the analysis versus D2C.
- What disclaimers, professional-engagement evidence, and access controls are required.
- What insurance, regulatory registration, or notification requirements apply.

Estimated cost: £25-75k per jurisdiction; refreshed every 3 years and on material law change.

| Jurisdiction | UPL clearance status | Notes |
|---|---|---|
| England & Wales | Required pre-launch | Will-writing is not lawyer-monopoly in E&W but is regulated by CILEx and SRA where solicitors are involved; will-writing services regulation evolved post-Legal Services Act 2007 |
| Portugal | Required pre-launch | Civil-law jurisdiction with notarial monopoly for notarial wills; Ordem dos Notários involvement |
| Ireland (Phase 2) | Required pre-launch | Common-law similar to E&W; Law Society of Ireland regulates |
| Quebec (Phase 2) | Required pre-launch | Civil law in a federal system; notarial monopoly for notarial wills |
| Spain (Phase 2/3) | Required pre-launch per autonomous community | Multiple legal systems; each autonomous community pack requires separate clearance |
| US states (Phase 3+) | Required pre-launch per state | UPL is criminal in TX, OH, FL, others; LegalZoom has been sued in 7+ states for UPL; per-state clearance is non-negotiable |
| France (Phase 3) | Required pre-launch | Notarial monopoly, strong regulatory environment |

### 18.2 Insurance posture

| Coverage | Amount | Held by |
|---|---|---|
| Tech E&O (professional liability) | £5-10M | Platform operator |
| Cyber liability | £10M+ | Platform operator |
| Each tenant's professional indemnity | Per tenant policy | B2B tenant (solicitor / notarial office) carries their own PI for legal services they render |
| Cyber-tenant indemnity | Tenant carries indemnity for data they upload; platform indemnifies for platform-caused breach | Both |

### 18.3 B2B tenant indemnity model

Phase-1 contracts with B2B tenants include:
- Tenant carries professional liability for legal advice and document drafting provided to end-clients.
- Platform carries operational liability for platform availability, data security, configuration integrity, and AI safety per the published metrics.
- Tenant warrants it holds the necessary professional licensing in each jurisdiction in which it operates on the platform.
- Platform reserves the right to suspend a tenant operating in a jurisdiction without proper licensing.
- Disputes between tenant and end-client are tenant's responsibility; platform provides audit-log evidence.

### 18.4 Regulatory monitoring

The operator maintains continuous monitoring of:
- UK Legal Services Board, SRA, CILEx, Law Society regulatory updates.
- Portuguese Ordem dos Notários and Ordem dos Advogados regulatory updates.
- EU regulations affecting succession, data protection, AML, e-signature.
- FATF guidance updates.
- Per-jurisdiction case law and statutory changes affecting the platform's covered functions.

Material regulatory changes trigger pack-level review and may trigger pack version updates with affected-tenant notification.

---

## 19. Non-Functional Requirements

| ID | Category | Requirement | Target (v2 makes explicit) |
|---|---|---|---|
| NFR-001 | Availability | Production platform uptime per tenant tier | 99.9% for production; 99.5% for AI features; 99.99% for document vault read |
| NFR-002 | Performance | Common screens load quickly even with many assets/documents/beneficiaries/tasks | <2s p95 for matter dashboard with up to 200 entities; <5s p95 for rule evaluation; <10s p95 for document generation |
| NFR-003 | Scalability | Platform scales across tenants, jurisdictions, languages, document volumes | Architecture supports 10x growth from launch without re-platforming; avoid one DB table per country |
| NFR-004 | Configurability | Rules, workflows, templates, translations, integrations configurable through governed tools | Pack #3 ships in ≤50% of pack #1 elapsed time |
| NFR-005 | Auditability | All legal workflow decisions, calculations, AI outputs traceable to data, rules, actors | 100% trace coverage on production cases |
| NFR-006 | Accessibility | WCAG 2.2 AA on all client-facing surfaces | Verified by third-party accessibility audit pre-GA |
| NFR-007 | Localization | All user-facing strings, templates, notifications, AI policies localizable | No hardcoded English in product flows; lint passes on every release |
| NFR-008 | Reliability | Calculations and document generation deterministic and regression tested | Golden-file tests for documents; calculation test packs per jurisdiction; 100% pass required for release |
| NFR-009 | Maintainability | Legal rule updates isolated from unrelated product releases | Versioned packs and publication workflow |
| NFR-010 | Security | Highly sensitive financial and family data | MFA, encryption, RBAC/ABAC, audit, secure SDLC, vulnerability management; SOC 2 Type II within 18 months |
| NFR-011 | Privacy | Privacy by design, data minimization, consent, retention, export/deletion | Field-level sensitivity labels; configurable retention policies |
| NFR-012 | Interoperability | APIs and data schemas allow integration with professional systems and registries | OpenAPI specs, data export, event webhooks |
| NFR-013 | Resilience | Documents and case data recoverable after service interruption | RPO ≤15min, RTO ≤4h for production; quarterly DR drills |
| NFR-014 | Usability | User journey explains complex legal workflows in plain language while preserving precision | Progressive disclosure, glossary, guided intake, issue lists |
| NFR-015 | AI safety | AI features measurable, gated, logged, reversible | See §14 evaluation framework; release-gate behaviour |

---

## 20. Integrations and External Services

Integrations are modular and optional. A country pack or tenant can enable a provider without changing business logic elsewhere. (Unchanged from v1; condensed.)

| Integration | Business use | Phase |
|---|---|---|
| Identity verification / eID | Verify client, fiduciary, beneficiary, adviser identity | 2 |
| KYC/AML screening | CDD/EDD, sanctions, PEP, adverse media, beneficial ownership | 2-4 |
| E-signature / trust services | Electronic signatures (not for wills at Phase 1); timestamps; certificate validation | 2 |
| Remote online notary / notarial booking | Schedule or perform notarial steps where allowed | 2-3 |
| Court/notary/registry filing | Submit or track filings | 3+ |
| Property registry / title search | Verify ownership, encumbrances, identifiers | 2 |
| Financial account aggregation | Import bank, brokerage, retirement, insurance data | 2-3 |
| Valuation services | Real estate estimates, securities prices, business valuation, collectibles appraisals | 2 |
| Tax engines | Estate/inheritance/gift calculations, forms, deadlines, reliefs | 2 (UK IHT engine selection); per-pack |
| Document management / storage | Store signed documents, vault, evidence, correspondence | 1 |
| Practice management / CRM | **Phase-1 API partnership channel** (Clio, MyCase, NetDocuments, Smokeball, Actionstep candidates) | **1** |
| Accounting / trust accounting | Estate accounts, fiduciary accounts, disbursements, statements | 4 |
| Payments | Professional fees, filing fees, service charges | 2 |

---

## 21. Reporting and Analytics

(Unchanged from v1; condensed.) Reports include: matter dashboard, estate inventory report, plan summary, risk and issue report, document execution report, estate administration accounting (Phase 3), fiduciary compliance report (Phase 4), configuration change report, **AI usage and safety report (with §14 metrics)**, localization coverage report.

---

## 22. Workflow Blueprints

(Workflow blueprints from v1 retained; Phase-1 scope tightens to planning workflow only with the Conflict-of-Laws Module integrated.)

### 22.1 Phase-1 estate planning workflow

1. Create client profile (via tenant solicitor/notary) and obtain privacy/legal-disclaimer acknowledgements.
2. Select jurisdiction(s) and capture domicile/habitual-residence/nationality/tax-residence/asset-situs facts. **Conflict-of-Laws Module activates if multi-jurisdiction.**
3. Complete family and relationship graph (spouse/partner, children, dependents, heirs, beneficiaries, fiduciary candidates).
4. Build asset and liability inventory (Phase-1 asset classes only) with ownership, valuation, documents.
5. Run jurisdiction pack issue scan for missing facts, forced heirship (PT), tax triggers (UK IHT), marital property, minors, fiduciary eligibility, cross-border.
6. Create one or more planning scenarios and compare distributions, taxes (UK IHT estimate), restrictions, professional-review requirements.
7. If Conflict-of-Laws Module active, the **Conflict-of-Laws Memo** is generated and attached to professional review.
8. Prepare will document using approved Phase-1 template (E&W or PT) with source/rule version metadata.
9. Route to solicitor/notary review.
10. Finalize will and generate execution instructions (E&W: 2 witnesses; PT: notarial execution).
11. Track execution, store signed copies, schedule periodic review.

### 22.2 Estate administration workflow

Phase 3.

### 22.3 Jurisdiction pack onboarding workflow

(Unchanged from v1.) Phase-1 packs are E&W and PT, built and launched concurrently as the company's proof of configuration-first architecture.

---

## 23. Configuration Governance and Legal Content Operations *(major rewrite)*

V1 described legal-content governance as a process. V2 commits to it as an operating model with concrete FTE assumptions, retained-counsel cost ranges, per-jurisdiction-pack total cost of ownership, and a quarterly law-update cadence. This is the company's largest ongoing investment and the gating factor on jurisdiction-pack velocity.

### 23.1 Operating model

The Legal Content Operations function is a permanent, growing organization, not a project.

| Role | Phase-1 FTE | Phase-2 FTE | Phase-3 FTE | Responsibilities |
|---|---|---|---|---|
| Legal Content Lead (lawyer, head of function) | 1 | 1 | 1 | Sets policy; signs off on pack publications; manages retained counsel |
| Jurisdiction Counsel (in-house, by jurisdiction or jurisdiction cluster) | 1 (E&W + IE cluster); 1 (PT cluster) — 2 total | 4-5 | 8-10 | Interprets local law; configures rules and templates; signs off on pack |
| Retained Local Counsel (external, hourly) | Per-pack £15-30k/year ongoing | Same per pack | Same per pack | Provides authoritative interpretation; reviews pack updates; available for tenant escalation |
| Legal Content Engineer / Configuration Engineer | 2 | 4-5 | 8 | Builds and validates rules, workflows, templates, translations, tests in configuration studio |
| Localization Lead | 1 (manages translators) | 1 | 1-2 | Coordinates legal-glossary, translation, regional variants |
| Tax Specialist (initially shared with retained advisors) | 0.5 internal + retained | 1 + retained | 2 + retained | Validates tax thresholds, rates, exemptions, reliefs, deadlines |
| Compliance Lead | 0.5 (shared with operations) | 1 | 1-2 | UPL, AML/KYC, privacy, e-signature, fiduciary, professional-boundary controls |
| QA Lead (legal-content QA) | 1 | 2 | 3 | Runs scenario, golden-document, calculation, AI evaluation, regression tests |
| AI Safety Lead | 1 | 1 | 1-2 | Manages AI evaluation framework, red-team sets, release gating |
| **Total Phase-1 internal FTE** | **~9-10** | **~16-19** | **~26-32** | |

Estimated Phase-1 fully-loaded annual cost: £1.2M-1.8M for internal headcount; £40-60k retained counsel per active pack; £100-200k translation/glossary; £200-400k evaluation-set construction (one-time, amortizing). Total Phase-1 legal-content-operations cost: £1.5M-2.5M/year.

### 23.2 Per-jurisdiction-pack TCO (illustrative)

See §5A.4 for full table. Key per-pack ongoing numbers:

- Legal content engineering ongoing: £30-50k/year
- Retained local counsel ongoing: £15-30k/year
- Translation and legal-glossary maintenance: £5-15k/year
- UPL legal opinion refresh: £10-20k every 3 years
- AI evaluation-set refresh: £20-40k/year
- QA and golden-document maintenance: £10-20k/year
- **Total per pack ongoing: ~£90-175k/year**

Tenant-density breakeven (§5A.5): 10-20 tenants per pack. A pack falling short of density 18 months post-launch is a candidate for sunset or tenant-co-funded maintenance.

### 23.3 Change management requirements (refined)

Every rule/template/workflow/translation change has a change request, source basis, author, reviewer, approval, effective date, test evidence, rollback plan.

The system identifies affected active cases when a rule changes and decides whether to grandfather, notify, or require plan review. Effective-dated rules ensure historical cases evaluate against the rule version in force at the time of their finalization.

A legal-update monitoring process tracks law changes, tax threshold updates, official form changes, e-signature rules, privacy changes, professional-regulation changes. **Each jurisdiction pack has a defined monitoring cadence:** quarterly for stable jurisdictions; event-driven for jurisdictions with active legislative agendas.

Pack publication is blocked if mandatory source references, translations, tests, UPL opinion, or approvals are missing.

Production pack changes are auditable and reproducible from immutable version snapshots.

### 23.4 Legal-content velocity targets

| Pack | Target time-to-publish (concept to GA) | Target cost |
|---|---|---|
| Pack #1 (E&W) | 8-10 months | £385-730k launch |
| Pack #2 (PT) | 6-8 months | £275-560k launch |
| Pack #3 (Phase 2 first new pack) | ≤4-5 months | £195-440k launch |
| Pack #4+ | ≤3-4 months | £150-350k launch |

If pack #3 does not ship in ≤50% of pack #1 elapsed time, the configuration-first thesis is broken (see §26 decision gates).

---

## 24. Testing, QA, and Acceptance Strategy

Testing validates both software behaviour and legal-content configuration. A technically correct application with wrong jurisdictional rules is a product failure. (V1 test categories retained; v2 adds AI evaluation as release-gating.)

| Test type | Purpose | Phase-1 examples |
|---|---|---|
| Unit | Individual rules, formulas, validations, workflow conditions | UK IHT threshold; PT reserved-share calc; witness-count validation |
| Scenario | Complete user stories by jurisdiction and family situation | E&W married couple with adult children; PT single parent with minor heir; E&W ↔ PT cross-border (Conflict-of-Laws Module) |
| Golden document | Generated documents vs approved expected output | E&W will draft; PT notarial will instruction; PT holographic will |
| Workflow | Branches, blockers, approvals, deadlines | Notary required when immovable property in PT; mandatory review for cross-border |
| Localization | Translation completeness, glossary usage, formats | en-GB UI; pt-PT UI; will glossary lint |
| Accessibility | WCAG conformance | Critical forms and document review screens; third-party audit pre-GA |
| Security | RBAC/ABAC, tenant isolation, encryption, audit, injection, document access, secrets | Penetration test pre-GA; quarterly internal |
| Privacy | Consent, export, deletion, retention, legal hold, cross-border transfer | UK GDPR and EU GDPR scenarios |
| AI | Factuality, grounding, escalation, refusal, multilingual, sensitive-data handling | §14 evaluation sets; release-gated |
| Regression | Law updates do not break prior packs or documents | Effective-dated thresholds produce correct output for old and new dates |

### 24.1 Acceptance criteria for release

- A jurisdiction pack cannot go live until: local counsel signs off on legal requirements, document templates, disclaimers, professional-review gates; UPL opinion is current; all mandatory UI/notification/AI/document content is translated for each supported language; critical calculations and decision tables have passing test cases with effective dates; all generated documents identify template version, jurisdiction, language, data version, review status; cross-border/high-value/contested/minor-beneficiary/disinheritance/tax-threshold/regulated-fiduciary triggers route to mandatory review unless the pack explicitly defines another safe path; security, privacy, audit controls are tested.
- An AI feature cannot go live until §14 evaluation thresholds are met.
- A locale variant cannot go live until §16 locale-launch conditions are met.

---

## 25. MVP, Phasing, and Roadmap *(major rewrite — narrower)*

V1's MVP listed 12+ capabilities, each effectively a product on its own. V2's Phase-1 MVP is deliberately narrow: prove the configuration-first thesis with one common-law and one civil-law jurisdiction, one document type, two languages, B2B-only.

### 25.1 Phase 0 — Discovery and legal-content foundation (months 1-6)

Confirm deployment model, target countries, regulated activities, professional network, legal-content governance, data architecture, AI boundaries.

Deliverables:
- Approved product scope, RACI, jurisdiction-pack format
- Risk register
- 5-10 design-partner LOIs (E&W solicitors and PT notarial offices)
- Initial legal-content team hired (Legal Content Lead, 1-2 Jurisdiction Counsel)
- UPL legal opinions commissioned for E&W and PT
- Initial AI evaluation-set construction begun

Exit criteria: design-partner LOIs in hand; legal-content team in place; UPL opinions returned; jurisdiction-pack format approved.

### 25.2 Phase 1 — Core platform MVP (months 6-18)

User onboarding, jurisdiction selection (E&W + PT), family graph, asset inventory (Phase-1 classes), planning scenario, document vault, professional review, multilingual UI (en-GB + pt-PT), audit, security, Conflict-of-Laws Module, configuration studio foundation.

Document scope: wills only.

Languages: en-GB + pt-PT UI and document output.

Distribution: B2B direct (solicitors and notarial offices) and B2B via API.

Exit criteria (§26 decision gates):
- Both Phase-1 jurisdiction packs live in production with paying tenants
- Tenant-density breakeven (10-20 tenants per pack) within line of sight
- AI evaluation framework meeting all release-gate thresholds
- At least one practice-management API partnership signed
- Pack-on-pack velocity demonstrated: pack #2 cost and elapsed time materially less than pack #1
- No material UPL incidents
- Security/privacy posture verified by third-party audit

### 25.3 Phase 2 — Pack #3, codicils, and partnership scale (months 18-30)

Add pack #3 (Quebec or Ireland depending on tenant demand and counsel availability). Add codicils and basic POAs to document scope. Add fr-CA or es-ES UI and document output (gated by pack readiness). Scale practice-management partnerships. Add tax-engine integration (UK IHT, PT stamp duty).

Exit criteria:
- Pack #3 in production with paying tenants
- Pack #3 elapsed time ≤50% of pack #1 elapsed time (configuration-first thesis confirmed)
- 200-400 firms across 3 jurisdictions
- ARR £5-8M
- Sufficient capital runway to fund Phase 3

### 25.4 Phase 3 — Estate administration mode (months 30-48)

Post-death case opening, authority validation, inventory, debts/taxes, notices, distributions, accounting, closure. Begin US-state pack expansion (state-by-state with UPL clearance per state).

Exit criteria: administration mode in production; one US state pack live with paying tenants; ARR £12-20M.

### 25.5 Phase 4 — Fiduciary/trust operations and B2B2C expansion (months 48-72)

Trust/foundation/managed-estate records; beneficiary register; compliance calendar; annual reviews; reporting. Begin B2B2C deployment with banks and wealth managers in launched jurisdictions.

Exit criteria: fiduciary mode in production with regulated tenants; B2B2C with 2-3 wealth-manager partners; ARR £25-40M.

### 25.6 Phase 5 — Advanced cross-border and AI (months 72+)

Cross-border conflict prompts beyond Phase-1 Conflict-of-Laws Module scope; multilingual AI guidance at scale; document summarization; inconsistency detection; professional question drafting; deeper integrations; D2C deployment in jurisdictions with explicit UPL clearance.

Exit criteria: AI outputs pass source-grounding, safety, multilingual, escalation tests in production at scale; first D2C launch in a cleared jurisdiction.

### 25.7 Phase-1 MVP scope reductions (explicit)

The following v1 MVP items are explicitly deferred:
- Estate administration mode → Phase 3
- Trust/fiduciary management mode → Phase 4
- Professional portal mode (multi-matter dashboards) → Phase 2.5
- Configuration studio for tenants → Phase 4
- Live tax filing → permanently out of MVP
- Court/registry filing automation → Phase 3+
- B2B2C, D2C → Phase 3+
- More than 2 jurisdictions → Phase 2
- More than 1 document type → Phase 2
- More than 2 languages → Phase 2

---

## 26. Phase-1 KPIs and Decision Gates *(new in v2)*

V1 had no quantitative success criteria for the MVP. V2 commits to specific KPIs and to two formal decision gates at month 18 and month 24 that determine whether to proceed to Phase 2, pivot, or wind down.

### 26.1 Phase-1 KPIs

| KPI | Definition | Target by Month 18 | Target by Month 24 |
|---|---|---|---|
| Paying tenants (combined E&W + PT) | Firms with active subscriptions | 30-50 | 100-200 |
| Per-pack tenant density | Tenants per active jurisdiction pack | 15-25 | 50-100 |
| Will documents finalized | Cumulative through platform | 500-1,500 | 5,000-15,000 |
| ARR | Annual recurring revenue | £400k-1.2M | £1.5M-3.5M |
| Pack-on-pack velocity | Pack #2 elapsed time vs pack #1 | ≤80% | ≤70% |
| Pack-on-pack cost | Pack #2 launch cost vs pack #1 | ≤80% | ≤70% |
| AI grounding rate | §14 grounding metric | ≥95% | ≥95% |
| AI hallucination rate | §14 hallucination metric | ≤1% | ≤1% |
| Practice-management API partnerships | Signed, integrated | 1 | 2-3 |
| Material UPL incidents | Tenant or platform UPL claims | 0 | 0 |
| Material security incidents | Class B+ incidents | 0 | 0 |
| Professional NPS | At solicitor/notary tenants | ≥30 | ≥40 |

### 26.2 Decision Gate 1 — Month 18

At Month 18, the company conducts a formal Phase-1 review with the board. The conditions to proceed to Phase 2 (pack #3 development) are:

- Tenant-density per pack on track to breakeven (10-20 tenants per pack) by Month 24-30
- AI evaluation framework meeting all release-gate thresholds
- At least one practice-management API partnership signed and integrated
- No material UPL or security incidents
- Pack #2 demonstrably cheaper and faster than pack #1
- Series A funding either closed or in active diligence

If any of these conditions is not met, the company pauses pack #3 development, conducts a 90-day reposition / cost-reduction exercise, and reconvenes the decision gate at Month 21.

### 26.3 Decision Gate 2 — Month 24

At Month 24, the company conducts a second Phase-1 review. Conditions to confirm full Phase-2 execution:

- Pack #2 launched and operating
- Tenant density ≥50% of breakeven on at least one pack
- Pack #3 in active development on track to launch by Month 27-30
- ARR ≥£1.5M
- Capital runway through at least Month 42

If conditions are not met, the company executes one of three pre-defined options: (a) reduce burn, focus on profitability within existing two packs (the "vertical specialist" path); (b) seek strategic acquisition by a practice-management incumbent (the "infrastructure exit" path); (c) wind down responsibly with tenant-data migration support.

### 26.4 Configuration-first thesis falsifiability

The single most important Phase-1 question is whether the configuration-first architecture genuinely allows pack #3 to be built materially faster and cheaper than pack #1.

**The thesis is confirmed if:** pack #3 ships in ≤50% of pack #1 elapsed time at ≤50% of pack #1 launch cost.

**The thesis is broken if:** pack #3 takes the same time or money as pack #1. In that case, the platform is not a multijurisdictional intelligence layer — it is a per-jurisdiction product family with shared back-end, which is a different (and lower-value) business.

V2's commitment is to make this falsifiability explicit and to act on the result.

---

## 27. Risks, Assumptions, Dependencies, and Open Decisions *(refreshed)*

### 27.1 Key risks

| Risk | Description | Severity | Mitigation | Residual after mitigation |
|---|---|---|---|---|
| R-001 Unauthorized practice of law | Product may be seen as providing legal advice or drafting where not authorized | High | Per-jurisdiction UPL opinion before launch; B2B-only Phase-1; tenant carries professional liability; explicit feature gating | Mitigable |
| R-002 Incorrect jurisdictional configuration | Wrong law, threshold, template, or workflow could harm users | High | Source-based rules; local counsel approval; tests; audit; effective dates; release governance | Mitigable |
| R-003 Overreliance on AI | Users may treat AI output as legal advice | High | AI disclaimers; source citations; escalation; prohibited-output controls; human-review gates; measurable evaluation framework | Mitigable |
| R-004 Privacy breach | Sensitive family/financial documents exposed | High | Encryption, RBAC/ABAC, MFA, audit, secure SDLC, privacy by design, incident response, SOC 2 within 18m | Mitigable but tail risk remains |
| R-005 Localization misinterpretation | Translated legal terms may mislead | Medium | Legal glossary; professional translation; local review; jurisdiction-specific terminology; lint on generation | Mitigable |
| R-006 Tax calculation defects | Thresholds and rates change | Medium | Effective dates; source monitoring; tax specialist review; test cases; disclaimers | Mitigable |
| R-007 Cross-border complexity | One plan may involve multiple countries and conflicting connecting factors | High | Conflict-of-Laws Module (§15); mandatory expert review; conservative assumptions; structured memos | Reduced to medium |
| R-008 E-signature invalidity | Users may execute documents electronically when wet ink/notary required | Medium | Document-specific signing policy; execution instructions; provider gating; wet-ink-only at Phase 1 for wills | Mitigable |
| R-009 Professional liability | Professional users need evidence of review | Medium | Audit logs; comments; issue list; professional override notes; version snapshots | Mitigable |
| R-010 Regulated fiduciary services | Trust/company operations trigger licensing | High | Phase-4 only; regulatory assessment; KYC/AML module; role limitations; operator authorization | Deferred to Phase 4 |
| **R-011 Tenant-density flywheel risk (new)** | Failure to reach 10-20 tenants per pack before capital is exhausted | **Existential** | Conservative MVP scope; decision gates at M18/M24; pre-defined wind-down options | **Not fully mitigable — fundamental** |
| **R-012 Specialist vertical risk (new)** | A specialist France-only or Spain-only vendor out-depths our pack in a single jurisdiction | **High** | Choose launch jurisdictions where no dominant specialist exists; out-breadth specialists with multi-jurisdiction value; differentiate on cross-border | **Partially mitigable** |
| **R-013 Regulatory drift risk (new)** | UPL, AML, fiduciary-licensing, data-residency rules change continuously; compliance burden grows non-linearly | **High** | Quarterly regulatory monitoring per pack; effective-dated rules; legal-content operations sized for growth | **Not fully mitigable — operating cost** |
| **R-014 Data-breach tail risk (new)** | A single breach is potentially fatal to reputation in regulated-services market | **High** | Strong security posture; cyber insurance £10M+; incident response; SOC 2 / ISO 27001 | **Not fully mitigable — tail risk** |
| **R-015 Practice-management incumbent risk (new)** | Clio/MyCase/NetDocuments build comparable jurisdiction-pack engines in-house | **Medium-High** | 3-5 year API-partnership window; build moat in jurisdiction-content depth; deepen professional-association relationships | **Partially mitigable** |

### 27.2 Assumptions

Each target country/sub-jurisdiction has access to qualified legal/tax professionals to validate rules, workflows, templates.

The operator does not initially act as regulated fiduciary, trust company, tax preparer, or legal representative unless explicitly authorized.

Professional-review workflows are available for high-risk or legally sensitive cases.

Data hosting and security architecture chosen to support UK and EU data-residency requirements at Phase 1.

The product supports en-GB and pt-PT at launch; regional variants and other locales phased by jurisdiction.

**Capital sufficient to operate for 36 months without revenue dependency, with explicit decision gates at M18/M24.**

**Founding-team strength in legal-content operations as well as engineering.**

**At least one launch-jurisdiction partnership with a notarial or bar association.**

### 27.3 Dependencies

Legal-content governance and source review process.

Local counsel and tax adviser availability in E&W and PT.

Professional liability and regulatory review.

Secure document storage and identity/KYC integrations.

Translation management system and approved legal glossary.

Rules engine, workflow engine, document assembly engine, AI orchestration architecture.

**Practice-management API partner readiness (at least 1 by M18).**

**Cyber insurance market access (£10M+ coverage).**

### 27.4 Open decisions

Specific Phase-2 third-jurisdiction priority: Quebec, Ireland, or Scotland?

Will the API tier carry revenue share to practice-management partners or flat platform fee?

Phase-3 US state priority: California, New York, Texas, Florida?

D2C launch jurisdiction (Phase 3+): E&W where will-writing is not lawyer-monopoly, or wait for a more permissive jurisdiction?

Phase-4 fiduciary-services entity: spin out a regulated subsidiary, or partner with an authorized trust company?

Sustainability of Portuguese (pt-PT) at single-pack scale: when does pt-PT need to expand to pt-BR or be sunset?

---

## 28. Appendices

### Appendix A — Common vs configurable requirements matrix

(Unchanged from v1.) Common: persons and relationships; assets and liabilities; beneficiaries and fiduciaries; will/document workflow concept; language platform; data protection. Configurable: trust/foundation; reserved share; tax; probate/succession; professional restrictions; e-signature.

### Appendix B — Jurisdiction onboarding checklist (refined)

Identify legal system, applicable personal-law or regional-law overlays, sub-jurisdiction hierarchy.

Confirm product scope for the pack: planning only at Phase 1; administration / fiduciary at later phases.

Identify official/legal sources and professional interpretive sources.

Commission UPL legal opinion.

Map party types, relationship rules, heir classes, beneficiary categories, fiduciary roles, minor/incapacity rules.

Map asset classes, ownership types, situs rules, registry requirements, valuation requirements.

Map available planning instruments and execution formalities.

Map forced-heirship/reserved-share, intestacy, marital-property, lifetime-gift rules.

Map estate/inheritance/gift tax rules, thresholds, rates, exemptions, reliefs, forms, deadlines.

Map probate/succession/administration workflow.

Map professional regulation, UPL boundaries, notary roles, fiduciary licensing, tax-agent restrictions, adviser role limits.

Map privacy, data residency, e-signature, KYC/AML, beneficial ownership, record-retention obligations.

Create intake questions, document templates, workflow nodes, calculations, translations, AI policies, tests.

**Construct AI evaluation set (500 prompts UI-language baseline; 200-prompt high-risk; 100-prompt red-team).**

Run counsel review, localization review, QA, UAT, security/privacy assessment, compliance sign-off.

**Verify all §14 release-gate metrics met before activation.**

**Verify pack tenant-density forecast before publication.**

### Appendix C — Sample jurisdiction pack decision tables

(Unchanged from v1; illustrative.) Reserved-share logic table; document execution policy table.

### Appendix D — Canonical data entities

(Unchanged from v1.) Party, Relationship, Matter, Asset, Liability, Disposition, Document, Rule evaluation, Task, Workflow instance, Tax workpaper, Communication, Consent, AI interaction, Jurisdiction pack. **Added in v2: Conflict-of-Laws Memo, AI Evaluation Run, UPL Opinion, Pack Velocity Record.**

### Appendix E — Sample issue and warning taxonomy

(Unchanged from v1.) JURISDICTION_UNRESOLVED, CROSS_BORDER_ASSETS, RESERVED_SHARE_CONFLICT, MINOR_BENEFICIARY, FIDUCIARY_INELIGIBLE, TAX_THRESHOLD_TRIGGER, MISSING_ASSET_EVIDENCE, OUTDATED_DOCUMENT, BENEFICIARY_DESIGNATION_CONFLICT, EXECUTION_FORMALITY_BLOCKER, AML_KYC_HOLD, PRIVACY_CONSENT_MISSING. **Added in v2: AI_EVALUATION_REGRESSION (release-gate failure), PACK_VELOCITY_RISK (pack falling behind velocity target), UPL_OPINION_STALE (UPL refresh due).**

### Appendix F — Requirements for AI agent planning and design

(Largely unchanged from v1; v2 adds the evaluation framework specifics from §14.)

Use a modular architecture: core domain model, rules engine, workflow engine, document assembly engine, configuration studio, localization service, AI orchestration service, audit service, integration layer.

The AI agent receives a narrow context package: user role, case mode, selected jurisdiction, pack version, relevant rule outputs, permitted actions, retrieval documents allowed for that user.

The AI agent never receives unrestricted tenant data. Retrieval is permission-filtered and matter-scoped.

The AI agent distinguishes between educational explanation, case-specific issue summary, document summary, and regulated advice; each mode has separate prompts, permissions, and evaluation metrics.

The AI agent is evaluated quarterly per the §14 framework with multilingual estate-planning scenarios, including red-team prompts attempting unauthorized legal advice, tax evasion, asset concealment, formality bypass.

The AI agent always offers a professional-escalation path for high-risk legal issues.

### Appendix G — Reference sources

(Unchanged from v1.)

| Ref | Source | URL |
|---|---|---|
| S1 | European Commission — Successions and wills | https://commission.europa.eu/strategy-and-policy/policies/justice-and-fundamental-rights/civil-justice/family-law/successions-and-wills_en |
| S2 | European e-Justice Portal — Succession: France | https://e-justice.europa.eu/topics/family-matters-inheritance/inheritance/succession/fr_en |
| S3 | European e-Justice Portal — Succession: Spain | https://e-justice.europa.eu/topics/family-matters-inheritance/inheritance/succession/es_en |
| S4 | European e-Justice Portal — Succession: Portugal | https://e-justice.europa.eu/topics/family-matters-inheritance/inheritance/succession/pt_en |
| S5 | Internal Revenue Service — Estate tax | https://www.irs.gov/businesses/small-businesses-self-employed/estate-tax |
| S6 | GOV.UK — How Inheritance Tax works | https://www.gov.uk/inheritance-tax |
| S7 | OECD — Inheritance Taxation in OECD Countries | https://www.oecd.org/en/publications/inheritance-taxation-in-oecd-countries_e2879a7d-en.html |
| S8 | FATF — Risk-Based Approach Guidance for TCSPs | https://www.fatf-gafi.org/en/publications/Fatfrecommendations/Rba-trust-company-service-providers.html |
| S9 | European Commission — Data protection | https://commission.europa.eu/law/law-topic/data-protection_en |
| S10 | UNCITRAL — Model Law on Electronic Signatures (2001) | https://uncitral.un.org/en/texts/ecommerce/modellaw/electronic_signatures |
| S11 | European Commission — eIDAS | https://digital-strategy.ec.europa.eu/en/policies/discover-eidas |
| S12 | W3C — WCAG 2.2 | https://www.w3.org/TR/WCAG22/ |
| S13 | Unicode CLDR Project | https://cldr.unicode.org/ |
| S14 | ABA — Rule 5.5 Comment on Unauthorized Practice of Law | https://www.americanbar.org/groups/professional_responsibility/publications/model_rules_of_professional_conduct/rule_5_5_unauthorized_practice_of_law_multijurisdictional_practice_of_law/comment_on_rule_5_5_unauthorized_practice_of_law_multijurisdictional_practice_of_law/ |
| S15 | ABA — The Probate Process | https://www.americanbar.org/groups/real_property_trust_estate/resources/estate-planning/probate-process/ |

### Appendix H — Adversarial Evaluation Summary *(new in v2)*

This BRD v2 was developed from v1 through an adversarial-evaluator process (5-round Proponent / Opponent / Judge debate). The substantive changes between v1 and v2 reflect the Judge's verdict and the Opponent's most-defensible objections. Key findings driving v2:

- **The original MVP was not minimum-viable.** Phase-1 narrowed from "global platform across 4 languages" to "E&W + PT, wills only, en-GB + pt-PT, B2B-only" (§5, §25).
- **No commercial model existed in v1.** Added §5A with tiered B2B SaaS pricing, year-by-year revenue plan, capital plan, per-pack unit economics, and tenant-density breakeven (§5A).
- **AI guardrails were policy, not measurement.** Rewrote §14 with measurable evaluation framework (grounding ≥95%, citation accuracy ≥98%, escalation ≥99%, hallucination ≤1%, language parity ≤3pp, red-team 100% refusal) tied to release gating (§14).
- **Cross-border was escaped, not designed.** Added §15 Conflict-of-Laws Module producing structured memos for professional review (§15).
- **Legal-content operations was hand-waved.** Rewrote §23 with FTE assumptions, per-pack TCO, retained-counsel model, quarterly cadence (§23).
- **UPL handling was a single line item.** Added §18 per-jurisdiction UPL & regulatory posture with explicit legal-opinion gate per launch (§18).
- **Competitive positioning was unclear.** Reframed as API-first intelligence layer partnering with practice-management incumbents rather than competing head-on (§3, §5A.6).
- **Multilingual launch was overspecified.** Split UI-language launch from document-output-language launch; locales now gated by pack readiness, legal glossary, and AI language-parity (§16).
- **No quantitative MVP success criteria existed.** Added §26 Phase-1 KPIs and Decision Gates at M18 and M24 with explicit go/no-go conditions and pre-defined alternatives.
- **Residual existential risks were not named.** Added R-011 (tenant-density flywheel), R-012 (specialist vertical), R-013 (regulatory drift), R-014 (data-breach tail), R-015 (practice-management incumbent) to risk register as not-fully-mitigable risks the business must operate under (§27.1).

The single most important Phase-1 question is whether the configuration-first architecture genuinely allows pack #3 to be built materially faster and cheaper than pack #1. The v2 BRD makes this question falsifiable (§26.4) and commits the business to act on the result.

---

> **How to use this BRD in planning.** Use this BRD v2 as the business and product baseline for solution design. The next planning stage should convert the requirements into epics, user stories, data models, rules-engine design, workflow-engine design, document-template architecture, AI guardrail specifications, security architecture, and a Phase-1 jurisdiction-pack implementation plan. Do not begin development by hardcoding either of the Phase-1 jurisdiction's estate-planning workflows; begin with the canonical domain model, the configuration architecture, and the §14 AI evaluation framework. The §26 decision gates are not optional — they are the company's central existential checkpoints in years 1-2.
