import i18n from "i18next";
import { initReactI18next } from "react-i18next";
import en from "./locales/en";

export const UI_LANGUAGES = [
  { code: "en", label: "English" },
  { code: "fr", label: "Français" },
  { code: "pt", label: "Português" },
  { code: "es", label: "Español" },
] as const;

export const SECONDARY_LANGUAGES = [
  { code: "none", label: "None (English only)" },
  { code: "fr", label: "Français (French)" },
  { code: "pt", label: "Português (Portuguese)" },
  { code: "es", label: "Español (Spanish)" },
] as const;

const resources = {
  en: { translation: en },
};

i18n
  .use(initReactI18next)
  .init({
    resources,
    lng: "en",
    fallbackLng: "en",
    interpolation: { escapeValue: false },
  });

document.documentElement.lang = "en";

// Lazy-load secondary locale bundles
const localeLoaders: Record<string, () => Promise<{ default: Record<string, string> }>> = {
  fr: () => import("./locales/fr"),
  pt: () => import("./locales/pt"),
  es: () => import("./locales/es"),
};
const loadedLocales = new Set<string>(["en"]);

export async function ensureLocaleLoaded(lang: string): Promise<void> {
  if (lang === "none" || loadedLocales.has(lang)) return;
  const loader = localeLoaders[lang];
  if (!loader) return;
  const mod = await loader();
  i18n.addResourceBundle(lang, "translation", mod.default, true, true);
  loadedLocales.add(lang);
}

export default i18n;
