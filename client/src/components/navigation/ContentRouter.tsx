import {
  AlertTriangle,
  Bot,
  CheckCircle2,
  Download,
  FileText,
  Globe2,
  Scale,
  ShieldCheck,
  TableProperties,
  Workflow,
} from "lucide-react";
import { useEffect, useState } from "react";
import { useTranslation } from "react-i18next";
import { api } from "../../lib/api";
import { useNavigation, SUB_NAV } from "../../navigation";
import type { NavSection, BreadcrumbSegment } from "../../navigation";
import type { BootstrapPayload, WorkspacePayload } from "../../lib/api";
import { T } from "../primitives/T";
import i18n from "../../i18n";

// Domain components
import { IntakeWizard } from "../intake/IntakeWizard";
import { IntakeScoring } from "../intake/IntakeScoring";
import { ConsentForm } from "../intake/ConsentForm";
import { PeopleList } from "../people/PeopleList";
import { AssetList } from "../assets/AssetList";
import { AssetTaxonomyConfig } from "../assets/AssetTaxonomyConfig";
import { ScenarioManager } from "../scenarios/ScenarioManager";
import { WhatIfSimulation } from "../scenarios/WhatIfSimulation";
import { ReviewInterface } from "../review/ReviewInterface";
import { ExecutionInstructions } from "../review/ExecutionInstructions";
import { SigningCeremony } from "../review/SigningCeremony";
import { ESignatureRouting } from "../review/ESignatureRouting";
import { SecureMessaging } from "../admin/SecureMessaging";
import { NotificationTemplates } from "../admin/NotificationTemplates";
import { InvitationManager } from "../admin/InvitationManager";
import { ServicePackageConfig } from "../admin/ServicePackageConfig";
import { JurisdictionAdmin } from "../matters/JurisdictionAdmin";
import { IhtCalculator } from "../iht/IhtCalculator";
import { GiftRegister } from "../gifts/GiftRegister";
import { WillCoordination } from "../wills/WillCoordination";
import { BalanceSheet } from "../balance/BalanceSheet";
import { FaraidCalculator } from "../faraid/FaraidCalculator";
import { GoalsDashboard } from "../goals/GoalsDashboard";
import { EstatePlanningReview } from "../estate/EstatePlanningReview";

// ---------- shared response types (migrated from App.tsx) ----------
interface IntakeData {
  totalModules: number;
  completeModules: number;
  score: number;
  missingCritical: string[];
}

interface RulesSummary {
  blocked: boolean;
  reviewRequired: boolean;
  issues: Array<{ code: string; severity: string; message: string; ruleCode: string }>;
}

interface LegalContentData {
  rules: Array<{ id: string; ruleCode: string; category: string; severity: string; status: string }>;
  releaseGates: Array<{ id: string; packId: string; gateCode: string; status: string }>;
  uplOpinions: Array<{ id: string; jurisdictionCode: string; status: string; refreshDueAt: string }>;
  velocity: Array<{ id: string; packId: string; elapsedDays: number | null; launchCost: number | null; status: string }>;
}

interface KpiData {
  payingTenants: number;
  activePacks: number;
  tenantDensityPerPack: number;
  finalizedWills: number;
  arrEstimate: number;
  aiGroundingRate: number;
  aiHallucinationRate: number;
  materialUplIncidents: number;
  materialSecurityIncidents: number;
}

// ---------- ContentRouter props ----------
export interface ContentRouterProps {
  workspace: WorkspacePayload | null;
  bootstrap: BootstrapPayload | null;
  intake: IntakeData | null;
  rules: RulesSummary | null;
  tables: Array<{ tableName: string; area: string; maintainedBy: string }>;
  tableAreas: Record<string, number>;
  legalContent: LegalContentData | null;
  kpis: KpiData | null;
  matterId: string | undefined;
  locale: string;
  busy: string;
  onRunRules: () => void;
  onCreateMemo: () => void;
  onGenerateWill: () => void;
  onExportBundle: () => void;
}

// ---------- Sub-tab bar ----------
function SubTabs({ sectionKey }: { sectionKey: NavSection }) {
  const { subPage, setSubPage } = useNavigation();
  const subs = SUB_NAV[sectionKey];
  if (!subs || subs.length === 0) return null;

  return (
    <nav className="sub-tabs" aria-label="Sub-navigation">
      {subs.map((item) => (
        <button
          key={item.key}
          type="button"
          className={`sub-tabs__item${subPage === item.key ? " sub-tabs__item--active" : ""}`}
          onClick={() => setSubPage(item.key)}
        >
          <T k={item.labelKey} />
        </button>
      ))}
    </nav>
  );
}

// ---------- Select-matter gate ----------
function MatterGate({ children, matterId }: { children: React.ReactNode; matterId: string | undefined }) {
  const { t } = useTranslation();
  if (!matterId) {
    return (
      <div className="select-matter-prompt">
        <Scale size={48} />
        <p>{t("nav.select_matter_prompt")}</p>
      </div>
    );
  }
  return <>{children}</>;
}

// ---------- ContentRouter ----------
export function ContentRouter(props: ContentRouterProps) {
  const { section, subPage, setBreadcrumbs } = useNavigation();
  const { t } = useTranslation();

  // Update breadcrumbs when section/subPage changes
  useEffect(() => {
    const sectionLabel = t(`nav.${section === "estate" ? "estate_analysis" : section === "compliance" ? "compliance" : section === "reports" ? "reports_analytics" : section === "collaboration" ? "collaboration" : section === "administration" ? "administration" : section}`);
    const subDefs = SUB_NAV[section];
    const subDef = subDefs.find((s) => s.key === subPage);

    const segments: BreadcrumbSegment[] = [{ label: sectionLabel, section }];
    if (props.workspace?.matter && isMatterScoped(section)) {
      segments.push({ label: props.workspace.matter.title });
    }
    if (subDef) {
      segments.push({ label: t(subDef.labelKey), section, subPage });
    }
    setBreadcrumbs(segments);
  }, [section, subPage, props.workspace?.matter, t, setBreadcrumbs]);

  return (
    <>
      <SubTabs sectionKey={section} />
      {renderSection(section, subPage, props)}
    </>
  );
}

function isMatterScoped(section: NavSection): boolean {
  return ["matters", "clients", "estate", "documents", "compliance"].includes(section);
}

// ---------- Section renderer ----------
function renderSection(section: NavSection, subPage: string, props: ContentRouterProps): React.ReactNode {
  switch (section) {
    case "dashboard":
      return <DashboardSection subPage={subPage} props={props} />;
    case "matters":
      return <MattersSection subPage={subPage} props={props} />;
    case "clients":
      return (
        <MatterGate matterId={props.matterId}>
          <ClientsSection subPage={subPage} />
        </MatterGate>
      );
    case "estate":
      return (
        <MatterGate matterId={props.matterId}>
          <EstateSection subPage={subPage} props={props} />
        </MatterGate>
      );
    case "documents":
      return (
        <MatterGate matterId={props.matterId}>
          <DocumentsSection subPage={subPage} props={props} />
        </MatterGate>
      );
    case "compliance":
      return (
        <MatterGate matterId={props.matterId}>
          <ComplianceSection subPage={subPage} props={props} />
        </MatterGate>
      );
    case "reports":
      return <ReportsSection subPage={subPage} props={props} />;
    case "collaboration":
      return <CollaborationSection subPage={subPage} />;
    case "administration":
      return <AdministrationSection subPage={subPage} props={props} />;
    case "settings":
      return null; // Settings rendered directly in App.tsx
    default:
      return null;
  }
}

// ==================== SECTION COMPONENTS ====================

// ----- Dashboard document panel (clickable items) -----
function DashboardDocumentsPanel({ props }: { props: ContentRouterProps }) {
  const { navigateTo } = useNavigation();
  return (
    <section className="panel">
      <PanelHeader icon={FileText} titleKey="front.documents" action={
        <div className="button-row">
          {props.matterId && (
            <button type="button" onClick={() => window.open(`/api/reports/matters/${props.matterId}/report/pdf?locale=${i18n.language}`, "_blank")}>
              <Download aria-hidden="true" size={14} /> <T k="common.download_report" variant="inline" />
            </button>
          )}
        </div>
      } />
      <ul className="compact-list">
        {(props.workspace?.documents ?? []).map((document) => (
          <li key={document.id} className="doc-row">
            <button type="button" className="doc-row__link" onClick={() => navigateTo("documents", "assembly")}>
              <FileText size={14} aria-hidden="true" />
              <span>{document.title}</span>
            </button>
            <strong>{document.reviewStatus}</strong>
          </li>
        ))}
        {!props.workspace?.documents.length ? <li><span><T k="front.no_drafts" /></span><strong>ready</strong></li> : null}
      </ul>
    </section>
  );
}

// ----- Dashboard -----
function DashboardSection({ subPage, props }: { subPage: string; props: ContentRouterProps }) {
  if (subPage === "activity") {
    return (
      <div className="content-grid">
        <section className="panel span-2">
          <PanelHeader icon={CheckCircle2} titleKey="reports.audit_trail" />
          <ul className="compact-list">
            {(props.workspace?.auditEvents ?? []).slice(0, 12).map((event) => (
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

  // overview (default)
  return (
    <div className="content-grid">
      <section className="panel span-2">
        <PanelHeader icon={Scale} titleKey="front.intake_score" action={<strong>{props.intake?.score ?? 0}%</strong>} />
        <div className="progress"><span style={{ width: `${props.intake?.score ?? 0}%` }} /></div>
        <div className="split-list">
          <DataList
            titleKey="front.people"
            rows={(props.workspace?.people ?? []).map((person) => [person.legalName, person.domicileCountry ?? "domicile pending", person.preferredLanguage])}
          />
          <DataList
            titleKey="front.assets"
            rows={(props.workspace?.assets ?? []).map((asset) => [
              asset.description,
              `${asset.currency} ${asset.valuation.toLocaleString()}`,
              asset.evidenceRefs.length ? "evidence linked" : "evidence missing"
            ])}
          />
        </div>
      </section>

      <section className="panel">
        <PanelHeader icon={ShieldCheck} titleKey="reports.metrics" />
        <div className="metric-grid">
          <Metric labelKey="reports.tenants" value={props.kpis?.payingTenants ?? 0} />
          <Metric labelKey="reports.packs" value={props.kpis?.activePacks ?? 0} />
          <Metric labelKey="reports.density" value={props.kpis?.tenantDensityPerPack ?? 0} />
          <Metric labelKey="reports.wills" value={props.kpis?.finalizedWills ?? 0} />
          <Metric labelKey="reports.ai_grounding" value={`${props.kpis?.aiGroundingRate ?? 0}%`} />
          <Metric labelKey="reports.security_incidents" value={props.kpis?.materialSecurityIncidents ?? 0} />
        </div>
      </section>

      <DashboardDocumentsPanel props={props} />

      <section className="panel">
        <PanelHeader icon={Workflow} titleKey="front.reviews" />
        <ul className="compact-list">
          {(props.workspace?.reviews ?? []).slice(0, 6).map((review) => (
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

// ----- Matters -----
function MattersSection({ subPage, props }: { subPage: string; props: ContentRouterProps }) {
  if (subPage === "intake") {
    return (
      <MatterGate matterId={props.matterId}>
        <div className="content-grid">
          <section className="span-2"><IntakeWizard /></section>
          <section><IntakeScoring /></section>
        </div>
      </MatterGate>
    );
  }
  if (subPage === "scoring") {
    return (
      <MatterGate matterId={props.matterId}>
        <IntakeScoring />
      </MatterGate>
    );
  }
  if (subPage === "consent") {
    return (
      <MatterGate matterId={props.matterId}>
        <ConsentForm />
      </MatterGate>
    );
  }

  // list (default)
  return (
    <div className="content-grid">
      <section className="panel span-2">
        <PanelHeader icon={Scale} titleKey="nav.matters" action={<strong>{props.bootstrap?.matters.length ?? 0}</strong>} />
        <ul className="compact-list">
          {(props.bootstrap?.matters ?? []).map((m) => (
            <li key={m.id}>
              <span>{m.title}</span>
              <strong>{m.status}</strong>
            </li>
          ))}
        </ul>
      </section>
    </div>
  );
}

// ----- Clients -----
function ClientsSection({ subPage }: { subPage: string }) {
  if (subPage === "domicile") {
    return <PeopleList />;
  }
  if (subPage === "relationships") {
    return <PeopleList />;
  }
  if (subPage === "goals") {
    return <GoalsDashboard />;
  }
  // people (default)
  return <PeopleList />;
}

// ----- Estate Analysis -----
function EstateSection({ subPage, props }: { subPage: string; props: ContentRouterProps }) {
  if (subPage === "review") return <EstatePlanningReview />;
  if (subPage === "balance") return <BalanceSheet />;
  if (subPage === "iht") return <IhtCalculator />;
  if (subPage === "faraid") return <FaraidCalculator />;
  if (subPage === "gifts") return <GiftRegister />;
  if (subPage === "scenarios") {
    return (
      <div className="content-grid">
        <section className="span-2"><ScenarioManager /></section>
        <section><WhatIfSimulation /></section>
      </div>
    );
  }
  // assets (default)
  return <AssetList />;
}

// ----- Document Assembly (with viewer) -----
interface FullDocument {
  id: string;
  title: string;
  documentType: string;
  jurisdictionCode: string;
  locale: string;
  status: string;
  reviewStatus: string;
  executionStatus: string;
  content: string;
  hash?: string;
  version: number | string;
  createdAt?: string;
}

const ESTATE_DOCUMENT_OPTIONS = [
  { value: "estate_planning_summary", label: "Estate planning summary" },
  { value: "protection_review_letter", label: "Protection review letter" },
  { value: "incapacity_instruction", label: "Incapacity instruction" },
  { value: "trust_memo", label: "Trust memo" },
  { value: "deed_of_variation_instruction", label: "Deed variation instruction" },
  { value: "cross_border_tax_note", label: "Cross-border tax note" },
];

function DocumentAssembly({ props }: { props: ContentRouterProps }) {
  const { t } = useTranslation();
  const [viewingDoc, setViewingDoc] = useState<FullDocument | null>(null);
  const [loadingDoc, setLoadingDoc] = useState<string | null>(null);
  const [generatedDocs, setGeneratedDocs] = useState<FullDocument[]>([]);
  const [estateDocumentType, setEstateDocumentType] = useState("estate_planning_summary");
  const [generatingEstateDoc, setGeneratingEstateDoc] = useState(false);

  const documents = [
    ...generatedDocs,
    ...(props.workspace?.documents ?? []).filter((doc) => !generatedDocs.some((generated) => generated.id === doc.id)),
  ];

  async function viewDocument(docId: string) {
    if (loadingDoc) return;
    if (viewingDoc?.id === docId) {
      setViewingDoc(null);
      return;
    }
    try {
      setLoadingDoc(docId);
      const payload = await api<{ document: FullDocument }>(`/api/planning/documents/${docId}`);
      setViewingDoc(payload.document);
    } catch {
      setViewingDoc(null);
    } finally {
      setLoadingDoc(null);
    }
  }

  async function generateEstateDocument() {
    if (!props.matterId || generatingEstateDoc) return;
    try {
      setGeneratingEstateDoc(true);
      const payload = await api<{ document: FullDocument & { documentId?: string } }>(`/api/planning/matters/${props.matterId}/documents/estate-planning`, {
        method: "POST",
        body: JSON.stringify({ documentType: estateDocumentType, locale: props.locale })
      });
      const document = { ...payload.document, id: payload.document.id ?? payload.document.documentId ?? "" };
      setGeneratedDocs((current) => [document, ...current.filter((doc) => doc.id !== document.id)]);
      setViewingDoc(document);
    } finally {
      setGeneratingEstateDoc(false);
    }
  }

  return (
    <div className="content-grid">
      <section className="panel span-2">
        <PanelHeader icon={FileText} titleKey="front.documents" action={
          <button onClick={props.onGenerateWill} type="button" disabled={!!props.busy} className={props.busy === "generateWill" ? "btn-loading" : ""}>
            <T k={props.busy === "generateWill" ? "status.generating_will" : "common.generate"} variant="inline" />
          </button>
        } />
        <div className="button-row mt-2">
          <label>
            <FileText aria-hidden="true" size={14} />
            <select value={estateDocumentType} onChange={(event) => setEstateDocumentType(event.target.value)}>
              {ESTATE_DOCUMENT_OPTIONS.map((option) => (
                <option key={option.value} value={option.value}>{option.label}</option>
              ))}
            </select>
          </label>
          <button type="button" onClick={generateEstateDocument} disabled={generatingEstateDoc}>
            <T k={generatingEstateDoc ? "common.saving" : "common.generate"} variant="inline" />
          </button>
        </div>
        <ul className="compact-list">
          {documents.map((doc) => (
            <li key={doc.id} className={`doc-row${viewingDoc?.id === doc.id ? " doc-row--active" : ""}`}>
              <button type="button" className="doc-row__link" onClick={() => viewDocument(doc.id)}>
                <FileText size={14} aria-hidden="true" />
                <span>{doc.title}</span>
              </button>
              <strong>{doc.reviewStatus}</strong>
              {loadingDoc === doc.id && <em className="btn-loading">{t("status.loading_workspace")}</em>}
            </li>
          ))}
          {!documents.length ? <li><span><T k="front.no_drafts" /></span><strong>ready</strong></li> : null}
        </ul>
      </section>

      {viewingDoc && (
        <section className="panel span-3 doc-viewer">
          <div className="panel-header">
            <h3><FileText aria-hidden="true" size={16} /> {viewingDoc.title}</h3>
            <div className="doc-viewer__meta">
              <span>{viewingDoc.jurisdictionCode}</span>
              <span>{viewingDoc.documentType}</span>
              <span>v{viewingDoc.version}</span>
              <strong>{viewingDoc.status}</strong>
            </div>
          </div>
          <pre className="doc-viewer__content">{viewingDoc.content}</pre>
        </section>
      )}
    </div>
  );
}

// ----- Documents -----
function DocumentsSection({ subPage, props }: { subPage: string; props: ContentRouterProps }) {
  if (subPage === "assembly") {
    return <DocumentAssembly props={props} />;
  }
  if (subPage === "review") {
    return (
      <div className="content-grid">
        <section className="span-2"><ReviewInterface /></section>
        <section><ExecutionInstructions /></section>
      </div>
    );
  }
  if (subPage === "signing") return <SigningCeremony />;
  if (subPage === "esignature") return <ESignatureRouting />;

  // wills (default)
  return <WillCoordination />;
}

// ----- Compliance -----
function ComplianceSection({ subPage, props }: { subPage: string; props: ContentRouterProps }) {
  if (subPage === "conflict-of-laws") {
    return (
      <div className="content-grid">
        <section className="panel span-2">
          <PanelHeader icon={Globe2} titleKey="middle.conflict_of_laws" action={
            <button onClick={props.onCreateMemo} type="button" disabled={!!props.busy} className={props.busy === "createMemo" ? "btn-loading" : ""}>
              <T k={props.busy === "createMemo" ? "status.creating_memo" : "common.create_memo"} variant="inline" />
            </button>
          } />
          <ul className="compact-list">
            {(props.legalContent?.rules ?? []).slice(0, 7).map((rule) => (
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
  if (subPage === "ai-monitors") {
    return (
      <div className="content-grid">
        <section className="panel span-2">
          <PanelHeader icon={Bot} titleKey="back.ai_monitors" />
          <ul className="compact-list">
            {(props.legalContent?.releaseGates ?? [])
              .filter((gate) => gate.gateCode === "ai-safety")
              .map((gate) => (
                <li key={gate.id}>
                  <span>{gate.packId}</span>
                  <strong>{gate.status}</strong>
                </li>
              ))}
          </ul>
        </section>
      </div>
    );
  }
  if (subPage === "upl-opinions") {
    return (
      <div className="content-grid">
        <section className="panel span-2">
          <PanelHeader icon={ShieldCheck} titleKey="back.upl_opinions" />
          <ul className="compact-list">
            {(props.legalContent?.uplOpinions ?? []).map((opinion) => (
              <li key={opinion.id}>
                <span>{opinion.jurisdictionCode}</span>
                <strong>{opinion.status}</strong>
              </li>
            ))}
          </ul>
        </section>
      </div>
    );
  }
  if (subPage === "audit-trail") {
    return (
      <div className="content-grid">
        <section className="panel span-2">
          <PanelHeader icon={CheckCircle2} titleKey="reports.audit_trail" />
          <ul className="compact-list">
            {(props.workspace?.auditEvents ?? []).slice(0, 12).map((event) => (
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

  // rule-scan (default)
  return (
    <div className="content-grid">
      <section className="panel span-2">
        <PanelHeader
          icon={AlertTriangle}
          titleKey="middle.rule_scan"
          action={
            <div className="button-row">
              <button onClick={props.onRunRules} type="button" disabled={!!props.busy} className={props.busy === "runRules" ? "btn-loading" : ""}>
                <T k={props.busy === "runRules" ? "status.running_rules" : "common.run_scan"} variant="inline" />
              </button>
              <button onClick={props.onCreateMemo} type="button" disabled={!!props.busy} className={props.busy === "createMemo" ? "btn-loading" : ""}>
                <T k={props.busy === "createMemo" ? "status.creating_memo" : "common.create_memo"} variant="inline" />
              </button>
            </div>
          }
        />
        <ul className="issue-list">
          {(props.rules?.issues ?? []).map((issue) => (
            <li key={`${issue.code}-${issue.ruleCode}`} className={issue.severity}>
              <strong>{issue.code}</strong>
              <span>{issue.message}</span>
              <em>{issue.ruleCode}</em>
            </li>
          ))}
          {!props.rules?.issues.length ? <li><strong><T k="middle.no_current_scan" /></strong><span><T k="common.run_scan" /></span><em>pending</em></li> : null}
        </ul>
      </section>
    </div>
  );
}

// ----- Reports & Analytics -----
function ReportsSection({ subPage, props }: { subPage: string; props: ContentRouterProps }) {
  if (subPage === "compliance-reports") {
    return (
      <div className="content-grid">
        <section className="panel span-2">
          <PanelHeader icon={Globe2} titleKey="middle.rules" />
          <ul className="compact-list">
            {(props.legalContent?.rules ?? []).slice(0, 10).map((rule) => (
              <li key={rule.id}>
                <span>{rule.ruleCode}</span>
                <strong>{rule.severity}</strong>
              </li>
            ))}
          </ul>
        </section>
        <section className="panel">
          <PanelHeader icon={ShieldCheck} titleKey="back.upl_opinions" />
          <ul className="compact-list">
            {(props.legalContent?.uplOpinions ?? []).map((opinion) => (
              <li key={opinion.id}>
                <span>{opinion.jurisdictionCode}</span>
                <strong>{opinion.status}</strong>
              </li>
            ))}
          </ul>
        </section>
      </div>
    );
  }
  if (subPage === "tenant-analytics") {
    return (
      <div className="content-grid">
        <section className="panel span-2">
          <PanelHeader icon={ShieldCheck} titleKey="reports.metrics" />
          <div className="metric-grid">
            <Metric labelKey="reports.tenants" value={props.kpis?.payingTenants ?? 0} />
            <Metric labelKey="reports.density" value={props.kpis?.tenantDensityPerPack ?? 0} />
            <Metric labelKey="reports.packs" value={props.kpis?.activePacks ?? 0} />
          </div>
        </section>
      </div>
    );
  }
  if (subPage === "export-centre") {
    return (
      <div className="content-grid">
        <section className="panel span-2">
          <PanelHeader icon={Download} titleKey="api.export_bundle" action={
            <button onClick={props.onExportBundle} type="button" disabled={!!props.busy} className={props.busy === "exportBundle" ? "btn-loading" : ""}>
              <T k={props.busy === "exportBundle" ? "status.exporting" : "common.export"} variant="inline" />
            </button>
          } />
          <div className="endpoint-grid">
            {["/api/planning/matters/{id}/rules/evaluate", "/api/planning/matters/{id}/documents/will", "/api/exports/matters/{id}", "/api/admin/packs"].map(
              (endpoint) => <code key={endpoint}>{endpoint}</code>
            )}
          </div>
        </section>
        <section className="panel">
          <PanelHeader icon={Globe2} titleKey="api.jurisdiction_packs" />
          <ul className="compact-list">
            {(props.bootstrap?.packs ?? []).map((pack) => (
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

  // operational (default)
  return (
    <div className="content-grid">
      <section className="panel span-2">
        <PanelHeader icon={ShieldCheck} titleKey="reports.metrics" />
        <div className="metric-grid">
          <Metric labelKey="reports.tenants" value={props.kpis?.payingTenants ?? 0} />
          <Metric labelKey="reports.packs" value={props.kpis?.activePacks ?? 0} />
          <Metric labelKey="reports.density" value={props.kpis?.tenantDensityPerPack ?? 0} />
          <Metric labelKey="reports.wills" value={props.kpis?.finalizedWills ?? 0} />
          <Metric labelKey="reports.ai_grounding" value={`${props.kpis?.aiGroundingRate ?? 0}%`} />
          <Metric labelKey="reports.security_incidents" value={props.kpis?.materialSecurityIncidents ?? 0} />
        </div>
      </section>
      <section className="panel">
        <PanelHeader icon={CheckCircle2} titleKey="reports.audit_trail" />
        <ul className="compact-list">
          {(props.workspace?.auditEvents ?? []).slice(0, 8).map((event) => (
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

// ----- Collaboration -----
function CollaborationSection({ subPage }: { subPage: string }) {
  if (subPage === "invitations") return <InvitationManager />;
  if (subPage === "notifications") return <NotificationTemplates />;

  // messaging (default)
  return (
    <div className="content-grid">
      <section className="span-2"><SecureMessaging /></section>
      <section><InvitationManager /></section>
    </div>
  );
}

// ----- Administration -----
function AdministrationSection({ subPage, props }: { subPage: string; props: ContentRouterProps }) {
  if (subPage === "taxonomy") return <AssetTaxonomyConfig />;
  if (subPage === "templates") return <NotificationTemplates />;
  if (subPage === "packages") return <ServicePackageConfig />;
  if (subPage === "schema") {
    return (
      <div className="content-grid">
        <section className="panel span-2">
          <PanelHeader icon={TableProperties} titleKey="back.schema_tables" action={<strong>{props.tables.length}</strong>} />
          <div className="metric-grid">
            {Object.entries(props.tableAreas).map(([area, count]) => (
              <div className="metric" key={area}>
                <span>{area.replaceAll("_", " ")}</span>
                <strong>{count}</strong>
              </div>
            ))}
          </div>
        </section>
      </div>
    );
  }
  if (subPage === "release-gates") {
    return (
      <div className="content-grid">
        <section className="panel span-2">
          <PanelHeader icon={Workflow} titleKey="back.release_gates" />
          <ul className="compact-list">
            {(props.legalContent?.velocity ?? []).map((record) => (
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

  // jurisdictions (default)
  return <JurisdictionAdmin />;
}

// ==================== SHARED PRESENTATIONAL COMPONENTS ====================

function PanelHeader({ icon: Icon, titleKey, action }: { icon: typeof Scale; titleKey: string; action?: React.ReactNode }) {
  return (
    <div className="panel-header">
      <h2><Icon aria-hidden="true" /><T k={titleKey} /></h2>
      {action}
    </div>
  );
}

function DataList({ titleKey, rows }: { titleKey: string; rows: string[][] }) {
  return (
    <div>
      <h3><T k={titleKey} /></h3>
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
      <span><T k={labelKey} /></span>
      <strong>{value}</strong>
    </div>
  );
}
