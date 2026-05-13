import { Router } from "express";
import { prisma } from "../db";
import { asyncHandler } from "./asyncHandler";
import { createNotificationSchema } from "../../shared/schemas";
import { audit } from "../services/auditService";

export const notificationsRouter = Router();

notificationsRouter.get(
  "/",
  asyncHandler(async (request, response) => {
    const tenantId = response.locals.tenantId as string;
    const status = request.query.status as string | undefined;
    const where = status ? { tenantId, status } : { tenantId };
    const notifications = await prisma.notification.findMany({ where, orderBy: { createdAt: "desc" } });
    response.json({ notifications });
  })
);

notificationsRouter.post(
  "/",
  asyncHandler(async (request, response) => {
    const data = createNotificationSchema.parse(request.body);
    const notification = await prisma.notification.create({ data });
    await audit({
      tenantId: data.tenantId,
      matterId: data.matterId,
      actorRole: "system",
      eventType: "notification.created",
      entityType: "Notification",
      entityId: notification.id,
      metadata: { requirementRefs: ["FR-029"] }
    });
    response.status(201).json({ notification });
  })
);
