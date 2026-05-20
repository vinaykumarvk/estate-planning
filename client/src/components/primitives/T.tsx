import { useTranslation } from "react-i18next";
import { useLanguageMode } from "../../LanguageModeContext";

interface Props {
  k: string;
  values?: Record<string, unknown>;
  variant?: "stacked" | "inline";
  className?: string;
}

export function T({ k, values, variant = "stacked", className }: Props) {
  const { t } = useTranslation();
  const { mode, secondaryLang } = useLanguageMode();

  // In monolingual mode, i18n is already set to the chosen language
  if (mode === "monolingual") {
    return <>{t(k, values as Record<string, string>)}</>;
  }

  // Bilingual mode: primary is always English, secondary is the chosen lang
  const en = t(k, { ...(values || {}), lng: "en" } as Record<string, string>);
  const sec = t(k, { ...(values || {}), lng: secondaryLang } as Record<string, string>);
  const hasSecondary = sec && sec !== en && sec !== k;

  if (!hasSecondary) return <>{en}</>;

  return (
    <span className={`bilingual bilingual--${variant}${className ? ` ${className}` : ""}`}>
      <span className="bilingual__primary">{en}</span>
      <span className="bilingual__secondary" lang={secondaryLang}>{sec}</span>
    </span>
  );
}
