import { Router } from "express";
import { prisma } from "../db";
import { asyncHandler } from "./asyncHandler";
import {
  acknowledgeConsent,
  addAsset,
  addDisposition,
  addPerson,
  addRelationship,
  createMatter,
  createScenario,
  getMatterWorkspace
} from "../services/matterService";
import { advanceIntake, calculateIntakeScore, getIntakeWorkflowState, validateIntakeStep } from "../services/intakeService";
import type { IntakeModule } from "../../shared/types";

export const mattersRouter = Router();

mattersRouter.get(
  "/",
  asyncHandler(async (_request, response) => {
    const tenantId = response.locals.tenantId as string;
    const matters = await prisma.matter.findMany({ where: { tenantId }, orderBy: { updatedAt: "desc" } });
    response.json({ matters });
  })
);

mattersRouter.post(
  "/",
  asyncHandler(async (request, response) => {
    response.status(201).json({ matter: await createMatter(request.body) });
  })
);

mattersRouter.get(
  "/:matterId",
  asyncHandler(async (request, response) => {
    response.json(await getMatterWorkspace(request.params.matterId));
  })
);

mattersRouter.get(
  "/:matterId/intake-score",
  asyncHandler(async (request, response) => {
    response.json({ intake: await calculateIntakeScore(request.params.matterId) });
  })
);

mattersRouter.post(
  "/:matterId/people",
  asyncHandler(async (request, response) => {
    response.status(201).json({ person: await addPerson({ ...request.body, matterId: request.params.matterId }) });
  })
);

mattersRouter.post(
  "/:matterId/relationships",
  asyncHandler(async (request, response) => {
    response.status(201).json({ relationship: await addRelationship({ ...request.body, matterId: request.params.matterId }) });
  })
);

mattersRouter.post(
  "/:matterId/assets",
  asyncHandler(async (request, response) => {
    response.status(201).json({ asset: await addAsset({ ...request.body, matterId: request.params.matterId }) });
  })
);

mattersRouter.post(
  "/:matterId/scenarios",
  asyncHandler(async (request, response) => {
    response.status(201).json({ scenario: await createScenario({ ...request.body, matterId: request.params.matterId }) });
  })
);

mattersRouter.post(
  "/:matterId/dispositions",
  asyncHandler(async (request, response) => {
    response.status(201).json({ disposition: await addDisposition({ ...request.body, matterId: request.params.matterId }) });
  })
);

mattersRouter.post(
  "/:matterId/consents/:consentId/acknowledge",
  asyncHandler(async (request, response) => {
    response.json({ consent: await acknowledgeConsent(request.params.consentId, String(request.body.actorUserId ?? "system")) });
  })
);

mattersRouter.get(
  "/:matterId/dispositions",
  asyncHandler(async (request, response) => {
    const dispositions = await prisma.disposition.findMany({
      where: { matterId: request.params.matterId },
      orderBy: { createdAt: "asc" }
    });
    response.json({ dispositions });
  })
);

mattersRouter.delete(
  "/:matterId/dispositions/:dispositionId",
  asyncHandler(async (request, response) => {
    const disposition = await prisma.disposition.delete({ where: { id: request.params.dispositionId } });
    response.json({ deleted: true });
  })
);

mattersRouter.get(
  "/:matterId/relationships",
  asyncHandler(async (request, response) => {
    const relationships = await prisma.relationship.findMany({
      where: { matterId: request.params.matterId },
      orderBy: { createdAt: "asc" }
    });
    response.json({ relationships });
  })
);

mattersRouter.delete(
  "/:matterId/relationships/:relationshipId",
  asyncHandler(async (request, response) => {
    const relationship = await prisma.relationship.delete({ where: { id: request.params.relationshipId } });
    response.json({ deleted: true });
  })
);

// --- Intake workflow (G-012 FR-005) ---

mattersRouter.get(
  "/:matterId/intake-workflow",
  asyncHandler(async (request, response) => {
    response.json({ workflow: await getIntakeWorkflowState(request.params.matterId) });
  })
);

mattersRouter.post(
  "/:matterId/intake-workflow/advance",
  asyncHandler(async (request, response) => {
    response.json({ result: await advanceIntake({ ...request.body, matterId: request.params.matterId }) });
  })
);

mattersRouter.get(
  "/:matterId/intake-workflow/validate/:module",
  asyncHandler(async (request, response) => {
    const errors = await validateIntakeStep(request.params.matterId, request.params.module as IntakeModule);
    response.json({ module: request.params.module, errors });
  })
);
