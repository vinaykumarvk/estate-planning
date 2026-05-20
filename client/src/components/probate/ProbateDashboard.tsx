import {
  AlertTriangle,
  CheckCircle2,
  Circle,
  ClipboardList,
  Clock,
  FileUp,
  Gavel,
  Loader2,
} from "lucide-react";
import { useMemo, useState } from "react";
import { useMatterContext } from "../hooks/useMatterContext";
import { Modal } from "../primitives/Modal";
import { FormActions } from "../primitives/FormActions";
import { FormSelect } from "../primitives/FormSelect";
import { FormTextarea } from "../primitives/FormTextarea";
import { StatusBadge } from "../primitives/StatusBadge";
import { T } from "../primitives/T";

/* ---------- Types ---------- */

type StepStatus = "pending" | "in_progress" | "complete";

interface ProbateStep {
  id: string;
  title: string;
  description: string;
  status: StepStatus;
  fileSlot?: { label: string; fileName: string | null };
}

/* ---------- Jurisdiction checklists ---------- */

function buildEWChecklist(): ProbateStep[] {
  return [
    { id: "ew-1", title: "Obtain death certificate", description: "Order official copies of the death certificate from the registrar.", status: "pending", fileSlot: { label: "Death certificate", fileName: null } },
    { id: "ew-2", title: "Register death", description: "Register the death within 5 days at the local register office.", status: "pending" },
    { id: "ew-3", title: "Notify banks and financial institutions", description: "Inform all banks, building societies, and insurers of the death.", status: "pending" },
    { id: "ew-4", title: "Value the estate", description: "Obtain professional valuations for property, investments, and personal effects.", status: "pending", fileSlot: { label: "Estate valuation report", fileName: null } },
    { id: "ew-5", title: "Apply for Grant of Probate", description: "Submit the PA1P or PA1A form to the Probate Registry along with the IHT form.", status: "pending", fileSlot: { label: "Probate application", fileName: null } },
    { id: "ew-6", title: "Pay Inheritance Tax", description: "Calculate and pay any IHT due to HMRC within 6 months of date of death.", status: "pending", fileSlot: { label: "IHT receipt", fileName: null } },
    { id: "ew-7", title: "Collect assets", description: "Use the Grant of Probate to collect all assets held by third parties.", status: "pending" },
    { id: "ew-8", title: "Pay debts and liabilities", description: "Settle all outstanding debts, funeral costs, and administrative expenses.", status: "pending" },
    { id: "ew-9", title: "Distribute legacies", description: "Pay out specific legacies and gifts as directed by the will.", status: "pending" },
    { id: "ew-10", title: "Distribute residue", description: "Transfer the residuary estate to the beneficiaries after all debts and legacies.", status: "pending" },
    { id: "ew-11", title: "File estate accounts", description: "Prepare and distribute the estate accounts to all beneficiaries.", status: "pending", fileSlot: { label: "Estate accounts", fileName: null } },
    { id: "ew-12", title: "Final tax return", description: "Submit the final self-assessment tax return for the deceased and the estate.", status: "pending", fileSlot: { label: "Tax return", fileName: null } },
    { id: "ew-13", title: "Close estate accounts", description: "Close all bank accounts and investment accounts held by the estate.", status: "pending" },
    { id: "ew-14", title: "Archive records", description: "Retain all estate administration records for a minimum of 12 years.", status: "pending" },
  ];
}

function buildNGChecklist(): ProbateStep[] {
  return [
    { id: "ng-1", title: "Obtain death certificate", description: "Obtain the death certificate from the National Population Commission or hospital.", status: "pending", fileSlot: { label: "Death certificate", fileName: null } },
    { id: "ng-2", title: "File petition for probate", description: "File a petition at the Probate Registry of the High Court in the relevant state.", status: "pending", fileSlot: { label: "Probate petition", fileName: null } },
    { id: "ng-3", title: "Publish citation", description: "Publish a citation in a newspaper of general circulation calling for objections.", status: "pending" },
    { id: "ng-4", title: "Obtain Letters of Administration", description: "Collect the Letters of Administration or Grant of Probate from the court.", status: "pending", fileSlot: { label: "Letters of Administration", fileName: null } },
    { id: "ng-5", title: "Inventory assets", description: "Create a comprehensive inventory of all assets of the deceased.", status: "pending" },
    { id: "ng-6", title: "Value estate", description: "Obtain independent valuations for real property and business interests.", status: "pending", fileSlot: { label: "Valuation report", fileName: null } },
    { id: "ng-7", title: "Pay debts and taxes", description: "Settle all outstanding debts, taxes, and administration expenses.", status: "pending" },
    { id: "ng-8", title: "Notify beneficiaries", description: "Formally notify all beneficiaries named in the will or entitled under intestacy rules.", status: "pending" },
    { id: "ng-9", title: "Distribute assets per will/intestacy", description: "Transfer assets to beneficiaries according to the will or applicable intestacy law.", status: "pending" },
    { id: "ng-10", title: "File final accounts", description: "File the estate accounts with the court and provide copies to all beneficiaries.", status: "pending", fileSlot: { label: "Final accounts", fileName: null } },
    { id: "ng-11", title: "Discharge executor", description: "Apply to the court for formal discharge of the executor/administrator.", status: "pending" },
    { id: "ng-12", title: "Archive records", description: "Archive all estate records and supporting documentation.", status: "pending" },
  ];
}

function buildDefaultChecklist(): ProbateStep[] {
  return [
    { id: "gen-1", title: "Obtain death certificate", description: "Secure official copies of the death certificate.", status: "pending", fileSlot: { label: "Death certificate", fileName: null } },
    { id: "gen-2", title: "Engage legal counsel", description: "Appoint a solicitor or legal representative to advise on probate.", status: "pending" },
    { id: "gen-3", title: "Identify and notify institutions", description: "Notify banks, insurers, and government bodies of the death.", status: "pending" },
    { id: "gen-4", title: "Inventory assets and liabilities", description: "Create a full inventory of the estate.", status: "pending" },
    { id: "gen-5", title: "Value the estate", description: "Obtain professional valuations for all significant assets.", status: "pending", fileSlot: { label: "Valuation report", fileName: null } },
    { id: "gen-6", title: "Apply for probate/letters of administration", description: "Submit the appropriate application to the relevant court.", status: "pending", fileSlot: { label: "Probate application", fileName: null } },
    { id: "gen-7", title: "Pay taxes and debts", description: "Settle all outstanding tax liabilities and debts of the estate.", status: "pending" },
    { id: "gen-8", title: "Distribute estate", description: "Transfer assets to beneficiaries in accordance with the will or law.", status: "pending" },
    { id: "gen-9", title: "File final accounts", description: "Prepare estate accounts and file with the court if required.", status: "pending", fileSlot: { label: "Final accounts", fileName: null } },
    { id: "gen-10", title: "Archive records", description: "Retain all estate documentation for the legally required period.", status: "pending" },
  ];
}

function getChecklistForJurisdiction(code: string): ProbateStep[] {
  switch (code) {
    case "EW": return buildEWChecklist();
    case "NG": return buildNGChecklist();
    default: return buildDefaultChecklist();
  }
}

const JURISDICTION_OPTIONS = [
  { value: "EW", label: "England & Wales" },
  { value: "NG", label: "Nigeria" },
  { value: "DEFAULT", label: "Other / Generic" },
];

/* ---------- Helpers ---------- */

const STATUS_ICON: Record<StepStatus, React.ReactNode> = {
  pending: <Circle aria-hidden="true" size={16} className="text-muted" />,
  in_progress: <Loader2 aria-hidden="true" size={16} className="text-warning" />,
  complete: <CheckCircle2 aria-hidden="true" size={16} className="text-success" />,
};

/* ---------- Component ---------- */

export function ProbateDashboard() {
  const { workspace } = useMatterContext();

  const primaryCode = workspace?.matter?.primaryJurisdictionCode?.toUpperCase() ?? "";
  const jurisdictionFromWorkspace =
    primaryCode === "EW" || primaryCode === "ENGLAND_WALES" ? "EW"
    : primaryCode === "NG" || primaryCode === "NIGERIA" ? "NG"
    : "DEFAULT";

  const [jurisdiction, setJurisdiction] = useState(jurisdictionFromWorkspace);
  const [steps, setSteps] = useState<ProbateStep[]>(() => getChecklistForJurisdiction(jurisdictionFromWorkspace));
  const [showDispute, setShowDispute] = useState(false);
  const [disputeText, setDisputeText] = useState("");
  const [disputes, setDisputes] = useState<Array<{ id: number; text: string; createdAt: string }>>([]);

  const completedCount = useMemo(() => steps.filter((s) => s.status === "complete").length, [steps]);
  const progressPct = steps.length > 0 ? Math.round((completedCount / steps.length) * 100) : 0;

  function handleJurisdictionChange(value: string) {
    setJurisdiction(value);
    setSteps(getChecklistForJurisdiction(value));
  }

  function cycleStatus(stepId: string) {
    setSteps((prev) =>
      prev.map((step) => {
        if (step.id !== stepId) return step;
        const next: StepStatus =
          step.status === "pending" ? "in_progress"
          : step.status === "in_progress" ? "complete"
          : "pending";
        return { ...step, status: next };
      }),
    );
  }

  function handleFileUpload(stepId: string, file: File) {
    setSteps((prev) =>
      prev.map((step) => {
        if (step.id !== stepId || !step.fileSlot) return step;
        return { ...step, fileSlot: { ...step.fileSlot, fileName: file.name } };
      }),
    );
  }

  function submitDispute(e: React.FormEvent) {
    e.preventDefault();
    if (!disputeText.trim()) return;
    setDisputes((prev) => [
      ...prev,
      { id: Date.now(), text: disputeText.trim(), createdAt: new Date().toISOString() },
    ]);
    setDisputeText("");
    setShowDispute(false);
  }

  return (
    <div className="content-grid">
      {/* Header + jurisdiction selector */}
      <section className="panel span-2">
        <div className="panel-header">
          <h3><Gavel aria-hidden="true" size={16} /> <T k="Probate workflow" /></h3>
          <div className="button-row">
            <FormSelect
              name="jurisdiction"
              labelKey="Jurisdiction"
              value={jurisdiction}
              options={JURISDICTION_OPTIONS}
              onChange={handleJurisdictionChange}
            />
          </div>
        </div>

        {/* Progress metrics */}
        <div className="metric-grid">
          <div className="metric">
            <span>Steps complete</span>
            <strong className="text-success">{completedCount}</strong>
          </div>
          <div className="metric">
            <span>Total steps</span>
            <strong>{steps.length}</strong>
          </div>
          <div className="metric">
            <span>In progress</span>
            <strong className="text-warning">{steps.filter((s) => s.status === "in_progress").length}</strong>
          </div>
          <div className="metric">
            <span>Progress</span>
            <strong>{progressPct}%</strong>
          </div>
        </div>
        <div className="progress mt-2">
          <span style={{ width: `${progressPct}%` }} />
        </div>
      </section>

      {/* Checklist */}
      <section className="panel span-2">
        <div className="panel-header">
          <h3><ClipboardList aria-hidden="true" size={16} /> Checklist &mdash; {JURISDICTION_OPTIONS.find((j) => j.value === jurisdiction)?.label}</h3>
          <StatusBadge status={`${completedCount} of ${steps.length} complete`} variant={progressPct === 100 ? "success" : progressPct > 50 ? "warning" : "default"} />
        </div>

        <ul className="compact-list">
          {steps.map((step, index) => (
            <li key={step.id} style={{ display: "flex", flexDirection: "column", gap: 4 }}>
              <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
                <button
                  type="button"
                  className="icon-button"
                  onClick={() => cycleStatus(step.id)}
                  aria-label={`Toggle status for step ${index + 1}`}
                  title={`Status: ${step.status} (click to advance)`}
                >
                  {STATUS_ICON[step.status]}
                </button>
                <span style={{ flex: 1 }}>
                  <strong>{index + 1}. {step.title}</strong>
                  <em style={{ display: "block", fontSize: "0.85em", opacity: 0.8 }}>{step.description}</em>
                </span>
                <StatusBadge status={step.status} />
              </div>

              {step.fileSlot && (
                <div style={{ marginLeft: 32, display: "flex", alignItems: "center", gap: 8 }}>
                  <FileUp aria-hidden="true" size={14} />
                  {step.fileSlot.fileName ? (
                    <span className="text-success" style={{ fontSize: "0.85em" }}>
                      {step.fileSlot.fileName}
                    </span>
                  ) : (
                    <label style={{ cursor: "pointer", fontSize: "0.85em" }}>
                      <span style={{ textDecoration: "underline" }}>Upload {step.fileSlot.label}</span>
                      <input
                        type="file"
                        style={{ display: "none" }}
                        onChange={(e) => {
                          const file = e.target.files?.[0];
                          if (file) handleFileUpload(step.id, file);
                        }}
                      />
                    </label>
                  )}
                </div>
              )}
            </li>
          ))}
        </ul>
      </section>

      {/* Disputes section */}
      <section className="panel span-2">
        <div className="panel-header">
          <h3><AlertTriangle aria-hidden="true" size={16} /> Disputes and concerns</h3>
          <button type="button" onClick={() => setShowDispute(true)}>
            <AlertTriangle aria-hidden="true" size={14} /> Raise Concern
          </button>
        </div>

        {disputes.length === 0 ? (
          <p style={{ padding: "1rem", opacity: 0.7 }}>No disputes raised. Use the button above to raise a concern about the probate process.</p>
        ) : (
          <ul className="compact-list">
            {disputes.map((d) => (
              <li key={d.id}>
                <span>{d.text}</span>
                <em style={{ fontSize: "0.85em" }}>
                  <Clock aria-hidden="true" size={12} /> {new Date(d.createdAt).toLocaleString()}
                </em>
              </li>
            ))}
          </ul>
        )}
      </section>

      {/* Dispute modal */}
      <Modal open={showDispute} titleKey="Raise a concern" onClose={() => { setShowDispute(false); setDisputeText(""); }}>
        <form className="form-stack" onSubmit={submitDispute}>
          <p style={{ marginBottom: "0.5rem", opacity: 0.8 }}>
            Describe your concern about the probate process. This will be recorded and visible to all parties involved in the estate administration.
          </p>
          <FormTextarea
            name="disputeText"
            labelKey="Concern description"
            value={disputeText}
            required
            rows={5}
            onChange={setDisputeText}
          />
          <FormActions
            onCancel={() => { setShowDispute(false); setDisputeText(""); }}
            submitLabelKey="Submit concern"
          />
        </form>
      </Modal>
    </div>
  );
}
