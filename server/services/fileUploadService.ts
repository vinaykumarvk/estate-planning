import { prisma } from "../db";
import { stableHash } from "./json";
import { audit } from "./auditService";
import path from "node:path";

function sanitizeFilename(filename: string): string {
  const base = path.basename(filename).replace(/[^a-zA-Z0-9._-]/g, "_");
  return base || "unnamed";
}

export async function storeFile(input: {
  tenantId: string;
  matterId?: string;
  filename: string;
  mimeType: string;
  content: string; // base64 encoded
  actorUserId?: string;
}) {
  const buffer = Buffer.from(input.content, "base64");
  const hash = stableHash(input.content);
  const safeFilename = sanitizeFilename(input.filename);

  const file = await prisma.fileAttachment.create({
    data: {
      tenantId: input.tenantId,
      matterId: input.matterId,
      filename: safeFilename,
      mimeType: input.mimeType,
      sizeBytes: buffer.length,
      hash,
      storageLocation: `local:files/${hash}_${safeFilename}`
    }
  });

  await audit({
    tenantId: input.tenantId,
    matterId: input.matterId,
    actorUserId: input.actorUserId,
    actorRole: "professional",
    eventType: "file.uploaded",
    entityType: "FileAttachment",
    entityId: file.id,
    metadata: { filename: input.filename, sizeBytes: buffer.length, requirementRefs: ["FR-020"] }
  });

  return file;
}

export async function linkFileToEntity(fileId: string, entityType: string, entityId: string, tenantId: string) {
  const file = await prisma.fileAttachment.findUniqueOrThrow({ where: { id: fileId } });

  // Update evidence refs on the target entity
  if (entityType === "Asset") {
    const asset = await prisma.asset.findUniqueOrThrow({ where: { id: entityId } });
    const refs = JSON.parse(asset.evidenceRefs || "[]") as string[];
    refs.push(file.storageLocation);
    await prisma.asset.update({ where: { id: entityId }, data: { evidenceRefs: JSON.stringify(refs) } });
  }

  await audit({
    tenantId,
    actorRole: "professional",
    eventType: "file.linked",
    entityType: "FileAttachment",
    entityId: fileId,
    metadata: { linkedEntityType: entityType, linkedEntityId: entityId, requirementRefs: ["FR-020"] }
  });

  return { fileId, entityType, entityId, linked: true };
}

export async function getFileMetadata(fileId: string) {
  return prisma.fileAttachment.findUniqueOrThrow({ where: { id: fileId } });
}
