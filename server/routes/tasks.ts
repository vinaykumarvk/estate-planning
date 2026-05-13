import { Router } from "express";
import { prisma } from "../db";
import { asyncHandler } from "./asyncHandler";
import { createTaskSchema, updateTaskSchema } from "../../shared/schemas";
import { encode } from "../services/json";
import { audit } from "../services/auditService";

export const tasksRouter = Router();

tasksRouter.get(
  "/",
  asyncHandler(async (request, response) => {
    const tenantId = response.locals.tenantId as string;
    const matterId = request.query.matterId as string | undefined;
    const where = matterId ? { tenantId, matterId } : { tenantId };
    const tasks = await prisma.task.findMany({ where, orderBy: { createdAt: "desc" } });
    response.json({ tasks });
  })
);

tasksRouter.post(
  "/",
  asyncHandler(async (request, response) => {
    const data = createTaskSchema.parse(request.body);
    const task = await prisma.task.create({ data });
    await audit({
      tenantId: data.tenantId,
      matterId: data.matterId,
      actorRole: "system",
      eventType: "task.created",
      entityType: "Task",
      entityId: task.id,
      metadata: { requirementRefs: ["FR-026"] }
    });
    response.status(201).json({ task });
  })
);

tasksRouter.patch(
  "/:taskId",
  asyncHandler(async (request, response) => {
    const updates = updateTaskSchema.parse(request.body);
    const task = await prisma.task.update({
      where: { id: request.params.taskId },
      data: updates
    });
    await audit({
      tenantId: task.tenantId,
      matterId: task.matterId ?? undefined,
      actorRole: "system",
      eventType: "task.updated",
      entityType: "Task",
      entityId: task.id,
      metadata: { requirementRefs: ["FR-026"] }
    });
    response.json({ task });
  })
);

tasksRouter.delete(
  "/:taskId",
  asyncHandler(async (request, response) => {
    const task = await prisma.task.delete({ where: { id: request.params.taskId } });
    await audit({
      tenantId: task.tenantId,
      matterId: task.matterId ?? undefined,
      actorRole: "system",
      eventType: "task.deleted",
      entityType: "Task",
      entityId: task.id,
      metadata: { requirementRefs: ["FR-026"] }
    });
    response.json({ deleted: true });
  })
);
