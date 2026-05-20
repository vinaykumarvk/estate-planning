import path from "node:path";
import { fileURLToPath } from "node:url";
import cors from "cors";
import express from "express";
import { ZodError } from "zod";
import { prisma } from "./db";
import { requireApiKey } from "./middleware/auth";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
import { requestId } from "./middleware/requestId";
import { securityHeaders } from "./middleware/securityHeaders";
import { apiRateLimit } from "./middleware/rateLimit";
import { adminRouter } from "./routes/admin";
import { aiRouter } from "./routes/ai";
import { deferredRouter } from "./routes/deferred";
import { exportsRouter } from "./routes/exports";
import { invitationsRouter } from "./routes/invitations";
import { liabilitiesRouter } from "./routes/liabilities";
import { mattersRouter } from "./routes/matters";
import { messagesRouter } from "./routes/messages";
import { notificationsRouter } from "./routes/notifications";
import { planningRouter } from "./routes/planning";
import { reportsRouter } from "./routes/reports";
import { tasksRouter } from "./routes/tasks";
import { servicePackagesRouter } from "./routes/servicePackages";
import { notificationTemplatesRouter } from "./routes/notificationTemplates";
import { assetTaxonomyRouter } from "./routes/assetTaxonomy";
import { uploadsRouter } from "./routes/uploads";
import { webhooksRouter } from "./routes/webhooks";
import { willsRouter } from "./routes/wills";
import { ihtRouter } from "./routes/iht";
import { faraidRouter } from "./routes/faraid";
import { goalsRouter } from "./routes/goals";
import { openapiRouter } from "./routes/openapi";
import { giftsRouter, balanceSheetRouter } from "./routes/gifts";
import { estatePlanningRouter } from "./routes/estatePlanning";

export function createApp() {
  const app = express();

  if (process.env.NODE_ENV === "production") {
    app.set("trust proxy", 1);
  }

  app.use(requestId);

  app.use(
    cors({
      origin: process.env.CORS_ORIGIN ?? "http://127.0.0.1:5173",
      credentials: true
    })
  );

  app.use(securityHeaders);
  app.use(apiRateLimit);
  app.use(express.json({ limit: "2mb" }));
  app.use(requireApiKey);

  // --- Health probes (NFR-001) ---

  app.get("/api/health", async (_request, response) => {
    const [tenants, packs] = await Promise.all([prisma.tenant.count(), prisma.jurisdictionPack.count()]);
    response.json({ status: "ok", tenants, packs, brd: "Estate_Planning_Platform_BRD_v2.md" });
  });

  app.get("/api/health/live", (_request, response) => {
    response.json({ status: "ok" });
  });

  app.get("/api/health/ready", async (_request, response) => {
    try {
      const tenants = await prisma.tenant.count();
      if (tenants === 0) {
        response.status(503).json({ status: "not_ready", reason: "no_data" });
        return;
      }
      response.json({ status: "ready", tenants });
    } catch {
      response.status(503).json({ status: "not_ready", reason: "db_unreachable" });
    }
  });

  app.get("/api/bootstrap", async (_request, response) => {
    const tenantId = response.locals.tenantId as string;
    const [tenant, matters, packs, kpis] = await Promise.all([
      prisma.tenant.findFirst({ where: { id: tenantId } }),
      prisma.matter.findMany({ where: { tenantId }, orderBy: { updatedAt: "desc" } }),
      prisma.jurisdictionPack.findMany({ orderBy: { jurisdictionCode: "asc" } }),
      prisma.reportSnapshot.findFirst({ where: { reportCode: "phase-1-kpis" }, orderBy: { createdAt: "desc" } })
    ]);
    response.json({ tenant, matters, packs, kpis });
  });

  app.use("/api/admin", adminRouter);
  app.use("/api/matters", mattersRouter);
  app.use("/api/planning", planningRouter);
  app.use("/api/ai", aiRouter);
  app.use("/api/exports", exportsRouter);
  app.use("/api/reports", reportsRouter);
  app.use("/api/deferred", deferredRouter);
  app.use("/api/tasks", tasksRouter);
  app.use("/api/messages", messagesRouter);
  app.use("/api/invitations", invitationsRouter);
  app.use("/api/notifications", notificationsRouter);
  app.use("/api/liabilities", liabilitiesRouter);
  app.use("/api/service-packages", servicePackagesRouter);
  app.use("/api/notification-templates", notificationTemplatesRouter);
  app.use("/api/asset-taxonomy", assetTaxonomyRouter);
  app.use("/api/uploads", uploadsRouter);
  app.use("/api/webhooks", webhooksRouter);
  app.use("/api", willsRouter);
  app.use("/api/iht", ihtRouter);
  app.use("/api/faraid", faraidRouter);
  app.use("/api", goalsRouter);
  app.use("/api/matters/:matterId/gifts", giftsRouter);
  app.use("/api/matters/:matterId/balance-sheet", balanceSheetRouter);
  app.use("/api/matters/:matterId/estate-planning", estatePlanningRouter);
  app.use("/api", openapiRouter);

  // --- Static file serving for production SPA ---
  if (process.env.NODE_ENV === "production") {
    const clientDir = process.env.CLIENT_DIR ?? path.resolve(__dirname, "../dist/client");
    app.use(express.static(clientDir));
    app.get("*", (_req, res) => {
      res.sendFile(path.join(clientDir, "index.html"));
    });
  }

  app.use((error: unknown, _request: express.Request, response: express.Response, _next: express.NextFunction) => {
    if (error instanceof ZodError) {
      response.status(400).json({ error: "VALIDATION_ERROR", details: error.flatten() });
      return;
    }

    const internalMessage = error instanceof Error ? error.message : "Unexpected error";
    const status = /not found|unknown/i.test(internalMessage) ? 404 : /blocked|cannot|gated/i.test(internalMessage) ? 409 : 500;
    const clientMessage = status === 404 ? "Resource not found" : status === 409 ? "Operation not allowed" : "Internal server error";
    response.status(status).json({ error: clientMessage });
  });

  return app;
}
