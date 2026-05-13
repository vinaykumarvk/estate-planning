import type { Locale } from "../../shared/types";

const LOCALE_MAP: Record<Locale, string> = {
  "en-GB": "en-GB",
  "pt-PT": "pt-PT"
};

export function formatCurrency(amount: number, currency: string, locale: Locale): string {
  const intlLocale = LOCALE_MAP[locale] ?? "en-GB";
  return new Intl.NumberFormat(intlLocale, {
    style: "currency",
    currency,
    minimumFractionDigits: 2,
    maximumFractionDigits: 2
  }).format(amount);
}

export function formatDate(date: Date, locale: Locale, style: "short" | "long" = "long"): string {
  const intlLocale = LOCALE_MAP[locale] ?? "en-GB";
  if (style === "short") {
    return new Intl.DateTimeFormat(intlLocale, { dateStyle: "short" }).format(date);
  }
  return new Intl.DateTimeFormat(intlLocale, { dateStyle: "long" }).format(date);
}

export function formatNumber(value: number, locale: Locale): string {
  const intlLocale = LOCALE_MAP[locale] ?? "en-GB";
  return new Intl.NumberFormat(intlLocale).format(value);
}

export function formatPercent(value: number, locale: Locale): string {
  const intlLocale = LOCALE_MAP[locale] ?? "en-GB";
  return new Intl.NumberFormat(intlLocale, {
    style: "percent",
    minimumFractionDigits: 0,
    maximumFractionDigits: 2
  }).format(value / 100);
}

export function pluralize(count: number, singular: string, plural: string, locale: Locale): string {
  const intlLocale = LOCALE_MAP[locale] ?? "en-GB";
  const rules = new Intl.PluralRules(intlLocale);
  const category = rules.select(count);
  return category === "one" ? `${count} ${singular}` : `${count} ${plural}`;
}
