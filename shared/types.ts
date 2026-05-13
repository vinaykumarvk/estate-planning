export type Locale = "en-GB" | "pt-PT";
export type JurisdictionCode = "EW" | "PT";
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
