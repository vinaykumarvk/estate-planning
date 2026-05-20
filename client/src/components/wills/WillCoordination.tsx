import { useState } from "react";
import { FileText, Plus, AlertTriangle, Trash2 } from "lucide-react";
import { useTranslation } from "react-i18next";
import { useMatterContext } from "../hooks/useMatterContext";
import { useApiMutation } from "../hooks/useApiMutation";
import { useApiQuery } from "../hooks/useApiQuery";
import { T } from "../primitives/T";
import { Modal } from "../primitives/Modal";
import { FormField } from "../primitives/FormField";
import { FormSelect } from "../primitives/FormSelect";
import { FormActions } from "../primitives/FormActions";
import { StatusBadge } from "../primitives/StatusBadge";
import { EmptyState } from "../primitives/EmptyState";
import { ConfirmDialog } from "../primitives/ConfirmDialog";

interface WillRecord {
  id: string;
  jurisdictionCode: string;
  documentType: string;
  status: string;
  revocationClause: string | null;
  assetIds: string[];
  notes: string | null;
  dateExecuted: string | null;
  solicitorNotary: string | null;
}

interface RevocationConflict {
  willId: string;
  jurisdictionCode: string;
  conflictingWillIds: string[];
  reason: string;
}

interface UnassignedAsset {
  assetId: string;
  description: string;
  situsCountry: string;
}

interface WillSummary {
  wills: WillRecord[];
  unassignedAssets: UnassignedAsset[];
  potentialConflicts: RevocationConflict[];
  assetCoverage: Array<{ assetId: string; coveredByWillIds: string[] }>;
}

const STATUS_OPTIONS = [
  { value: "draft", labelKey: "options.status_draft" },
  { value: "executed", label: "Executed" },
  { value: "revoked", label: "Revoked" },
  { value: "superseded", label: "Superseded" },
];

const JURISDICTION_OPTIONS = [
  { value: "EW", label: "England & Wales" },
  { value: "PT", label: "Portugal" },
  { value: "NG", labelKey: "options.jurisdiction_ng" },
  { value: "GH", labelKey: "options.jurisdiction_gh" },
  { value: "ZA", labelKey: "options.jurisdiction_za" },
  { value: "KE", labelKey: "options.jurisdiction_ke" },
  { value: "SN", labelKey: "options.jurisdiction_sn" },
  { value: "CM", labelKey: "options.jurisdiction_cm" },
  { value: "MZ", labelKey: "options.jurisdiction_mz" },
  { value: "AO", labelKey: "options.jurisdiction_ao" },
];

export function WillCoordination() {
  const { t } = useTranslation();
  const { matterId } = useMatterContext();
  const mutation = useApiMutation();
  const summaryQuery = useApiQuery<{ summary: WillSummary }>(`/api/matters/${matterId}/wills/summary`);

  const [showAdd, setShowAdd] = useState(false);
  const [deleteId, setDeleteId] = useState<string | null>(null);
  const [jurisdictionCode, setJurisdictionCode] = useState("");
  const [documentType, setDocumentType] = useState("will");
  const [status, setStatus] = useState("draft");
  const [revocationClause, setRevocationClause] = useState("");
  const [notes, setNotes] = useState("");

  const summary = summaryQuery.data?.summary;
  const wills = summary?.wills ?? [];
  const conflicts = summary?.potentialConflicts ?? [];
  const unassigned = summary?.unassignedAssets ?? [];

  function resetForm() {
    setJurisdictionCode("");
    setDocumentType("will");
    setStatus("draft");
    setRevocationClause("");
    setNotes("");
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    await mutation.mutate(`/api/matters/${matterId}/wills`, {
      tenantId: "tenant-demo",
      matterId,
      jurisdictionCode,
      documentType,
      status,
      revocationClause: revocationClause || undefined,
      notes: notes || undefined,
    });
    setShowAdd(false);
    resetForm();
    summaryQuery.refetch();
  }

  async function handleDelete() {
    if (!deleteId) return;
    await mutation.mutate(`/api/matters/${matterId}/wills/${deleteId}`, undefined, "DELETE");
    setDeleteId(null);
    summaryQuery.refetch();
  }

  return (
    <div className="content-grid">
      <section className="panel span-2">
        <div className="panel-header">
          <h3><FileText aria-hidden="true" size={16} /> <T k="wills.title" /></h3>
          <button type="button" onClick={() => setShowAdd(true)}><Plus aria-hidden="true" size={14} /> <T k="wills.add_will" /></button>
        </div>

        {wills.length === 0 ? (
          <EmptyState messageKey="wills.empty" actionKey="wills.add_will" onAction={() => setShowAdd(true)} />
        ) : (
          <ul className="compact-list">
            {wills.map((will) => (
              <li key={will.id}>
                <span>{will.jurisdictionCode} &mdash; {will.documentType}</span>
                <StatusBadge status={will.status} />
                <em>{will.assetIds.length} {t("wills.assets_assigned")}</em>
                <div className="list-item-actions">
                  <button type="button" className="icon-button icon-button--danger" onClick={() => setDeleteId(will.id)} aria-label={t("common.delete")}>
                    <Trash2 size={14} />
                  </button>
                </div>
              </li>
            ))}
          </ul>
        )}
      </section>

      {conflicts.length > 0 && (
        <section className="panel">
          <div className="panel-header">
            <h3><AlertTriangle aria-hidden="true" size={16} /> <T k="wills.conflicts" /></h3>
          </div>
          <ul className="issue-list">
            {conflicts.map((c) => (
              <li key={c.willId} className="warning">
                <strong>{c.jurisdictionCode}</strong>
                <span>{c.reason}</span>
              </li>
            ))}
          </ul>
        </section>
      )}

      {unassigned.length > 0 && (
        <section className="panel">
          <div className="panel-header">
            <h3><AlertTriangle aria-hidden="true" size={16} /> <T k="wills.unassigned_assets" /></h3>
          </div>
          <ul className="compact-list">
            {unassigned.map((a) => (
              <li key={a.assetId}>
                <span>{a.description}</span>
                <strong>{a.situsCountry}</strong>
              </li>
            ))}
          </ul>
        </section>
      )}

      <Modal open={showAdd} titleKey="wills.add_will" onClose={() => { setShowAdd(false); resetForm(); }}>
        <form onSubmit={handleSubmit}>
          <FormSelect name="jurisdictionCode" labelKey="wills.jurisdiction" value={jurisdictionCode} options={JURISDICTION_OPTIONS} onChange={setJurisdictionCode} required />
          <FormField name="documentType" labelKey="wills.document_type" value={documentType} onChange={setDocumentType} required />
          <FormSelect name="status" labelKey="wills.status" value={status} options={STATUS_OPTIONS} onChange={setStatus} />
          <FormField name="revocationClause" labelKey="wills.revocation_clause" value={revocationClause} onChange={setRevocationClause} />
          <FormField name="notes" labelKey="wills.notes" value={notes} onChange={setNotes} />
          {mutation.error && <div className="form-field__error" role="alert">{mutation.error}</div>}
          <FormActions onCancel={() => { setShowAdd(false); resetForm(); }} loading={mutation.loading} />
        </form>
      </Modal>

      <ConfirmDialog open={!!deleteId} titleKey="wills.delete_title" messageKey="wills.delete_confirm" destructive onConfirm={handleDelete} onCancel={() => setDeleteId(null)} />
    </div>
  );
}
