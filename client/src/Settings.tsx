import { useTranslation } from "react-i18next";
import { CUSTOM_THEMES, THEME_LABELS, type ThemePreference } from "./theme";
import { UI_LANGUAGES } from "./i18n";
import type { LangMode, UILanguage } from "./LanguageModeContext";
import type { UserRole } from "./navigation";

type Props = {
  theme: ThemePreference;
  langMode: LangMode;
  primaryLang: UILanguage;
  secondaryLang: UILanguage;
  userRole: UserRole;
  onThemeChange: (theme: ThemePreference) => void;
  onLangModeChange: (mode: LangMode) => void;
  onPrimaryLangChange: (lang: UILanguage) => void;
  onSecondaryLangChange: (lang: UILanguage) => void;
  onUserRoleChange: (role: UserRole) => void;
};

const SECONDARY_OPTIONS = UI_LANGUAGES.filter((l) => l.code !== "en");

const ROLES: UserRole[] = ["viewer", "editor", "admin", "compliance"];

export function Settings({
  theme,
  langMode,
  primaryLang,
  secondaryLang,
  userRole,
  onThemeChange,
  onLangModeChange,
  onPrimaryLangChange,
  onSecondaryLangChange,
  onUserRoleChange,
}: Props) {
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
                {CUSTOM_THEMES.map((ct) => (
                  <option key={ct} value={ct}>{THEME_LABELS[ct]}</option>
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
            <span className="settings-field__label">{t("settings.language_mode")}</span>
            <select
              className="settings-field__select"
              value={langMode}
              onChange={(e) => onLangModeChange(e.target.value as LangMode)}
            >
              <option value="monolingual">{t("settings.mode_monolingual")}</option>
              <option value="bilingual">{t("settings.mode_bilingual")}</option>
            </select>
          </label>

          {langMode === "monolingual" ? (
            <label className="settings-field">
              <span className="settings-field__label">{t("settings.primary_language")}</span>
              <select
                className="settings-field__select"
                value={primaryLang}
                onChange={(e) => onPrimaryLangChange(e.target.value as UILanguage)}
              >
                {UI_LANGUAGES.map((lang) => (
                  <option key={lang.code} value={lang.code}>{lang.label}</option>
                ))}
              </select>
            </label>
          ) : (
            <label className="settings-field">
              <span className="settings-field__label">{t("settings.secondary_language")}</span>
              <select
                className="settings-field__select"
                value={secondaryLang}
                onChange={(e) => onSecondaryLangChange(e.target.value as UILanguage)}
              >
                {SECONDARY_OPTIONS.map((lang) => (
                  <option key={lang.code} value={lang.code}>{lang.label}</option>
                ))}
              </select>
            </label>
          )}
        </div>
      </section>

      <section className="settings-section">
        <h3 className="settings-section__title">{t("settings.development")}</h3>
        <div className="settings-grid">
          <label className="settings-field">
            <span className="settings-field__label">{t("settings.user_role")}</span>
            <select
              className="settings-field__select"
              value={userRole}
              onChange={(e) => onUserRoleChange(e.target.value as UserRole)}
            >
              {ROLES.map((role) => (
                <option key={role} value={role}>{t(`nav.role_${role}`)}</option>
              ))}
            </select>
          </label>
        </div>
      </section>
    </div>
  );
}
