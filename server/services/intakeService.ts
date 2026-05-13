import { prisma } from "../db";
import type { IntakeModule, IntakeScore, IntakeStepStatus, IntakeWorkflowState } from "../../shared/types";
import { advanceIntakeSchema } from "../../shared/schemas";
import { audit } from "./auditService";

export async function calculateIntakeScore(matterId: string): Promise<IntakeScore> {
  const [matter, people, relationships, assets, consents, scenarios] = await Promise.all([
    prisma.matter.findUniqueOrThrow({ where: { id: matterId } }),
    prisma.person.findMany({ where: { matterId } }),
    prisma.relationship.findMany({ where: { matterId } }),
    prisma.asset.findMany({ where: { matterId } }),
    prisma.consent.findMany({ where: { matterId, acknowledged: true } }),
    prisma.scenario.findMany({ where: { matterId } })
  ]);

  const missingCritical: string[] = [];
  const modules = [
    { name: "jurisdiction", complete: Boolean(matter.primaryJurisdictionCode && matter.languageOfRecord) },
    { name: "client profile", complete: people.some((person) => person.legalName && person.dateOfBirth) },
    { name: "connecting factors", complete: people.some((person) => person.domicileCountry && person.habitualResidence && person.taxResidency) },
    { name: "relationships", complete: relationships.length > 0 },
    { name: "assets", complete: assets.length > 0 && assets.every((asset) => asset.valuationDate && asset.situsCountry) },
    { name: "planning scenario", complete: scenarios.length > 0 },
    { name: "privacy consent", complete: consents.some((consent) => consent.consentType === "privacy_notice") },
    { name: "professional disclaimer", complete: consents.some((consent) => consent.consentType === "professional_disclaimer") }
  ];

  for (const module of modules) {
    if (!module.complete) {
      missingCritical.push(module.name);
    }
  }

  return {
    totalModules: modules.length,
    completeModules: modules.filter((module) => module.complete).length,
    score: Math.round((modules.filter((module) => module.complete).length / modules.length) * 100),
    missingCritical
  };
}

export async function missingRelationshipFacts(matterId: string) {
  const people = await prisma.person.findMany({ where: { matterId } });
  const relationships = await prisma.relationship.findMany({ where: { matterId } });
  const issues: string[] = [];

  for (const person of people) {
    if (!person.dateOfBirth) {
      issues.push(`${person.legalName}: missing date of birth`);
    }
    if (!person.nationality || !person.domicileCountry || !person.habitualResidence) {
      issues.push(`${person.legalName}: missing connecting-factor facts`);
    }
  }

  if (people.length > 1 && relationships.length === 0) {
    issues.push("Relationship graph has multiple people but no relationship records");
  }

  return issues;
}

const INTAKE_MODULE_ORDER: IntakeModule[] = [
  "jurisdiction",
  "client_profile",
  "connecting_factors",
  "relationships",
  "assets",
  "planning_scenario",
  "privacy_consent",
  "professional_disclaimer"
];

export async function getIntakeWorkflowState(matterId: string): Promise<IntakeWorkflowState> {
  const [matter, people, relationships, assets, consents, scenarios] = await Promise.all([
    prisma.matter.findUniqueOrThrow({ where: { id: matterId } }),
    prisma.person.findMany({ where: { matterId } }),
    prisma.relationship.findMany({ where: { matterId } }),
    prisma.asset.findMany({ where: { matterId } }),
    prisma.consent.findMany({ where: { matterId, acknowledged: true } }),
    prisma.scenario.findMany({ where: { matterId } })
  ]);

  const moduleChecks: Record<IntakeModule, { complete: boolean; errors: string[] }> = {
    jurisdiction: {
      complete: Boolean(matter.primaryJurisdictionCode && matter.languageOfRecord),
      errors: !matter.primaryJurisdictionCode ? ["Primary jurisdiction required"] : []
    },
    client_profile: {
      complete: people.some((p) => p.legalName && p.dateOfBirth),
      errors: people.length === 0 ? ["At least one person (testator) required"] : []
    },
    connecting_factors: {
      complete: people.some((p) => p.domicileCountry && p.habitualResidence && p.taxResidency),
      errors: people.every((p) => !p.domicileCountry) ? ["Domicile country required for at least one person"] : []
    },
    relationships: {
      complete: relationships.length > 0,
      errors: relationships.length === 0 ? ["At least one relationship required"] : []
    },
    assets: {
      complete: assets.length > 0 && assets.every((a) => a.valuationDate && a.situsCountry),
      errors: assets.length === 0 ? ["At least one asset required"] : []
    },
    planning_scenario: {
      complete: scenarios.length > 0,
      errors: scenarios.length === 0 ? ["At least one planning scenario required"] : []
    },
    privacy_consent: {
      complete: consents.some((c) => c.consentType === "privacy_notice"),
      errors: !consents.some((c) => c.consentType === "privacy_notice") ? ["Privacy notice acknowledgement required"] : []
    },
    professional_disclaimer: {
      complete: consents.some((c) => c.consentType === "professional_disclaimer"),
      errors: !consents.some((c) => c.consentType === "professional_disclaimer") ? ["Professional disclaimer acknowledgement required"] : []
    }
  };

  let currentModule: IntakeModule = "jurisdiction";
  for (const mod of INTAKE_MODULE_ORDER) {
    if (!moduleChecks[mod].complete) {
      currentModule = mod;
      break;
    }
    if (mod === INTAKE_MODULE_ORDER[INTAKE_MODULE_ORDER.length - 1]) {
      currentModule = mod;
    }
  }

  return {
    matterId,
    currentModule,
    modules: INTAKE_MODULE_ORDER.map((name) => ({
      name,
      status: moduleChecks[name].complete ? "complete" as IntakeStepStatus : "incomplete" as IntakeStepStatus,
      validationErrors: moduleChecks[name].errors
    }))
  };
}

export async function validateIntakeStep(matterId: string, module: IntakeModule): Promise<string[]> {
  const state = await getIntakeWorkflowState(matterId);
  const found = state.modules.find((m) => m.name === module);
  return found?.validationErrors ?? [];
}

export async function advanceIntake(input: unknown) {
  const data = advanceIntakeSchema.parse(input);
  const state = await getIntakeWorkflowState(data.matterId);
  const currentIndex = INTAKE_MODULE_ORDER.indexOf(data.currentModule);
  const currentMod = state.modules.find((m) => m.name === data.currentModule);

  if (currentMod && currentMod.status !== "complete") {
    throw new Error(`Cannot advance: ${data.currentModule} is incomplete — ${currentMod.validationErrors.join(", ")}`);
  }

  const nextIndex = currentIndex + 1;
  if (nextIndex >= INTAKE_MODULE_ORDER.length) {
    // All complete — update matter status
    await prisma.matter.update({ where: { id: data.matterId }, data: { status: "review" } });
    await audit({
      tenantId: (await prisma.matter.findUniqueOrThrow({ where: { id: data.matterId } })).tenantId,
      matterId: data.matterId,
      actorRole: "system",
      eventType: "intake.completed",
      entityType: "Matter",
      entityId: data.matterId,
      metadata: { requirementRefs: ["FR-005"] }
    });
    return { matterId: data.matterId, nextModule: null, intakeComplete: true };
  }

  return { matterId: data.matterId, nextModule: INTAKE_MODULE_ORDER[nextIndex], intakeComplete: false };
}
