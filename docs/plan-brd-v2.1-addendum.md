# Development Plan: BRD v2.1 Addendum — Phase 1 Requirements

## Overview
Implement the 22 Phase-1 requirements from the BRD v2.1 Addendum, covering: (1) a full UK Inheritance Tax calculation engine with NRB, RNRB, 7-year transfer audit, second-death projection, and exemptions; (2) lifetime gift register with 7-year timeline and PET/CLT classification; (3) digital asset class in the asset taxonomy; (4) balance sheet and market valuation enhancements; (5) multi-jurisdiction will coordination with revocation clause management; and (6) domicile-of-origin tracking with snap-back risk detection. Each phase delivers a complete functional slice with API routes, service logic, and tests.

## Architecture Decisions

- **Decision 1: Built-in IHT engine, not external integration.** The BRD specifies Phase 1 needs an IHT calculation engine before external tax engine integration (Phase 2). We build `ihtCalculationService.ts` with effective-dated thresholds stored in the jurisdiction pack, following the existing `ruleEngine.ts` pattern.

- **Decision 2: Extend existing models rather than creating separate tables.** The Person model gets a `domicileOfOrigin` field. The Asset model gets expanded `assetClass` enum values for digital assets. New tables are created only for genuinely new entities (LifetimeGift, IhtCalculation, WillCoordination).

- **Decision 3: IHT thresholds as configuration, not hardcoded.** NRB (£325K), RNRB (£175K), taper threshold (£2M), rates (40%/36%), exemption amounts are stored as pack-level configuration with effective dates, following the existing `Rule` model pattern with `effectiveFrom`/`effectiveTo`.

- **Decision 4: Add EW and PT to PHASE_1_JURISDICTIONS.** The existing constants define African jurisdictions. We extend the jurisdiction code type and constants to include England & Wales ("EW") and Portugal ("PT") as the BRD v2 mandates.

- **Decision 5: Follow existing patterns exactly.** All new routes use the `asyncHandler` wrapper, Zod validation, tenant-scoped queries, and audit logging established in existing routes. All new services follow the function-export pattern (not classes) used throughout the codebase.

## Conventions
- **Route pattern**: See `server/routes/matters.ts` — Express Router, `asyncHandler`, Zod `parse()`, `response.locals.tenantId`, 201 for creates
- **Service pattern**: See `server/services/matterService.ts` — exported async functions, Prisma queries, `audit()` calls
- **Schema pattern**: See `shared/schemas.ts` — Zod objects with `.min()`, `.default()`, `.optional()` chains
- **Type pattern**: See `shared/types.ts` — exported interfaces and type aliases
- **Test pattern**: See `tests/critical-rules.test.ts` — `describe("REQ-ID: description")`, `it("TC-REQ-SEQ: description")`, supertest with `x-api-key` header
- **Component pattern**: See `client/src/components/assets/AssetList.tsx` — `useMatterContext()`, `useApiMutation()`, `useFormState()`, `<T k="key">` for i18n
- **CSS pattern**: See `client/src/styles.css` — `.panel`, `.panel-header`, `.compact-list`, `.form-stack` classes with CSS custom properties

---

## Phase 1: Database Schema, Shared Types & Constants
**Dependencies:** none

**Description:**
Foundation phase. Add new Prisma models, extend existing ones, add Zod schemas, TypeScript types, constants, and issue codes needed by all subsequent phases. No business logic — pure data layer and type definitions.

**Tasks:**
1. Extend `shared/constants.ts`: add `"EW"` and `"PT"` to `PHASE_1_JURISDICTIONS`; add new issue codes (`IHT_LIQUIDITY_SHORTFALL`, `PROTECTION_GAP`, `GIFT_RESERVATION_OF_BENEFIT`, `REVOCATION_CLAUSE_CONFLICT`, `ASSET_UNASSIGNED_TO_WILL`, `DIGITAL_ASSET_ACCESS_UNPLANNED`, `DOMICILE_SNAPBACK_RISK`) to `ISSUE_CODES`; add `"LifetimeGift"`, `"IhtCalculation"`, `"WillCoordination"`, `"DomicileRecord"` to `TABLE_CATALOG`; add addendum requirement IDs to `FRONT_OFFICE_REQUIREMENTS`.

2. Extend `shared/types.ts`: add `"EW" | "PT"` to `JurisdictionCode`; add new interfaces: `IhtCalculationResult` (fields: matterId, personId, netEstate, nrb, rnrb, transferableNrb, transferableRnrb, charitableRate, taxableEstate, ihtDue, exemptions, taperRelief, effectiveDate), `IhtHouseholdResult` (persons array + combinedIht + secondDeathProjection), `LifetimeGiftRecord` (giftDate, recipientPersonId, value, assetType, relationship, exemptionClaimed, petOrClt, taperBand, yearsElapsed), `GiftTimelineResult` (gifts array + cumulativeTotal + nrbRemaining + projectedFallOffDates), `BalanceSheetResult` (totalAssets, totalLiabilities, netWorth, byAssetClass), `WillCoordinationRecord` (jurisdictionCode, documentType, dateExecuted, status, assetsCovered), `WillCoordinationSummary` (wills array + unassignedAssets + potentialConflicts), `DomicileRecord` (domicileOfOrigin, domicileOfChoice, domicileOfDependency, snapBackRisk).

3. Add new Zod schemas to `shared/schemas.ts`: `createLifetimeGiftSchema` (tenantId, matterId, donorPersonId, recipientPersonId, giftDate, value, currency, assetType, relationship, exemptionClaimed enum, petOrClt enum, description, evidenceRefs), `createIhtCalculationSchema` (tenantId, matterId, personId, scenarioId, effectiveDate), `createWillCoordinationSchema` (tenantId, matterId, jurisdictionCode, documentType, dateExecuted, solicitorNotary, status, revocationClause, assetIds), `createDomicileRecordSchema` (tenantId, personId, domicileOfOrigin, domicileOfChoice, domicileOfDependency, dateEstablished, evidenceSummary), `updatePersonSchema` to include `domicileOfOrigin` field. Extend `createAssetSchema` `assetClass` enum to include `"digital_asset"`, `"cryptocurrency"`, `"intellectual_property"`, `"domain_name"`.

4. Add Prisma models to `prisma/schema.prisma`:
   - `LifetimeGift` (id, tenantId, matterId, donorPersonId, recipientPersonId, giftDate, value, currency, assetType, relationship, exemptionClaimed, petOrClt, description, taperBand, yearsElapsed, evidenceRefs, createdAt, updatedAt) with indexes on [tenantId], [matterId], [donorPersonId]
   - `IhtCalculation` (id, tenantId, matterId, personId, scenarioId, effectiveDate, netEstate, nrb, nrbUsed, rnrb, rnrbTapering, transferableNrb, transferableRnrb, charitableRate, taxableEstate, ihtDue, exemptionsApplied, sevenYearTransfers, taperRelief, calculationDetails, createdAt) with indexes on [tenantId], [matterId], [personId]
   - `WillCoordination` (id, tenantId, matterId, jurisdictionCode, documentType, documentId, dateExecuted, solicitorNotary, status, revocationClause, assetIds, notes, createdAt, updatedAt) with indexes on [tenantId], [matterId]
   - `DomicileRecord` (id, tenantId, personId, domicileOfOrigin, domicileOfChoice, domicileOfDependency, dateEstablished, evidenceSummary, snapBackRisk, snapBackReason, createdAt, updatedAt) with indexes on [tenantId], [personId]
   - Extend `Person` model: add `domicileOfOrigin String?`
   - Extend `Asset` model: add `digitalAccessMethod String?`, `volatilityFlag Boolean @default(false)`

5. Update seed data in `prisma/seed.ts`: add EW and PT jurisdiction records; add IHT-related rules to EW jurisdiction pack (NRB threshold rule, RNRB threshold rule, charity rate rule, taper relief rule); seed sample lifetime gifts and will coordination records for the demo matter.

6. Run `npx prisma db push` and `npx prisma generate` to apply schema changes.

**Files to create/modify:**
- `shared/constants.ts` — extend jurisdiction codes, issue codes, table catalog
- `shared/types.ts` — add IHT, gift, balance sheet, will coordination, domicile interfaces
- `shared/schemas.ts` — add Zod schemas for new entities, extend asset class enum
- `prisma/schema.prisma` — add 4 new models, extend Person and Asset
- `prisma/seed.ts` — add EW/PT jurisdictions, IHT rules, sample data

**Acceptance criteria:**
- `npx prisma generate` succeeds without errors
- `npx prisma db push` applies all schema changes
- TypeScript compilation passes (`npm run typecheck`)
- Existing tests continue to pass (`npm test`)
- New jurisdiction codes EW and PT are in PHASE_1_JURISDICTIONS
- All new Zod schemas validate correct inputs and reject invalid ones

---

## Phase 2: IHT Calculation Engine
**Dependencies:** Phase 1

**Description:**
Build the core UK Inheritance Tax calculation engine implementing ADD-001 through ADD-010. This is the largest and most critical Phase-1 deliverable. The engine calculates per-individual IHT liability with NRB, RNRB (with tapering), transferable bands, 7-year chargeable transfer audit with taper relief, exemptions, standard/charitable rate, and second-death projection for married couples. All thresholds are effective-dated.

**Tasks:**
1. Create `server/services/ihtCalculationService.ts` with the following exported functions:
   - `getIhtThresholds(packId: string, effectiveDate: Date)` — fetch NRB, RNRB, taper threshold, rates from pack rules (effective-dated); return `IhtThresholds` object. Follow the pattern in `ruleEngine.ts` for querying pack rules.
   - `calculateNrb(netEstate: number, thresholds: IhtThresholds, transferablePercent?: number)` — apply NRB (£325K default), add transferable NRB from predeceased spouse if applicable, return { nrb, transferableNrb, totalNrb }.
   - `calculateRnrb(netEstate: number, qualifyingPropertyValue: number, toDirectDescendants: boolean, thresholds: IhtThresholds, transferablePercent?: number)` — apply RNRB (£175K default); taper by £1 per £2 above £2M threshold; add transferable RNRB if applicable; return { rnrb, taperedRnrb, transferableRnrb }.
   - `auditSevenYearTransfers(gifts: LifetimeGift[], deathDate: Date)` — for each gift within 7 years, calculate years elapsed, classify as PET or CLT, apply taper relief bands (0-3 years: 0%, 3-4: 20%, 4-5: 40%, 5-6: 60%, 6-7: 80%), calculate cumulative NRB consumption; return { transfers, cumulativeNrbUsed, taperReliefApplied }.
   - `calculateExemptions(estate: EstateInputs)` — apply spouse exemption (unlimited), annual exemption (£3K + 1yr carry-forward), small gifts (£250/recipient), normal expenditure, charity; return { totalExemptions, breakdown }.
   - `calculateIhtForPerson(matterId: string, personId: string, scenarioId: string, effectiveDate: Date)` — orchestrate full IHT calculation for one person: fetch assets, gifts, thresholds → netEstate → exemptions → NRB → RNRB → 7-year transfers → taxableEstate → rate (40% standard or 36% charitable) → ihtDue. Persist `IhtCalculation` record. Return `IhtCalculationResult`.
   - `calculateHouseholdIht(matterId: string, scenarioId: string, effectiveDate: Date)` — find all persons in matter linked by spouse/civil-partner relationship; calculate per-person IHT; project second death (assets transfer to survivor → recalculate with transferable NRB/RNRB); return `IhtHouseholdResult` with individual + combined totals.
   - `compareIhtScenarios(matterId: string, scenarioIds: string[])` — calculate IHT for each scenario; return side-by-side comparison with delta highlighting.

2. Create `server/routes/iht.ts` — new Express router with endpoints:
   - `POST /api/matters/:matterId/iht/calculate` — body: `{ personId, scenarioId, effectiveDate }` → calls `calculateIhtForPerson`, returns `IhtCalculationResult`
   - `POST /api/matters/:matterId/iht/household` — body: `{ scenarioId, effectiveDate }` → calls `calculateHouseholdIht`, returns `IhtHouseholdResult`
   - `POST /api/matters/:matterId/iht/compare` — body: `{ scenarioIds, effectiveDate }` → calls `compareIhtScenarios`
   - `GET /api/matters/:matterId/iht/calculations` — list all saved IHT calculations for matter
   - `GET /api/matters/:matterId/iht/thresholds` — return current EW IHT thresholds (for UI display)
   Mount router in `server/app.ts` under `/api/matters` path grouping.

3. Create `tests/iht-calculation.test.ts` with comprehensive test coverage:
   - TC-ADD001-01: Single person £500K estate → IHT on £175K (above £325K NRB) = £70K at 40%
   - TC-ADD001-02: Single person £300K estate → no IHT (below NRB)
   - TC-ADD002-01: NRB correctly set at £325K for 2026
   - TC-ADD003-01: RNRB £175K applied when property passes to direct descendants
   - TC-ADD003-02: RNRB tapered for £2.5M estate: RNRB reduced from £175K to (£175K - (£2.5M-£2M)/2) = £175K - £250K = £0
   - TC-ADD003-03: RNRB tapered for £2.2M estate: RNRB = £175K - £100K = £75K
   - TC-ADD004-01: Transferable NRB — Person 1 uses £200K of £325K NRB, Person 2 gets 38.46% of £325K (= £125K) transferred
   - TC-ADD004-02: Full transferable NRB — Person 1 uses £0 of NRB, Person 2 gets 100% (= £325K) transferred
   - TC-ADD005-01: PET at 3 years → taper 20%, PET at 5 years → taper 60%, PET at 6 years → taper 80%
   - TC-ADD005-02: CLT within 7 years reduces available NRB
   - TC-ADD005-03: Gift at 7+ years → falls off, no NRB impact
   - TC-ADD006-01: Married couple second death projection — £1.2M + £800K estates, combined IHT
   - TC-ADD006-02: Surviving spouse inherits all → second death calculates on combined estate with transferable NRB/RNRB
   - TC-ADD007-01: Standard rate 40% applied correctly
   - TC-ADD007-02: Charitable rate 36% when ≥10% to charity (baseline = net estate - NRB - RNRB)
   - TC-ADD007-03: Charitable rate NOT applied when <10% to charity
   - TC-ADD009-01: Spouse exemption unlimited
   - TC-ADD009-02: Annual exemption £3K + £3K carry-forward from prior year
   - TC-ADD009-03: Small gifts £250/recipient
   - TC-ADD010-01: API endpoint returns comparison of 2 scenarios with IHT delta
   - AC-IHT-01: Married couple Person1 £1.2M, Person2 £800K → individual + combined correct
   - AC-IHT-02: £2.5M estate RNRB tapering correct (RNRB = £0)
   - AC-IHT-03: Person1 uses £200K NRB → Person2 gets 38.46% transferable
   - AC-IHT-04: 3 PETs at years 3, 5, 6 → taper relief correct

**Files to create/modify:**
- `server/services/ihtCalculationService.ts` — new IHT engine (core business logic)
- `server/routes/iht.ts` — new API routes for IHT calculation
- `server/app.ts` — mount IHT router
- `tests/iht-calculation.test.ts` — 20+ test scenarios (golden-file equivalent)

**Acceptance criteria:**
- All 20+ IHT test scenarios pass
- AC-IHT-01 through AC-IHT-04 acceptance criteria from addendum verified
- IHT calculation persists result to database
- All thresholds are effective-dated (not hardcoded magic numbers)
- Second-death projection correctly applies transferable NRB/RNRB
- Charitable rate (36%) correctly applied only when ≥10% baseline to charity
- API endpoints return correct status codes (200 for success, 400 for validation, 404 for missing matter)

---

## Phase 3: Gift Register, Digital Assets & Balance Sheet
**Dependencies:** Phase 1

**Description:**
Implement lifetime gift register with 7-year timeline (ADD-022, ADD-023), digital asset class (ADD-028, ADD-031), balance sheet view (ADD-014), and market valuation enhancements (ADD-015). These are independent of the IHT engine and can be built in parallel with Phase 2.

**Tasks:**
1. Create `server/services/lifetimeGiftService.ts`:
   - `addLifetimeGift(data: CreateLifetimeGiftInput)` — validate via Zod schema, create LifetimeGift record, audit log. Follow `matterService.addAsset()` pattern.
   - `getLifetimeGifts(matterId: string, tenantId: string)` — list all gifts for matter, ordered by giftDate desc.
   - `updateLifetimeGift(giftId: string, data: Partial<LifetimeGift>)` — update gift record.
   - `deleteLifetimeGift(giftId: string, tenantId: string)` — delete with audit.
   - `calculateGiftTimeline(matterId: string, referenceDate: Date)` — for each gift within 7 years of referenceDate: calculate years elapsed, taper band, PET/CLT status, cumulative NRB consumption, projected fall-off date; return `GiftTimelineResult` with array + cumulativeTotal + nrbRemaining.
   - `classifyGift(gift: LifetimeGift)` — determine if PET or CLT based on trust involvement and gift type.
   - `calculateExemptionAvailability(matterId: string, taxYear: number)` — track annual exemption usage (£3K/year + 1yr carry-forward), small gifts per recipient.

2. Create `server/services/balanceSheetService.ts`:
   - `calculateBalanceSheet(matterId: string, tenantId: string)` — aggregate all assets and liabilities for matter; group by asset class; calculate totals, net worth; flag stale valuations (older than configurable threshold, default 12 months); return `BalanceSheetResult`.
   - `flagStaleValuations(matterId: string, thresholdMonths: number)` — find assets with valuationDate older than threshold; return list with staleness info.

3. Create `server/routes/gifts.ts` — new Express router:
   - `GET /api/matters/:matterId/gifts` — list lifetime gifts
   - `POST /api/matters/:matterId/gifts` — create gift (Zod validation)
   - `PATCH /api/matters/:matterId/gifts/:giftId` — update gift
   - `DELETE /api/matters/:matterId/gifts/:giftId` — delete gift
   - `GET /api/matters/:matterId/gifts/timeline` — query param `referenceDate` → 7-year timeline
   - `GET /api/matters/:matterId/gifts/exemptions` — query param `taxYear` → exemption availability
   - `GET /api/matters/:matterId/balance-sheet` — balance sheet view
   Mount in `server/app.ts`.

4. Extend asset creation to support digital asset classes: update `server/services/matterService.ts` `addAsset()` to handle new asset classes (`digital_asset`, `cryptocurrency`, `intellectual_property`, `domain_name`) and new fields (`digitalAccessMethod`, `volatilityFlag`).

5. Create `tests/gifts-digital-balance.test.ts`:
   - TC-ADD022-01: Create lifetime gift with all fields → 201 + correct record
   - TC-ADD022-02: Gift with invalid exemption type → 400
   - TC-ADD023-01: Timeline shows 3 gifts at years 2, 4, 6 with correct taper bands
   - TC-ADD023-02: Gift at 8 years → excluded from timeline
   - TC-ADD023-03: Cumulative NRB consumption calculated correctly
   - TC-ADD023-04: Projected fall-off dates correct
   - TC-ADD028-01: Create digital asset (cryptocurrency) → 201
   - TC-ADD028-02: Create digital asset (domain_name) → 201
   - TC-ADD028-03: Digital asset with volatilityFlag stored correctly
   - TC-ADD031-01: Digital asset valuation with confidence caveat
   - TC-ADD014-01: Balance sheet returns correct totals by asset class
   - TC-ADD014-02: Balance sheet net worth = assets - liabilities
   - TC-ADD015-01: Stale valuation flagged when >12 months old
   - TC-ADD015-02: Fresh valuation not flagged

**Files to create/modify:**
- `server/services/lifetimeGiftService.ts` — gift register logic
- `server/services/balanceSheetService.ts` — balance sheet aggregation
- `server/routes/gifts.ts` — gift and balance sheet API routes
- `server/services/matterService.ts` — extend addAsset for digital classes
- `server/app.ts` — mount gifts router
- `tests/gifts-digital-balance.test.ts` — test coverage

**Acceptance criteria:**
- Gift CRUD operations work with proper tenant isolation
- 7-year timeline correctly calculates taper bands and cumulative NRB
- Digital asset classes accepted in asset creation
- Balance sheet aggregates all assets/liabilities correctly
- Stale valuations flagged beyond threshold
- All 14 test cases pass

---

## Phase 4: Multi-Jurisdiction Will Coordination & Domicile
**Dependencies:** Phase 1

**Description:**
Implement multi-jurisdiction will register (ADD-054), revocation clause management (ADD-055), cross-jurisdiction asset assignment (ADD-056), and domicile-of-origin tracking with snap-back risk (ADD-064). Can run in parallel with Phases 2 and 3.

**Tasks:**
1. Create `server/services/willCoordinationService.ts`:
   - `addWillRecord(data: CreateWillCoordinationInput)` — create WillCoordination record, validate jurisdiction code, audit log.
   - `getWillRecords(matterId: string, tenantId: string)` — list all will records for matter.
   - `updateWillRecord(willId: string, data: Partial<WillCoordination>)` — update record.
   - `deleteWillRecord(willId: string, tenantId: string)` — delete with audit.
   - `checkRevocationClauseConflicts(matterId: string, newJurisdictionCode: string, revocationClause: string)` — analyze if a new will's revocation clause might revoke wills in other jurisdictions; check for overly broad "I revoke all previous wills" vs jurisdiction-limited "I revoke all previous wills relating to assets in [jurisdiction]"; return { hasConflict, conflictingWills, recommendation }.
   - `getUnassignedAssets(matterId: string, tenantId: string)` — find assets whose situsCountry does not match any will's jurisdictionCode; return list of unassigned assets.
   - `getAssetWillCoverage(matterId: string, tenantId: string)` — for each asset, determine which will(s) claim it based on situs rules; flag assets claimed by multiple wills or no wills; return coverage map.
   - `generateWillCoordinationSummary(matterId: string, tenantId: string)` — aggregate all wills, asset coverage, unassigned assets, conflicts; return `WillCoordinationSummary`.

2. Create `server/services/domicileTrackingService.ts`:
   - `createDomicileRecord(data: CreateDomicileRecordInput)` — create DomicileRecord, audit log.
   - `getDomicileRecords(personId: string, tenantId: string)` — list domicile records.
   - `updateDomicileRecord(recordId: string, data: Partial<DomicileRecord>)` — update.
   - `assessSnapBackRisk(personId: string)` — check if person's domicile of origin differs from domicile of choice AND domicile of choice has weak evidence (short residence, no property, intention unclear); return { snapBackRisk: boolean, reason: string, recommendation: string }. Flag `DOMICILE_SNAPBACK_RISK` issue code.
   - `getDomicileSummary(personId: string, tenantId: string)` — return structured domicile summary for display.

3. Create `server/routes/wills.ts` — new Express router:
   - `GET /api/matters/:matterId/wills` — list will records
   - `POST /api/matters/:matterId/wills` — create will record
   - `PATCH /api/matters/:matterId/wills/:willId` — update
   - `DELETE /api/matters/:matterId/wills/:willId` — delete
   - `GET /api/matters/:matterId/wills/conflicts` — check revocation clause conflicts
   - `GET /api/matters/:matterId/wills/coverage` — asset-to-will coverage map
   - `GET /api/matters/:matterId/wills/unassigned-assets` — unassigned assets list
   - `GET /api/matters/:matterId/wills/summary` — full coordination summary
   - `POST /api/persons/:personId/domicile` — create domicile record
   - `GET /api/persons/:personId/domicile` — get domicile records
   - `PATCH /api/persons/:personId/domicile/:recordId` — update
   - `GET /api/persons/:personId/domicile/snap-back-risk` — assess snap-back risk
   Mount in `server/app.ts`.

4. Extend `server/services/matterService.ts` `addPerson()` and `updatePerson()` to accept and persist `domicileOfOrigin` field on Person model.

5. Integrate will coordination into rule evaluation: extend `server/services/ruleEngine.ts` to add new rule checks:
   - `REVOCATION_CLAUSE_CONFLICT` — if matter has multiple wills and any has broad revocation clause
   - `ASSET_UNASSIGNED_TO_WILL` — if matter has wills but some assets are unassigned
   - `DOMICILE_SNAPBACK_RISK` — if any person has snap-back risk

6. Create `tests/will-coordination-domicile.test.ts`:
   - TC-ADD054-01: Create will record → 201 with correct data
   - TC-ADD054-02: List wills for matter returns all records
   - TC-ADD054-03: Update will status (draft→executed→revoked)
   - TC-ADD055-01: Broad revocation clause "I revoke all previous wills" → conflict detected with existing EW will
   - TC-ADD055-02: Limited revocation clause "I revoke all wills relating to Portugal" → no conflict
   - TC-ADD055-03: No existing wills → no conflict
   - TC-ADD056-01: Asset in EW, will covers EW → assigned
   - TC-ADD056-02: Asset in PT, no PT will → flagged unassigned
   - TC-ADD056-03: Asset in ZA, wills in EW and PT → flagged unassigned
   - TC-ADD056-04: Coverage map shows all assignments correctly
   - TC-ADD064-01: Create domicile record with origin, choice, dependency
   - TC-ADD064-02: Person with Nigerian origin, UK choice, short residence → snap-back risk flagged
   - TC-ADD064-03: Person with UK origin and UK choice → no snap-back risk
   - TC-ADD064-04: Rule engine fires DOMICILE_SNAPBACK_RISK issue

**Files to create/modify:**
- `server/services/willCoordinationService.ts` — will register and coordination logic
- `server/services/domicileTrackingService.ts` — domicile tracking and snap-back risk
- `server/routes/wills.ts` — will coordination and domicile API routes
- `server/services/matterService.ts` — extend person creation/update for domicileOfOrigin
- `server/services/ruleEngine.ts` — add new rule checks
- `server/app.ts` — mount wills router
- `tests/will-coordination-domicile.test.ts` — test coverage

**Acceptance criteria:**
- Will CRUD operations work with tenant isolation
- Revocation clause conflict detection correctly identifies broad vs limited clauses
- Unassigned assets detected when situs doesn't match any will jurisdiction
- Asset coverage map accurate
- Domicile snap-back risk correctly assessed
- Rule engine fires new issue codes
- All 14 test cases pass

---

## Phase 5: Frontend UI Components & i18n
**Dependencies:** Phase 2, Phase 3, Phase 4

**Description:**
Build the React frontend components for all Phase-1 addendum features: IHT calculator panel, gift register, 7-year timeline, digital asset form, balance sheet view, will coordination panel, and domicile tracking. Add i18n translations for all new UI strings across all 4 supported locales (en, fr, pt, es).

**Tasks:**
1. Create `client/src/components/iht/IhtCalculator.tsx` — IHT calculation panel:
   - Form to select person and scenario, trigger calculation via `POST /api/matters/:matterId/iht/calculate`
   - Display results: net estate, NRB used, RNRB (with tapering note), exemptions breakdown, 7-year transfers summary, taxable estate, IHT rate, IHT due
   - "Calculate Household" button for married couples → calls `/iht/household`, shows per-person + combined + second-death projection
   - Use `useMatterContext()`, `useApiMutation()`, existing `<T>` component for labels
   - Follow panel layout pattern from `AssetList.tsx`

2. Create `client/src/components/iht/IhtScenarioComparison.tsx` — scenario comparison:
   - Side-by-side comparison of IHT across scenarios
   - Highlight savings/increases with color coding (green = savings, red = increase)
   - Call `POST /api/matters/:matterId/iht/compare`

3. Create `client/src/components/gifts/GiftRegister.tsx` — gift management:
   - List all lifetime gifts with add/edit/delete
   - GiftForm modal with Zod-validated fields: date, recipient, value, currency, asset type, exemption claimed, PET/CLT classification
   - Use `useFormState(createLifetimeGiftSchema)` pattern

4. Create `client/src/components/gifts/GiftTimeline.tsx` — 7-year visual timeline:
   - Fetch from `GET /api/matters/:matterId/gifts/timeline`
   - Horizontal timeline showing gifts as markers at their year positions (0-7)
   - Color-coded taper bands (red=0-3yr, orange=3-4yr, yellow=4-5yr, green=5-7yr)
   - Show cumulative NRB consumption bar
   - Show projected fall-off dates for each gift
   - CSS in `styles.css` using `.timeline-track`, `.timeline-marker`, `.taper-band` classes

5. Create `client/src/components/assets/DigitalAssetForm.tsx` — extend AssetValuationForm:
   - When assetClass is digital_asset/cryptocurrency/intellectual_property/domain_name, show additional fields: digital access method, volatility flag, platform/exchange name
   - Render confidence caveat for volatile assets

6. Create `client/src/components/assets/BalanceSheet.tsx` — balance sheet view:
   - Fetch from `GET /api/matters/:matterId/balance-sheet`
   - Display: total assets, total liabilities, net worth
   - Breakdown by asset class as table/grid
   - Flag stale valuations with warning icon and date
   - Use `.metric-grid` and `.panel` CSS patterns

7. Create `client/src/components/wills/WillCoordination.tsx` — will register and coordination:
   - List all will records with add/edit/delete
   - Will form modal: jurisdiction, document type, date executed, solicitor/notary, revocation clause, status
   - Asset coverage panel: show which assets are covered by which will, highlight unassigned/multi-claimed
   - Conflict warnings when broad revocation clause detected

8. Create `client/src/components/people/DomicileTracking.tsx` — domicile tracking:
   - Form for domicile of origin, choice, dependency with evidence summary
   - Snap-back risk indicator (warning badge if risk detected)
   - Display current domicile summary

9. Integrate new components into `client/src/App.tsx`:
   - Add "IHT" sub-tab under Front Office → Scenarios section
   - Add "Gifts" sub-tab under Front Office (after Assets)
   - Add "Balance Sheet" view in Assets section
   - Add "Will Coordination" sub-tab under Front Office (after Review)
   - Add domicile tracking to People section
   - Wire up data fetching and refreshWorkspace calls

10. Add i18n translations to all 4 locale files:
    - `client/src/locales/en.ts` — English translations for all new labels, headings, descriptions, tooltips, error messages, status badges
    - `client/src/locales/fr.ts` — French translations
    - `client/src/locales/pt.ts` — Portuguese translations
    - `client/src/locales/es.ts` — Spanish translations
    - Key namespace: `iht.*`, `gifts.*`, `balanceSheet.*`, `willCoordination.*`, `domicile.*`, `digitalAsset.*`

11. Add CSS for new components to `client/src/styles.css`:
    - `.iht-result-card`, `.iht-comparison-grid` — IHT display
    - `.timeline-track`, `.timeline-marker`, `.taper-band-*` — gift timeline
    - `.balance-sheet-grid`, `.stale-warning` — balance sheet
    - `.will-coverage-map`, `.conflict-badge` — will coordination
    - `.snapback-warning` — domicile risk

**Files to create/modify:**
- `client/src/components/iht/IhtCalculator.tsx` — new
- `client/src/components/iht/IhtScenarioComparison.tsx` — new
- `client/src/components/gifts/GiftRegister.tsx` — new
- `client/src/components/gifts/GiftTimeline.tsx` — new
- `client/src/components/assets/DigitalAssetForm.tsx` — new
- `client/src/components/assets/BalanceSheet.tsx` — new
- `client/src/components/wills/WillCoordination.tsx` — new
- `client/src/components/people/DomicileTracking.tsx` — new
- `client/src/App.tsx` — integrate new tabs/panels
- `client/src/locales/en.ts` — English translations
- `client/src/locales/fr.ts` — French translations
- `client/src/locales/pt.ts` — Portuguese translations
- `client/src/locales/es.ts` — Spanish translations
- `client/src/styles.css` — new CSS classes

**Acceptance criteria:**
- All new components render without errors
- IHT calculator shows correct per-person and household results
- Gift timeline visualizes 7-year window with taper bands
- Balance sheet shows correct totals and flags stale valuations
- Will coordination highlights unassigned assets and revocation conflicts
- Domicile snap-back risk shown when applicable
- All text uses `<T k="...">` for i18n
- All 4 locale files have complete translations for new keys
- Bilingual mode renders correctly for all new components
- TypeScript compilation passes

---

## Phase 6: Integration Testing & Build Verification
**Dependencies:** Phase 2, Phase 3, Phase 4, Phase 5

**Description:**
Final integration testing phase. Run end-to-end workflows across all new features, verify cross-feature interactions (IHT engine uses gift register data, will coordination checks asset situs), validate build, and ensure no regressions.

**Tasks:**
1. Create `tests/addendum-integration.test.ts` — end-to-end workflow tests:
   - E2E-ADD-01: Full IHT planning workflow: create matter → add persons (married couple) → add assets → add gifts (PET/CLT) → create scenarios → calculate IHT → compare scenarios → verify second-death projection
   - E2E-ADD-02: Gift register + IHT integration: add 3 lifetime gifts → calculate IHT → verify gifts reduce available NRB → verify taper relief applied
   - E2E-ADD-03: Digital asset workflow: create digital asset (cryptocurrency) → flag volatility → verify in balance sheet → verify in IHT calculation
   - E2E-ADD-04: Will coordination workflow: create EW will → create PT will → add assets in EW, PT, ZA → verify EW/PT assigned, ZA unassigned → broad revocation → conflict flagged
   - E2E-ADD-05: Domicile snap-back: create person with Nigerian origin, UK choice → assess snap-back risk → verify issue code in rule evaluation
   - E2E-ADD-06: Balance sheet + stale valuation: create assets with old valuation dates → verify stale flags → update valuation → verify flag cleared
   - E2E-ADD-07: Cross-feature: multi-jurisdiction matter with gifts, digital assets, multiple wills → IHT calculation includes all asset types → will coordination covers all jurisdictions → rule evaluation fires all applicable issues

2. Add IHT golden-file test data to `tests/iht-calculation.test.ts` (extend Phase 2 tests):
   - Golden-01: Single person, £400K estate, no gifts, no RNRB → IHT = (£400K - £325K) × 40% = £30K
   - Golden-02: Single person, £500K estate, qualifying property to children, RNRB → IHT = (£500K - £325K - £175K) × 40% = £0
   - Golden-03: Married couple, first death uses full NRB, second death full transferable → £0 + IHT on combined at second death
   - Golden-04: Widowed person, full transferable NRB + RNRB → effective £1M nil-rate
   - Golden-05: £2.5M estate with RNRB tapering → RNRB = £0, IHT on (£2.5M - £325K)
   - Golden-06: Charitable estate (15% to charity on baseline) → 36% rate
   - Golden-07: Charitable estate (8% to charity on baseline) → 40% rate (below 10%)
   - Golden-08: 3 PETs at different years → taper relief reduces IHT
   - Golden-09: CLT + PET combination → NRB consumed by CLT, PET fails
   - Golden-10: Annual exemptions (£3K + carry-forward) + small gifts

3. Run full test suite and verify no regressions:
   - `npm test` — all existing + new tests pass
   - `npm run typecheck` — no TypeScript errors
   - `npm run build` — build completes successfully

4. Verify performance:
   - IHT calculation for household (2 persons, 10 assets, 5 gifts) completes in <5s
   - Balance sheet aggregation for 50 assets completes in <2s
   - Gift timeline calculation completes in <1s

**Files to create/modify:**
- `tests/addendum-integration.test.ts` — new integration tests
- `tests/iht-calculation.test.ts` — extend with golden-file data

**Acceptance criteria:**
- All 7 E2E integration tests pass
- All 10 golden-file IHT scenarios produce correct results
- All existing tests pass (no regressions)
- TypeScript compilation clean
- Build completes successfully
- Performance targets met
- AC-IHT-06 satisfied: ≥20 golden-file IHT test scenarios covering single, married, widowed, with/without RNRB, with/without transfers, with/without charity rate
