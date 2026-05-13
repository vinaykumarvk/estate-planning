import type { Locale } from "../../shared/types";

const PHONE_PATTERNS: Record<string, RegExp> = {
  GB: /^\+?44\d{10}$|^0\d{10,11}$/,
  PT: /^\+?351\d{9}$|^9\d{8}$/
};

const ID_PATTERNS: Record<string, { pattern: RegExp; label: string }> = {
  GB: { pattern: /^[A-Z]{2}\d{6}[A-D]$/i, label: "National Insurance Number" },
  PT: { pattern: /^\d{9}$/i, label: "NIF (Número de Identificação Fiscal)" }
};

const ADDRESS_PATTERNS: Record<string, RegExp> = {
  GB: /^[A-Z]{1,2}\d[A-Z\d]?\s*\d[A-Z]{2}$/i,
  PT: /^\d{4}-\d{3}$/
};

export function validatePhoneForLocale(phone: string, locale: Locale): { valid: boolean; error?: string } {
  const country = locale === "en-GB" ? "GB" : "PT";
  const pattern = PHONE_PATTERNS[country];
  if (!pattern) return { valid: true };
  const cleaned = phone.replace(/[\s\-()]/g, "");
  if (!pattern.test(cleaned)) {
    return { valid: false, error: `Phone number does not match expected ${country} format` };
  }
  return { valid: true };
}

export function validateAddressForLocale(postcode: string, locale: Locale): { valid: boolean; error?: string } {
  const country = locale === "en-GB" ? "GB" : "PT";
  const pattern = ADDRESS_PATTERNS[country];
  if (!pattern) return { valid: true };
  if (!pattern.test(postcode.trim())) {
    return { valid: false, error: `Postcode does not match expected ${country} format` };
  }
  return { valid: true };
}

export function validateIdDocumentForLocale(idNumber: string, locale: Locale): { valid: boolean; error?: string } {
  const country = locale === "en-GB" ? "GB" : "PT";
  const spec = ID_PATTERNS[country];
  if (!spec) return { valid: true };
  if (!spec.pattern.test(idNumber.trim())) {
    return { valid: false, error: `${spec.label} format invalid` };
  }
  return { valid: true };
}
