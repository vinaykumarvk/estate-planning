import { describe, expect, it } from "vitest";
import { formatCurrency, formatDate, formatNumber, formatPercent, pluralize } from "../server/services/icuFormattingService";
import { validatePhoneForLocale, validateAddressForLocale, validateIdDocumentForLocale } from "../server/services/localeValidationService";
import { runLocalizationQa } from "../server/services/localizationQaService";
import { prisma } from "../server/db";

describe("L10N-004: ICU/CLDR-aware formatting", () => {
  it("formats currency for en-GB", () => {
    const result = formatCurrency(325000, "GBP", "en-GB");
    expect(result).toContain("325");
    expect(result).toMatch(/£|GBP/);
  });

  it("formats currency for pt-PT", () => {
    const result = formatCurrency(50000, "EUR", "pt-PT");
    expect(result).toContain("50");
    expect(result).toMatch(/€|EUR/);
  });

  it("formats dates for both locales", () => {
    const date = new Date("2026-01-15");
    const enResult = formatDate(date, "en-GB");
    const ptResult = formatDate(date, "pt-PT");
    expect(enResult).toContain("2026");
    expect(ptResult).toContain("2026");
  });

  it("formats short dates", () => {
    const date = new Date("2026-06-01");
    const result = formatDate(date, "en-GB", "short");
    expect(result).toBeTruthy();
    expect(result.length).toBeLessThan(20);
  });

  it("formats numbers with locale separators", () => {
    const en = formatNumber(1000000, "en-GB");
    const pt = formatNumber(1000000, "pt-PT");
    expect(en).toContain("1");
    expect(pt).toContain("1");
  });

  it("formats percentages", () => {
    const result = formatPercent(66, "en-GB");
    expect(result).toContain("66");
    expect(result).toContain("%");
  });

  it("pluralizes correctly", () => {
    expect(pluralize(1, "beneficiary", "beneficiaries", "en-GB")).toContain("beneficiary");
    expect(pluralize(2, "beneficiary", "beneficiaries", "en-GB")).toContain("beneficiaries");
    expect(pluralize(0, "heir", "heirs", "pt-PT")).toContain("heir");
  });
});

describe("L10N-008: Localized format validation", () => {
  it("validates GB phone numbers", () => {
    expect(validatePhoneForLocale("+44 7911 123456", "en-GB").valid).toBe(true);
    expect(validatePhoneForLocale("07911123456", "en-GB").valid).toBe(true);
    expect(validatePhoneForLocale("123", "en-GB").valid).toBe(false);
  });

  it("validates PT phone numbers", () => {
    expect(validatePhoneForLocale("+351 912 345 678", "pt-PT").valid).toBe(true);
    expect(validatePhoneForLocale("912345678", "pt-PT").valid).toBe(true);
    expect(validatePhoneForLocale("123", "pt-PT").valid).toBe(false);
  });

  it("validates GB postcodes", () => {
    expect(validateAddressForLocale("SW1A 1AA", "en-GB").valid).toBe(true);
    expect(validateAddressForLocale("EC2R 8AH", "en-GB").valid).toBe(true);
    expect(validateAddressForLocale("INVALID", "en-GB").valid).toBe(false);
  });

  it("validates PT postal codes", () => {
    expect(validateAddressForLocale("1000-001", "pt-PT").valid).toBe(true);
    expect(validateAddressForLocale("4000-123", "pt-PT").valid).toBe(true);
    expect(validateAddressForLocale("INVALID", "pt-PT").valid).toBe(false);
  });

  it("validates GB National Insurance Number", () => {
    expect(validateIdDocumentForLocale("QQ123456C", "en-GB").valid).toBe(true);
    expect(validateIdDocumentForLocale("INVALID", "en-GB").valid).toBe(false);
  });

  it("validates PT NIF", () => {
    expect(validateIdDocumentForLocale("123456789", "pt-PT").valid).toBe(true);
    expect(validateIdDocumentForLocale("12345", "pt-PT").valid).toBe(false);
  });
});

describe("L10N-010: Localization QA workflow", () => {
  it("runs QA check on a pack", async () => {
    const pack = await prisma.jurisdictionPack.findFirst({ where: { status: "active" } });
    if (!pack) return;

    const result = await runLocalizationQa(pack.id);
    expect(result.packId).toBe(pack.id);
    expect(Array.isArray(result.issues)).toBe(true);
    expect(typeof result.tasksCreated).toBe("number");
    expect(result.requirementRefs).toContain("L10N-010");
  });
});

describe("L10N-002 / L10N-003: Locale architecture and content keys", () => {
  it("localization strings use stable content keys", async () => {
    const strings = await prisma.localizationString.findMany({ take: 10 });
    for (const s of strings) {
      expect(s.contentKey).toBeTruthy();
      expect(s.locale).toBeTruthy();
      expect(["en-GB", "pt-PT"]).toContain(s.locale);
    }
  });

  it("content key + locale is unique", async () => {
    const strings = await prisma.localizationString.findMany();
    const keys = strings.map((s) => `${s.contentKey}:${s.locale}`);
    const unique = new Set(keys);
    expect(unique.size).toBe(keys.length);
  });
});
