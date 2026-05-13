import { prisma } from "../db";
import { encode } from "./json";

export interface AuditInput {
  tenantId: string;
  matterId?: string;
  actorUserId?: string;
  actorRole: string;
  eventType: string;
  entityType: string;
  entityId?: string;
  ruleVersion?: string;
  metadata?: unknown;
}

export async function audit(input: AuditInput) {
  return prisma.auditEvent.create({
    data: {
      tenantId: input.tenantId,
      matterId: input.matterId,
      actorUserId: input.actorUserId,
      actorRole: input.actorRole,
      eventType: input.eventType,
      entityType: input.entityType,
      entityId: input.entityId,
      ruleVersion: input.ruleVersion,
      metadata: encode(input.metadata ?? {})
    }
  });
}
