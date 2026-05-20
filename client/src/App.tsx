import {
  CheckCircle2,
  FileText,
  Globe2,
  Menu,
  Plus,
  X
} from "lucide-react";
import { useCallback, useEffect, useMemo, useState } from "react";
import { useTranslation } from "react-i18next";
import { api, type BootstrapPayload, type WorkspacePayload } from "./lib/api";
import { T } from "./components/primitives/T";
import { LanguageModeProvider, type LangMode, type UILanguage } from "./LanguageModeContext";
import { Settings } from "./Settings";
import { useTheme, type ThemePreference } from "./theme";
import i18n, { ensureLocaleLoaded } from "./i18n";
import { MatterContext } from "./components/hooks/useMatterContext";
import { MatterCreateForm } from "./components/matters/MatterCreateForm";
import { NavigationProvider, useNavigation } from "./navigation";
import { Sidebar } from "./components/navigation/Sidebar";
import { Breadcrumbs } from "./components/navigation/Breadcrumbs";
import { ContentRouter } from "./components/navigation/ContentRouter";

interface IntakeResponse {
  intake: { totalModules: number; completeModules: number; score: number; missingCritical: string[] };
}

interface RulesResponse {
  summary: {
    blocked: boolean;
    reviewRequired: boolean;
    issues: Array<{ code: string; severity: string; message: string; ruleCode: string }>;
  };
}

interface TableCatalogResponse {
  tables: Array<{ tableName: string; area: string; maintainedBy: string }>;
}

interface LegalContentResponse {
  rules: Array<{ id: string; ruleCode: string; category: string; severity: string; status: string }>;
  releaseGates: Array<{ id: string; packId: string; gateCode: string; status: string }>;
  uplOpinions: Array<{ id: string; jurisdictionCode: string; status: string; refreshDueAt: string }>;
  velocity: Array<{ id: string; packId: string; elapsedDays: number | null; launchCost: number | null; status: string }>;
}

interface KpiResponse {
  kpis: {
    payingTenants: number;
    activePacks: number;
    tenantDensityPerPack: number;
    finalizedWills: number;
    arrEstimate: number;
    aiGroundingRate: number;
    aiHallucinationRate: number;
    materialUplIncidents: number;
    materialSecurityIncidents: number;
  };
}

export function App() {
  return (
    <NavigationProvider>
      <AppInner />
    </NavigationProvider>
  );
}

function AppInner() {
  const { t } = useTranslation();
  const { theme, setTheme } = useTheme("estate-theme");
  const { section, sidebarCollapsed, userRole, setUserRole, navigateTo } = useNavigation();
  const [langMode, setLangMode] = useState<LangMode>(() => {
    return (localStorage.getItem("estate-lang-mode") as LangMode) || "monolingual";
  });
  const [primaryLang, setPrimaryLang] = useState<UILanguage>(() => {
    return (localStorage.getItem("estate-primary-lang") as UILanguage) || "en";
  });
  const [secondaryLang, setSecondaryLang] = useState<UILanguage>(() => {
    return (localStorage.getItem("estate-secondary-lang") as UILanguage) || "fr";
  });

  const [bootstrap, setBootstrap] = useState<BootstrapPayload | null>(null);
  const [workspace, setWorkspace] = useState<WorkspacePayload | null>(null);
  const [intake, setIntake] = useState<IntakeResponse["intake"] | null>(null);
  const [rules, setRules] = useState<RulesResponse["summary"] | null>(null);
  const [tables, setTables] = useState<TableCatalogResponse["tables"]>([]);
  const [legalContent, setLegalContent] = useState<LegalContentResponse | null>(null);
  const [kpis, setKpis] = useState<KpiResponse["kpis"] | null>(null);
  const [locale, setLocale] = useState<"en" | "fr" | "pt" | "es">("en");
  const [status, setStatus] = useState<string>("");
  const [busy, setBusy] = useState<string>("");
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [navOpen, setNavOpen] = useState(false);
  const [showCreateMatter, setShowCreateMatter] = useState(false);
  const [selectedMatterId, setSelectedMatterId] = useState<string | undefined>();

  useEffect(() => {
    void load();
  }, []);

  // Auto-dismiss toast after 4 seconds
  useEffect(() => {
    if (!status) return;
    const timer = setTimeout(() => setStatus(""), 4000);
    return () => clearTimeout(timer);
  }, [status]);

  useEffect(() => {
    function closeOnEscape(event: KeyboardEvent) {
      if (event.key === "Escape") {
        setNavOpen(false);
      }
    }
    window.addEventListener("keydown", closeOnEscape);
    return () => window.removeEventListener("keydown", closeOnEscape);
  }, []);

  useEffect(() => {
    async function syncLanguage() {
      if (langMode === "monolingual") {
        await ensureLocaleLoaded(primaryLang);
        i18n.changeLanguage(primaryLang);
        document.documentElement.lang = primaryLang;
      } else {
        i18n.changeLanguage("en");
        document.documentElement.lang = "en";
        await ensureLocaleLoaded(secondaryLang);
      }
    }
    void syncLanguage();
  }, [langMode, primaryLang, secondaryLang]);

  function handleLangModeChange(mode: LangMode) {
    setLangMode(mode);
    localStorage.setItem("estate-lang-mode", mode);
  }

  async function handlePrimaryLangChange(lang: UILanguage) {
    setPrimaryLang(lang);
    localStorage.setItem("estate-primary-lang", lang);
  }

  async function handleSecondaryLangChange(lang: UILanguage) {
    setSecondaryLang(lang);
    localStorage.setItem("estate-secondary-lang", lang);
  }

  function handleThemeChange(newTheme: ThemePreference) {
    setTheme(newTheme);
  }

  async function load() {
    try {
      setLoading(true);
      setError(null);
      const boot = await api<BootstrapPayload>("/api/bootstrap");
      setBootstrap(boot);
      setLocale((boot.tenant?.defaultLocale as "en" | "fr" | "pt" | "es") ?? "en");
      const firstMatterId = boot.matters[0]?.id;
      if (firstMatterId) {
        setSelectedMatterId(firstMatterId);
        const [workspacePayload, intakePayload, tablePayload, legalPayload, kpiPayload] = await Promise.all([
          api<WorkspacePayload>(`/api/matters/${firstMatterId}`),
          api<IntakeResponse>(`/api/matters/${firstMatterId}/intake-score`),
          api<TableCatalogResponse>("/api/admin/table-catalog"),
          api<LegalContentResponse>("/api/admin/legal-content"),
          api<KpiResponse>("/api/reports/phase-1-kpis")
        ]);
        setWorkspace(workspacePayload);
        setIntake(intakePayload.intake);
        setTables(tablePayload.tables);
        setLegalContent(legalPayload);
        setKpis(kpiPayload.kpis);
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : t("error.load_failed"));
    } finally {
      setLoading(false);
    }
  }

  async function runRules() {
    if (!selectedMatterId || busy) return;
    try {
      setBusy("runRules");
      setStatus(t("status.running_rules"));
      const payload = await api<RulesResponse>(`/api/planning/matters/${selectedMatterId}/rules/evaluate`, { method: "POST", body: "{}" });
      setRules(payload.summary);
      setStatus(t("status.rule_scan_complete"));
      await refreshWorkspace();
    } catch (err) {
      setStatus(`${t("common.error")}: ${err instanceof Error ? err.message : t("error.rule_scan_failed")}`);
    } finally {
      setBusy("");
    }
  }

  async function createMemo() {
    if (!selectedMatterId || busy) return;
    try {
      setBusy("createMemo");
      setStatus(t("status.creating_memo"));
      await api(`/api/planning/matters/${selectedMatterId}/conflict-of-laws`, { method: "POST", body: "{}" });
      setStatus(t("status.conflict_memo_created"));
      await refreshWorkspace();
      navigateTo("documents", "assembly");
    } catch (err) {
      setStatus(`${t("common.error")}: ${err instanceof Error ? err.message : t("error.memo_creation_failed")}`);
    } finally {
      setBusy("");
    }
  }

  async function generateWill() {
    if (!selectedMatterId || busy) return;
    try {
      setBusy("generateWill");
      setStatus(t("status.generating_will"));
      await api(`/api/planning/matters/${selectedMatterId}/documents/will`, {
        method: "POST",
        body: JSON.stringify({ locale })
      });
      setStatus(t("status.will_generated"));
      await refreshWorkspace();
      navigateTo("documents", "assembly");
    } catch (err) {
      setStatus(`${t("common.error")}: ${err instanceof Error ? err.message : t("error.will_generation_failed")}`);
    } finally {
      setBusy("");
    }
  }

  async function exportBundle() {
    if (!selectedMatterId || busy) return;
    try {
      setBusy("exportBundle");
      setStatus(t("status.exporting"));
      await api(`/api/exports/matters/${selectedMatterId}?requestedBy=user-solicitor`);
      setStatus(t("status.export_generated"));
      await refreshWorkspace();
    } catch (err) {
      setStatus(`${t("common.error")}: ${err instanceof Error ? err.message : t("error.export_failed")}`);
    } finally {
      setBusy("");
    }
  }

  const refreshWorkspace = useCallback(async () => {
    if (!selectedMatterId) return;
    const [workspacePayload, kpiPayload] = await Promise.all([
      api<WorkspacePayload>(`/api/matters/${selectedMatterId}`),
      api<KpiResponse>("/api/reports/phase-1-kpis")
    ]);
    setWorkspace(workspacePayload);
    setKpis(kpiPayload.kpis);
  }, [selectedMatterId]);

  const switchMatter = useCallback(async (matterId: string) => {
    setSelectedMatterId(matterId);
    try {
      setLoading(true);
      const [workspacePayload, intakePayload] = await Promise.all([
        api<WorkspacePayload>(`/api/matters/${matterId}`),
        api<IntakeResponse>(`/api/matters/${matterId}/intake-score`),
      ]);
      setWorkspace(workspacePayload);
      setIntake(intakePayload.intake);
    } catch (err) {
      setError(err instanceof Error ? err.message : t("error.load_failed"));
    } finally {
      setLoading(false);
    }
  }, [t]);

  const selectedMatter = workspace?.matter;
  const tableAreas = useMemo(() => {
    return tables.reduce<Record<string, number>>((accumulator, table) => {
      accumulator[table.area] = (accumulator[table.area] ?? 0) + 1;
      return accumulator;
    }, {});
  }, [tables]);

  const matterCtx = useMemo(() => {
    if (!selectedMatterId) return null;
    return {
      matterId: selectedMatterId,
      tenantId: bootstrap?.tenant?.id ?? "",
      workspace,
      refreshWorkspace,
    };
  }, [selectedMatterId, bootstrap?.tenant?.id, workspace, refreshWorkspace]);

  return (
    <LanguageModeProvider mode={langMode} primaryLang={primaryLang} secondaryLang={secondaryLang}>
      <main className={`app-shell ${sidebarCollapsed ? "app-shell--collapsed" : ""}`}>
        <Sidebar
          tenantName={bootstrap?.tenant?.name}
          navOpen={navOpen}
          onNavClose={() => setNavOpen(false)}
        />

        <section className="workspace">
          <header className="topbar">
            <button
              aria-expanded={navOpen}
              aria-label={navOpen ? t("nav.close_menu") : t("nav.open_menu")}
              className="mobile-menu-button"
              onClick={() => setNavOpen((open) => !open)}
              type="button"
            >
              {navOpen ? <X aria-hidden="true" /> : <Menu aria-hidden="true" />}
            </button>
            <div>
              <h1>{selectedMatter?.title ?? t("nav.brand")}</h1>
              <div className="meta-row">
                <span>{selectedMatter?.primaryJurisdictionCode ?? "NG"}</span>
                <span>{selectedMatter?.riskLevel ?? "medium"}</span>
                <span>{selectedMatter?.status ?? "intake"}</span>
              </div>
            </div>
            <div className="topbar-actions">
              {bootstrap && bootstrap.matters.length > 1 && (
                <label>
                  <FileText aria-hidden="true" />
                  <select value={selectedMatterId ?? ""} onChange={(e) => switchMatter(e.target.value)}>
                    {bootstrap.matters.map((m) => (
                      <option key={m.id} value={m.id}>{m.title}</option>
                    ))}
                  </select>
                </label>
              )}
              <button type="button" onClick={() => setShowCreateMatter(true)}>
                <Plus aria-hidden="true" size={16} />
                {t("matters.create")}
              </button>
              <label>
                <Globe2 aria-hidden="true" />
                <select value={locale} onChange={(event) => setLocale(event.target.value as "en" | "fr" | "pt" | "es")}>
                  <option value="en">English</option>
                  <option value="fr">Français</option>
                  <option value="pt">Português</option>
                  <option value="es">Español</option>
                </select>
              </label>
              <button type="button" onClick={load}>
                <CheckCircle2 aria-hidden="true" />
                <T k="common.refresh" variant="inline" />
              </button>
            </div>
          </header>
          {navOpen ? <button aria-label={t("nav.close_menu")} className="nav-backdrop" onClick={() => setNavOpen(false)} type="button" /> : null}

          <Breadcrumbs />

          {status ? <div className="toast" role="status" aria-live="polite">{status}</div> : null}

          {loading ? <div className="loading-state" role="status">{t("status.loading_workspace")}</div> : null}
          {error ? <div className="error-state" role="alert">{t("common.error")}: {error} <button type="button" onClick={load}>{t("common.retry")}</button></div> : null}

          {!loading && !error && matterCtx ? (
            <MatterContext.Provider value={matterCtx}>
              {section === "settings" ? (
                <Settings
                  theme={theme}
                  langMode={langMode}
                  primaryLang={primaryLang}
                  secondaryLang={secondaryLang}
                  userRole={userRole}
                  onThemeChange={handleThemeChange}
                  onLangModeChange={handleLangModeChange}
                  onPrimaryLangChange={handlePrimaryLangChange}
                  onSecondaryLangChange={handleSecondaryLangChange}
                  onUserRoleChange={setUserRole}
                />
              ) : (
                <ContentRouter
                  workspace={workspace}
                  bootstrap={bootstrap}
                  intake={intake}
                  rules={rules}
                  tables={tables}
                  tableAreas={tableAreas}
                  legalContent={legalContent}
                  kpis={kpis}
                  matterId={selectedMatterId}
                  locale={locale}
                  busy={busy}
                  onRunRules={runRules}
                  onCreateMemo={createMemo}
                  onGenerateWill={generateWill}
                  onExportBundle={exportBundle}
                />
              )}
            </MatterContext.Provider>
          ) : null}
        </section>
      </main>

      <MatterCreateForm open={showCreateMatter} onClose={() => setShowCreateMatter(false)} onCreated={load} />
    </LanguageModeProvider>
  );
}
