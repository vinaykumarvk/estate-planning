export type Locale = "en" | "fr" | "pt" | "es";
export type JurisdictionCode = "NG" | "GH" | "ZA" | "KE" | "SN" | "CM" | "MZ" | "AO" | "EW" | "PT";
export type ProductMode = "planning" | "administration" | "fiduciary" | "configuration-studio";
export type MatterStatus = "draft" | "intake" | "review" | "execution" | "closed";
export type Severity = "info" | "warning" | "blocker";
export type ReviewStatus = "not_required" | "required" | "pending" | "approved" | "changes_requested";
export type ReleaseGateStatus = "pass" | "fail" | "blocked" | "not_checked";

export interface IntakeScore {
  totalModules: number;
  completeModules: number;
  score: number;
  missingCritical: string[];
}

export interface RuleIssue {
  code: string;
  severity: Severity;
  message: string;
  ruleCode: string;
  sourceCode: string;
  professionalReview: boolean;
}

export interface RuleEvaluationSummary {
  matterId: string;
  packId: string;
  packVersion: string;
  issues: RuleIssue[];
  blocked: boolean;
  reviewRequired: boolean;
}

export interface ConflictMemoResult {
  memoId: string;
  matterId: string;
  applicableLawSummary: string;
  requiredEvidence: string[];
  proceduralSteps: string[];
  riskAreas: string[];
  reviewStatus: ReviewStatus;
}

export interface DocumentDraftResult {
  documentId: string;
  title: string;
  status: string;
  reviewStatus: ReviewStatus;
  executionStatus: string;
  hash: string;
  content: string;
}

export interface AiEvaluationInput {
  packId: string;
  locale: Locale;
  modelVersion: string;
  promptSetVersion: string;
  groundingRate: number;
  citationAccuracy: number;
  escalationRate: number;
  hallucinatedCitationRate: number;
  languageParityGap: number;
  redTeamRefusalRate: number;
  sensitiveLeakEvents: number;
  sourceStaleRate: number;
  signedOffBy?: string[];
}

export interface AiEvaluationVerdict {
  status: ReleaseGateStatus;
  failures: string[];
}

export interface ExportBundle {
  matterId: string;
  generatedAt: string;
  matter: unknown;
  people: unknown[];
  assets: unknown[];
  scenarios: unknown[];
  documents: unknown[];
  auditEvents: unknown[];
  configurationSnapshot: unknown;
}

// --- Hague 1961 Formal Validity (G-005 CL-003) ---
export interface FormalValidityRoute {
  basis: "place_of_execution" | "nationality" | "domicile" | "habitual_residence";
  country: string;
  satisfied: boolean;
  reasoning: string;
}

export interface HagueValidityResult {
  matterId: string;
  formallyValid: boolean;
  routes: FormalValidityRoute[];
}

// --- EU 650/2012 (G-013 CL-002) ---
export type MemberStateStatus = "participating" | "non_participating" | "denmark_exception";

export interface EU650Result {
  matterId: string;
  defaultApplicableLaw: string;
  professioJurisElected: boolean;
  excludedAssets: string[];
  memberStateStatus: Record<string, MemberStateStatus>;
}

// --- Intake Workflow (G-012 FR-005) ---
export type IntakeModule =
  | "jurisdiction"
  | "client_profile"
  | "connecting_factors"
  | "relationships"
  | "assets"
  | "planning_scenario"
  | "privacy_consent"
  | "professional_disclaimer";

export type IntakeStepStatus = "complete" | "incomplete" | "not_started";

export interface IntakeWorkflowState {
  matterId: string;
  currentModule: IntakeModule;
  modules: Array<{
    name: IntakeModule;
    status: IntakeStepStatus;
    validationErrors: string[];
  }>;
}

// --- DSR (G-016 CR-010) ---
export interface DsrAccessBundle {
  dsrId: string;
  personId: string;
  exportedAt: string;
  data: {
    person: unknown;
    matters: unknown[];
    consents: unknown[];
    auditEvents: unknown[];
  };
}

export interface DsrDeletionResult {
  dsrId: string;
  personId: string;
  anonymizedFields: string[];
  legalHoldPrevented: boolean;
}

// --- Scenario Comparison (G-022 FR-021) ---
export interface ScenarioDiff {
  matterId: string;
  scenarioA: { id: string; name: string };
  scenarioB: { id: string; name: string };
  differences: Array<{
    field: string;
    scenarioAValue: unknown;
    scenarioBValue: unknown;
  }>;
}

// --- Signing Ceremony (G-024 FR-030) ---
export type SigningCeremonyStatus = "scheduled" | "in_progress" | "witnessed" | "completed" | "cancelled";

// --- Matrimonial Property (G-033 CS-008) ---
export interface MatrimonialRegimeResult {
  matterId: string;
  jurisdictionCode: string;
  regime: string;
  description: string;
  risks: string[];
}

// --- IHT Calculation (ADD-001 to ADD-010) ---
export interface IhtThresholds {
  nrb: number;
  rnrb: number;
  rnrbTaperThreshold: number;
  standardRate: number;
  charitableRate: number;
  annualExemption: number;
  smallGiftLimit: number;
  effectiveDate: Date;
}

export interface IhtExemptionBreakdown {
  spouse: number;
  annual: number;
  smallGifts: number;
  normalExpenditure: number;
  charity: number;
  total: number;
}

export interface IhtCalculationResult {
  id: string;
  matterId: string;
  personId: string;
  scenarioId: string;
  netEstate: number;
  nrb: number;
  nrbUsed: number;
  rnrb: number;
  rnrbTapering: number;
  transferableNrb: number;
  transferableRnrb: number;
  charitableRate: boolean;
  taxableEstate: number;
  ihtDue: number;
  exemptionsApplied: IhtExemptionBreakdown;
  taperRelief: number;
  effectiveDate: Date;
}

export interface IhtHouseholdResult {
  matterId: string;
  scenarioId: string;
  persons: IhtCalculationResult[];
  combinedIht: number;
  secondDeathProjection: {
    survivorPersonId: string;
    projectedNetEstate: number;
    transferableNrbPercent: number;
    transferableRnrbPercent: number;
    projectedIht: number;
    totalFamilyIht: number;
  } | null;
}

export interface IhtScenarioComparison {
  matterId: string;
  scenarios: Array<{
    scenarioId: string;
    scenarioName: string;
    householdIht: number;
    secondDeathIht: number;
    totalFamilyIht: number;
  }>;
  bestScenarioId: string;
  maxSavings: number;
}

// --- Lifetime Gift Register (ADD-022, ADD-023) ---
export type GiftExemption = "annual" | "small_gift" | "normal_expenditure" | "marriage" | "charity" | "spouse" | "none";
export type GiftClassification = "pet" | "clt" | "exempt";
export type TaperBand = "0-3" | "3-4" | "4-5" | "5-6" | "6-7" | "7+";

export interface LifetimeGiftRecord {
  id: string;
  matterId: string;
  donorPersonId: string;
  recipientPersonId: string | null;
  giftDate: Date;
  value: number;
  currency: string;
  assetType: string;
  relationship: string;
  exemptionClaimed: GiftExemption;
  petOrClt: GiftClassification;
  description: string;
  taperBand: TaperBand | null;
  yearsElapsed: number | null;
}

export interface GiftTimelineResult {
  matterId: string;
  referenceDate: Date;
  gifts: Array<LifetimeGiftRecord & {
    taperReliefPercent: number;
    projectedFallOffDate: Date;
    nrbImpact: number;
  }>;
  cumulativeTotal: number;
  nrbRemaining: number;
}

// --- Core Estate Planning Remediation ---
export type EstatePlanningRecordType =
  | "income_record"
  | "expense_record"
  | "protection_policy"
  | "outside_estate_asset"
  | "pension_nomination"
  | "life_assurance_trust"
  | "trust_structure"
  | "deed_of_variation"
  | "gift_received"
  | "grob_assessment"
  | "incapacity_instrument"
  | "dta_position"
  | "professional_referral";

export type EstatePlanningRecordStatus = "active" | "inactive" | "superseded" | "archived";
export type EstatePlanningReviewStatus = "pending" | "reviewed" | "accepted" | "action_required";
export type EstateRequirementStatus = "met" | "partial" | "gap" | "not_applicable";
export type EstateRequirementSeverity = "info" | "warning" | "blocker";
export type EstatePlanningDocumentType =
  | "estate_planning_summary"
  | "protection_review_letter"
  | "incapacity_instruction"
  | "trust_memo"
  | "deed_of_variation_instruction"
  | "cross_border_tax_note";

export interface EstatePlanningRecordDto {
  id: string;
  matterId: string;
  personId: string | null;
  recordType: EstatePlanningRecordType;
  title: string;
  status: EstatePlanningRecordStatus;
  reviewStatus: EstatePlanningReviewStatus;
  payload: Record<string, unknown>;
  evidenceRefs: string[];
  effectiveDate: Date | null;
  createdAt: Date;
  updatedAt: Date;
}

export interface CashFlowSummary {
  annualIncome: number;
  annualExpenses: number;
  annualSurplus: number;
  normalExpenditureGiftTotal: number;
  normalExpenditureCapacity: number;
  evidenceGaps: string[];
}

export interface LiquiditySummary {
  liquidAssets: number;
  liabilities: number;
  latestIhtDue: number;
  availableProtectionCover: number;
  fundingGap: number;
  liquidAssetCoveragePct: number;
}

export interface ProtectionSummary {
  totalCover: number;
  coverInTrust: number;
  coverOutsideEstate: number;
  policiesMissingTrust: number;
  protectionGap: number;
}

export interface CrossBorderTaxSummary {
  countries: string[];
  dtaPositions: Array<{ countryA: string; countryB: string; reliefType: string; status: string }>;
  unresolvedPairs: string[];
}

export interface QuickSuccessionReliefResult {
  reliefRate: number;
  reliefAmount: number;
  yearsSinceFirstDeath: number;
}

export interface GrobRiskAssessmentResult {
  risk: "low" | "medium" | "high";
  includedValue: number;
  reasons: string[];
}

export interface EstateRequirementFit {
  code: string;
  area: string;
  requirement: string;
  status: EstateRequirementStatus;
  severity: EstateRequirementSeverity;
  evidence: string[];
  gap: string | null;
  recommendedAction: string | null;
}

export interface EstatePlanningReview {
  matterId: string;
  generatedAt: Date;
  fitmentPercent: number;
  applicableRequirementCount: number;
  metRequirementCount: number;
  partialRequirementCount: number;
  gapRequirementCount: number;
  blockerCount: number;
  summaries: {
    cashFlow: CashFlowSummary;
    liquidity: LiquiditySummary;
    protection: ProtectionSummary;
    crossBorderTax: CrossBorderTaxSummary;
  };
  requirements: EstateRequirementFit[];
  records: EstatePlanningRecordDto[];
}

// --- Balance Sheet (ADD-014) ---
export interface AssetClassSummary {
  assetClass: string;
  count: number;
  totalValue: number;
  currency: string;
}

export interface BalanceSheetResult {
  matterId: string;
  totalAssets: number;
  totalLiabilities: number;
  netWorth: number;
  byAssetClass: AssetClassSummary[];
  staleValuations: Array<{
    assetId: string;
    description: string;
    valuationDate: Date;
    monthsStale: number;
  }>;
}

// --- Will Coordination (ADD-054 to ADD-056) ---
export type WillStatus = "draft" | "executed" | "revoked" | "superseded";

export interface WillCoordinationRecord {
  id: string;
  matterId: string;
  jurisdictionCode: string;
  documentType: string;
  documentId: string | null;
  dateExecuted: Date | null;
  solicitorNotary: string | null;
  status: WillStatus;
  revocationClause: string | null;
  assetIds: string[];
  notes: string | null;
}

export interface RevocationConflict {
  willId: string;
  jurisdictionCode: string;
  conflictingWillIds: string[];
  reason: string;
}

export interface WillCoordinationSummary {
  matterId: string;
  wills: WillCoordinationRecord[];
  unassignedAssets: Array<{ assetId: string; description: string; situsCountry: string }>;
  potentialConflicts: RevocationConflict[];
  assetCoverage: Array<{ assetId: string; coveredByWillIds: string[] }>;
}

// --- Domicile Tracking (ADD-064) ---
export interface DomicileRecord {
  id: string;
  personId: string;
  domicileOfOrigin: string | null;
  domicileOfChoice: string | null;
  domicileOfDependency: string | null;
  dateEstablished: Date | null;
  evidenceSummary: string | null;
  snapBackRisk: boolean;
  snapBackReason: string | null;
}

export interface SnapBackRiskAssessment {
  personId: string;
  snapBackRisk: boolean;
  reason: string;
  recommendation: string;
}

// --- Faraid (Islamic Inheritance) ---
export type FaraidHeirType =
  | "husband" | "wife" | "son" | "daughter"
  | "father" | "mother" | "grandfather" | "grandmother"
  | "full_brother" | "full_sister"
  | "paternal_brother" | "paternal_sister"
  | "maternal_brother" | "maternal_sister"
  | "grandson" | "granddaughter"
  | "paternal_uncle";

export interface FaraidHeirInput {
  heirType: FaraidHeirType;
  name: string;
  personId?: string;
  count?: number;
}

export interface FaraidHeirShare {
  heirType: FaraidHeirType;
  name: string;
  personId?: string;
  quranicFraction: string;
  percentage: number;
  amount: number;
  blocked: boolean;
  blockReason?: string;
}

export interface FaraidCalculationResult {
  id: string;
  matterId: string;
  deceasedPersonId: string;
  netEstate: number;
  currency: string;
  method: "standard" | "awl" | "radd";
  heirs: FaraidHeirShare[];
  totalAllocated: number;
  totalPercentage: number;
}

export interface StatutoryComparisonResult {
  heirType: FaraidHeirType;
  name: string;
  faraidShare: number;
  faraidPercent: number;
  statutoryShare: number;
  statutoryPercent: number;
  difference: number;
}

// --- Client Goals ---
export type GoalCategory =
  | "minimize_iht" | "protect_family_home" | "provide_for_dependants"
  | "cross_border_coordination" | "islamic_compliance" | "business_succession"
  | "charitable_giving" | "asset_protection" | "tax_efficiency";

export type GoalPriority = "high" | "medium" | "low";
export type GoalStatus = "pending" | "addressed" | "partially_addressed";

export interface ClientGoalRecord {
  id: string;
  matterId: string;
  goalText: string;
  category: GoalCategory;
  priority: GoalPriority;
  status: GoalStatus;
  linkedScenarioIds: string[];
  notes: string | null;
}

export interface GoalGapAnalysis {
  totalGoals: number;
  addressedCount: number;
  unaddressedCount: number;
  completionPercent: number;
  gaps: Array<{
    goalId: string;
    goalText: string;
    category: GoalCategory;
    reason: string;
  }>;
}
