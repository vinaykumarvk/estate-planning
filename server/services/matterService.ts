import { prisma } from "../db";
import {
  createAssetSchema,
  createDispositionSchema,
  createMatterSchema,
  createPersonSchema,
  createScenarioSchema
} from "../../shared/schemas";
import { decode, encode } from "./json";
import { audit } from "./auditService";

export async function createMatter(input: unknown) {
  const data = createMatterSchema.parse(input);
  const count = await prisma.matter.count({ where: { tenantId: data.tenantId } });
  const matter = await prisma.matter.create({
    data: {
      tenantId: data.tenantId,
      matterNumber: `MAT-${new Date().getUTCFullYear()}-${String(count + 1).padStart(4, "0")}`,
      title: data.title,
      mode: "planning",
      status: "intake",
      primaryJurisdictionCode: data.primaryJurisdictionCode,
      additionalJurisdictions: encode(data.additionalJurisdictions),
      languageOfRecord: data.languageOfRecord,
      engagementStatus: "professional_engaged",
      confidentialityMode: data.jointMatter ? "joint_with_firewall" : "standard",
      createdByUserId: data.createdByUserId
    }
  });

  await prisma.consent.createMany({
    data: [
      {
        tenantId: matter.tenantId,
        matterId: matter.id,
        consentType: "privacy_notice",
        locale: matter.languageOfRecord,
        textVersion: "2026.05",
        acknowledged: false,
        legalBasis: "contract"
      },
      {
        tenantId: matter.tenantId,
        matterId: matter.id,
        consentType: "professional_disclaimer",
        locale: matter.languageOfRecord,
        textVersion: "2026.05",
        acknowledged: false,
        legalBasis: "professional_engagement"
      }
    ]
  });

  await audit({
    tenantId: matter.tenantId,
    matterId: matter.id,
    actorUserId: data.createdByUserId,
    actorRole: "professional",
    eventType: "matter.created",
    entityType: "Matter",
    entityId: matter.id,
    metadata: { requirementRefs: ["FR-005", "FR-007", "CR-008"] }
  });

  return matter;
}

export async function addPerson(input: unknown) {
  const data = createPersonSchema.parse(input);
  const person = await prisma.person.create({
    data: {
      tenantId: data.tenantId,
      matterId: data.matterId,
      legalName: data.legalName,
      preferredName: data.preferredName,
      dateOfBirth: data.dateOfBirth,
      email: data.email,
      nationality: data.nationality,
      residenceCountry: data.residenceCountry,
      domicileCountry: data.domicileCountry,
      habitualResidence: data.habitualResidence,
      taxResidency: data.taxResidency,
      maritalStatus: data.maritalStatus,
      preferredLanguage: data.preferredLanguage
    }
  });

  await audit({
    tenantId: person.tenantId,
    matterId: person.matterId ?? undefined,
    actorRole: "professional",
    eventType: "person.created",
    entityType: "Person",
    entityId: person.id,
    metadata: { requirementRefs: ["CR-001", "FR-013"] }
  });

  return person;
}

export async function acknowledgeConsent(consentId: string, actorUserId: string) {
  const consent = await prisma.consent.update({
    where: { id: consentId },
    data: { acknowledged: true, acknowledgedAt: new Date() }
  });

  await audit({
    tenantId: consent.tenantId,
    matterId: consent.matterId,
    actorUserId,
    actorRole: "client_or_professional",
    eventType: "consent.acknowledged",
    entityType: "Consent",
    entityId: consent.id,
    metadata: { consentType: consent.consentType, requirementRefs: ["FR-007", "SEC-007"] }
  });

  return consent;
}

export async function addRelationship(data: {
  tenantId: string;
  matterId: string;
  fromPersonId: string;
  toPersonId: string;
  relationshipType: string;
  legalStatus: string;
  biological?: boolean;
  adoptive?: boolean;
  stepRelationship?: boolean;
  dependent?: boolean;
  minor?: boolean;
  incapacitated?: boolean;
}) {
  const relationship = await prisma.relationship.create({
    data: {
      tenantId: data.tenantId,
      matterId: data.matterId,
      fromPersonId: data.fromPersonId,
      toPersonId: data.toPersonId,
      relationshipType: data.relationshipType,
      legalStatus: data.legalStatus,
      biological: data.biological ?? false,
      adoptive: data.adoptive ?? false,
      stepRelationship: data.stepRelationship ?? false,
      dependent: data.dependent ?? false,
      minor: data.minor ?? false,
      incapacitated: data.incapacitated ?? false
    }
  });

  await audit({
    tenantId: relationship.tenantId,
    matterId: relationship.matterId,
    actorRole: "professional",
    eventType: "relationship.created",
    entityType: "Relationship",
    entityId: relationship.id,
    metadata: { requirementRefs: ["CR-002", "FR-013", "FR-014"] }
  });

  return relationship;
}

export async function addAsset(input: unknown) {
  const data = createAssetSchema.parse(input);
  const asset = await prisma.asset.create({
    data: {
      tenantId: data.tenantId,
      matterId: data.matterId,
      ownerPersonId: data.ownerPersonId,
      assetClass: data.assetClass,
      description: data.description,
      jurisdictionCode: data.jurisdictionCode,
      situsCountry: data.situsCountry,
      currency: data.currency,
      valuation: data.valuation,
      valuationDate: data.valuationDate,
      valuationSource: data.valuationSource,
      confidenceLevel: data.confidenceLevel,
      ownershipType: data.ownershipType,
      ownershipShare: data.ownershipShare,
      todPod: data.todPod,
      dynamicFields: data.dynamicFields,
      taxonomyCode: data.taxonomyCode,
      evidenceRefs: encode(data.evidenceRefs)
    }
  });

  await audit({
    tenantId: asset.tenantId,
    matterId: asset.matterId,
    actorRole: "professional",
    eventType: "asset.created",
    entityType: "Asset",
    entityId: asset.id,
    metadata: { requirementRefs: ["CR-003", "FR-016", "FR-017", "FR-018", "FR-020"] }
  });

  return asset;
}

export async function createScenario(input: unknown) {
  const data = createScenarioSchema.parse(input);
  const scenario = await prisma.scenario.create({
    data: {
      tenantId: data.tenantId,
      matterId: data.matterId,
      name: data.name,
      comparisonBase: data.comparisonBase,
      status: "draft"
    }
  });

  await audit({
    tenantId: scenario.tenantId,
    matterId: scenario.matterId,
    actorRole: "professional",
    eventType: "scenario.created",
    entityType: "Scenario",
    entityId: scenario.id,
    metadata: { requirementRefs: ["FR-021", "FR-023", "FR-025"] }
  });

  return scenario;
}

export async function addDisposition(input: unknown) {
  const data = createDispositionSchema.parse(input);
  const disposition = await prisma.disposition.create({
    data: {
      tenantId: data.tenantId,
      matterId: data.matterId,
      scenarioId: data.scenarioId,
      giftType: data.giftType,
      beneficiaryPersonId: data.beneficiaryPersonId,
      beneficiaryLabel: data.beneficiaryLabel,
      assetId: data.assetId,
      amount: data.amount,
      percentage: data.percentage,
      currency: data.currency,
      conditions: data.conditions,
      survivorshipDays: data.survivorshipDays,
      perStirpes: data.perStirpes,
      perCapita: data.perCapita,
      executorPersonId: data.executorPersonId,
      guardianPersonId: data.guardianPersonId,
      fiduciaryRole: data.fiduciaryRole,
      giftDate: data.giftDate,
      lifetimeGift: data.lifetimeGift
    }
  });

  await audit({
    tenantId: disposition.tenantId,
    matterId: disposition.matterId,
    actorRole: "professional",
    eventType: "disposition.created",
    entityType: "Disposition",
    entityId: disposition.id,
    metadata: { requirementRefs: ["CR-004", "FR-015", "FR-023"] }
  });

  return disposition;
}

export async function getMatterWorkspace(matterId: string) {
  const [matter, people, relationships, consents, assets, liabilities, scenarios, dispositions, documents, reviews, tasks, messages, auditEvents] =
    await Promise.all([
      prisma.matter.findUniqueOrThrow({ where: { id: matterId } }),
      prisma.person.findMany({ where: { matterId }, orderBy: { createdAt: "asc" } }),
      prisma.relationship.findMany({ where: { matterId }, orderBy: { createdAt: "asc" } }),
      prisma.consent.findMany({ where: { matterId }, orderBy: { createdAt: "asc" } }),
      prisma.asset.findMany({ where: { matterId }, orderBy: { createdAt: "asc" } }),
      prisma.liability.findMany({ where: { matterId }, orderBy: { createdAt: "asc" } }),
      prisma.scenario.findMany({ where: { matterId }, orderBy: { createdAt: "asc" } }),
      prisma.disposition.findMany({ where: { matterId }, orderBy: { createdAt: "asc" } }),
      prisma.document.findMany({ where: { matterId }, orderBy: { createdAt: "desc" } }),
      prisma.review.findMany({ where: { matterId }, orderBy: { createdAt: "desc" } }),
      prisma.task.findMany({ where: { matterId }, orderBy: { createdAt: "asc" } }),
      prisma.message.findMany({ where: { matterId }, orderBy: { createdAt: "desc" } }),
      prisma.auditEvent.findMany({ where: { matterId }, orderBy: { createdAt: "desc" }, take: 50 })
    ]);

  return {
    matter: {
      ...matter,
      additionalJurisdictions: decode<string[]>(matter.additionalJurisdictions, [])
    },
    people,
    relationships,
    consents,
    assets: assets.map((asset) => ({ ...asset, evidenceRefs: decode<string[]>(asset.evidenceRefs, []) })),
    liabilities,
    scenarios,
    dispositions,
    documents,
    reviews,
    tasks,
    messages,
    auditEvents
  };
}
