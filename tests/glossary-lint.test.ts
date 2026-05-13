import { describe, expect, it } from "vitest";
import { lintDocumentGlossary } from "../server/services/localizationService";
import { prisma } from "../server/db";

describe("G-045 (L10N-009): lintDocumentGlossary standalone", () => {
  it("passes when content has no prohibited terms", async () => {
    const pack = await prisma.jurisdictionPack.findFirst({ where: { status: "active" } });
    if (!pack) return;

    const result = await lintDocumentGlossary(pack.id, "en-GB", "This is a valid legal document with proper terminology.");
    expect(result.passed).toBe(true);
    expect(result.violations).toHaveLength(0);
  });

  it("detects prohibited terms in content", async () => {
    const pack = await prisma.jurisdictionPack.findFirst({ where: { status: "active" } });
    if (!pack) return;

    // Get glossary terms to find a prohibited term
    const terms = await prisma.legalGlossaryTerm.findMany({ where: { packId: pack.id, locale: "en-GB", status: "approved" } });
    if (terms.length === 0) return;

    const prohibitedTerms = JSON.parse(terms[0].prohibitedTerms || "[]") as string[];
    if (prohibitedTerms.length === 0) return;

    const contentWithProhibited = `This document contains ${prohibitedTerms[0]} which is prohibited.`;
    const result = await lintDocumentGlossary(pack.id, "en-GB", contentWithProhibited);
    expect(result.passed).toBe(false);
    expect(result.violations.length).toBeGreaterThan(0);
  });

  it("works for pt-PT locale", async () => {
    const pack = await prisma.jurisdictionPack.findFirst({ where: { status: "active", jurisdictionCode: "PT" } });
    if (!pack) return;

    const result = await lintDocumentGlossary(pack.id, "pt-PT", "Documento legal com terminologia adequada.");
    expect(typeof result.passed).toBe("boolean");
    expect(Array.isArray(result.violations)).toBe(true);
  });
});
