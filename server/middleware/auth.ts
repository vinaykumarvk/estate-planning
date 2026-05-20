import { createHash } from "node:crypto";
import type { NextFunction, Request, Response } from "express";
import { prisma } from "../db";

function hashApiKey(value: string): string {
  return createHash("sha256").update(value).digest("hex");
}

const publicPaths = new Set(["/api/health", "/api/health/live", "/api/health/ready"]);

export async function requireApiKey(request: Request, response: Response, next: NextFunction) {
  if (publicPaths.has(request.path) || !request.path.startsWith("/api/")) {
    next();
    return;
  }

  const apiKey = request.header("x-api-key");
  if (!apiKey) {
    response.status(401).json({ error: "API key required" });
    return;
  }

  const record = await prisma.apiKey.findFirst({
    where: { keyHash: hashApiKey(apiKey), status: "active" }
  });

  if (!record) {
    response.status(403).json({ error: "Invalid API key" });
    return;
  }

  const userId = request.header("x-user-id");
  if (userId) {
    const tenantUser = await prisma.tenantUser.findFirst({
      where: { tenantId: record.tenantId, userId, status: "active" }
    });
    if (!tenantUser) {
      response.status(403).json({ error: "User is not active for this tenant" });
      return;
    }
    response.locals.userId = userId;
    response.locals.userRole = tenantUser.role;
  }

  await prisma.apiKey.update({
    where: { id: record.id },
    data: { lastUsedAt: new Date() }
  });

  response.locals.tenantId = record.tenantId;
  next();
}
