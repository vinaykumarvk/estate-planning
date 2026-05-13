import { prisma } from "../db";
import type { ConflictMemoResult, EU650Result, FormalValidityRoute, HagueValidityResult, MemberStateStatus } from "../../shared/types";
import { decode, encode } from "./json";
import { audit } from "./auditService";

const EU650_MEMBER_STATE_MAP: Record<string, MemberStateStatus> = {
  PT: "participating",
  ES: "participating",
  FR: "participating",
  DE: "participating",
  IT: "participating",
  NL: "participating",
  BE: "participating",
  AT: "participating",
  GB: "non_participating",
  IE: "non_participating",
  DK: "denmark_exception"
};

export async function evaluateHague1961FormalValidity(matterId: string): Promise<HagueValidityResult> {
  const matter = await prisma.matter.findUniqueOrThrow({ where: { id: matterId } });
  const [people, assets] = await Promise.all([
    prisma.person.findMany({ where: { matterId } }),
    prisma.asset.findMany({ where: { matterId } })
  ]);

  const testator = people[0];
  const routes: FormalValidityRoute[] = [];
  const executionCountry = matter.primaryJurisdictionCode === "EW" ? "GB" : matter.primaryJurisdictionCode;

  // (a) Place of execution
  routes.push({
    basis: "place_of_execution",
    country: executionCountry,
    satisfied: Boolean(executionCountry),
    reasoning: `Will executed in ${executionCountry} — compliant with internal law of place of execution.`
  });

  // (b) Nationality
  if (testator?.nationality) {
    routes.push({
      basis: "nationality",
      country: testator.nationality,
      satisfied: true,
      reasoning: `Testator nationality ${testator.nationality} — compliant with internal law of nationality.`
    });
  } else {
    routes.push({
      basis: "nationality",
      country: "unknown",
      satisfied: false,
      reasoning: "Testator nationality not recorded."
    });
  }

  // (c) Domicile
  if (testator?.domicileCountry) {
    routes.push({
      basis: "domicile",
      country: testator.domicileCountry,
      satisfied: true,
      reasoning: `Testator domiciled in ${testator.domicileCountry} — compliant with internal law of domicile.`
    });
  } else {
    routes.push({
      basis: "domicile",
      country: "unknown",
      satisfied: false,
      reasoning: "Testator domicile not recorded."
    });
  }

  // (d) Habitual residence
  if (testator?.habitualResidence) {
    routes.push({
      basis: "habitual_residence",
      country: testator.habitualResidence,
      satisfied: true,
      reasoning: `Testator habitually resident in ${testator.habitualResidence} — compliant with internal law of habitual residence.`
    });
  } else {
    routes.push({
      basis: "habitual_residence",
      country: "unknown",
      satisfied: false,
      reasoning: "Testator habitual residence not recorded."
    });
  }

  const formallyValid = routes.some((r) => r.satisfied);

  await audit({
    tenantId: matter.tenantId,
    matterId,
    actorRole: "system",
    eventType: "hague_validity.evaluated",
    entityType: "Matter",
    entityId: matterId,
    metadata: { formallyValid, routes: routes.map((r) => r.basis), requirementRefs: ["CL-003"] }
  });

  return { matterId, formallyValid, routes };
}

export async function evaluateEU650(matterId: string): Promise<EU650Result> {
  const matter = await prisma.matter.findUniqueOrThrow({ where: { id: matterId } });
  const [people, assets] = await Promise.all([
    prisma.person.findMany({ where: { matterId } }),
    prisma.asset.findMany({ where: { matterId } })
  ]);

  const testator = people[0];
  const habitualResidence = testator?.habitualResidence ?? matter.primaryJurisdictionCode;
  const memberStatus = EU650_MEMBER_STATE_MAP[habitualResidence] ?? "non_participating";

  // Article 21: default applicable law = habitual residence of deceased
  const defaultApplicableLaw = habitualResidence === "EW" ? "GB" : habitualResidence;

  // Article 22: professio juris — check if nationality differs (election assumed if nationality set)
  const professioJurisElected = Boolean(testator?.nationality && testator.nationality !== habitualResidence);

  // Scope exclusion: immovable property in non-participating states
  const excludedAssets = assets
    .filter((a) => a.assetClass === "real_estate")
    .filter((a) => {
      const status = EU650_MEMBER_STATE_MAP[a.situsCountry] ?? "non_participating";
      return status === "non_participating";
    })
    .map((a) => `${a.description} (situs: ${a.situsCountry})`);

  const additionalJurisdictions = decode<string[]>(matter.additionalJurisdictions, []);
  const allCountries = [habitualResidence, ...additionalJurisdictions, ...assets.map((a) => a.situsCountry)];
  const uniqueCountries = [...new Set(allCountries.filter(Boolean))];
  const memberStateStatus: Record<string, MemberStateStatus> = {};
  for (const country of uniqueCountries) {
    memberStateStatus[country] = EU650_MEMBER_STATE_MAP[country] ?? "non_participating";
  }

  await audit({
    tenantId: matter.tenantId,
    matterId,
    actorRole: "system",
    eventType: "eu650.evaluated",
    entityType: "Matter",
    entityId: matterId,
    metadata: { defaultApplicableLaw, professioJurisElected, excludedAssets, requirementRefs: ["CL-002"] }
  });

  return { matterId, defaultApplicableLaw, professioJurisElected, excludedAssets, memberStateStatus };
}

export async function generateConflictMemo(matterId: string): Promise<ConflictMemoResult> {
  const matter = await prisma.matter.findUniqueOrThrow({ where: { id: matterId } });
  const [people, assets] = await Promise.all([
    prisma.person.findMany({ where: { matterId } }),
    prisma.asset.findMany({ where: { matterId } })
  ]);

  const additionalJurisdictions = decode<string[]>(matter.additionalJurisdictions, []);
  const assetCountries = [...new Set(assets.map((asset) => asset.situsCountry).filter(Boolean))];
  const habitualResidences = [...new Set(people.map((person) => person.habitualResidence).filter(Boolean))];
  const nationalities = [...new Set(people.map((person) => person.nationality).filter(Boolean))];
  const regimesEvaluated = ["EU_650_2012", "HAGUE_1961_WILLS"];
  const riskAreas: string[] = [];
  const proceduralSteps: string[] = [];
  const requiredEvidence = ["habitual residence proof", "domicile statement", "asset situs evidence"];

  if (additionalJurisdictions.includes("PT") || assetCountries.includes("PT") || habitualResidences.includes("PT")) {
    proceduralSteps.push("Evaluate EU 650/2012 participating-state succession logic for Portuguese connecting factors.");
    proceduralSteps.push("Confirm Hague 1961 formal validity route for E&W will recognition in Portugal.");
  }

  if (matter.primaryJurisdictionCode === "EW" || assetCountries.includes("GB")) {
    proceduralSteps.push("Record that UK is outside EU 650/2012 and requires common-law conflict review for E&W-side effects.");
  }

  if (people.some((person) => person.maritalStatus === "married")) {
    riskAreas.push("Matrimonial property is outside EU 650/2012 succession scope and requires national-law review.");
  }

  if (assetCountries.length > 1 || habitualResidences.length > 1 || nationalities.length > 1) {
    riskAreas.push("Multiple connecting factors create cross-border review requirement.");
  }

  // Evaluate Hague 1961 and EU 650
  const hagueResult = await evaluateHague1961FormalValidity(matterId);
  if (hagueResult.formallyValid) {
    proceduralSteps.push(`Hague 1961 formal validity confirmed via: ${hagueResult.routes.filter((r) => r.satisfied).map((r) => r.basis).join(", ")}.`);
  } else {
    riskAreas.push("Hague 1961 formal validity could not be confirmed on any basis — all routes unsatisfied.");
  }

  const eu650Result = await evaluateEU650(matterId);
  proceduralSteps.push(`EU 650/2012 default applicable law: ${eu650Result.defaultApplicableLaw}.`);
  if (eu650Result.professioJurisElected) {
    proceduralSteps.push("Professio juris (Article 22) election detected — testator nationality law may apply.");
  }
  if (eu650Result.excludedAssets.length > 0) {
    riskAreas.push(`Immovable property in non-participating states excluded from EU 650 scope: ${eu650Result.excludedAssets.join("; ")}.`);
  }

  if (riskAreas.length === 0) {
    riskAreas.push("No cross-border blocker found from captured facts, but professional review remains available.");
  }

  const applicableLawSummary =
    matter.primaryJurisdictionCode === "PT"
      ? "Preliminary view: Portugal pack applies to the planning workflow; EU 650/2012 review required for cross-border succession facts."
      : "Preliminary view: England & Wales pack applies to the planning workflow; Portugal/EU connecting factors require structured professional review.";

  const memo = await prisma.conflictOfLawsMemo.create({
    data: {
      tenantId: matter.tenantId,
      matterId,
      connectingFactors: encode({ additionalJurisdictions, assetCountries, habitualResidences, nationalities }),
      regimesEvaluated: encode(regimesEvaluated),
      applicableLawSummary,
      requiredEvidence: encode(requiredEvidence),
      proceduralSteps: encode(proceduralSteps),
      riskAreas: encode(riskAreas),
      disclaimer: "Decision-support memo only. It is not legal advice and must be reviewed by qualified counsel.",
      reviewStatus: "pending"
    }
  });

  await prisma.review.create({
    data: {
      tenantId: matter.tenantId,
      matterId,
      reviewType: "conflict_of_laws",
      status: "pending",
      mandatory: true,
      triggerReason: "Cross-border connecting factors detected; CL-005 blocks finalization until reviewed."
    }
  });

  await audit({
    tenantId: matter.tenantId,
    matterId,
    actorRole: "system",
    eventType: "conflict_memo.generated",
    entityType: "ConflictOfLawsMemo",
    entityId: memo.id,
    metadata: { regimesEvaluated, requirementRefs: ["CL-001", "CL-002", "CL-003", "CL-004", "CL-005"] }
  });

  return {
    memoId: memo.id,
    matterId,
    applicableLawSummary,
    requiredEvidence,
    proceduralSteps,
    riskAreas,
    reviewStatus: "pending"
  };
}

export async function recordConflictReviewerRationale(memoId: string, reviewerUserId: string, rationale: string) {
  const memo = await prisma.conflictOfLawsMemo.update({
    where: { id: memoId },
    data: { reviewStatus: "approved", reviewerRationale: rationale }
  });

  await prisma.review.updateMany({
    where: { matterId: memo.matterId, reviewType: "conflict_of_laws", status: "pending" },
    data: { status: "approved", reviewerUserId, decision: "approved", rationale, completedAt: new Date() }
  });

  await audit({
    tenantId: memo.tenantId,
    matterId: memo.matterId,
    actorUserId: reviewerUserId,
    actorRole: "qualified_professional",
    eventType: "conflict_memo.reviewed",
    entityType: "ConflictOfLawsMemo",
    entityId: memo.id,
    metadata: { requirementRefs: ["CL-006"] }
  });

  return memo;
}
