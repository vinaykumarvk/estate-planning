import { Router } from "express";
import { z } from "zod";
import { asyncHandler } from "./asyncHandler";
import { getFileMetadata, linkFileToEntity, storeFile } from "../services/fileUploadService";

const storeFileSchema = z.object({
  tenantId: z.string().min(1),
  matterId: z.string().optional(),
  filename: z.string().min(1).max(255),
  mimeType: z.string().min(1),
  content: z.string().min(1),
  actorUserId: z.string().optional()
});

const linkFileSchema = z.object({
  entityType: z.enum(["Asset", "Person", "Document", "Matter"]),
  entityId: z.string().min(1),
  tenantId: z.string().min(1)
});

export const uploadsRouter = Router();

uploadsRouter.post(
  "/",
  asyncHandler(async (request, response) => {
    const data = storeFileSchema.parse(request.body);
    const file = await storeFile(data);
    response.status(201).json({ file });
  })
);

uploadsRouter.get(
  "/:fileId",
  asyncHandler(async (request, response) => {
    const file = await getFileMetadata(request.params.fileId);
    response.json({ file });
  })
);

uploadsRouter.post(
  "/:fileId/link",
  asyncHandler(async (request, response) => {
    const data = linkFileSchema.parse(request.body);
    const result = await linkFileToEntity(
      request.params.fileId,
      data.entityType,
      data.entityId,
      data.tenantId
    );
    response.json({ result });
  })
);
