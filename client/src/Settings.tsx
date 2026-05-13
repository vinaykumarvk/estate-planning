import { useTranslation } from "react-i18next";
import { CUSTOM_THEMES, THEME_LABELS, type ThemePreference } from "./theme";
import { SECONDARY_LANGUAGES } from "./i18n";

type Props = {
  theme: ThemePreference;
  language: string;
  onThemeChange: (theme: ThemePreference) => void;
  onLanguageChange: (lang: string) => void;
};

export function Settings({ theme, language, onThemeChange, onLanguageChange }: Props) {
  const { t } = useTranslation();

  return (
    <div className="settings-page">
      <h2 className="settings-page__title">{t("settings.title")}</h2>

      <section className="settings-section">
        <h3 className="settings-section__title">{t("settings.appearance")}</h3>
        <div className="settings-grid">
          <label className="settings-field">
            <span className="settings-field__label">{t("settings.theme")}</span>
            <select
              className="settings-field__select"
              value={theme}
              onChange={(e) => onThemeChange(e.target.value as ThemePreference)}
            >
              <option value="system">{t("settings.theme_system")}</option>
              <option value="light">{t("settings.theme_light")}</option>
              <option value="dark">{t("settings.theme_dark")}</option>
              <optgroup label={t("settings.creative_themes")}>
                {CUSTOM_THEMES.map((t) => (
                  <option key={t} value={t}>{THEME_LABELS[t]}</option>
                ))}
              </optgroup>
            </select>
          </label>
        </div>
      </section>

      <section className="settings-section">
        <h3 className="settings-section__title">{t("settings.regional")}</h3>
        <div className="settings-grid">
          <label className="settings-field">
            <span className="settings-field__label">{t("settings.language")}</span>
            <select
              className="settings-field__select"
              value={language}
              onChange={(e) => onLanguageChange(e.target.value)}
            >
              {SECONDARY_LANGUAGES.map((lang) => (
                <option key={lang.code} value={lang.code}>{lang.label}</option>
              ))}
            </select>
          </label>
        </div>
      </section>
    </div>
  );
}
