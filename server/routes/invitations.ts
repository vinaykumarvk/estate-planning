import { Router } from "express";
import { prisma } from "../db";
import { asyncHandler } from "./asyncHandler";
import { createInvitationSchema } from "../../shared/schemas";
import { encode } from "../services/json";
import { audit } from "../services/auditService";

export const invitationsRouter = Router();

invitationsRouter.get(
  "/",
  asyncHandler(async (request, response) => {
    const tenantId = response.locals.tenantId as string;
    const matterId = request.query.matterId as string | undefined;
    const where = matterId ? { tenantId, matterId } : { tenantId };
    const invitations = await prisma.invitation.findMany({ where, orderBy: { createdAt: "desc" } });
    response.json({ invitations });
  })
);

invitationsRouter.post(
  "/",
  asyncHandler(async (request, response) => {
    const data = createInvitationSchema.parse(request.body);
    const invitation = await prisma.invitation.create({
      data: {
        tenantId: data.tenantId,
        matterId: data.matterId,
        inviteeEmail: data.inviteeEmail,
        role: data.role,
        scopes: encode(data.scopes),
        expiresAt: data.expiresAt
      }
    });
    await audit({
      tenantId: data.tenantId,
      matterId: data.matterId,
      actorRole: "professional",
      eventType: "invitation.created",
      entityType: "Invitation",
      entityId: invitation.id,
      metadata: { requirementRefs: ["SEC-002"] }
    });
    response.status(201).json({ invitation });
  })
);

invitationsRouter.post(
  "/:invitationId/revoke",
  asyncHandler(async (request, response) => {
    const invitation = await prisma.invitation.update({
      where: { id: request.params.invitationId },
      data: { revokedAt: new Date() }
    });
    await audit({
      tenantId: invitation.tenantId,
      matterId: invitation.matterId,
      actorRole: "professional",
      eventType: "invitation.revoked",
      entityType: "Invitation",
      entityId: invitation.id,
      metadata: { requirementRefs: ["SEC-002"] }
    });
    response.json({ invitation });
  })
);
