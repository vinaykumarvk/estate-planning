import { Router } from "express";
import { asyncHandler } from "./asyncHandler";
import { phaseOneKpis, reportsIndex } from "../services/reportingService";
import { generateEstateSummaryPdf } from "../services/pdfReportService";
import { audit } from "../services/auditService";

export const reportsRouter = Router();

reportsRouter.get(
  "/phase-1-kpis",
  asyncHandler(async (_request, response) => {
    response.json({ kpis: await phaseOneKpis() });
  })
);

reportsRouter.get(
  "/snapshots",
  asyncHandler(async (_request, response) => {
    response.json({ reports: await reportsIndex() });
  })
);

reportsRouter.get(
  "/matters/:matterId/report/pdf",
  asyncHandler(async (request, response) => {
    const { matterId } = request.params;
    const tenantId = response.locals.tenantId as string;
    const locale = (request.query.locale as string) || "en";

    const pdf = await generateEstateSummaryPdf(matterId, tenantId, locale);

    await audit({
      tenantId,
      matterId,
      actorRole: "professional",
      eventType: "report.pdf_generated",
      entityType: "Matter",
      entityId: matterId,
      metadata: { locale, sizeBytes: pdf.length },
    });

    response.setHeader("Content-Type", "application/pdf");
    response.setHeader(
      "Content-Disposition",
      `inline; filename="estate-report-${matterId}.pdf"`
    );
    response.send(pdf);
  })
);
