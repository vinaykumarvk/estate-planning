import type { Locale } from "../../shared/types";

const PHONE_PATTERNS: Record<string, RegExp> = {
  NG: /^\+?234\d{10}$|^0\d{10}$/,
  GH: /^\+?233\d{9}$|^0\d{9}$/,
  ZA: /^\+?27\d{9}$|^0\d{9}$/,
  KE: /^\+?254\d{9}$|^0\d{9}$/,
  SN: /^\+?221\d{9}$|^[7]\d{8}$/,
  CM: /^\+?237\d{8,9}$|^[26]\d{7,8}$/,
  MZ: /^\+?258\d{9}$|^[89]\d{8}$/,
  AO: /^\+?244\d{9}$|^9\d{8}$/
};

const ID_PATTERNS: Record<string, { pattern: RegExp; label: string }> = {
  NG: { pattern: /^\d{11}$/, label: "NIN (National Identification Number)" },
  GH: { pattern: /^GHA-\d{9}-\d$/, label: "Ghana Card Number" },
  ZA: { pattern: /^\d{13}$/, label: "South African ID Number" },
  KE: { pattern: /^\d{7,8}$/, label: "National ID Number" },
  SN: { pattern: /^\d{13}$/, label: "CNI (Carte Nationale d'Identité)" },
  CM: { pattern: /^\d{9}$/, label: "CNI Number" },
  MZ: { pattern: /^\d{12}[A-Z]$/, label: "BI (Bilhete de Identidade)" },
  AO: { pattern: /^\d{9}[A-Z]{2}\d{3}$/, label: "BI (Bilhete de Identidade)" }
};

const ADDRESS_PATTERNS: Record<string, RegExp> = {
  NG: /^[1-9]\d{5}$/, // 6-digit postal code
  GH: /^[A-Z]{2}-\d{3,4}-\d{4}$/, // Ghana Post GPS
  ZA: /^\d{4}$/, // 4-digit postal code
  KE: /^\d{5}$/, // 5-digit postal code
  SN: /^\d{5}$/, // 5-digit postal code
  CM: /^[A-Z]{2}\d{3}$/, // Region-based postal code
  MZ: /^\d{4}$/, // 4-digit postal code
  AO: /^[A-Z]{2}\d{4}$/ // Province + 4-digit code
};

const LOCALE_TO_COUNTRY: Record<string, string> = {
  en: "NG",
  fr: "SN",
  pt: "MZ",
  es: "NG"
};

function getCountry(locale: Locale, jurisdictionCode?: string): string {
  if (jurisdictionCode && PHONE_PATTERNS[jurisdictionCode]) return jurisdictionCode;
  return LOCALE_TO_COUNTRY[locale] ?? "NG";
}

export function validatePhoneForLocale(phone: string, locale: Locale, jurisdictionCode?: string): { valid: boolean; error?: string } {
  const country = getCountry(locale, jurisdictionCode);
  const pattern = PHONE_PATTERNS[country];
  if (!pattern) return { valid: true };
  const cleaned = phone.replace(/[\s\-()]/g, "");
  if (!pattern.test(cleaned)) {
    return { valid: false, error: `Phone number does not match expected ${country} format` };
  }
  return { valid: true };
}

export function validateAddressForLocale(postcode: string, locale: Locale, jurisdictionCode?: string): { valid: boolean; error?: string } {
  const country = getCountry(locale, jurisdictionCode);
  const pattern = ADDRESS_PATTERNS[country];
  if (!pattern) return { valid: true };
  if (!pattern.test(postcode.trim())) {
    return { valid: false, error: `Postcode does not match expected ${country} format` };
  }
  return { valid: true };
}

export function validateIdDocumentForLocale(idNumber: string, locale: Locale, jurisdictionCode?: string): { valid: boolean; error?: string } {
  const country = getCountry(locale, jurisdictionCode);
  const spec = ID_PATTERNS[country];
  if (!spec) return { valid: true };
  if (!spec.pattern.test(idNumber.trim())) {
    return { valid: false, error: `${spec.label} format invalid` };
  }
  return { valid: true };
}
