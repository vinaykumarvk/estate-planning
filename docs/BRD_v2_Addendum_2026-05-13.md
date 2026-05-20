# BRD v2 Addendum — New Requirements from Reference Documents

**Date:** 2026-05-13
**Source documents analysed:**
1. `IHT calculator.pdf` — UK Inheritance Tax household calculation model
2. `Salesforce.pdf` — Financial planning data model and client lifecycle
3. `ECO Bank - Estate planning Africa Vs UK.ppt.pdf` — Six-pillar estate planning framework with African jurisdiction comparison

**Purpose:** Track new and enhanced requirements identified from the above source documents that are not covered (or are insufficiently covered) by BRD v2. Each requirement has a unique addendum ID (`ADD-xxx`), source traceability, affected BRD section, and recommended phase.

---

## Change Summary

| Category | New Reqs | Enhanced Reqs | Source |
|---|---|---|---|
| IHT Calculation Engine | 8 | 2 | IHT Calculator PDF |
| Financial Planning & Cash Flow | 7 | 1 | Salesforce PDF |
| Client Goals & Protection | 4 | 0 | Salesforce PDF |
| Gifting & Transfer Tracking | 5 | 1 | Salesforce PDF + ECO Bank PDF |
| Digital Assets | 3 | 1 | ECO Bank PDF |
| Power of Attorney & LPA | 4 | 0 | ECO Bank PDF |
| Trust Type Taxonomy | 3 | 1 | ECO Bank PDF |
| Pension & Life Assurance | 3 | 0 | ECO Bank PDF |
| African Jurisdictions | 6 | 0 | ECO Bank PDF |
| Customary & Islamic Law | 5 | 0 | ECO Bank PDF |
| Multi-Jurisdiction Will Coordination | 4 | 1 | ECO Bank PDF |
| Double Taxation Agreements | 3 | 0 | ECO Bank PDF |
| Family Graph Enhancements | 3 | 1 | ECO Bank PDF |
| Diaspora & Cross-Border Enhancements | 4 | 1 | ECO Bank PDF |
| **Total** | **62** | **9** | |

---

## 1. IHT Calculation Engine (Source: IHT Calculator PDF)

**Context:** The IHT calculator PDF shows a detailed per-individual, per-household IHT model with NRB, RNRB, 7-year chargeable transfer audit, and second-death projection. BRD v2 references UK IHT only at a high level (FR-022 mentions "tax rules"; §20 lists "Tax engines" as Phase 2 integration). These requirements define the built-in IHT calculation engine needed before an external tax-engine integration is available.

**Affected BRD sections:** §13.6 (Planning scenarios), §20 (Integrations — Tax engines), §24 (Testing)

| ADD ID | Requirement | Type | Phase | BRD Section |
|---|---|---|---|---|
| ADD-001 | **IHT per-individual liability model** — Calculate IHT liability separately for each individual in a household (e.g., Person 1 and Person 2 in a married couple/civil partnership), showing net estate before tax, applicable thresholds, and tax due per person | New | 1 | §13.6 |
| ADD-002 | **Nil Rate Band (NRB) application** — Apply the current NRB threshold (£325,000 as of 2026) against each individual's chargeable estate; support effective-dated NRB values for historical and future calculations | New | 1 | §13.6 |
| ADD-003 | **Residence Nil Rate Band (RNRB) offset** — Calculate and apply RNRB (£175,000 as of 2026) where a qualifying residential property is passed to direct descendants; model RNRB tapering for estates over £2M | New | 1 | §13.6 |
| ADD-004 | **Transferable NRB and RNRB** — On second death, calculate transferred unused NRB and RNRB from predeceased spouse/civil partner; support partial transfer where first death estate partially used the allowance | New | 1 | §13.6 |
| ADD-005 | **7-year chargeable transfer audit** — Track all chargeable lifetime transfers (CLTs) and potentially exempt transfers (PETs) within the preceding 7 years; apply taper relief at 3-7 year bands (20%, 40%, 60%, 80% reduction); recalculate NRB availability after transfers | New | 1 | §13.6 |
| ADD-006 | **Second death projection** — Model the combined estate tax impact across both deaths in a married couple/civil partnership; project total cumulative IHT payable by the family across both events; show the "final number" for planning purposes | New | 1 | §13.6 |
| ADD-007 | **IHT rate calculation** — Apply standard 40% rate on taxable estate above thresholds; apply reduced 36% rate where ≥10% of baseline estate is left to qualifying charities | New | 1 | §13.6 |
| ADD-008 | **Business Property Relief (BPR) and Agricultural Property Relief (APR)** — Model BPR (50% or 100%) and APR (50% or 100%) on qualifying assets; validate qualifying conditions and holding-period requirements | New | 2 | §13.6 |
| ADD-009 | **IHT exemptions engine** — Calculate and apply: spouse/civil partner exemption (unlimited), annual exemption (£3,000 with carry-forward), small gifts exemption (£250 per recipient), normal expenditure out of income exemption, charity exemption | Enhanced (FR-022) | 1 | §13.6 |
| ADD-010 | **IHT scenario comparison dashboard** — Side-by-side comparison of multiple IHT planning scenarios showing the tax impact of different gift, trust, and distribution strategies; highlight tax savings achieved per scenario | Enhanced (FR-021) | 1 | §13.6 |

### Acceptance Criteria (IHT Engine)
- AC-IHT-01: Given a married couple where Person 1 has £1.2M estate and Person 2 has £800K estate, the engine correctly calculates individual IHT liability per person and combined family total
- AC-IHT-02: Given a £2.5M estate, RNRB tapering correctly reduces RNRB by £1 for every £2 above £2M
- AC-IHT-03: Given Person 1 dies first using only £200K of NRB, Person 2's calculation correctly applies 100% of their own NRB plus the remaining 38.46% of Person 1's transferable NRB
- AC-IHT-04: Given 3 PETs made at years 3, 5, and 6 before death, taper relief is correctly applied at the respective band rates
- AC-IHT-05: All IHT thresholds and rates are effective-dated and configurable per jurisdiction pack update
- AC-IHT-06: Golden-file test packs include at least 20 IHT calculation scenarios covering single, married, widowed, with/without RNRB, with/without transfers, with/without charity rate

---

## 2. Financial Planning & Cash Flow (Source: Salesforce PDF)

**Context:** The Salesforce data model shows a comprehensive financial foundation layer including cash flow analysis (income vs expenditure), real-time balance sheet, and market valuations. BRD v2 has an asset/liability inventory (§13.5) but no cash flow analysis, no income/expenditure tracking, and no liquidity assessment.

**Affected BRD sections:** §13.5 (Asset and liability inventory), §13.6 (Planning scenarios)

| ADD ID | Requirement | Type | Phase | BRD Section |
|---|---|---|---|---|
| ADD-011 | **Income tracking** — Record regular income sources per individual (employment, self-employment, pensions, rental, investment, benefits) with amounts, frequency, tax treatment, and projected changes | New | 2 | §13.5 |
| ADD-012 | **Expenditure tracking** — Record regular expenditure per individual/household (essential, discretionary, commitments) to establish surplus/deficit and savings capacity | New | 2 | §13.5 |
| ADD-013 | **Cash flow analysis** — Calculate net income vs expenditure to determine liquidity position, savings capacity, and ability to make lifetime gifts or fund insurance premiums | New | 2 | §13.6 |
| ADD-014 | **Balance sheet view** — Real-time consolidated balance sheet per individual and per household showing total assets, total liabilities, and net worth with current market valuations | New | 1 | §13.5 |
| ADD-015 | **Market valuation updates** — Support periodic revaluation of assets with valuation date, source, method, and confidence level; flag stale valuations exceeding configurable age threshold | Enhanced (FR-017) | 1 | §13.5 |
| ADD-016 | **Liquidity analysis** — Classify assets by liquidity (immediately liquid, realisable within 6 months, illiquid) to assess estate's ability to meet IHT liability within HMRC's 6-month payment deadline | New | 2 | §13.6 |
| ADD-017 | **Normal expenditure out of income evidence** — Track income, expenditure, and gifting patterns to build evidence supporting the "normal expenditure out of income" IHT exemption claim | New | 2 | §13.6 |

---

## 3. Client Goals & Protection Framework (Source: Salesforce PDF)

**Context:** The Salesforce model includes client goals (short/long-term objectives) and a protection framework (insurance policies and coverages). BRD v2 has no concept of client goals or insurance tracking.

**Affected BRD sections:** §13.4 (Client/party data), §13.6 (Planning scenarios), new section needed

| ADD ID | Requirement | Type | Phase | BRD Section |
|---|---|---|---|---|
| ADD-018 | **Client goals register** — Capture and track client estate-planning goals (e.g., "protect family home", "provide for minor children", "minimise IHT", "ensure business continuity", "charitable legacy") with priority ranking | New | 2 | New §13.6A |
| ADD-019 | **Goal-to-plan mapping** — Link each planning scenario to the client goals it addresses; highlight unaddressed goals as planning gaps | New | 2 | New §13.6A |
| ADD-020 | **Protection/insurance register** — Record existing life assurance, critical illness, income protection, and relevant insurance policies per individual with: provider, sum assured, policy type (term/whole-of-life), trust status, nomination details, premium amounts | New | 2 | §13.5 |
| ADD-021 | **Protection gap analysis** — Compare total IHT liability estimate against available liquid assets and life assurance cover; flag where cover is insufficient to meet projected tax liability on death | New | 2 | §13.6 |

---

## 4. Gifting & Transfer Tracking (Source: Salesforce PDF + ECO Bank PDF)

**Context:** Both source documents emphasise the importance of tracking lifetime gifts, PETs, CLTs, Deeds of Variation, and historical transfers. BRD v2 mentions gifts only briefly in FR-023 ("basic gifts only" at Phase 1).

**Affected BRD sections:** §13.5 (Asset inventory), §13.6 (Planning scenarios)

| ADD ID | Requirement | Type | Phase | BRD Section |
|---|---|---|---|---|
| ADD-022 | **Lifetime gift register** — Record all lifetime gifts with: date, recipient, value, asset type, relationship to donor, exemption claimed (annual, small gift, normal expenditure, marriage/civil partnership), and whether gift is PET or CLT | New | 1 | §13.5 |
| ADD-023 | **7-year gift timeline** — Visual timeline of all gifts within the last 7 years showing PET/CLT status, cumulative running total against NRB, taper relief bands, and projected date each gift "falls off" | New | 1 | §13.6 |
| ADD-024 | **Deed of Variation tracking** — Record Deeds of Variation (within 2 years of death) redirecting inherited assets; track IHT and CGT implications of variation; link to original will provision being varied | New | 2 | §13.5 |
| ADD-025 | **Gift with reservation of benefit (GROB)** — Flag gifts where the donor retains a benefit (e.g., gifting property but continuing to live in it); apply pre-owned asset tax (POAT) rules; alert that GROB negates PET treatment | New | 2 | §13.6 |
| ADD-026 | **Gifts received tracking** — Record gifts received in last 2 years per individual (relevant for Deed of Variation window and for quick succession relief if donor dies within 5 years) | New | 2 | §13.5 |
| ADD-027 | **Quick succession relief** — Calculate relief where a beneficiary dies within 5 years of inheriting an estate that paid IHT; apply sliding scale (100% year 1, 80% year 2, 60% year 3, 40% year 4, 20% year 5) | Enhanced (ADD-005) | 2 | §13.6 |

---

## 5. Digital Assets (Source: ECO Bank PDF)

**Context:** The ECO Bank presentation explicitly identifies digital assets (cryptocurrency, mobile money, online accounts, IP) as a modern estate-planning requirement. BRD v2's asset taxonomy (FR-016) does not mention digital assets.

**Affected BRD sections:** §13.5 (Asset inventory), Appendix A (Common vs configurable)

| ADD ID | Requirement | Type | Phase | BRD Section |
|---|---|---|---|---|
| ADD-028 | **Digital asset class** — Add digital assets as a first-class asset category in the configurable taxonomy, including: cryptocurrency/tokens (with wallet type, exchange, seed phrase storage method), domain names, digital media libraries, online business accounts, intellectual property (patents, trademarks, copyrights), social media accounts with commercial value | New | 1 | §13.5 |
| ADD-029 | **Digital asset access planning** — Record access credentials storage method (password manager, hardware wallet, custodian), designated digital executor/trustee, and platform-specific legacy/memorialisation settings (e.g., Google Inactive Account Manager, Facebook Legacy Contact, Apple Digital Legacy) | New | 2 | §13.5 |
| ADD-030 | **Mobile money accounts** — Support mobile money platforms (M-Pesa, MTN Mobile Money, Airtel Money) as asset type with provider, account holder, balance, and jurisdiction-specific transfer rules; relevant for African jurisdiction packs | New | Phase 3+ (African packs) | §13.5 |
| ADD-031 | **Digital asset valuation** — Support volatile-asset valuation with: valuation date, exchange/source used, currency conversion, and confidence caveat for highly volatile assets (crypto) | Enhanced (FR-017) | 1 | §13.5 |

---

## 6. Power of Attorney & LPA (Source: ECO Bank PDF)

**Context:** The ECO Bank presentation identifies Power of Attorney as one of the six pillars of estate planning, including LPA registration with the Office of the Public Guardian (OPG). BRD v2 mentions "basic POAs" only in Phase 2 (§25.3) with no detailed requirements.

**Affected BRD sections:** §13.7 (Document preparation), §25.3 (Phase 2)

| ADD ID | Requirement | Type | Phase | BRD Section |
|---|---|---|---|---|
| ADD-032 | **LPA document types** — Support Lasting Power of Attorney for Property & Financial Affairs and LPA for Health & Welfare as distinct document types with jurisdiction-specific forms, execution requirements, and registration workflows | New | 2 | §13.7 |
| ADD-033 | **LPA attorney appointment** — Capture attorney details, replacement attorneys, how attorneys act (jointly / jointly and severally / jointly for some decisions), preferences and instructions, certificate provider, and people to notify | New | 2 | §13.7 |
| ADD-034 | **OPG registration tracking** — Track LPA registration status with the Office of the Public Guardian (E&W): submitted, pending, registered, rejected; store registration reference number and registration date | New | 2 | §13.7 |
| ADD-035 | **Equivalent incapacity instruments** — Configurable per jurisdiction pack: Procuração (Portugal), Enduring Power of Attorney (Ireland), Mandat de protection future (Quebec/France), each with jurisdiction-specific formalities and registration requirements | New | 2+ | §13.7 |

---

## 7. Trust Type Taxonomy (Source: ECO Bank PDF)

**Context:** The ECO Bank presentation lists trust types as a pillar: Discretionary, Bare, Interest-in-Possession, Charitable. BRD v2 defers trusts entirely to Phase 4 (FR-038–041) with no taxonomy detail.

**Affected BRD sections:** §13.9 (Trust management — Phase 4), §13.6 (Planning scenarios)

| ADD ID | Requirement | Type | Phase | BRD Section |
|---|---|---|---|---|
| ADD-036 | **Trust type taxonomy** — Define configurable trust types per jurisdiction pack: Discretionary Trust, Bare/Absolute Trust, Interest-in-Possession Trust, Charitable Trust/CIO, Accumulation & Maintenance Trust, Pilot Trust, Will Trust (created on death), Inter Vivos Trust (created during lifetime), Protective Trust | New | 2 (taxonomy); 4 (management) | §13.9 |
| ADD-037 | **Trust in planning scenarios** — Allow planning scenarios to model the IHT impact of settling assets into trust (CLT entry charge at 20%, 10-year periodic charge, exit charges) even before full trust management is built | New | 2 | §13.6 |
| ADD-038 | **Life assurance in trust** — Model writing life assurance policies in trust to keep proceeds outside the estate for IHT purposes; flag policies not written in trust as an IHT planning opportunity | New | 2 | §13.6 |
| ADD-039 | **South African trust structures** — Support inter vivos trusts (loan account method), testamentary trusts, and Section 4q spousal rollover modeling for South African jurisdiction pack | Enhanced (FR-038) | Phase 3+ (SA pack) | §13.9 |

---

## 8. Pension & Life Assurance Nominations (Source: ECO Bank PDF)

**Context:** The ECO Bank presentation emphasises that pension death benefits and life assurance nominations fall outside the estate and are critical planning tools. BRD v2 does not track these.

**Affected BRD sections:** §13.5 (Asset inventory), §13.6 (Planning scenarios)

| ADD ID | Requirement | Type | Phase | BRD Section |
|---|---|---|---|---|
| ADD-040 | **Pension death benefit nominations** — Record pension schemes per individual with: provider, scheme type (DB/DC/SIPP), current value, nominated beneficiaries, nomination type (binding/non-binding expression of wish), and last review date; flag that these typically fall outside the estate for IHT | New | 2 | §13.5 |
| ADD-041 | **Life assurance nomination tracking** — Record life assurance policies with: provider, sum assured, policy type, beneficiary nominations, trust status (written in trust = outside estate), and premium payment frequency | New | 2 | §13.5 |
| ADD-042 | **Outside-estate assets summary** — Provide a consolidated view of assets passing outside the will/intestacy (pension nominations, life assurance in trust, joint tenancy survivorship, POD/TOD designations) to give a complete picture of what beneficiaries will actually receive | New | 2 | §13.6 |

---

## 9. African Jurisdiction Packs (Source: ECO Bank PDF)

**Context:** The ECO Bank presentation provides detailed estate-planning requirements for six African sub-regions. BRD v2's roadmap covers E&W, PT, Ireland, Quebec, Spain, France, and US states — no African jurisdictions appear on the roadmap.

**Affected BRD sections:** §25 (Phasing/Roadmap), §18 (UPL/Regulatory), §15 (Conflict-of-Laws), Appendix B

| ADD ID | Requirement | Type | Phase | BRD Section |
|---|---|---|---|---|
| ADD-043 | **West African pack — Nigeria** — Jurisdiction pack covering: Administration of Estates Law (Lagos), Wills Act (Southern), Islamic Personal Law (Northern), Customary Law of Succession; High Court probate vs Customary Court jurisdiction; Letters of Administration; NTA 2025 trust taxation; land tenure (Certificate of Occupancy vs customary title) | New | Phase 4+ | §25 |
| ADD-044 | **West African pack — Ghana** — Jurisdiction pack covering: PNDCL 111 intestacy shares, Wills Act 1971, customary property restrictions, IHT on intangibles only (no general IHT), Probate & Administration form requirements | New | Phase 4+ | §25 |
| ADD-045 | **East African pack — Kenya** — Jurisdiction pack covering: Law of Succession Act Cap 160, Muslim personal law (Kadhis Courts), land restrictions for non-citizens, separate local/international wills requirement, no IHT | New | Phase 4+ | §25 |
| ADD-046 | **Southern African pack — South Africa** — Jurisdiction pack covering: Administration of Estates Act 66/1965, estate duty (20% above R3.5M, 25% above R30M), matrimonial property regimes (in/out of community, accrual system), Section 4q spousal rollover, inter vivos trust structures, UK-SA Double Taxation Agreement | New | Phase 3+ | §25 |
| ADD-047 | **North African pack — Egypt** — Jurisdiction pack covering: Islamic Faraid fixed-share succession for Muslims, Civil Code for non-Muslims, notarial deed requirements, CGT on property transfers, no IHT | New | Phase 5+ | §25 |
| ADD-048 | **North African pack — Morocco** — Jurisdiction pack covering: Mudawwana 2004 family code, Dahir civil code for non-Muslims, France-Morocco DTA, Faraid succession rules | New | Phase 5+ | §25 |

---

## 10. Customary & Islamic Law Modules (Source: ECO Bank PDF)

**Context:** The ECO Bank presentation reveals that many African jurisdictions operate under multiple parallel legal systems (statutory + customary + Islamic). BRD v2's configuration-first architecture handles common-law vs civil-law jurisdictions but has no framework for customary or religious law systems.

**Affected BRD sections:** §12 (Jurisdiction pack architecture), §13.3 (Jurisdiction and rule configuration), §15 (Conflict-of-Laws)

| ADD ID | Requirement | Type | Phase | BRD Section |
|---|---|---|---|---|
| ADD-049 | **Multi-legal-system jurisdiction packs** — Extend jurisdiction pack architecture to support jurisdictions where multiple legal systems operate in parallel (e.g., Nigeria: statutory + customary + Islamic). The applicable system may be determined by religion, ethnicity, domicile, or choice of the deceased | New | Phase 3+ | §12 |
| ADD-050 | **Islamic succession law (Faraid) module** — Configurable Faraid calculation engine supporting: fixed Quranic shares (fard), residual heirs (asaba), blocked heirs (hajb), return (radd), and acknowledgement (iqrar); applicable in Nigeria (Northern states), Kenya (Muslim personal law), Egypt, Morocco, and potentially UK Muslim clients under non-binding guidance | New | Phase 3+ | §13.6 |
| ADD-051 | **Customary law succession rules** — Configurable customary inheritance rules per ethnic/regional group where applicable: primogeniture, ultimogeniture, matrilineal inheritance, communal land succession; with conflict resolution against statutory law | New | Phase 4+ | §13.6 |
| ADD-052 | **Legal system determination workflow** — Guided intake to determine which legal system applies to a specific individual's succession: statutory vs customary vs Islamic, based on domicile, religion, ethnicity, and applicable jurisdiction rules; with professional-review gate | New | Phase 3+ | §13.3 |
| ADD-053 | **Polygamous union handling in family graph** — Extend family graph to support polygamous marriages/unions recognised under customary or Islamic law; correctly model inheritance rights of multiple spouses and their respective children under applicable legal system | New | Phase 3+ | §13.4 |

---

## 11. Multi-Jurisdiction Will Coordination (Source: ECO Bank PDF)

**Context:** The ECO Bank presentation emphasises that clients with assets in multiple countries need separate wills per jurisdiction with carefully drafted revocation clauses to avoid one will inadvertently revoking another.

**Affected BRD sections:** §13.7 (Document preparation), §15 (Conflict-of-Laws)

| ADD ID | Requirement | Type | Phase | BRD Section |
|---|---|---|---|---|
| ADD-054 | **Multi-jurisdiction will register** — Track all wills held by a client across jurisdictions, including: jurisdiction, document type, date executed, solicitor/notary, assets covered, current status (draft/executed/revoked/superseded) | New | 1 | §13.7 |
| ADD-055 | **Revocation clause management** — When generating a will for one jurisdiction, automatically flag or generate appropriate limited revocation clause to avoid revoking wills in other jurisdictions; alert if a new will's revocation clause is overly broad | New | 1 | §13.7 |
| ADD-056 | **Cross-jurisdiction asset assignment** — Require explicit assignment of each asset to the jurisdiction-specific will that governs it based on asset situs rules; flag unassigned assets and assets potentially claimed by multiple wills | New | 1 | §13.7 |
| ADD-057 | **Foreign grant recognition tracking** — Track whether a grant of probate/letters of administration from one jurisdiction is recognised in another, or whether a fresh application is required (e.g., UK grant is not recognised in Nigeria, Kenya, Ghana — fresh Letters of Administration required per jurisdiction) | New | Phase 3+ | §13.8 |
| ADD-058 | **Will coordination summary** — Generate a consolidated cross-jurisdiction estate plan summary showing: all wills, all assets and which will covers each, all beneficiaries and what they receive from each jurisdiction, potential conflicts, and professional review requirements | Enhanced (CL-004) | 2 | §15 |

---

## 12. Double Taxation Agreements (Source: ECO Bank PDF)

**Context:** The ECO Bank presentation highlights the importance of DTAs in cross-border estate planning (e.g., UK-SA DTA exists; no DTA with Nigeria, Kenya, Ghana, Egypt — creating double taxation risk). BRD v2's Conflict-of-Laws Module (§15) does not address tax treaties.

**Affected BRD sections:** §15 (Conflict-of-Laws), §13.6 (Planning scenarios)

| ADD ID | Requirement | Type | Phase | BRD Section |
|---|---|---|---|---|
| ADD-059 | **DTA register** — Maintain a configurable register of bilateral estate/inheritance tax treaties and conventions with: signatory countries, covered taxes, relief method (credit/exemption), scope limitations, and effective date | New | 2 | §15 |
| ADD-060 | **DTA relief calculation** — In cross-border planning scenarios, apply DTA relief to avoid double taxation where a treaty exists; calculate unilateral relief where no treaty exists; flag double-taxation exposure | New | 2 | §13.6 |
| ADD-061 | **No-DTA warning** — In cross-border cases where no relevant DTA exists between the jurisdictions involved, generate an explicit warning highlighting double-taxation risk and recommend professional tax advice | New | 2 | §15 |

---

## 13. Family Graph Enhancements (Source: ECO Bank PDF)

**Context:** The ECO Bank presentation identifies beneficiary classes and family structures not fully covered by BRD v2's family/relationship graph.

**Affected BRD sections:** §13.4 (Client/party data)

| ADD ID | Requirement | Type | Phase | BRD Section |
|---|---|---|---|---|
| ADD-062 | **Polygamous marriage/union support** — Extend family graph to model multiple concurrent marriages/unions recognised by customary or Islamic law; correctly calculate inheritance shares for all recognised spouses and their children under applicable legal system | New | Phase 3+ | §13.4 |
| ADD-063 | **Customary beneficiary claimants** — Support additional beneficiary categories recognised under customary law: extended family members, clan/community members, dependants of the deceased not in the nuclear family | New | Phase 4+ | §13.4 |
| ADD-064 | **Domicile of origin tracking** — Explicitly track domicile of origin (birth domicile) separately from domicile of choice and domicile of dependency; flag "domicile snap-back" risk where an individual who acquired UK domicile of choice could revert to their domicile of origin (common issue for diaspora clients) | Enhanced (CL-001) | 1 | §13.4 |

---

## 14. Diaspora & Cross-Border Enhancements (Source: ECO Bank PDF)

**Context:** The ECO Bank presentation identifies diaspora-specific planning needs (UK residents with assets and family in Africa) that extend beyond BRD v2's Conflict-of-Laws Module.

**Affected BRD sections:** §15 (Conflict-of-Laws), §22 (Workflow blueprints)

| ADD ID | Requirement | Type | Phase | BRD Section |
|---|---|---|---|---|
| ADD-065 | **Diaspora planning workflow** — Dedicated planning workflow for clients with dual nationality / diaspora status: comprehensive asset discovery across all jurisdictions, domicile analysis, multi-jurisdiction will coordination, tax treaty assessment, local professional network referral | New | Phase 3+ | §22 |
| ADD-066 | **Universal advisor checklist** — Configurable advisor checklist per client type: full asset discovery (including digital, crypto, mobile money), domicile/residence/nationality determination, multi-jurisdiction will strategy, beneficiary identification (including customary claimants), pension/life nominations review, local professional network | New | 2 | §22 |
| ADD-067 | **Land restriction rules** — Per-jurisdiction rules on land ownership restrictions for non-citizens (e.g., Kenya restricts freehold land ownership by non-citizens to 99-year leases); flag where a beneficiary may be unable to inherit real property due to citizenship/residency restrictions | New | Phase 3+ | §13.5 |
| ADD-068 | **Local professional network** — Maintain a configurable directory of local legal/tax professionals per jurisdiction for referral when cross-border matters require in-country expertise (solicitors, notaries, advocates, tax advisers, Sharia scholars) | Enhanced (FR-042) | 2 | §13.10 |

---

## Phase Summary

| Phase | Requirement IDs | Count |
|---|---|---|
| **Phase 1** (immediate) | ADD-001 to ADD-010, ADD-014, ADD-015, ADD-022, ADD-023, ADD-028, ADD-031, ADD-054, ADD-055, ADD-056, ADD-064 | 22 |
| **Phase 2** | ADD-011 to ADD-013, ADD-016 to ADD-021, ADD-024 to ADD-027, ADD-029, ADD-032 to ADD-038, ADD-040 to ADD-042, ADD-058 to ADD-061, ADD-066, ADD-068 | 31 |
| **Phase 3+** | ADD-030, ADD-039, ADD-043 to ADD-053, ADD-057, ADD-062, ADD-063, ADD-065, ADD-067 | 17 |
| **Total** | | **70** |

---

## Development Tracking

### Phase 1 Priority Items (22 requirements)

**Sprint Group A — IHT Calculation Engine (10 items)**
- ADD-001 through ADD-010
- Dependencies: FR-016 (asset taxonomy), FR-017 (valuations), FR-021 (scenarios), FR-022 (rule evaluation)
- Estimated effort: Large (complex calculation engine with effective-dating)

**Sprint Group B — Asset Taxonomy & Gift Tracking (5 items)**
- ADD-014, ADD-015, ADD-022, ADD-023, ADD-028, ADD-031
- Dependencies: FR-016 (asset taxonomy)
- Estimated effort: Medium

**Sprint Group C — Multi-Jurisdiction Will Coordination (3 items)**
- ADD-054, ADD-055, ADD-056
- Dependencies: FR-026 (document generation), CL-001 (connecting factors)
- Estimated effort: Medium

**Sprint Group D — Domicile Enhancement (1 item)**
- ADD-064
- Dependencies: CL-001 (connecting factors)
- Estimated effort: Small

---

## Reference Source Traceability

| Source Document | Requirements Sourced | Key Themes |
|---|---|---|
| IHT Calculator PDF | ADD-001 to ADD-010 | NRB/RNRB, 7-year transfers, second death projection, taper relief, charitable rate |
| Salesforce PDF | ADD-011 to ADD-021, ADD-024, ADD-026 | Cash flow, balance sheet, client goals, protection, gifting history, Deed of Variation |
| ECO Bank PDF | ADD-022, ADD-023, ADD-025, ADD-027 to ADD-068 | Digital assets, LPA, trusts, pensions, African jurisdictions, customary/Islamic law, multi-will coordination, DTAs, diaspora planning, polygamous unions, land restrictions |
| Multiple sources | ADD-022, ADD-023 (both Salesforce + ECO Bank) | Gift tracking with 7-year timeline |
