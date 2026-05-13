import { Router } from "express";
import { asyncHandler } from "./asyncHandler";
import { deleteWebhook, listWebhooks, registerWebhook } from "../services/webhookService";

export const webhooksRouter = Router();

webhooksRouter.get(
  "/",
  asyncHandler(async (_request, response) => {
    const tenantId = response.locals.tenantId as string;
    response.json({ webhooks: await listWebhooks(tenantId) });
  })
);

webhooksRouter.post(
  "/",
  asyncHandler(async (request, response) => {
    response.status(201).json({ webhook: await registerWebhook(request.body) });
  })
);

webhooksRouter.delete(
  "/:webhookId",
  asyncHandler(async (request, response) => {
    response.json(await deleteWebhook(request.params.webhookId));
  })
);
