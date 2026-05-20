import { Router } from "express";
import { prisma } from "../db";
import { asyncHandler } from "./asyncHandler";
import { createReviewCommentSchema, generateEstatePlanningDocumentSchema } from "../../shared/schemas";
import { evaluateMatterRules } from "../services/ruleEngine";
import { evaluateHague1961FormalValidity, generateConflictMemo, recordConflictReviewerRationale } from "../services/conflictOfLawsService";
import { approveReview, finalizeDocument, generateEstatePlanningDocument, generateWillDraft } from "../services/documentAssemblyService";
import { compareScenarios } from "../services/scenarioComparisonService";
import { runWhatIfSimulation } from "../services/simulationService";
import { captureWitnessDetails, revokeDocument, transitionSigningCeremony } from "../services/signingService";
import { evaluateMatrimonialRegime } from "../services/matrimonialPropertyService";
import { evaluateGiftLookback } from "../services/giftLookbackService";
import { checkESignatureStatus, routeForESignature } from "../services/esignatureService";

export const planningRouter = Router();

planningRouter.post(
  "/matters/:matterId/rules/evaluate",
  asyncHandler(async (request, response) => {
    response.json({ summary: await evaluateMatterRules(request.params.matterId, request.body.scenarioId) });
  })
);

planningRouter.post(
  "/matters/:matterId/conflict-of-laws",
  asyncHandler(async (request, response) => {
    response.status(201).json({ memo: await generateConflictMemo(request.params.matterId) });
  })
);

planningRouter.post(
  "/conflict-of-laws/:memoId/review",
  asyncHandler(async (request, response) => {
    response.json({
      memo: await recordConflictReviewerRationale(
        request.params.memoId,
        String(request.body.reviewerUserId ?? "system"),
        String(request.body.rationale ?? "Reviewed and approved.")
      )
    });
  })
);

planningRouter.post(
  "/matters/:matterId/documents/will",
  asyncHandler(async (request, response) => {
    response.status(201).json({ document: await generateWillDraft(request.params.matterId, request.body.locale) });
  })
);

planningRouter.post(
  "/matters/:matterId/documents/estate-planning",
  asyncHandler(async (request, response) => {
    const data = generateEstatePlanningDocumentSchema.parse(request.body);
    response.status(201).json({
      document: await generateEstatePlanningDocument(request.params.matterId, data.documentType, data.locale)
    });
  })
);

planningRouter.post(
  "/reviews/:reviewId/approve",
  asyncHandler(async (request, response) => {
    response.json({
      review: await approveReview(
        request.params.reviewId,
        String(request.body.reviewerUserId ?? "system"),
        String(request.body.rationale ?? "Approved.")
      )
    });
  })
);

planningRouter.post(
  "/documents/:documentId/finalize",
  asyncHandler(async (request, response) => {
    response.json({ document: await finalizeDocument(request.params.documentId, String(request.body.reviewerUserId ?? "system")) });
  })
);

// --- Document list/get ---

planningRouter.get(
  "/matters/:matterId/documents",
  asyncHandler(async (request, response) => {
    const documents = await prisma.document.findMany({
      where: { matterId: request.params.matterId },
      orderBy: { createdAt: "desc" }
    });
    response.json({ documents });
  })
);

planningRouter.get(
  "/documents/:documentId",
  asyncHandler(async (request, response) => {
    const document = await prisma.document.findUniqueOrThrow({ where: { id: request.params.documentId } });
    response.json({ document });
  })
);

// --- Review list ---

planningRouter.get(
  "/matters/:matterId/reviews",
  asyncHandler(async (request, response) => {
    const reviews = await prisma.review.findMany({
      where: { matterId: request.params.matterId },
      orderBy: { createdAt: "desc" }
    });
    response.json({ reviews });
  })
);

// --- Review comments ---

planningRouter.get(
  "/reviews/:reviewId/comments",
  asyncHandler(async (request, response) => {
    const comments = await prisma.reviewComment.findMany({
      where: { reviewId: request.params.reviewId },
      orderBy: { createdAt: "asc" }
    });
    response.json({ comments });
  })
);

planningRouter.post(
  "/reviews/:reviewId/comments",
  asyncHandler(async (request, response) => {
    const data = createReviewCommentSchema.parse({ ...request.body, reviewId: request.params.reviewId });
    const comment = await prisma.reviewComment.create({ data });
    response.status(201).json({ comment });
  })
);

planningRouter.patch(
  "/reviews/:reviewId/comments/:commentId/resolve",
  asyncHandler(async (request, response) => {
    const comment = await prisma.reviewComment.update({
      where: { id: request.params.commentId },
      data: { resolved: true }
    });
    response.json({ comment });
  })
);

// --- Hague 1961 & EU 650 ---

planningRouter.post(
  "/matters/:matterId/hague-validity",
  asyncHandler(async (request, response) => {
    response.json({ result: await evaluateHague1961FormalValidity(request.params.matterId) });
  })
);

planningRouter.post(
  "/matters/:matterId/eu650-evaluation",
  asyncHandler(async (_request, response) => {
    response.status(410).json({ error: "EU 650/2012 evaluation is not applicable for African jurisdictions." });
  })
);

// --- Scenario comparison & simulation ---

planningRouter.post(
  "/matters/:matterId/scenarios/compare",
  asyncHandler(async (request, response) => {
    response.json({
      diff: await compareScenarios(request.params.matterId, request.body.scenarioIdA, request.body.scenarioIdB)
    });
  })
);

planningRouter.post(
  "/matters/:matterId/scenarios/:scenarioId/simulate",
  asyncHandler(async (request, response) => {
    response.json({
      result: await runWhatIfSimulation(request.params.matterId, request.params.scenarioId, request.body.hypothetical ?? {})
    });
  })
);

// --- Signing ceremony ---

planningRouter.get(
  "/matters/:matterId/signing-events",
  asyncHandler(async (request, response) => {
    const events = await prisma.signatureEvent.findMany({
      where: { matterId: request.params.matterId },
      orderBy: { createdAt: "desc" },
    });
    response.json({
      events: events.map((e) => ({
        ...e,
        witnesses: JSON.parse(e.witnessDetails || "[]"),
      })),
    });
  })
);

planningRouter.post(
  "/signing-events/:eventId/transition",
  asyncHandler(async (request, response) => {
    response.json({ event: await transitionSigningCeremony({ ...request.body, eventId: request.params.eventId }) });
  })
);

planningRouter.post(
  "/signing-events/:eventId/witnesses",
  asyncHandler(async (request, response) => {
    response.json({ event: await captureWitnessDetails({ ...request.body, eventId: request.params.eventId }) });
  })
);

planningRouter.post(
  "/documents/:documentId/revoke",
  asyncHandler(async (request, response) => {
    response.json({ document: await revokeDocument({ ...request.body, documentId: request.params.documentId }) });
  })
);

// --- Matrimonial regime ---

planningRouter.post(
  "/matters/:matterId/matrimonial-regime",
  asyncHandler(async (request, response) => {
    response.json({ result: await evaluateMatrimonialRegime(request.params.matterId) });
  })
);

// --- Gift lookback ---

planningRouter.post(
  "/matters/:matterId/gift-lookback",
  asyncHandler(async (request, response) => {
    response.json({ result: await evaluateGiftLookback(request.params.matterId) });
  })
);

// --- E-signature ---

planningRouter.post(
  "/documents/:documentId/e-sign",
  asyncHandler(async (request, response) => {
    response.json({ result: await routeForESignature(request.params.documentId, String(request.body.actorUserId ?? "system")) });
  })
);

planningRouter.get(
  "/documents/:documentId/e-sign-status",
  asyncHandler(async (request, response) => {
    response.json({ result: await checkESignatureStatus(request.params.documentId) });
  })
);
