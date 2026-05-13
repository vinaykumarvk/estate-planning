import { Router } from "express";
import { prisma } from "../db";
import { asyncHandler } from "./asyncHandler";
import { createNotificationTemplateSchema, updateNotificationTemplateSchema } from "../../shared/schemas";
import { audit } from "../services/auditService";

export const notificationTemplatesRouter = Router();

notificationTemplatesRouter.get(
  "/",
  asyncHandler(async (_request, response) => {
    const templates = await prisma.notificationTemplate.findMany({ orderBy: { templateCode: "asc" } });
    response.json({ templates });
  })
);

notificationTemplatesRouter.post(
  "/",
  asyncHandler(async (request, response) => {
    const data = createNotificationTemplateSchema.parse(request.body);
    const template = await prisma.notificationTemplate.create({ data });
    await audit({
      tenantId: data.tenantId ?? "platform",
      actorRole: "platform_admin",
      eventType: "notification_template.created",
      entityType: "NotificationTemplate",
      entityId: template.id,
      metadata: { requirementRefs: ["FR-043"] }
    });
    response.status(201).json({ template });
  })
);

notificationTemplatesRouter.patch(
  "/:templateId",
  asyncHandler(async (request, response) => {
    const data = updateNotificationTemplateSchema.parse(request.body);
    const template = await prisma.notificationTemplate.update({
      where: { id: request.params.templateId },
      data
    });
    response.json({ template });
  })
);

notificationTemplatesRouter.delete(
  "/:templateId",
  asyncHandler(async (request, response) => {
    await prisma.notificationTemplate.delete({ where: { id: request.params.templateId } });
    response.json({ deleted: true });
  })
);
