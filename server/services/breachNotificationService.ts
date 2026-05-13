import { prisma } from "../db";
import { audit } from "./auditService";

export async function detectBreach(incidentId: string) {
  const incident = await prisma.incident.findUniqueOrThrow({ where: { id: incidentId } });

  const isPersonalDataBreach = incident.incidentClass === "data_breach" ||
    incident.affectedUsers > 0 ||
    incident.description.toLowerCase().includes("personal data");

  const assessment = {
    incidentId,
    isPersonalDataBreach,
    affectedUsers: incident.affectedUsers,
    severity: incident.affectedUsers > 100 ? "high" : incident.affectedUsers > 10 ? "medium" : "low",
    gdprNotificationRequired: isPersonalDataBreach && incident.affectedUsers > 0,
    deadlineHours: 72,
    deadline: new Date(Date.now() + 72 * 60 * 60 * 1000).toISOString()
  };

  await audit({
    tenantId: incident.tenantId ?? "platform",
    actorRole: "system",
    eventType: "breach.assessed",
    entityType: "Incident",
    entityId: incidentId,
    metadata: { ...assessment, requirementRefs: ["SEC-014"] }
  });

  return assessment;
}

export async function triggerBreachNotification(incidentId: string, actorUserId: string) {
  const incident = await prisma.incident.findUniqueOrThrow({ where: { id: incidentId } });

  await prisma.incident.update({
    where: { id: incidentId },
    data: { breachNotified: true }
  });

  // Create notification records for affected users
  await prisma.notification.create({
    data: {
      tenantId: incident.tenantId ?? "platform",
      channel: "email",
      subject: `Data Breach Notification: ${incident.title}`,
      body: `A data breach has been detected affecting ${incident.affectedUsers} users. Incident: ${incident.title}. ${incident.description}`,
      status: "pending"
    }
  });

  await audit({
    tenantId: incident.tenantId ?? "platform",
    actorUserId,
    actorRole: "data_protection_officer",
    eventType: "breach.notified",
    entityType: "Incident",
    entityId: incidentId,
    metadata: { affectedUsers: incident.affectedUsers, requirementRefs: ["SEC-014"] }
  });

  return {
    incidentId,
    notified: true,
    notifiedAt: new Date().toISOString(),
    affectedUsers: incident.affectedUsers
  };
}

export async function markBreachNotified(incidentId: string) {
  return prisma.incident.update({
    where: { id: incidentId },
    data: { breachNotified: true }
  });
}
