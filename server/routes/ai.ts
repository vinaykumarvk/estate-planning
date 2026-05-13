import { Router } from "express";
import { asyncHandler } from "./asyncHandler";
import { logAiInteraction, recordAiEvaluation } from "../services/aiSafetyService";
import { prisma } from "../db";

export const aiRouter = Router();

aiRouter.get(
  "/policies",
  asyncHandler(async (_request, response) => {
    response.json({ policies: await prisma.aiPolicy.findMany({ orderBy: { policyCode: "asc" } }) });
  })
);

aiRouter.get(
  "/evaluations",
  asyncHandler(async (_request, response) => {
    response.json({ evaluations: await prisma.aiEvaluationRun.findMany({ orderBy: { createdAt: "desc" } }) });
  })
);

aiRouter.post(
  "/evaluations",
  asyncHandler(async (request, response) => {
    response.status(201).json(await recordAiEvaluation(request.body));
  })
);

aiRouter.post(
  "/interactions",
  asyncHandler(async (request, response) => {
    response.status(201).json({ interaction: await logAiInteraction(request.body) });
  })
);
