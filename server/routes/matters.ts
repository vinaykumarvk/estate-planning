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
  getMatterWorkspace,
  updateMatter,
  updatePerson
} from "../services/matterService";
import { advanceIntake, calculateIntakeScore, getIntakeWorkflowState, validateIntakeStep } from "../services/intakeService";
import type { IntakeModule } from "../../shared/types";

export const mattersRouter = Router();

async function assertMatterAccess(matterId: string, tenantId: string) {
  await prisma.matter.findFirstOrThrow({
    where: { id: matterId, tenantId },
    select: { id: true }
  });
}

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
    const tenantId = response.locals.tenantId as string;
    const actorUserId = (response.locals.userId as string | undefined) ?? request.header("x-user-id") ?? "system";
    response.status(201).json({
      matter: await createMatter({ ...request.body, tenantId, createdByUserId: actorUserId })
    });
  })
);

mattersRouter.get(
  "/:matterId",
  asyncHandler(async (request, response) => {
    await assertMatterAccess(request.params.matterId, response.locals.tenantId as string);
    response.json(await getMatterWorkspace(request.params.matterId));
  })
);

mattersRouter.patch(
  "/:matterId",
  asyncHandler(async (request, response) => {
    await assertMatterAccess(request.params.matterId, response.locals.tenantId as string);
    response.json({ matter: await updateMatter(request.params.matterId, request.body) });
  })
);

mattersRouter.get(
  "/:matterId/intake-score",
  asyncHandler(async (request, response) => {
    await assertMatterAccess(request.params.matterId, response.locals.tenantId as string);
    response.json({ intake: await calculateIntakeScore(request.params.matterId) });
  })
);

mattersRouter.post(
  "/:matterId/people",
  asyncHandler(async (request, response) => {
    const tenantId = response.locals.tenantId as string;
    await assertMatterAccess(request.params.matterId, tenantId);
    response.status(201).json({ person: await addPerson({ ...request.body, tenantId, matterId: request.params.matterId }) });
  })
);

mattersRouter.patch(
  "/:matterId/people/:personId",
  asyncHandler(async (request, response) => {
    await assertMatterAccess(request.params.matterId, response.locals.tenantId as string);
    response.json({ person: await updatePerson(request.params.personId, request.body) });
  })
);

mattersRouter.delete(
  "/:matterId/people/:personId",
  asyncHandler(async (request, response) => {
    const tenantId = response.locals.tenantId as string;
    await assertMatterAccess(request.params.matterId, tenantId);
    const result = await prisma.person.deleteMany({
      where: { id: request.params.personId, matterId: request.params.matterId, tenantId }
    });
    if (result.count === 0) throw new Error("Person not found");
    response.json({ deleted: true });
  })
);

mattersRouter.delete(
  "/:matterId/assets/:assetId",
  asyncHandler(async (request, response) => {
    const tenantId = response.locals.tenantId as string;
    await assertMatterAccess(request.params.matterId, tenantId);
    const result = await prisma.asset.deleteMany({
      where: { id: request.params.assetId, matterId: request.params.matterId, tenantId }
    });
    if (result.count === 0) throw new Error("Asset not found");
    response.json({ deleted: true });
  })
);

mattersRouter.get(
  "/:matterId/consents",
  asyncHandler(async (request, response) => {
    const tenantId = response.locals.tenantId as string;
    await assertMatterAccess(request.params.matterId, tenantId);
    const consents = await prisma.consent.findMany({
      where: { matterId: request.params.matterId, tenantId },
      orderBy: { createdAt: "asc" },
    });
    response.json({ consents });
  })
);

mattersRouter.post(
  "/:matterId/relationships",
  asyncHandler(async (request, response) => {
    const tenantId = response.locals.tenantId as string;
    await assertMatterAccess(request.params.matterId, tenantId);
    response.status(201).json({ relationship: await addRelationship({ ...request.body, tenantId, matterId: request.params.matterId }) });
  })
);

mattersRouter.post(
  "/:matterId/assets",
  asyncHandler(async (request, response) => {
    const tenantId = response.locals.tenantId as string;
    await assertMatterAccess(request.params.matterId, tenantId);
    response.status(201).json({ asset: await addAsset({ ...request.body, tenantId, matterId: request.params.matterId }) });
  })
);

mattersRouter.post(
  "/:matterId/scenarios",
  asyncHandler(async (request, response) => {
    const tenantId = response.locals.tenantId as string;
    await assertMatterAccess(request.params.matterId, tenantId);
    response.status(201).json({ scenario: await createScenario({ ...request.body, tenantId, matterId: request.params.matterId }) });
  })
);

mattersRouter.post(
  "/:matterId/dispositions",
  asyncHandler(async (request, response) => {
    const tenantId = response.locals.tenantId as string;
    await assertMatterAccess(request.params.matterId, tenantId);
    response.status(201).json({ disposition: await addDisposition({ ...request.body, tenantId, matterId: request.params.matterId }) });
  })
);

mattersRouter.post(
  "/:matterId/consents/:consentId/acknowledge",
  asyncHandler(async (request, response) => {
    const tenantId = response.locals.tenantId as string;
    await assertMatterAccess(request.params.matterId, tenantId);
    const consent = await prisma.consent.findFirstOrThrow({
      where: { id: request.params.consentId, matterId: request.params.matterId, tenantId },
      select: { id: true }
    });
    response.json({
      consent: await acknowledgeConsent(
        consent.id,
        (response.locals.userId as string | undefined) ?? String(request.body.actorUserId ?? "system")
      )
    });
  })
);

mattersRouter.get(
  "/:matterId/dispositions",
  asyncHandler(async (request, response) => {
    await assertMatterAccess(request.params.matterId, response.locals.tenantId as string);
    const dispositions = await prisma.disposition.findMany({
      where: { matterId: request.params.matterId },
      orderBy: { createdAt: "asc" }
    });
    response.json({ dispositions });
  })
);

mattersRouter.get(
  "/:matterId/scenarios/:scenarioId/dispositions",
  asyncHandler(async (request, response) => {
    await assertMatterAccess(request.params.matterId, response.locals.tenantId as string);
    const dispositions = await prisma.disposition.findMany({
      where: { matterId: request.params.matterId, scenarioId: request.params.scenarioId },
      orderBy: { createdAt: "asc" }
    });
    response.json({ dispositions });
  })
);

mattersRouter.delete(
  "/:matterId/dispositions/:dispositionId",
  asyncHandler(async (request, response) => {
    const tenantId = response.locals.tenantId as string;
    await assertMatterAccess(request.params.matterId, tenantId);
    const disposition = await prisma.disposition.deleteMany({
      where: { id: request.params.dispositionId, matterId: request.params.matterId, tenantId }
    });
    if (disposition.count === 0) throw new Error("Disposition not found");
    response.json({ deleted: true });
  })
);

mattersRouter.get(
  "/:matterId/relationships",
  asyncHandler(async (request, response) => {
    const tenantId = response.locals.tenantId as string;
    await assertMatterAccess(request.params.matterId, tenantId);
    const relationships = await prisma.relationship.findMany({
      where: { matterId: request.params.matterId, tenantId },
      orderBy: { createdAt: "asc" }
    });
    response.json({ relationships });
  })
);

mattersRouter.delete(
  "/:matterId/relationships/:relationshipId",
  asyncHandler(async (request, response) => {
    const tenantId = response.locals.tenantId as string;
    await assertMatterAccess(request.params.matterId, tenantId);
    const relationship = await prisma.relationship.deleteMany({
      where: { id: request.params.relationshipId, matterId: request.params.matterId, tenantId }
    });
    if (relationship.count === 0) throw new Error("Relationship not found");
    response.json({ deleted: true });
  })
);

// --- Intake workflow (G-012 FR-005) ---

mattersRouter.get(
  "/:matterId/intake-workflow",
  asyncHandler(async (request, response) => {
    await assertMatterAccess(request.params.matterId, response.locals.tenantId as string);
    response.json({ workflow: await getIntakeWorkflowState(request.params.matterId) });
  })
);

mattersRouter.post(
  "/:matterId/intake-workflow/advance",
  asyncHandler(async (request, response) => {
    await assertMatterAccess(request.params.matterId, response.locals.tenantId as string);
    response.json({ result: await advanceIntake({ ...request.body, matterId: request.params.matterId }) });
  })
);

mattersRouter.get(
  "/:matterId/intake-workflow/validate/:module",
  asyncHandler(async (request, response) => {
    await assertMatterAccess(request.params.matterId, response.locals.tenantId as string);
    const errors = await validateIntakeStep(request.params.matterId, request.params.module as IntakeModule);
    response.json({ module: request.params.module, errors });
  })
);
