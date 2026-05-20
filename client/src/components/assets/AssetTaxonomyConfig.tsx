import { useState } from "react";
import { Plus, Trash2 } from "lucide-react";
import { useTranslation } from "react-i18next";
import { useApiQuery } from "../hooks/useApiQuery";
import { useApiMutation } from "../hooks/useApiMutation";
import { FormField } from "../primitives/FormField";
import { FormSelect } from "../primitives/FormSelect";
import { FormCheckbox } from "../primitives/FormCheckbox";
import { FormActions } from "../primitives/FormActions";
import { Modal } from "../primitives/Modal";
import { ConfirmDialog } from "../primitives/ConfirmDialog";
import { EmptyState } from "../primitives/EmptyState";

interface FieldDef {
  fieldName: string;
  fieldType: "string" | "number" | "boolean" | "date";
  required: boolean;
  label: string;
}

interface TaxonomyEntry {
  id: string;
  jurisdictionCode: string;
  assetClass: string;
  fieldDefinitions: FieldDef[];
  status: string;
}

export function AssetTaxonomyConfig() {
  const { t } = useTranslation();
  const { data, refetch } = useApiQuery<{ taxonomies: TaxonomyEntry[] }>("/api/asset-taxonomy");
  const mutation = useApiMutation();
  const [showAdd, setShowAdd] = useState(false);
  const [deleteId, setDeleteId] = useState<string | null>(null);
  const [jurisdiction, setJurisdiction] = useState("NG");
  const [assetClass, setAssetClass] = useState("");
  const [fieldDefs, setFieldDefs] = useState<FieldDef[]>([]);

  const taxonomies = data?.taxonomies ?? [];

  function addFieldDef() {
    setFieldDefs([...fieldDefs, { fieldName: "", fieldType: "string", required: false, label: "" }]);
  }

  function updateFieldDef(index: number, updates: Partial<FieldDef>) {
    setFieldDefs(fieldDefs.map((fd, i) => (i === index ? { ...fd, ...updates } : fd)));
  }

  function removeFieldDef(index: number) {
    setFieldDefs(fieldDefs.filter((_, i) => i !== index));
  }

  async function handleCreate(e: React.FormEvent) {
    e.preventDefault();
    if (!assetClass) return;
    await mutation.mutate("/api/asset-taxonomy", {
      jurisdictionCode: jurisdiction,
      assetClass,
      fieldDefinitions: fieldDefs.filter((fd) => fd.fieldName && fd.label),
      status: "active",
    });
    setAssetClass("");
    setFieldDefs([]);
    setShowAdd(false);
    refetch();
  }

  async function handleDelete() {
    if (!deleteId) return;
    await mutation.mutate(`/api/asset-taxonomy/${deleteId}`, undefined, "DELETE");
    setDeleteId(null);
    refetch();
  }

  return (
    <div className="panel">
      <div className="panel-header">
        <h3>{t("assets.taxonomy_title")}</h3>
        <button type="button" onClick={() => setShowAdd(true)}><Plus aria-hidden="true" size={14} /> {t("assets.add_taxonomy")}</button>
      </div>
      {taxonomies.length === 0 ? (
        <EmptyState messageKey="assets.taxonomy_empty" actionKey="assets.add_taxonomy" onAction={() => setShowAdd(true)} />
      ) : (
        <ul className="compact-list">
          {taxonomies.map((tax) => (
            <li key={tax.id}>
              <span>{tax.jurisdictionCode} / {tax.assetClass}</span>
              <strong>{tax.fieldDefinitions?.length ?? 0} fields</strong>
              <em>{tax.status}</em>
              <button type="button" className="icon-button icon-button--danger" onClick={() => setDeleteId(tax.id)} aria-label={t("common.delete")}>
                <Trash2 size={14} />
              </button>
            </li>
          ))}
        </ul>
      )}
      <Modal open={showAdd} titleKey="assets.add_taxonomy" onClose={() => setShowAdd(false)} wide>
        <form onSubmit={handleCreate} className="form-stack">
          <FormSelect name="jurisdiction" labelKey="matters.jurisdiction" value={jurisdiction} options={[{ value: "NG", labelKey: "options.jurisdiction_ng" }, { value: "GH", labelKey: "options.jurisdiction_gh" }, { value: "ZA", labelKey: "options.jurisdiction_za" }, { value: "KE", labelKey: "options.jurisdiction_ke" }, { value: "SN", labelKey: "options.jurisdiction_sn" }, { value: "CM", labelKey: "options.jurisdiction_cm" }, { value: "MZ", labelKey: "options.jurisdiction_mz" }, { value: "AO", labelKey: "options.jurisdiction_ao" }]} onChange={setJurisdiction} />
          <FormField name="assetClass" labelKey="assets.class" value={assetClass} required onChange={setAssetClass} />

          <fieldset>
            <legend>{t("assets.taxonomy_fields")}</legend>
            {fieldDefs.map((fd, i) => (
              <div key={i} className="form-row" style={{ alignItems: "flex-end" }}>
                <FormField name={`fieldName_${i}`} labelKey="assets.taxonomy_field_name" value={fd.fieldName} required onChange={(v) => updateFieldDef(i, { fieldName: v })} />
                <FormField name={`label_${i}`} labelKey="assets.taxonomy_field_label" value={fd.label} required onChange={(v) => updateFieldDef(i, { label: v })} />
                <FormSelect name={`fieldType_${i}`} labelKey="assets.taxonomy_field_type" value={fd.fieldType} options={[
                  { value: "string", label: "Text" },
                  { value: "number", label: "Number" },
                  { value: "boolean", label: "Yes/No" },
                  { value: "date", label: "Date" },
                ]} onChange={(v) => updateFieldDef(i, { fieldType: v as FieldDef["fieldType"] })} />
                <FormCheckbox name={`required_${i}`} labelKey="common.required" checked={fd.required} onChange={(v) => updateFieldDef(i, { required: v })} />
                <button type="button" className="icon-button icon-button--danger" onClick={() => removeFieldDef(i)} aria-label={t("common.delete")}>
                  <Trash2 size={14} />
                </button>
              </div>
            ))}
            <button type="button" onClick={addFieldDef}>
              <Plus aria-hidden="true" size={14} /> {t("assets.taxonomy_add_field")}
            </button>
          </fieldset>

          {mutation.error && <div className="form-error" role="alert">{mutation.error}</div>}
          <FormActions onCancel={() => setShowAdd(false)} loading={mutation.loading} />
        </form>
      </Modal>
      <ConfirmDialog open={!!deleteId} titleKey="assets.delete_taxonomy" messageKey="assets.delete_taxonomy_confirm" destructive onConfirm={handleDelete} onCancel={() => setDeleteId(null)} />
    </div>
  );
}
