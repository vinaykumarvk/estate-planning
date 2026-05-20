import { createRequire } from "node:module";
import { prisma } from "../db";
import { decode } from "./json";
import { t } from "./pdfTranslations";

// pdfmake ships as CommonJS; use createRequire for ESM compatibility.
const require = createRequire(import.meta.url);
const PdfPrinter = require("pdfmake/src/printer");
const vfsFonts = require("pdfmake/build/vfs_fonts");

// ---------------------------------------------------------------------------
// Font setup - extract Roboto from pdfmake virtual file system
// ---------------------------------------------------------------------------

const fonts = {
  Roboto: {
    normal: Buffer.from(vfsFonts["Roboto-Regular.ttf"], "base64"),
    bold: Buffer.from(vfsFonts["Roboto-Medium.ttf"], "base64"),
    italics: Buffer.from(vfsFonts["Roboto-Italic.ttf"], "base64"),
    bolditalics: Buffer.from(vfsFonts["Roboto-MediumItalic.ttf"], "base64"),
  },
};

const printer = new PdfPrinter(fonts);

// ---------------------------------------------------------------------------
// Branding constants
// ---------------------------------------------------------------------------

const FIRM_NAME = "Ecobank Africa";
const BRAND_DARK = "#1B2A4A";
const BRAND_ACCENT = "#2E5C9A";
const TABLE_HEADER_BG = "#E8EDF4";
const TABLE_STRIPE_BG = "#F6F8FB";

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

type PdfContent = Record<string, unknown>;

function formatDate(date: Date | string | null | undefined): string {
  if (!date) return "—";
  const d = typeof date === "string" ? new Date(date) : date;
  return d.toISOString().slice(0, 10);
}

function formatCurrency(value: number, currency?: string): string {
  const cur = currency ?? "GBP";
  try {
    return new Intl.NumberFormat("en-GB", { style: "currency", currency: cur }).format(value);
  } catch {
    return `${cur} ${value.toLocaleString("en-GB", { minimumFractionDigits: 2 })}`;
  }
}

function sectionHeading(text: string): PdfContent {
  return {
    text,
    style: "sectionHeader",
    margin: [0, 18, 0, 8],
  };
}

function tableHeaderCell(text: string): PdfContent {
  return { text, style: "tableHeader", fillColor: TABLE_HEADER_BG };
}

function emptyCell(fillColor?: string): PdfContent {
  return fillColor ? { text: "", fillColor } : { text: "" };
}

function stripedRow(cells: PdfContent[], rowIndex: number): PdfContent[] {
  if (rowIndex % 2 === 1) {
    return cells.map((c) => ({ ...c, fillColor: TABLE_STRIPE_BG }));
  }
  return cells;
}

// ---------------------------------------------------------------------------
// Main generator
// ---------------------------------------------------------------------------

export async function generateEstateSummaryPdf(
  matterId: string,
  tenantId: string,
  locale: string
): Promise<Buffer> {
  // 1. Fetch all relevant data in parallel
  const [
    matter,
    people,
    relationships,
    assets,
    liabilities,
    scenarios,
    lifetimeGifts,
    willCoordinations,
    clientGoals,
    ihtCalculations,
  ] = await Promise.all([
    prisma.matter.findFirstOrThrow({ where: { id: matterId, tenantId } }),
    prisma.person.findMany({ where: { matterId, tenantId }, orderBy: { createdAt: "asc" } }),
    prisma.relationship.findMany({ where: { matterId, tenantId }, orderBy: { createdAt: "asc" } }),
    prisma.asset.findMany({ where: { matterId, tenantId }, orderBy: { createdAt: "asc" } }),
    prisma.liability.findMany({ where: { matterId, tenantId }, orderBy: { createdAt: "asc" } }),
    prisma.scenario.findMany({ where: { matterId, tenantId }, orderBy: { createdAt: "asc" } }),
    prisma.lifetimeGift.findMany({ where: { matterId, tenantId }, orderBy: { giftDate: "asc" } }),
    prisma.willCoordination.findMany({ where: { matterId, tenantId }, orderBy: { createdAt: "asc" } }),
    prisma.clientGoal.findMany({ where: { matterId, tenantId }, orderBy: { createdAt: "asc" } }),
    prisma.ihtCalculation.findMany({ where: { matterId, tenantId }, orderBy: { createdAt: "desc" } }),
  ]);

  // Fetch domicile records for the testator (first person)
  const testator = people[0] ?? null;
  const domicileRecords = testator
    ? await prisma.domicileRecord.findMany({ where: { personId: testator.id, tenantId } })
    : [];

  // Build a lookup: personId -> relationship type(s)
  const roleMap = new Map<string, string>();
  for (const rel of relationships) {
    const existing = roleMap.get(rel.toPersonId);
    const label = rel.relationshipType;
    roleMap.set(rel.toPersonId, existing ? `${existing}, ${label}` : label);
  }
  // The first person is typically the testator/client
  if (testator && !roleMap.has(testator.id)) {
    roleMap.set(testator.id, "Testator / Client");
  }

  // Compute totals
  const totalAssets = assets.reduce((s, a) => s + a.valuation, 0);
  const totalLiabilities = liabilities.reduce((s, l) => s + l.amount, 0);
  const netWorth = totalAssets - totalLiabilities;
  const mainCurrency = assets[0]?.currency ?? "GBP";

  // -----------------------------------------------------------------------
  // Build document content
  // -----------------------------------------------------------------------
  const content: PdfContent[] = [];

  // --- Cover section ---
  content.push({
    table: {
      widths: ["*"],
      body: [
        [
          {
            text: FIRM_NAME,
            fontSize: 11,
            color: "#FFFFFF",
            bold: true,
            alignment: "center",
            margin: [0, 12, 0, 4],
          },
        ],
        [
          {
            text: t(locale, "report.title").toUpperCase(),
            fontSize: 22,
            color: "#FFFFFF",
            bold: true,
            alignment: "center",
            margin: [0, 4, 0, 4],
          },
        ],
        [
          {
            text: t(locale, "report.confidential").toUpperCase(),
            fontSize: 9,
            color: "#CBD5E1",
            alignment: "center",
            margin: [0, 0, 0, 12],
          },
        ],
      ],
    },
    layout: {
      fillColor: () => BRAND_DARK,
      hLineWidth: () => 0,
      vLineWidth: () => 0,
    },
    margin: [0, 0, 0, 20],
  });

  content.push({
    columns: [
      {
        width: "50%",
        text: [
          { text: `${t(locale, "report.prepared_for")}: `, bold: true },
          testator?.legalName ?? "—",
        ],
      },
      {
        width: "50%",
        text: [
          { text: `${t(locale, "report.matter_ref")}: `, bold: true },
          matter.matterNumber,
        ],
        alignment: "right",
      },
    ],
    margin: [0, 0, 0, 4],
  });

  content.push({
    text: [
      { text: `${t(locale, "report.date")}: `, bold: true },
      formatDate(new Date()),
    ],
    margin: [0, 0, 0, 20],
  });

  // --- Family Structure ---
  if (people.length > 0) {
    content.push(sectionHeading(t(locale, "report.family_structure")));

    const familyBody: PdfContent[][] = [
      [
        tableHeaderCell(t(locale, "report.name")),
        tableHeaderCell(t(locale, "report.role")),
        tableHeaderCell(t(locale, "report.dob")),
        tableHeaderCell(t(locale, "report.nationality")),
      ],
    ];

    people.forEach((p, idx) => {
      familyBody.push(
        stripedRow(
          [
            { text: p.legalName },
            { text: roleMap.get(p.id) ?? "—" },
            { text: formatDate(p.dateOfBirth) },
            { text: p.nationality ?? "—" },
          ],
          idx
        )
      );
    });

    content.push({
      table: { headerRows: 1, widths: ["*", "auto", "auto", "auto"], body: familyBody },
      layout: "lightHorizontalLines",
      margin: [0, 0, 0, 12],
    });
  }

  // --- Asset Summary ---
  if (assets.length > 0) {
    content.push(sectionHeading(t(locale, "report.asset_summary")));

    const assetBody: PdfContent[][] = [
      [
        tableHeaderCell(t(locale, "report.description")),
        tableHeaderCell(t(locale, "report.type")),
        tableHeaderCell(t(locale, "report.jurisdiction")),
        tableHeaderCell(t(locale, "report.value")),
      ],
    ];

    assets.forEach((a, idx) => {
      assetBody.push(
        stripedRow(
          [
            { text: a.description },
            { text: a.assetClass },
            { text: a.jurisdictionCode ?? a.situsCountry },
            { text: formatCurrency(a.valuation, a.currency), alignment: "right" },
          ],
          idx
        )
      );
    });

    // Totals rows
    assetBody.push([
      { text: t(locale, "report.total_assets"), bold: true, colSpan: 3 },
      emptyCell(),
      emptyCell(),
      { text: formatCurrency(totalAssets, mainCurrency), bold: true, alignment: "right" },
    ]);

    if (liabilities.length > 0) {
      assetBody.push([
        { text: t(locale, "report.total_liabilities"), bold: true, colSpan: 3 },
        emptyCell(),
        emptyCell(),
        {
          text: `(${formatCurrency(totalLiabilities, mainCurrency)})`,
          bold: true,
          alignment: "right",
          color: "#B91C1C",
        },
      ]);
    }

    assetBody.push([
      { text: t(locale, "report.net_worth"), bold: true, colSpan: 3, fillColor: TABLE_HEADER_BG },
      emptyCell(TABLE_HEADER_BG),
      emptyCell(TABLE_HEADER_BG),
      {
        text: formatCurrency(netWorth, mainCurrency),
        bold: true,
        alignment: "right",
        fillColor: TABLE_HEADER_BG,
      },
    ]);

    content.push({
      table: { headerRows: 1, widths: ["*", "auto", "auto", 100], body: assetBody },
      layout: "lightHorizontalLines",
      margin: [0, 0, 0, 12],
    });
  }

  // --- IHT Breakdown ---
  if (ihtCalculations.length > 0) {
    content.push(sectionHeading(t(locale, "report.iht_breakdown")));

    const calc = ihtCalculations[0]; // Most recent calculation
    const exemptions = decode<Record<string, unknown>>(calc.exemptionsApplied, {});
    const totalExemptions = Object.values(exemptions).reduce(
      (s: number, v) => s + (typeof v === "number" ? v : 0),
      0
    );

    const ihtBody: PdfContent[][] = [
      [tableHeaderCell(t(locale, "report.description")), tableHeaderCell(t(locale, "report.value"))],
      [
        { text: t(locale, "report.gross_estate") },
        { text: formatCurrency(calc.netEstate + totalExemptions, mainCurrency), alignment: "right" },
      ],
      [
        { text: t(locale, "report.exemptions") },
        {
          text: `(${formatCurrency(totalExemptions, mainCurrency)})`,
          alignment: "right",
          color: "#B91C1C",
        },
      ],
      [
        { text: t(locale, "report.nil_rate_band") },
        { text: formatCurrency(calc.nrb - calc.nrbUsed, mainCurrency), alignment: "right" },
      ],
      [
        { text: t(locale, "report.taxable_estate"), bold: true },
        { text: formatCurrency(calc.taxableEstate, mainCurrency), bold: true, alignment: "right" },
      ],
      [
        { text: t(locale, "report.iht_due"), bold: true, fillColor: TABLE_HEADER_BG },
        {
          text: formatCurrency(calc.ihtDue, mainCurrency),
          bold: true,
          alignment: "right",
          fillColor: TABLE_HEADER_BG,
          color: calc.ihtDue > 0 ? "#B91C1C" : undefined,
        },
      ],
    ];

    content.push({
      table: { headerRows: 1, widths: ["*", 140], body: ihtBody },
      layout: "lightHorizontalLines",
      margin: [0, 0, 0, 12],
    });
  }

  // --- Gift Timeline ---
  if (lifetimeGifts.length > 0) {
    content.push(sectionHeading(t(locale, "report.gift_timeline")));

    const giftBody: PdfContent[][] = [
      [
        tableHeaderCell(t(locale, "report.gift_date")),
        tableHeaderCell(t(locale, "report.description")),
        tableHeaderCell(t(locale, "report.gift_value")),
        tableHeaderCell(t(locale, "report.type")),
      ],
    ];

    lifetimeGifts.forEach((g, idx) => {
      giftBody.push(
        stripedRow(
          [
            { text: formatDate(g.giftDate) },
            { text: g.description },
            { text: formatCurrency(g.value, g.currency), alignment: "right" },
            { text: g.petOrClt.toUpperCase() },
          ],
          idx
        )
      );
    });

    content.push({
      table: { headerRows: 1, widths: ["auto", "*", 100, "auto"], body: giftBody },
      layout: "lightHorizontalLines",
      margin: [0, 0, 0, 12],
    });
  }

  // --- Will Coordination ---
  if (willCoordinations.length > 0) {
    content.push(sectionHeading(t(locale, "report.will_coordination")));

    const willBody: PdfContent[][] = [
      [
        tableHeaderCell(t(locale, "report.jurisdiction")),
        tableHeaderCell(t(locale, "report.type")),
        tableHeaderCell(t(locale, "report.status")),
        tableHeaderCell(t(locale, "report.date")),
      ],
    ];

    willCoordinations.forEach((w, idx) => {
      willBody.push(
        stripedRow(
          [
            { text: w.jurisdictionCode },
            { text: w.documentType },
            { text: w.status },
            { text: formatDate(w.dateExecuted) },
          ],
          idx
        )
      );
    });

    content.push({
      table: { headerRows: 1, widths: ["auto", "*", "auto", "auto"], body: willBody },
      layout: "lightHorizontalLines",
      margin: [0, 0, 0, 12],
    });
  }

  // --- Goals & Recommendations ---
  if (clientGoals.length > 0) {
    content.push(sectionHeading(t(locale, "report.goals")));

    const goalBody: PdfContent[][] = [
      [
        tableHeaderCell(t(locale, "report.goal_text")),
        tableHeaderCell(t(locale, "report.category")),
        tableHeaderCell(t(locale, "report.priority")),
        tableHeaderCell(t(locale, "report.status")),
      ],
    ];

    clientGoals.forEach((g, idx) => {
      goalBody.push(
        stripedRow(
          [
            { text: g.goalText },
            { text: g.category },
            { text: g.priority },
            { text: g.status },
          ],
          idx
        )
      );
    });

    content.push({
      table: { headerRows: 1, widths: ["*", "auto", "auto", "auto"], body: goalBody },
      layout: "lightHorizontalLines",
      margin: [0, 0, 0, 12],
    });
  }

  // --- Domicile Risk Assessment ---
  const domicile = domicileRecords[0] ?? null;
  if (domicile) {
    content.push(sectionHeading(t(locale, "report.domicile_risk")));

    const domBody: PdfContent[][] = [
      [tableHeaderCell(t(locale, "report.description")), tableHeaderCell(t(locale, "report.value"))],
      [
        { text: t(locale, "report.domicile_origin") },
        { text: domicile.domicileOfOrigin ?? "—" },
      ],
      [
        { text: t(locale, "report.domicile_choice") },
        { text: domicile.domicileOfChoice ?? "—" },
      ],
      [
        { text: t(locale, "report.snap_back_risk"), bold: true },
        {
          text: domicile.snapBackRisk
            ? t(locale, "common.yes")
            : t(locale, "common.no"),
          bold: true,
          color: domicile.snapBackRisk ? "#B91C1C" : "#15803D",
        },
      ],
    ];

    if (domicile.snapBackReason) {
      domBody.push([
        { text: t(locale, "report.description") },
        { text: domicile.snapBackReason },
      ]);
    }

    content.push({
      table: { headerRows: 1, widths: [200, "*"], body: domBody },
      layout: "lightHorizontalLines",
      margin: [0, 0, 0, 12],
    });
  }

  // --- Disclaimer ---
  content.push({
    text: t(locale, "report.disclaimer"),
    style: "disclaimer",
    margin: [0, 24, 0, 0],
  });

  // -----------------------------------------------------------------------
  // Document definition
  // -----------------------------------------------------------------------
  const docDefinition = {
    pageSize: "A4" as const,
    pageMargins: [40, 60, 40, 60] as [number, number, number, number],

    header: (currentPage: number, _pageCount: number) => {
      if (currentPage === 1) return null;
      return {
        columns: [
          { text: FIRM_NAME, fontSize: 8, color: BRAND_ACCENT, margin: [40, 20, 0, 0] },
          {
            text: t(locale, "report.confidential").toUpperCase(),
            fontSize: 8,
            color: "#94A3B8",
            alignment: "right",
            margin: [0, 20, 40, 0],
          },
        ],
      };
    },

    footer: (currentPage: number, pageCount: number) => ({
      columns: [
        {
          text: t(locale, "report.disclaimer"),
          fontSize: 7,
          color: "#94A3B8",
          italics: true,
          margin: [40, 0, 0, 0],
          width: "70%",
        },
        {
          text: `${t(locale, "report.page")} ${currentPage} / ${pageCount}`,
          fontSize: 8,
          color: "#64748B",
          alignment: "right",
          margin: [0, 0, 40, 0],
          width: "30%",
        },
      ],
      margin: [0, 10, 0, 0] as [number, number, number, number],
    }),

    content,

    styles: {
      sectionHeader: {
        fontSize: 14,
        bold: true,
        color: BRAND_DARK,
      },
      tableHeader: {
        fontSize: 9,
        bold: true,
        color: BRAND_DARK,
      },
      disclaimer: {
        fontSize: 8,
        italics: true,
        color: "#64748B",
      },
    },

    defaultStyle: {
      font: "Roboto",
      fontSize: 10,
      color: "#1E293B",
    },
  };

  // -----------------------------------------------------------------------
  // Render to buffer
  // -----------------------------------------------------------------------
  return new Promise<Buffer>((resolve, reject) => {
    try {
      const pdfDoc = printer.createPdfKitDocument(docDefinition);
      const chunks: Buffer[] = [];

      pdfDoc.on("data", (chunk: Buffer) => chunks.push(chunk));
      pdfDoc.on("end", () => resolve(Buffer.concat(chunks)));
      pdfDoc.on("error", (err: Error) => reject(err));

      pdfDoc.end();
    } catch (err) {
      reject(err);
    }
  });
}
