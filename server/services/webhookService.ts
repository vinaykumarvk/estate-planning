import { createHmac } from "node:crypto";
import { prisma } from "../db";
import { createWebhookSchema } from "../../shared/schemas";
import { encode } from "./json";
import { audit } from "./auditService";

export async function registerWebhook(input: unknown) {
  const data = createWebhookSchema.parse(input);
  const hmacKey = process.env.WEBHOOK_HMAC_KEY;
  if (!hmacKey) throw new Error("WEBHOOK_HMAC_KEY environment variable must be set");
  const secretHash = createHmac("sha256", hmacKey).update(data.secret).digest("hex");

  const webhook = await prisma.webhookSubscription.create({
    data: {
      tenantId: data.tenantId,
      url: data.url,
      events: encode(data.events),
      secretHash,
      status: data.status
    }
  });

  await audit({
    tenantId: data.tenantId,
    actorRole: "platform_admin",
    eventType: "webhook.registered",
    entityType: "WebhookSubscription",
    entityId: webhook.id,
    metadata: { url: data.url, events: data.events, requirementRefs: ["FR-047"] }
  });

  return webhook;
}

export async function dispatchWebhook(tenantId: string, eventType: string, payload: unknown) {
  const webhooks = await prisma.webhookSubscription.findMany({
    where: { tenantId, status: "active" }
  });

  const dispatched: string[] = [];

  for (const webhook of webhooks) {
    const events = JSON.parse(webhook.events) as string[];
    if (!events.includes("*") && !events.includes(eventType)) continue;

    const body = JSON.stringify({ eventType, payload, timestamp: new Date().toISOString() });
    const signature = createHmac("sha256", webhook.secretHash).update(body).digest("hex");

    // In production, this would be an HTTP POST. For now, log the dispatch.
    dispatched.push(webhook.id);
  }

  return { eventType, dispatchedCount: dispatched.length };
}

export async function listWebhooks(tenantId: string) {
  return prisma.webhookSubscription.findMany({
    where: { tenantId },
    orderBy: { createdAt: "desc" }
  });
}

export async function deleteWebhook(webhookId: string) {
  await prisma.webhookSubscription.delete({ where: { id: webhookId } });
  return { deleted: true };
}
