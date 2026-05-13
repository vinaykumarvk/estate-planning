import { Router } from "express";
import { prisma } from "../db";
import { asyncHandler } from "./asyncHandler";
import { createLiabilitySchema, updateLiabilitySchema } from "../../shared/schemas";
import { encode } from "../services/json";
import { audit } from "../services/auditService";

export const liabilitiesRouter = Router();

liabilitiesRouter.get(
  "/",
  asyncHandler(async (request, response) => {
    const tenantId = response.locals.tenantId as string;
    const matterId = request.query.matterId as string | undefined;
    const where = matterId ? { tenantId, matterId } : { tenantId };
    const liabilities = await prisma.liability.findMany({ where, orderBy: { createdAt: "desc" } });
    response.json({ liabilities });
  })
);

liabilitiesRouter.post(
  "/",
  asyncHandler(async (request, response) => {
    const data = createLiabilitySchema.parse(request.body);
    const liability = await prisma.liability.create({
      data: {
        tenantId: data.tenantId,
        matterId: data.matterId,
        liabilityType: data.liabilityType,
        description: data.description,
        creditor: data.creditor,
        currency: data.currency,
        amount: data.amount,
        dueDate: data.dueDate,
        evidenceRefs: encode(data.evidenceRefs)
      }
    });
    await audit({
      tenantId: data.tenantId,
      matterId: data.matterId,
      actorRole: "professional",
      eventType: "liability.created",
      entityType: "Liability",
      entityId: liability.id,
      metadata: { requirementRefs: ["CR-003"] }
    });
    response.status(201).json({ liability });
  })
);

liabilitiesRouter.patch(
  "/:liabilityId",
  asyncHandler(async (request, response) => {
    const updates = updateLiabilitySchema.parse(request.body);
    const updateData: Record<string, unknown> = { ...updates };
    if (updates.evidenceRefs) {
      updateData.evidenceRefs = encode(updates.evidenceRefs);
    }
    const liability = await prisma.liability.update({
      where: { id: request.params.liabilityId },
      data: updateData
    });
    await audit({
      tenantId: liability.tenantId,
      matterId: liability.matterId,
      actorRole: "professional",
      eventType: "liability.updated",
      entityType: "Liability",
      entityId: liability.id,
      metadata: { requirementRefs: ["CR-003"] }
    });
    response.json({ liability });
  })
);

liabilitiesRouter.delete(
  "/:liabilityId",
  asyncHandler(async (request, response) => {
    const liability = await prisma.liability.delete({ where: { id: request.params.liabilityId } });
    await audit({
      tenantId: liability.tenantId,
      matterId: liability.matterId,
      actorRole: "professional",
      eventType: "liability.deleted",
      entityType: "Liability",
      entityId: liability.id,
      metadata: { requirementRefs: ["CR-003"] }
    });
    response.json({ deleted: true });
  })
);
