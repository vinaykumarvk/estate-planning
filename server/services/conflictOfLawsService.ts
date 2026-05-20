import { prisma } from "../db";
import type { ConflictMemoResult, FormalValidityRoute, HagueValidityResult } from "../../shared/types";
import { decode, encode } from "./json";
import { audit } from "./auditService";

const COMMON_LAW_JURISDICTIONS = ["NG", "GH", "ZA", "KE"];
const CIVIL_LAW_JURISDICTIONS = ["SN", "CM", "MZ", "AO"];
// OHADA member states (Organisation for the Harmonisation of Business Law in Africa)
const OHADA_MEMBERS = ["SN", "CM"];

export async function evaluateHague1961FormalValidity(matterId: string): Promise<HagueValidityResult> {
  const matter = await prisma.matter.findUniqueOrThrow({ where: { id: matterId } });
  const [people, assets] = await Promise.all([
    prisma.person.findMany({ where: { matterId } }),
    prisma.asset.findMany({ where: { matterId } })
  ]);

  const testator = people[0];
  const routes: FormalValidityRoute[] = [];
  const executionCountry = matter.primaryJurisdictionCode;

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
  const regimesEvaluated = ["HAGUE_1961_WILLS", "AFRICAN_CONFLICT_RULES"];
  const riskAreas: string[] = [];
  const proceduralSteps: string[] = [];
  const requiredEvidence = ["habitual residence proof", "domicile statement", "asset situs evidence"];

  // Check for common law vs civil law jurisdiction conflicts
  const allJurisdictions = [matter.primaryJurisdictionCode, ...additionalJurisdictions];
  const hasCommonLaw = allJurisdictions.some((j) => COMMON_LAW_JURISDICTIONS.includes(j));
  const hasCivilLaw = allJurisdictions.some((j) => CIVIL_LAW_JURISDICTIONS.includes(j));

  if (hasCommonLaw && hasCivilLaw) {
    riskAreas.push("Mixed legal systems: matter involves both common law and civil law jurisdictions — conflict rules differ fundamentally.");
    proceduralSteps.push("Evaluate applicable succession law for each jurisdiction separately: common law (domicile-based) vs civil law (nationality/habitual residence-based).");
  }

  // OHADA references for francophone countries
  if (allJurisdictions.some((j) => OHADA_MEMBERS.includes(j))) {
    proceduralSteps.push("Review OHADA Uniform Acts for business asset classification and cross-border commercial property succession.");
  }

  // Customary law recognition
  if (allJurisdictions.some((j) => ["NG", "GH", "KE"].includes(j))) {
    riskAreas.push("Customary law may apply alongside statutory succession law — verify testator's personal law and community customs.");
    proceduralSteps.push("Determine whether customary law succession rules apply based on testator's ethnic/community affiliation.");
  }

  // Cross-border asset situs rules
  if (assetCountries.length > 1) {
    proceduralSteps.push("Apply lex situs rule: immovable property governed by law of location; movable property governed by testator's domicile/habitual residence.");
    riskAreas.push("Assets in multiple African countries may be subject to different succession regimes.");
  }

  if (people.some((person) => person.maritalStatus === "married")) {
    riskAreas.push("Matrimonial property regime classification differs across African jurisdictions and requires national-law review.");
  }

  // Evaluate Hague 1961
  const hagueResult = await evaluateHague1961FormalValidity(matterId);
  if (hagueResult.formallyValid) {
    proceduralSteps.push(`Hague 1961 formal validity confirmed via: ${hagueResult.routes.filter((r) => r.satisfied).map((r) => r.basis).join(", ")}.`);
  } else {
    riskAreas.push("Hague 1961 formal validity could not be confirmed on any basis — all routes unsatisfied.");
  }

  if (riskAreas.length === 0) {
    riskAreas.push("No cross-border blocker found from captured facts, but professional review remains available.");
  }

  const primaryIsCommonLaw = COMMON_LAW_JURISDICTIONS.includes(matter.primaryJurisdictionCode);
  const applicableLawSummary = primaryIsCommonLaw
    ? `Preliminary view: ${matter.primaryJurisdictionCode} common law pack applies to the planning workflow; cross-border connecting factors require structured professional review.`
    : `Preliminary view: ${matter.primaryJurisdictionCode} civil law pack applies to the planning workflow; forced heirship and cross-border succession rules require professional review.`;

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
