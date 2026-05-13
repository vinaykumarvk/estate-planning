import { Router } from "express";
import { prisma } from "../db";
import { asyncHandler } from "./asyncHandler";
import { createMessageSchema } from "../../shared/schemas";
import { audit } from "../services/auditService";

export const messagesRouter = Router();

messagesRouter.get(
  "/",
  asyncHandler(async (request, response) => {
    const tenantId = response.locals.tenantId as string;
    const matterId = request.query.matterId as string | undefined;
    const where = matterId ? { tenantId, matterId } : { tenantId };
    const messages = await prisma.message.findMany({ where, orderBy: { createdAt: "desc" } });
    response.json({ messages });
  })
);

messagesRouter.post(
  "/",
  asyncHandler(async (request, response) => {
    const data = createMessageSchema.parse(request.body);
    const message = await prisma.message.create({ data });
    await audit({
      tenantId: data.tenantId,
      matterId: data.matterId,
      actorUserId: data.senderUserId,
      actorRole: "professional",
      eventType: "message.created",
      entityType: "Message",
      entityId: message.id,
      metadata: { requirementRefs: ["FR-028"] }
    });
    response.status(201).json({ message });
  })
);
