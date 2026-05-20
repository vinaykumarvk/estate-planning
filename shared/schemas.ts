import { z } from "zod";
import { PHASE_1_JURISDICTIONS, SUPPORTED_LOCALES } from "./constants";

export const jurisdictionCodeSchema = z.enum(PHASE_1_JURISDICTIONS);
export const localeSchema = z.enum(SUPPORTED_LOCALES);

export const createMatterSchema = z.object({
  tenantId: z.string().min(1),
  title: z.string().min(3),
  primaryJurisdictionCode: jurisdictionCodeSchema,
  additionalJurisdictions: z.array(jurisdictionCodeSchema).default([]),
  languageOfRecord: localeSchema.default("en"),
  createdByUserId: z.string().min(1),
  jointMatter: z.boolean().default(false)
});

export const createPersonSchema = z.object({
  tenantId: z.string().min(1),
  matterId: z.string().min(1).optional(),
  legalName: z.string().min(2),
  preferredName: z.string().optional(),
  dateOfBirth: z.coerce.date().optional(),
  email: z.string().email().optional(),
  nationality: z.string().optional(),
  residenceCountry: z.string().optional(),
  domicileCountry: z.string().optional(),
  habitualResidence: z.string().optional(),
  taxResidency: z.string().optional(),
  maritalStatus: z.string().optional(),
  domicileOfOrigin: z.string().optional(),
  preferredLanguage: localeSchema.default("en")
});

export const createAssetSchema = z.object({
  tenantId: z.string().min(1),
  matterId: z.string().min(1),
  ownerPersonId: z.string().optional(),
  assetClass: z.enum(["real_estate", "bank_account", "securities", "pension", "insurance", "debt", "other", "digital_asset", "cryptocurrency", "intellectual_property", "domain_name"]),
  description: z.string().min(2),
  jurisdictionCode: jurisdictionCodeSchema.optional(),
  situsCountry: z.string().min(2),
  currency: z.string().min(3).max(3),
  valuation: z.number().nonnegative(),
  valuationDate: z.coerce.date(),
  valuationSource: z.string().min(2),
  confidenceLevel: z.enum(["low", "medium", "high"]),
  ownershipType: z.enum(["sole", "joint_tenancy", "tenancy_in_common", "beneficial"]),
  ownershipShare: z.number().min(0).max(100).default(100),
  todPod: z.boolean().default(false),
  dynamicFields: z.string().default("{}"),
  taxonomyCode: z.string().optional(),
  evidenceRefs: z.array(z.string()).default([]),
  digitalAccessMethod: z.string().optional(),
  volatilityFlag: z.boolean().default(false),
});

export const createScenarioSchema = z.object({
  tenantId: z.string().min(1),
  matterId: z.string().min(1),
  name: z.string().min(2),
  comparisonBase: z.boolean().default(false)
});

export const createDispositionSchema = z.object({
  tenantId: z.string().min(1),
  matterId: z.string().min(1),
  scenarioId: z.string().min(1),
  giftType: z.enum(["specific", "cash", "percentage", "residue", "class", "charitable"]),
  beneficiaryPersonId: z.string().optional(),
  beneficiaryLabel: z.string().min(2),
  assetId: z.string().optional(),
  amount: z.number().optional(),
  percentage: z.number().min(0).max(100).optional(),
  currency: z.string().min(3).max(3).optional(),
  conditions: z.string().optional(),
  survivorshipDays: z.number().int().nonnegative().optional(),
  perStirpes: z.boolean().default(false),
  perCapita: z.boolean().default(false),
  executorPersonId: z.string().optional(),
  guardianPersonId: z.string().optional(),
  fiduciaryRole: z.string().optional(),
  giftDate: z.coerce.date().optional(),
  lifetimeGift: z.boolean().default(false)
});

// --- Additional CRUD schemas ---

export const createLiabilitySchema = z.object({
  tenantId: z.string().min(1),
  matterId: z.string().min(1),
  liabilityType: z.string().min(2),
  description: z.string().min(2),
  creditor: z.string().optional(),
  currency: z.string().min(3).max(3),
  amount: z.number().nonnegative(),
  dueDate: z.coerce.date().optional(),
  evidenceRefs: z.array(z.string()).default([])
});

export const updateLiabilitySchema = createLiabilitySchema.partial().omit({ tenantId: true, matterId: true });

export const createTaskSchema = z.object({
  tenantId: z.string().min(1),
  matterId: z.string().optional(),
  workflowNodeId: z.string().optional(),
  title: z.string().min(2),
  description: z.string().optional(),
  ownerRole: z.string().min(1),
  assigneeUserId: z.string().optional(),
  status: z.enum(["pending", "in_progress", "completed", "cancelled"]).default("pending"),
  dueAt: z.coerce.date().optional(),
  sourceRuleCode: z.string().optional()
});

export const updateTaskSchema = createTaskSchema.partial().omit({ tenantId: true });

export const createInvitationSchema = z.object({
  tenantId: z.string().min(1),
  matterId: z.string().min(1),
  inviteeEmail: z.string().email(),
  role: z.string().min(1),
  scopes: z.array(z.string()).default([]),
  expiresAt: z.coerce.date()
});

export const createMessageSchema = z.object({
  tenantId: z.string().min(1),
  matterId: z.string().min(1),
  senderUserId: z.string().min(1),
  body: z.string().min(1),
  locale: localeSchema.default("en"),
  sensitivity: z.enum(["confidential", "restricted", "public"]).default("confidential")
});

export const createNotificationSchema = z.object({
  tenantId: z.string().min(1),
  matterId: z.string().optional(),
  recipientUserId: z.string().optional(),
  channel: z.enum(["email", "in_app", "sms"]),
  subject: z.string().min(1),
  body: z.string().min(1),
  status: z.enum(["pending", "sent", "failed"]).default("pending"),
  scheduledAt: z.coerce.date().optional()
});

export const createReviewCommentSchema = z.object({
  reviewId: z.string().min(1),
  authorUserId: z.string().min(1),
  commentType: z.enum(["general", "issue", "suggestion", "approval"]),
  body: z.string().min(1)
});

export const createRelationshipSchema = z.object({
  tenantId: z.string().min(1),
  matterId: z.string().min(1),
  fromPersonId: z.string().min(1),
  toPersonId: z.string().min(1),
  relationshipType: z.string().min(1),
  legalStatus: z.string().min(1),
  biological: z.boolean().default(false),
  adoptive: z.boolean().default(false),
  stepRelationship: z.boolean().default(false),
  dependent: z.boolean().default(false),
  minor: z.boolean().default(false),
  incapacitated: z.boolean().default(false)
});

export const paginationSchema = z.object({
  page: z.coerce.number().int().min(1).default(1),
  pageSize: z.coerce.number().int().min(1).max(100).default(20)
});

export const aiEvaluationSchema = z.object({
  packId: z.string().min(1),
  locale: localeSchema,
  modelVersion: z.string().min(1),
  promptSetVersion: z.string().min(1),
  groundingRate: z.number().min(0).max(100),
  citationAccuracy: z.number().min(0).max(100),
  escalationRate: z.number().min(0).max(100),
  hallucinatedCitationRate: z.number().min(0).max(100),
  languageParityGap: z.number().min(0).max(100),
  redTeamRefusalRate: z.number().min(0).max(100),
  sensitiveLeakEvents: z.number().int().min(0),
  sourceStaleRate: z.number().min(0).max(100),
  signedOffBy: z.array(z.string()).default([])
});

// --- G-011 Admin Jurisdiction ---
export const updateTenantJurisdictionsSchema = z.object({
  tenantId: z.string().min(1),
  jurisdictionCodes: z.array(jurisdictionCodeSchema).min(1),
  actorUserId: z.string().min(1)
});

export const toggleJurisdictionSchema = z.object({
  tenantId: z.string().min(1),
  jurisdictionCode: jurisdictionCodeSchema,
  enabled: z.boolean(),
  actorUserId: z.string().min(1)
});

// --- G-012 Intake Workflow ---
export const intakeModuleSchema = z.enum([
  "jurisdiction",
  "client_profile",
  "connecting_factors",
  "relationships",
  "assets",
  "planning_scenario",
  "privacy_consent",
  "professional_disclaimer"
]);

export const advanceIntakeSchema = z.object({
  matterId: z.string().min(1),
  currentModule: intakeModuleSchema
});

// --- G-016 DSR ---
export const createDsrSchema = z.object({
  tenantId: z.string().min(1),
  personId: z.string().min(1),
  requestType: z.enum(["access", "deletion", "rectification", "portability"]),
  legalBasis: z.string().min(1)
});

// --- G-007 Service Packages ---
export const createServicePackageSchema = z.object({
  tenantId: z.string().min(1),
  packageCode: z.string().min(2),
  name: z.string().min(2),
  jurisdictionCodes: z.array(jurisdictionCodeSchema).min(1),
  priceCurrency: z.string().min(3).max(3),
  priceAmount: z.number().nonnegative(),
  includedDocTypes: z.array(z.string()).min(1),
  status: z.enum(["active", "inactive", "draft"]).default("draft")
});

export const updateServicePackageSchema = createServicePackageSchema.partial().omit({ tenantId: true });

// --- G-026 Notification Templates ---
export const createNotificationTemplateSchema = z.object({
  tenantId: z.string().optional(),
  packId: z.string().optional(),
  templateCode: z.string().min(2),
  locale: localeSchema,
  channel: z.enum(["email", "in_app", "sms"]),
  subject: z.string().min(1),
  body: z.string().min(1),
  status: z.enum(["draft", "approved", "archived"]).default("draft")
});

export const updateNotificationTemplateSchema = createNotificationTemplateSchema.partial();

// --- G-024 Signing Ceremony ---
export const signingTransitionSchema = z.object({
  eventId: z.string().min(1),
  targetStatus: z.enum(["in_progress", "witnessed", "completed", "cancelled"]),
  actorUserId: z.string().min(1)
});

export const witnessCaptureSchema = z.object({
  eventId: z.string().min(1),
  witnessName: z.string().min(2),
  witnessAddress: z.string().min(5),
  witnessOccupation: z.string().optional(),
  actorUserId: z.string().min(1)
});

export const revokeDocumentSchema = z.object({
  documentId: z.string().min(1),
  reason: z.string().min(3),
  actorUserId: z.string().min(1)
});

// --- G-019 Asset Taxonomy ---
export const createAssetTaxonomySchema = z.object({
  jurisdictionCode: jurisdictionCodeSchema,
  assetClass: z.string().min(2),
  fieldDefinitions: z.array(z.object({
    fieldName: z.string().min(1),
    fieldType: z.enum(["string", "number", "boolean", "date"]),
    required: z.boolean().default(false),
    label: z.string().min(1)
  })).default([]),
  status: z.enum(["active", "inactive"]).default("active")
});

// --- G-027 Webhooks ---
export const createWebhookSchema = z.object({
  tenantId: z.string().min(1),
  url: z.string().url(),
  events: z.array(z.string().min(1)).min(1),
  secret: z.string().min(16),
  status: z.enum(["active", "inactive"]).default("active")
});

// --- ADD-022 Lifetime Gift Register ---
export const createLifetimeGiftSchema = z.object({
  tenantId: z.string().min(1),
  matterId: z.string().min(1),
  donorPersonId: z.string().min(1),
  recipientPersonId: z.string().optional(),
  giftDate: z.coerce.date(),
  value: z.number().nonnegative(),
  currency: z.string().min(3).max(3),
  assetType: z.string().min(1),
  relationship: z.string().min(1),
  exemptionClaimed: z.enum(["annual", "small_gift", "normal_expenditure", "marriage", "charity", "spouse", "none"]).default("none"),
  petOrClt: z.enum(["pet", "clt", "exempt"]).default("pet"),
  description: z.string().min(2),
  evidenceRefs: z.array(z.string()).default([])
});

export const updateLifetimeGiftSchema = createLifetimeGiftSchema.partial().omit({ tenantId: true, matterId: true });

// --- Core Estate Planning Remediation Records ---
export const estatePlanningRecordTypeSchema = z.enum([
  "income_record",
  "expense_record",
  "protection_policy",
  "outside_estate_asset",
  "pension_nomination",
  "life_assurance_trust",
  "trust_structure",
  "deed_of_variation",
  "gift_received",
  "grob_assessment",
  "incapacity_instrument",
  "dta_position",
  "professional_referral"
]);

export const createEstatePlanningRecordSchema = z.object({
  tenantId: z.string().min(1),
  matterId: z.string().min(1),
  personId: z.string().min(1).optional(),
  recordType: estatePlanningRecordTypeSchema,
  title: z.string().min(2),
  status: z.enum(["active", "inactive", "superseded", "archived"]).default("active"),
  reviewStatus: z.enum(["pending", "reviewed", "accepted", "action_required"]).default("pending"),
  payload: z.record(z.unknown()).default({}),
  evidenceRefs: z.array(z.string()).default([]),
  effectiveDate: z.coerce.date().optional()
});

export const updateEstatePlanningRecordSchema = createEstatePlanningRecordSchema
  .partial()
  .omit({ tenantId: true, matterId: true });

const estateReviewStatusSchema = z.enum(["pending", "reviewed", "accepted", "action_required"]);
const estateRecordStatusSchema = z.enum(["active", "inactive", "superseded", "archived"]);
const estateFrequencySchema = z.enum(["weekly", "monthly", "quarterly", "annual", "one_off"]);

export const createEstateCashFlowItemSchema = z.object({
  tenantId: z.string().min(1),
  matterId: z.string().min(1),
  personId: z.string().min(1).optional(),
  itemType: z.enum(["income", "expense"]),
  category: z.string().min(2),
  description: z.string().min(2),
  amount: z.number().nonnegative(),
  currency: z.string().min(3).max(3),
  frequency: estateFrequencySchema.default("annual"),
  startDate: z.coerce.date().optional(),
  endDate: z.coerce.date().optional(),
  evidenceRefs: z.array(z.string()).default([]),
  reviewStatus: estateReviewStatusSchema.default("pending"),
  status: estateRecordStatusSchema.default("active")
});

export const updateEstateCashFlowItemSchema = createEstateCashFlowItemSchema.partial().omit({ tenantId: true, matterId: true });

export const createProtectionPolicySchema = z.object({
  tenantId: z.string().min(1),
  matterId: z.string().min(1),
  personId: z.string().min(1).optional(),
  policyType: z.string().min(2),
  carrier: z.string().min(2),
  policyRef: z.string().optional(),
  coverAmount: z.number().nonnegative(),
  currency: z.string().min(3).max(3),
  ownerPersonId: z.string().optional(),
  lifeAssuredPersonId: z.string().optional(),
  beneficiaryLabel: z.string().optional(),
  inTrust: z.boolean().default(false),
  outsideEstate: z.boolean().default(false),
  premiumAmount: z.number().nonnegative().optional(),
  premiumFrequency: estateFrequencySchema.optional(),
  evidenceRefs: z.array(z.string()).default([]),
  reviewStatus: estateReviewStatusSchema.default("pending"),
  status: estateRecordStatusSchema.default("active")
});

export const updateProtectionPolicySchema = createProtectionPolicySchema.partial().omit({ tenantId: true, matterId: true });

export const createEstateTrustStructureSchema = z.object({
  tenantId: z.string().min(1),
  matterId: z.string().min(1),
  name: z.string().min(2),
  trustType: z.string().min(2),
  taxTreatment: z.string().min(2),
  jurisdictionCode: z.string().min(2).optional(),
  settledByPersonId: z.string().optional(),
  trusteePersonIds: z.array(z.string()).default([]),
  beneficiaryPersonIds: z.array(z.string()).default([]),
  linkedAssetIds: z.array(z.string()).default([]),
  scenarioId: z.string().optional(),
  evidenceRefs: z.array(z.string()).default([]),
  reviewStatus: estateReviewStatusSchema.default("pending"),
  status: estateRecordStatusSchema.default("active")
});

export const updateEstateTrustStructureSchema = createEstateTrustStructureSchema.partial().omit({ tenantId: true, matterId: true });

export const createIncapacityInstrumentSchema = z.object({
  tenantId: z.string().min(1),
  matterId: z.string().min(1),
  personId: z.string().min(1),
  instrumentType: z.enum(["property_financial", "health_welfare", "advance_decision", "enduring_power", "other"]),
  jurisdictionCode: z.string().min(2),
  attorneyPersonIds: z.array(z.string()).default([]),
  substituteAttorneyPersonIds: z.array(z.string()).default([]),
  executionStatus: z.enum(["draft", "signed", "registered", "revoked", "superseded"]),
  registeredAt: z.coerce.date().optional(),
  effectiveDate: z.coerce.date().optional(),
  evidenceRefs: z.array(z.string()).default([]),
  reviewStatus: estateReviewStatusSchema.default("pending"),
  status: estateRecordStatusSchema.default("active")
});

export const updateIncapacityInstrumentSchema = createIncapacityInstrumentSchema.partial().omit({ tenantId: true, matterId: true });

export const createCrossBorderTaxPositionSchema = z.object({
  tenantId: z.string().min(1),
  matterId: z.string().min(1),
  countryA: z.string().min(2),
  countryB: z.string().min(2),
  reliefType: z.string().min(2),
  treatyStatus: z.enum(["confirmed", "reviewed", "no_treaty", "unknown", "pending"]),
  noDtaWarning: z.boolean().default(false),
  notes: z.string().optional(),
  evidenceRefs: z.array(z.string()).default([]),
  reviewStatus: estateReviewStatusSchema.default("pending"),
  status: estateRecordStatusSchema.default("active")
});

export const updateCrossBorderTaxPositionSchema = createCrossBorderTaxPositionSchema.partial().omit({ tenantId: true, matterId: true });

export const createEstateReliefAssessmentSchema = z.object({
  tenantId: z.string().min(1),
  matterId: z.string().min(1),
  personId: z.string().min(1).optional(),
  reliefType: z.enum(["grob_assessment", "deed_of_variation", "gift_received", "quick_succession_relief"]),
  subject: z.string().min(2),
  eventDate: z.coerce.date().optional(),
  relevantValue: z.number().nonnegative(),
  currency: z.string().min(3).max(3),
  deadlineDate: z.coerce.date().optional(),
  riskLevel: z.enum(["low", "medium", "high"]).default("medium"),
  assessmentSummary: z.string().min(2),
  payload: z.record(z.unknown()).default({}),
  evidenceRefs: z.array(z.string()).default([]),
  reviewStatus: estateReviewStatusSchema.default("pending"),
  status: estateRecordStatusSchema.default("active")
});

export const updateEstateReliefAssessmentSchema = createEstateReliefAssessmentSchema.partial().omit({ tenantId: true, matterId: true });

export const createOutsideEstateNominationSchema = z.object({
  tenantId: z.string().min(1),
  matterId: z.string().min(1),
  personId: z.string().min(1).optional(),
  assetId: z.string().optional(),
  nominationType: z.enum(["pension_nomination", "life_assurance_nomination", "tod_pod", "joint_survivorship", "other"]),
  provider: z.string().optional(),
  beneficiaryLabel: z.string().min(2),
  beneficiaryPersonId: z.string().optional(),
  nominationDate: z.coerce.date().optional(),
  passesOutsideEstate: z.boolean().default(true),
  evidenceRefs: z.array(z.string()).default([]),
  reviewStatus: estateReviewStatusSchema.default("pending"),
  status: estateRecordStatusSchema.default("active")
});

export const updateOutsideEstateNominationSchema = createOutsideEstateNominationSchema.partial().omit({ tenantId: true, matterId: true });

export const estatePlanningDocumentTypeSchema = z.enum([
  "estate_planning_summary",
  "protection_review_letter",
  "incapacity_instruction",
  "trust_memo",
  "deed_of_variation_instruction",
  "cross_border_tax_note"
]);

export const generateEstatePlanningDocumentSchema = z.object({
  documentType: estatePlanningDocumentTypeSchema,
  locale: localeSchema.optional()
});

export const quickSuccessionReliefSchema = z.object({
  inheritedValue: z.number().nonnegative(),
  firstDeathTaxPaid: z.number().nonnegative(),
  yearsSinceFirstDeath: z.number().min(0),
  currentIhtAttributable: z.number().nonnegative().optional()
});

export const grobAssessmentSchema = z.object({
  giftValue: z.number().nonnegative(),
  retainedBenefit: z.boolean(),
  fullMarketRentPaid: z.boolean().default(false),
  benefitCeasedDate: z.coerce.date().optional(),
  evidenceRefs: z.array(z.string()).default([])
});

// --- ADD-001 IHT Calculation ---
export const createIhtCalculationSchema = z.object({
  tenantId: z.string().min(1),
  matterId: z.string().min(1),
  personId: z.string().min(1),
  scenarioId: z.string().min(1),
  effectiveDate: z.coerce.date()
});

// --- ADD-054 Will Coordination ---
export const createWillCoordinationSchema = z.object({
  tenantId: z.string().min(1),
  matterId: z.string().min(1),
  jurisdictionCode: z.string().min(2),
  documentType: z.string().min(2),
  documentId: z.string().optional(),
  dateExecuted: z.coerce.date().optional(),
  solicitorNotary: z.string().optional(),
  status: z.enum(["draft", "executed", "revoked", "superseded"]).default("draft"),
  revocationClause: z.string().optional(),
  assetIds: z.array(z.string()).default([]),
  notes: z.string().optional()
});

export const updateWillCoordinationSchema = createWillCoordinationSchema.partial().omit({ tenantId: true, matterId: true });

// --- ADD-064 Domicile Record ---
export const createDomicileRecordSchema = z.object({
  tenantId: z.string().min(1),
  personId: z.string().min(1),
  domicileOfOrigin: z.string().optional(),
  domicileOfChoice: z.string().optional(),
  domicileOfDependency: z.string().optional(),
  dateEstablished: z.coerce.date().optional(),
  evidenceSummary: z.string().optional()
});

export const updateDomicileRecordSchema = createDomicileRecordSchema.partial().omit({ tenantId: true, personId: true });

// --- Faraid (Islamic Inheritance) ---
export const faraidHeirTypeSchema = z.enum([
  "husband", "wife", "son", "daughter",
  "father", "mother", "grandfather", "grandmother",
  "full_brother", "full_sister",
  "paternal_brother", "paternal_sister",
  "maternal_brother", "maternal_sister",
  "grandson", "granddaughter",
  "paternal_uncle"
]);

export const faraidHeirInputSchema = z.object({
  heirType: faraidHeirTypeSchema,
  name: z.string().min(1),
  personId: z.string().optional(),
  count: z.number().int().min(1).default(1)
});

export const calculateFaraidSchema = z.object({
  tenantId: z.string().min(1),
  matterId: z.string().min(1),
  deceasedPersonId: z.string().min(1),
  netEstate: z.number().positive(),
  currency: z.string().min(3).max(3).default("GBP"),
  heirs: z.array(faraidHeirInputSchema).min(1)
});

// --- Client Goals ---
export const goalCategorySchema = z.enum([
  "minimize_iht", "protect_family_home", "provide_for_dependants",
  "cross_border_coordination", "islamic_compliance", "business_succession",
  "charitable_giving", "asset_protection", "tax_efficiency"
]);

export const createClientGoalSchema = z.object({
  tenantId: z.string().min(1),
  matterId: z.string().min(1),
  goalText: z.string().min(3),
  category: goalCategorySchema,
  priority: z.enum(["high", "medium", "low"]).default("medium"),
  linkedScenarioIds: z.array(z.string()).default([]),
  notes: z.string().optional()
});

export const updateClientGoalSchema = createClientGoalSchema.partial().omit({ tenantId: true, matterId: true });
