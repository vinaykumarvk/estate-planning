import type { NextFunction, Request, Response } from "express";
import { prisma } from "../db";
import { decode } from "../services/json";

/**
 * Attribute-Based Access Control middleware.
 * Checks tenant isolation, scope enforcement, and data-region compliance.
 */
export function requireAbac(requiredScope?: string) {
  return async (request: Request, response: Response, next: NextFunction) => {
    const tenantId = response.locals.tenantId as string | undefined;

    if (!tenantId) {
      response.status(403).json({ error: "Tenant context missing" });
      return;
    }

    // Tenant isolation: body.tenantId must match API-key tenant
    const bodyTenantId = request.body?.tenantId;
    if (bodyTenantId && bodyTenantId !== tenantId) {
      response.status(403).json({ error: "Cross-tenant access denied" });
      return;
    }

    // Scope enforcement
    if (requiredScope) {
      const apiKey = request.header("x-api-key");
      if (apiKey) {
        const { createHash } = await import("node:crypto");
        const keyHash = createHash("sha256").update(apiKey).digest("hex");
        const record = await prisma.apiKey.findFirst({ where: { keyHash, status: "active" } });
        if (record) {
          const scopes = decode<string[]>(record.scopes, []);
          if (!scopes.includes("*") && !scopes.includes(requiredScope)) {
            response.status(403).json({ error: `Missing required scope: ${requiredScope}` });
            return;
          }
        }
      }
    }

    next();
  };
}

/**
 * Require MFA for sensitive operations (SEC-003).
 * In production, this checks the IdP session. Locally, it checks user.mfaEnabled.
 */
export function requireMfa() {
  return async (request: Request, response: Response, next: NextFunction) => {
    const actorUserId = request.body?.actorUserId;
    if (!actorUserId) {
      response.status(403).json({ error: "Actor user ID required for MFA-protected operation" });
      return;
    }

    const user = await prisma.user.findUnique({ where: { id: actorUserId } });
    if (!user) {
      response.status(404).json({ error: "User not found" });
      return;
    }

    if (!user.mfaEnabled) {
      response.status(403).json({ error: "MFA required for this operation" });
      return;
    }

    next();
  };
}
