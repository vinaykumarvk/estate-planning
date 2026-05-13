import {
  AlertTriangle,
  Bot,
  CheckCircle2,
  Download,
  FileText,
  Globe2,
  Menu,
  Scale,
  Settings as SettingsIcon,
  ShieldCheck,
  TableProperties,
  Workflow,
  X
} from "lucide-react";
import { useEffect, useMemo, useState } from "react";
import { useTranslation } from "react-i18next";
import { api, type BootstrapPayload, type WorkspacePayload } from "./lib/api";
import { Bilingual } from "./Bilingual";
import { SecondaryLanguageProvider } from "./SecondaryLanguageContext";
import { Settings } from "./Settings";
import { useTheme, type ThemePreference } from "./theme";
import { ensureLocaleLoaded } from "./i18n";

type TabKey = "front" | "middle" | "back" | "api" | "reports" | "settings";

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

const tabs: Array<{ key: TabKey; labelKey: string; icon: typeof Scale }> = [
  { key: "front", labelKey: "nav.front_office", icon: Scale },
  { key: "middle", labelKey: "nav.middle_office", icon: Workflow },
  { key: "back", labelKey: "nav.back_office", icon: TableProperties },
  { key: "api", labelKey: "nav.api", icon: Download },
  { key: "reports", labelKey: "nav.reports", icon: ShieldCheck },
  { key: "settings", labelKey: "settings.title", icon: SettingsIcon }
];

export function App() {
  const { t } = useTranslation();
  const { theme, setTheme } = useTheme("estate-theme");
  const [secondaryLang, setSecondaryLang] = useState<"fr" | "pt" | "es" | "none">(() => {
    return (localStorage.getItem("estate-secondary-lang") as "fr" | "pt" | "es" | "none") || "none";
  });

  const [bootstrap, setBootstrap] = useState<BootstrapPayload | null>(null);
  const [workspace, setWorkspace] = useState<WorkspacePayload | null>(null);
  const [intake, setIntake] = useState<IntakeResponse["intake"] | null>(null);
  const [rules, setRules] = useState<RulesResponse["summary"] | null>(null);
  const [tables, setTables] = useState<TableCatalogResponse["tables"]>([]);
  const [legalContent, setLegalContent] = useState<LegalContentResponse | null>(null);
  const [kpis, setKpis] = useState<KpiResponse["kpis"] | null>(null);
  const [tab, setTab] = useState<TabKey>("front");
  const [locale, setLocale] = useState<"en-GB" | "pt-PT">("en-GB");
  const [status, setStatus] = useState<string>("");
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [navOpen, setNavOpen] = useState(false);
  const selectedMatterId = bootstrap?.matters[0]?.id;

  useEffect(() => {
    void load();
  }, []);

  useEffect(() => {
    function closeOnEscape(event: KeyboardEvent) {
      if (event.key === "Escape") {
        setNavOpen(false);
      }
    }
    window.addEventListener("keydown", closeOnEscape);
    return () => window.removeEventListener("keydown", closeOnEscape);
  }, []);

  async function handleLanguageChange(lang: string) {
    const typedLang = lang as "fr" | "pt" | "es" | "none";
    await ensureLocaleLoaded(lang);
    setSecondaryLang(typedLang);
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
      setLocale((boot.tenant?.defaultLocale as "en-GB" | "pt-PT") ?? "en-GB");
      if (boot.matters[0]) {
        const [workspacePayload, intakePayload, tablePayload, legalPayload, kpiPayload] = await Promise.all([
          api<WorkspacePayload>(`/api/matters/${boot.matters[0].id}`),
          api<IntakeResponse>(`/api/matters/${boot.matters[0].id}/intake-score`),
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
    if (!selectedMatterId) return;
    try {
      setStatus(t("status.running_rules"));
      const payload = await api<RulesResponse>(`/api/planning/matters/${selectedMatterId}/rules/evaluate`, { method: "POST", body: "{}" });
      setRules(payload.summary);
      setStatus(t("status.rule_scan_complete"));
      await refreshWorkspace();
    } catch (err) {
      setStatus(`${t("common.error")}: ${err instanceof Error ? err.message : t("error.rule_scan_failed")}`);
    }
  }

  async function createMemo() {
    if (!selectedMatterId) return;
    try {
      setStatus(t("status.creating_memo"));
      await api(`/api/planning/matters/${selectedMatterId}/conflict-of-laws`, { method: "POST", body: "{}" });
      setStatus(t("status.conflict_memo_created"));
      await refreshWorkspace();
    } catch (err) {
      setStatus(`${t("common.error")}: ${err instanceof Error ? err.message : t("error.memo_creation_failed")}`);
    }
  }

  async function generateWill() {
    if (!selectedMatterId) return;
    try {
      setStatus(t("status.generating_will"));
      await api(`/api/planning/matters/${selectedMatterId}/documents/will`, {
        method: "POST",
        body: JSON.stringify({ locale })
      });
      setStatus(t("status.will_generated"));
      await refreshWorkspace();
    } catch (err) {
      setStatus(`${t("common.error")}: ${err instanceof Error ? err.message : t("error.will_generation_failed")}`);
    }
  }

  async function exportBundle() {
    if (!selectedMatterId) return;
    try {
      setStatus(t("status.exporting"));
      await api(`/api/exports/matters/${selectedMatterId}?requestedBy=user-solicitor`);
      setStatus(t("status.export_generated"));
      await refreshWorkspace();
    } catch (err) {
      setStatus(`${t("common.error")}: ${err instanceof Error ? err.message : t("error.export_failed")}`);
    }
  }

  async function refreshWorkspace() {
    if (!selectedMatterId) return;
    const [workspacePayload, kpiPayload] = await Promise.all([
      api<WorkspacePayload>(`/api/matters/${selectedMatterId}`),
      api<KpiResponse>("/api/reports/phase-1-kpis")
    ]);
    setWorkspace(workspacePayload);
    setKpis(kpiPayload.kpis);
  }

  const selectedMatter = workspace?.matter;
  const tableAreas = useMemo(() => {
    return tables.reduce<Record<string, number>>((accumulator, table) => {
      accumulator[table.area] = (accumulator[table.area] ?? 0) + 1;
      return accumulator;
    }, {});
  }, [tables]);

  return (
    <SecondaryLanguageProvider lang={secondaryLang}>
      <main className="app-shell">
        <aside className={`sidebar ${navOpen ? "open" : ""}`}>
          <div className="brand-block">
            <Scale aria-hidden="true" />
            <div>
              <strong><Bilingual tKey="nav.brand" /></strong>
              <span>{bootstrap?.tenant?.name ?? t("common.loading")}</span>
            </div>
          </div>

          <nav className="nav-tabs" aria-label={t("nav.workspace_sections")}>
            {tabs.map((item) => {
              const Icon = item.icon;
              return (
                <button
                  key={item.key}
                  className={tab === item.key ? "active" : ""}
                  onClick={() => {
                    setTab(item.key);
                    setNavOpen(false);
                  }}
                  type="button"
                >
                  <Icon aria-hidden="true" />
                  <span><Bilingual tKey={item.labelKey} /></span>
                </button>
              );
            })}
          </nav>
        </aside>

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
                <span>{selectedMatter?.primaryJurisdictionCode ?? "EW"}</span>
                <span>{selectedMatter?.riskLevel ?? "medium"}</span>
                <span>{selectedMatter?.status ?? "intake"}</span>
              </div>
            </div>
            <div className="topbar-actions">
              <label>
                <Globe2 aria-hidden="true" />
                <select value={locale} onChange={(event) => setLocale(event.target.value as "en-GB" | "pt-PT")}>
                  <option value="en-GB">en-GB</option>
                  <option value="pt-PT">pt-PT</option>
                </select>
              </label>
              <button type="button" onClick={load}>
                <CheckCircle2 aria-hidden="true" />
                <Bilingual tKey="common.refresh" variant="inline" />
              </button>
            </div>
          </header>
          {navOpen ? <button aria-label={t("nav.close_menu")} className="nav-backdrop" onClick={() => setNavOpen(false)} type="button" /> : null}

          {status ? <div className="toast" role="status" aria-live="polite">{status}</div> : null}

          {loading ? <div className="loading-state" role="status">{t("status.loading_workspace")}</div> : null}
          {error ? <div className="error-state" role="alert">{t("common.error")}: {error} <button type="button" onClick={load}>{t("common.retry")}</button></div> : null}

          {!loading && !error ? (
            tab === "front" ? (
              <FrontOffice workspace={workspace} intake={intake} onGenerateWill={generateWill} />
            ) : tab === "middle" ? (
              <MiddleOffice rules={rules} legalContent={legalContent} onRunRules={runRules} onCreateMemo={createMemo} />
            ) : tab === "back" ? (
              <BackOffice tables={tables} tableAreas={tableAreas} legalContent={legalContent} />
            ) : tab === "api" ? (
              <ApiSurface packs={bootstrap?.packs ?? []} onExport={exportBundle} />
            ) : tab === "settings" ? (
              <Settings
                theme={theme}
                language={secondaryLang}
                onThemeChange={handleThemeChange}
                onLanguageChange={handleLanguageChange}
              />
            ) : (
              <Reports kpis={kpis} workspace={workspace} />
            )
          ) : null}
        </section>
      </main>
    </SecondaryLanguageProvider>
  );
}

function FrontOffice({
  workspace,
  intake,
  onGenerateWill
}: {
  workspace: WorkspacePayload | null;
  intake: IntakeResponse["intake"] | null;
  onGenerateWill: () => void;
}) {
  return (
    <div className="content-grid">
      <section className="panel span-2">
        <PanelHeader icon={Scale} titleKey="front.intake_score" action={<strong>{intake?.score ?? 0}%</strong>} />
        <div className="progress"><span style={{ width: `${intake?.score ?? 0}%` }} /></div>
        <div className="split-list">
          <DataList
            titleKey="front.people"
            rows={(workspace?.people ?? []).map((person) => [person.legalName, person.domicileCountry ?? "domicile pending", person.preferredLanguage])}
          />
          <DataList
            titleKey="front.assets"
            rows={(workspace?.assets ?? []).map((asset) => [
              asset.description,
              `${asset.currency} ${asset.valuation.toLocaleString()}`,
              asset.evidenceRefs.length ? "evidence linked" : "evidence missing"
            ])}
          />
        </div>
      </section>

      <section className="panel">
        <PanelHeader icon={FileText} titleKey="front.documents" action={<button onClick={onGenerateWill} type="button"><Bilingual tKey="common.generate" variant="inline" /></button>} />
        <ul className="compact-list">
          {(workspace?.documents ?? []).map((document) => (
            <li key={document.id}>
              <span>{document.title}</span>
              <strong>{document.reviewStatus}</strong>
            </li>
          ))}
          {!workspace?.documents.length ? <li><span><Bilingual tKey="front.no_drafts" /></span><strong>ready</strong></li> : null}
        </ul>
      </section>

      <section className="panel">
        <PanelHeader icon={Workflow} titleKey="front.reviews" />
        <ul className="compact-list">
          {(workspace?.reviews ?? []).slice(0, 6).map((review) => (
            <li key={review.id}>
              <span>{review.reviewType}</span>
              <strong>{review.status}</strong>
            </li>
          ))}
        </ul>
      </section>
    </div>
  );
}

function MiddleOffice({
  rules,
  legalContent,
  onRunRules,
  onCreateMemo
}: {
  rules: RulesResponse["summary"] | null;
  legalContent: LegalContentResponse | null;
  onRunRules: () => void;
  onCreateMemo: () => void;
}) {
  return (
    <div className="content-grid">
      <section className="panel span-2">
        <PanelHeader
          icon={AlertTriangle}
          titleKey="middle.rule_scan"
          action={
            <div className="button-row">
              <button onClick={onRunRules} type="button"><Bilingual tKey="common.run_scan" variant="inline" /></button>
              <button onClick={onCreateMemo} type="button"><Bilingual tKey="common.create_memo" variant="inline" /></button>
            </div>
          }
        />
        <ul className="issue-list">
          {(rules?.issues ?? []).map((issue) => (
            <li key={`${issue.code}-${issue.ruleCode}`} className={issue.severity}>
              <strong>{issue.code}</strong>
              <span>{issue.message}</span>
              <em>{issue.ruleCode}</em>
            </li>
          ))}
          {!rules?.issues.length ? <li><strong><Bilingual tKey="middle.no_current_scan" /></strong><span><Bilingual tKey="common.run_scan" /></span><em>pending</em></li> : null}
        </ul>
      </section>

      <section className="panel">
        <PanelHeader icon={Bot} titleKey="back.ai_monitors" />
        <ul className="compact-list">
          {(legalContent?.releaseGates ?? [])
            .filter((gate) => gate.gateCode === "ai-safety")
            .map((gate) => (
              <li key={gate.id}>
                <span>{gate.packId}</span>
                <strong>{gate.status}</strong>
              </li>
            ))}
        </ul>
      </section>

      <section className="panel">
        <PanelHeader icon={Globe2} titleKey="middle.rules" />
        <ul className="compact-list">
          {(legalContent?.rules ?? []).slice(0, 7).map((rule) => (
            <li key={rule.id}>
              <span>{rule.ruleCode}</span>
              <strong>{rule.severity}</strong>
            </li>
          ))}
        </ul>
      </section>
    </div>
  );
}

function BackOffice({
  tables,
  tableAreas,
  legalContent
}: {
  tables: TableCatalogResponse["tables"];
  tableAreas: Record<string, number>;
  legalContent: LegalContentResponse | null;
}) {
  return (
    <div className="content-grid">
      <section className="panel span-2">
        <PanelHeader icon={TableProperties} titleKey="back.schema_tables" action={<strong>{tables.length}</strong>} />
        <div className="metric-grid">
          {Object.entries(tableAreas).map(([area, count]) => (
            <div className="metric" key={area}>
              <span>{area.replaceAll("_", " ")}</span>
              <strong>{count}</strong>
            </div>
          ))}
        </div>
      </section>

      <section className="panel">
        <PanelHeader icon={ShieldCheck} titleKey="back.upl_opinions" />
        <ul className="compact-list">
          {(legalContent?.uplOpinions ?? []).map((opinion) => (
            <li key={opinion.id}>
              <span>{opinion.jurisdictionCode}</span>
              <strong>{opinion.status}</strong>
            </li>
          ))}
        </ul>
      </section>

      <section className="panel">
        <PanelHeader icon={Workflow} titleKey="back.release_gates" />
        <ul className="compact-list">
          {(legalContent?.velocity ?? []).map((record) => (
            <li key={record.id}>
              <span>{record.packId}</span>
              <strong>{record.status}</strong>
            </li>
          ))}
        </ul>
      </section>
    </div>
  );
}

function ApiSurface({ packs, onExport }: { packs: BootstrapPayload["packs"]; onExport: () => void }) {
  return (
    <div className="content-grid">
      <section className="panel span-2">
        <PanelHeader icon={Download} titleKey="api.export_bundle" action={<button onClick={onExport} type="button"><Bilingual tKey="common.export" variant="inline" /></button>} />
        <div className="endpoint-grid">
          {["/api/planning/matters/{id}/rules/evaluate", "/api/planning/matters/{id}/documents/will", "/api/exports/matters/{id}", "/api/admin/packs"].map(
            (endpoint) => (
              <code key={endpoint}>{endpoint}</code>
            )
          )}
        </div>
      </section>
      <section className="panel">
        <PanelHeader icon={Globe2} titleKey="api.jurisdiction_packs" />
        <ul className="compact-list">
          {packs.map((pack) => (
            <li key={pack.id}>
              <span>{pack.jurisdictionCode}</span>
              <strong>{pack.status}</strong>
            </li>
          ))}
        </ul>
      </section>
    </div>
  );
}

function Reports({ kpis, workspace }: { kpis: KpiResponse["kpis"] | null; workspace: WorkspacePayload | null }) {
  return (
    <div className="content-grid">
      <section className="panel span-2">
        <PanelHeader icon={ShieldCheck} titleKey="reports.metrics" />
        <div className="metric-grid">
          <Metric labelKey="reports.tenants" value={kpis?.payingTenants ?? 0} />
          <Metric labelKey="reports.packs" value={kpis?.activePacks ?? 0} />
          <Metric labelKey="reports.density" value={kpis?.tenantDensityPerPack ?? 0} />
          <Metric labelKey="reports.wills" value={kpis?.finalizedWills ?? 0} />
          <Metric labelKey="reports.ai_grounding" value={`${kpis?.aiGroundingRate ?? 0}%`} />
          <Metric labelKey="reports.security_incidents" value={kpis?.materialSecurityIncidents ?? 0} />
        </div>
      </section>
      <section className="panel">
        <PanelHeader icon={CheckCircle2} titleKey="reports.audit_trail" />
        <ul className="compact-list">
          {(workspace?.auditEvents ?? []).slice(0, 8).map((event) => (
            <li key={event.id}>
              <span>{event.eventType}</span>
              <strong>{event.actorRole}</strong>
            </li>
          ))}
        </ul>
      </section>
    </div>
  );
}

function PanelHeader({ icon: Icon, titleKey, action }: { icon: typeof Scale; titleKey: string; action?: React.ReactNode }) {
  return (
    <div className="panel-header">
      <h2><Icon aria-hidden="true" /><Bilingual tKey={titleKey} /></h2>
      {action}
    </div>
  );
}

function DataList({ titleKey, rows }: { titleKey: string; rows: string[][] }) {
  return (
    <div>
      <h3><Bilingual tKey={titleKey} /></h3>
      <ul className="compact-list">
        {rows.map((row) => (
          <li key={row.join("-")}>
            <span>{row[0]}</span>
            <strong>{row[1]}</strong>
            <em>{row[2]}</em>
          </li>
        ))}
      </ul>
    </div>
  );
}

function Metric({ labelKey, value }: { labelKey: string; value: string | number }) {
  return (
    <div className="metric">
      <span><Bilingual tKey={labelKey} /></span>
      <strong>{value}</strong>
    </div>
  );
}
