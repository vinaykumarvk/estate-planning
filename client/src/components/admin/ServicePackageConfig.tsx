import { useState } from "react";
import { Plus, Trash2, Edit3 } from "lucide-react";
import { useTranslation } from "react-i18next";
import { useApiQuery } from "../hooks/useApiQuery";
import { useApiMutation } from "../hooks/useApiMutation";
import { FormField } from "../primitives/FormField";
import { FormSelect } from "../primitives/FormSelect";
import { FormCurrencyInput } from "../primitives/FormCurrencyInput";
import { FormCheckbox } from "../primitives/FormCheckbox";
import { FormActions } from "../primitives/FormActions";
import { Modal } from "../primitives/Modal";
import { ConfirmDialog } from "../primitives/ConfirmDialog";
import { EmptyState } from "../primitives/EmptyState";
import { StatusBadge } from "../primitives/StatusBadge";

interface ServicePackage {
  id: string;
  packageCode: string;
  name: string;
  priceCurrency: string;
  priceAmount: number;
  status: string;
  jurisdictionCodes: string[];
}

export function ServicePackageConfig() {
  const { t } = useTranslation();
  const { data, refetch } = useApiQuery<{ packages: ServicePackage[] }>("/api/service-packages");
  const mutation = useApiMutation();
  const [showForm, setShowForm] = useState(false);
  const [deleteId, setDeleteId] = useState<string | null>(null);
  const [editPkg, setEditPkg] = useState<ServicePackage | null>(null);
  const [formData, setFormData] = useState({ packageCode: "", name: "", priceCurrency: "NGN", priceAmount: 0, status: "draft", jurisdictionCodes: ["NG"], includedDocTypes: ["will"] });

  const packages = data?.packages ?? [];

  function openEdit(pkg: ServicePackage) {
    setEditPkg(pkg);
    setFormData({ packageCode: pkg.packageCode, name: pkg.name, priceCurrency: pkg.priceCurrency, priceAmount: pkg.priceAmount, status: pkg.status, jurisdictionCodes: pkg.jurisdictionCodes, includedDocTypes: ["will"] });
    setShowForm(true);
  }

  function openCreate() {
    setEditPkg(null);
    setFormData({ packageCode: "", name: "", priceCurrency: "NGN", priceAmount: 0, status: "draft", jurisdictionCodes: ["NG"], includedDocTypes: ["will"] });
    setShowForm(true);
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (editPkg) {
      await mutation.mutate(`/api/service-packages/${editPkg.id}`, formData, "PATCH");
    } else {
      await mutation.mutate("/api/service-packages", { tenantId: "tenant-demo", ...formData });
    }
    setShowForm(false);
    refetch();
  }

  async function handleDelete() {
    if (!deleteId) return;
    await mutation.mutate(`/api/service-packages/${deleteId}`, undefined, "DELETE");
    setDeleteId(null);
    refetch();
  }

  return (
    <div className="panel">
      <div className="panel-header">
        <h3>{t("admin.packages_title")}</h3>
        <button type="button" onClick={openCreate}><Plus aria-hidden="true" size={14} /> {t("admin.add_package")}</button>
      </div>
      {packages.length === 0 ? (
        <EmptyState messageKey="admin.packages_empty" actionKey="admin.add_package" onAction={openCreate} />
      ) : (
        <ul className="compact-list">
          {packages.map((pkg) => (
            <li key={pkg.id}>
              <span>{pkg.name} ({pkg.packageCode})</span>
              <strong>{pkg.priceCurrency} {pkg.priceAmount.toLocaleString()}</strong>
              <StatusBadge status={pkg.status} />
              <div className="list-item-actions">
                <button type="button" className="icon-button" onClick={() => openEdit(pkg)} aria-label={t("common.edit")}><Edit3 size={14} /></button>
                <button type="button" className="icon-button icon-button--danger" onClick={() => setDeleteId(pkg.id)} aria-label={t("common.delete")}><Trash2 size={14} /></button>
              </div>
            </li>
          ))}
        </ul>
      )}
      <Modal open={showForm} titleKey={editPkg ? "admin.edit_package" : "admin.add_package"} onClose={() => setShowForm(false)}>
        <form onSubmit={handleSubmit} className="form-stack">
          <FormField name="packageCode" labelKey="admin.package_code" value={formData.packageCode} required onChange={(v) => setFormData({ ...formData, packageCode: v })} />
          <FormField name="name" labelKey="admin.package_name" value={formData.name} required onChange={(v) => setFormData({ ...formData, name: v })} />
          <FormCurrencyInput name="priceAmount" labelKey="admin.price" value={formData.priceAmount} currency={formData.priceCurrency} required onChange={(v) => setFormData({ ...formData, priceAmount: v })} />
          <FormSelect name="status" labelKey="admin.status" value={formData.status} options={[{ value: "draft", labelKey: "options.status_draft" }, { value: "active", labelKey: "options.status_active" }, { value: "inactive", labelKey: "options.status_inactive" }]} onChange={(v) => setFormData({ ...formData, status: v })} />
          <fieldset>
            <legend>{t("admin.package_jurisdictions")}</legend>
            {([
              { code: "NG", labelKey: "options.jurisdiction_ng" },
              { code: "GH", labelKey: "options.jurisdiction_gh" },
              { code: "ZA", labelKey: "options.jurisdiction_za" },
              { code: "KE", labelKey: "options.jurisdiction_ke" },
              { code: "SN", labelKey: "options.jurisdiction_sn" },
              { code: "CM", labelKey: "options.jurisdiction_cm" },
              { code: "MZ", labelKey: "options.jurisdiction_mz" },
              { code: "AO", labelKey: "options.jurisdiction_ao" },
            ] as const).map((j) => (
              <FormCheckbox key={j.code} name={`jur_${j.code.toLowerCase()}`} labelKey={j.labelKey} checked={formData.jurisdictionCodes.includes(j.code)} onChange={(v) => {
                const codes = v ? [...new Set([...formData.jurisdictionCodes, j.code])] : formData.jurisdictionCodes.filter((c) => c !== j.code);
                setFormData({ ...formData, jurisdictionCodes: codes });
              }} />
            ))}
          </fieldset>
          <fieldset>
            <legend>{t("admin.package_doc_types")}</legend>
            <FormCheckbox name="doc_will" labelKey="admin.doc_will" checked={formData.includedDocTypes.includes("will")} onChange={(v) => {
              const types = v ? [...new Set([...formData.includedDocTypes, "will"])] : formData.includedDocTypes.filter((d) => d !== "will");
              setFormData({ ...formData, includedDocTypes: types });
            }} />
            <FormCheckbox name="doc_trust" labelKey="admin.doc_trust" checked={formData.includedDocTypes.includes("trust")} onChange={(v) => {
              const types = v ? [...new Set([...formData.includedDocTypes, "trust"])] : formData.includedDocTypes.filter((d) => d !== "trust");
              setFormData({ ...formData, includedDocTypes: types });
            }} />
            <FormCheckbox name="doc_poa" labelKey="admin.doc_poa" checked={formData.includedDocTypes.includes("power_of_attorney")} onChange={(v) => {
              const types = v ? [...new Set([...formData.includedDocTypes, "power_of_attorney"])] : formData.includedDocTypes.filter((d) => d !== "power_of_attorney");
              setFormData({ ...formData, includedDocTypes: types });
            }} />
          </fieldset>
          {mutation.error && <div className="form-error" role="alert">{mutation.error}</div>}
          <FormActions onCancel={() => setShowForm(false)} loading={mutation.loading} />
        </form>
      </Modal>
      <ConfirmDialog open={!!deleteId} titleKey="admin.delete_package" messageKey="admin.delete_package_confirm" destructive onConfirm={handleDelete} onCancel={() => setDeleteId(null)} />
    </div>
  );
}
