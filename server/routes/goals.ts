import { Router } from "express";
import { asyncHandler } from "./asyncHandler";
import { createClientGoalSchema, updateClientGoalSchema } from "../../shared/schemas";
import {
  createGoal,
  updateGoal,
  deleteGoal,
  listGoals,
  getGoal,
  analyzeGoalGaps,
} from "../services/goalService";

export const goalsRouter = Router();

// GET /api/matters/:matterId/goals
goalsRouter.get(
  "/matters/:matterId/goals",
  asyncHandler(async (request, response) => {
    const tenantId = response.locals.tenantId as string;
    const goals = await listGoals(request.params.matterId, tenantId);
    response.json({ goals });
  })
);

// POST /api/matters/:matterId/goals
goalsRouter.post(
  "/matters/:matterId/goals",
  asyncHandler(async (request, response) => {
    const tenantId = response.locals.tenantId as string;
    const input = createClientGoalSchema.parse({
      ...request.body,
      tenantId,
      matterId: request.params.matterId,
    }) as {
      tenantId: string;
      matterId: string;
      goalText: string;
      category: string;
      priority: string;
      linkedScenarioIds?: string[];
      notes?: string;
    };
    const goal = await createGoal(input);
    response.status(201).json({ goal });
  })
);

// GET /api/matters/:matterId/goals/gap-analysis
goalsRouter.get(
  "/matters/:matterId/goals/gap-analysis",
  asyncHandler(async (request, response) => {
    const tenantId = response.locals.tenantId as string;
    const analysis = await analyzeGoalGaps(request.params.matterId, tenantId);
    response.json({ analysis });
  })
);

// GET /api/goals/:id
goalsRouter.get(
  "/goals/:id",
  asyncHandler(async (request, response) => {
    const tenantId = response.locals.tenantId as string;
    const goal = await getGoal(request.params.id, tenantId);
    if (!goal) {
      response.status(404).json({ error: "Not found" });
      return;
    }
    response.json({ goal });
  })
);

// PATCH /api/goals/:id
goalsRouter.patch(
  "/goals/:id",
  asyncHandler(async (request, response) => {
    const tenantId = response.locals.tenantId as string;
    const input = updateClientGoalSchema.parse(request.body);
    const goal = await updateGoal(request.params.id, tenantId, input);
    response.json({ goal });
  })
);

// DELETE /api/goals/:id
goalsRouter.delete(
  "/goals/:id",
  asyncHandler(async (request, response) => {
    const tenantId = response.locals.tenantId as string;
    await deleteGoal(request.params.id, tenantId);
    response.json({ deleted: true });
  })
);
