import { prisma } from "../db";
import type { AiEvaluationInput, AiEvaluationVerdict } from "../../shared/types";
import { AI_RELEASE_THRESHOLDS } from "../../shared/constants";
import { aiEvaluationSchema } from "../../shared/schemas";
import { encode } from "./json";
import { audit } from "./auditService";

export function evaluateAiRelease(input: AiEvaluationInput): AiEvaluationVerdict {
  const failures: string[] = [];

  if (input.groundingRate < AI_RELEASE_THRESHOLDS.groundingRate) failures.push("groundingRate");
  if (input.citationAccuracy < AI_RELEASE_THRESHOLDS.citationAccuracy) failures.push("citationAccuracy");
  if (input.escalationRate < AI_RELEASE_THRESHOLDS.escalationRate) failures.push("escalationRate");
  if (input.hallucinatedCitationRate > AI_RELEASE_THRESHOLDS.hallucinatedCitationRateMax) failures.push("hallucinatedCitationRate");
  if (input.languageParityGap > AI_RELEASE_THRESHOLDS.languageParityGapMax) failures.push("languageParityGap");
  if (input.redTeamRefusalRate < AI_RELEASE_THRESHOLDS.redTeamRefusalRate) failures.push("redTeamRefusalRate");
  if (input.sensitiveLeakEvents > AI_RELEASE_THRESHOLDS.sensitiveLeakEventsMax) failures.push("sensitiveLeakEvents");
  if (input.sourceStaleRate > AI_RELEASE_THRESHOLDS.sourceStaleRateMax) failures.push("sourceStaleRate");

  return { status: failures.length === 0 ? "pass" : "blocked", failures };
}

export async function recordAiEvaluation(input: unknown) {
  const data = aiEvaluationSchema.parse(input);
  const verdict = evaluateAiRelease(data);
  const run = await prisma.aiEvaluationRun.create({
    data: {
      packId: data.packId,
      locale: data.locale,
      modelVersion: data.modelVersion,
      promptSetVersion: data.promptSetVersion,
      groundingRate: data.groundingRate,
      citationAccuracy: data.citationAccuracy,
      escalationRate: data.escalationRate,
      hallucinatedCitationRate: data.hallucinatedCitationRate,
      languageParityGap: data.languageParityGap,
      redTeamRefusalRate: data.redTeamRefusalRate,
      sensitiveLeakEvents: data.sensitiveLeakEvents,
      sourceStaleRate: data.sourceStaleRate,
      releaseGateStatus: verdict.status,
      signedOffBy: encode(data.signedOffBy)
    }
  });

  await prisma.releaseGate.updateMany({
    where: { packId: data.packId, gateCode: "ai-safety" },
    data: {
      status: verdict.status === "pass" ? "pass" : "fail",
      evidence: verdict.failures.length === 0 ? `Evaluation ${run.id} passed.` : `Evaluation ${run.id} failed: ${verdict.failures.join(", ")}`
    }
  });

  await audit({
    tenantId: "platform",
    actorRole: "ai-safety-lead",
    eventType: "ai.evaluation_recorded",
    entityType: "AiEvaluationRun",
    entityId: run.id,
    metadata: { verdict, requirementRefs: ["AI-001", "AI-003", "AI-009", "AI-010", "AI-012", "NFR-015"] }
  });

  return { run, verdict };
}

export async function logAiInteraction(input: {
  tenantId: string;
  matterId?: string;
  userId: string;
  userRole: string;
  packId?: string;
  prompt: string;
  output: string;
  citedRuleCodes?: string[];
  modelVersion: string;
  riskFlags?: string[];
  escalated?: boolean;
}) {
  const prohibitedIntent = /(hide assets|evade tax|fabricate|bypass witness|mislead heirs)/i.test(input.prompt);
  const riskFlags = [...(input.riskFlags ?? []), ...(prohibitedIntent ? ["prohibited_intent"] : [])];
  const output = prohibitedIntent
    ? "I cannot help with that request. A qualified professional must review the matter."
    : input.output;

  return prisma.aiInteraction.create({
    data: {
      tenantId: input.tenantId,
      matterId: input.matterId,
      userId: input.userId,
      userRole: input.userRole,
      packId: input.packId,
      prompt: input.prompt,
      output,
      citedRuleCodes: encode(input.citedRuleCodes ?? []),
      modelVersion: input.modelVersion,
      riskFlags: encode(riskFlags),
      escalated: input.escalated ?? prohibitedIntent
    }
  });
}
