import { useState } from "react";
import { useTranslation } from "react-i18next";
import { createMatterSchema } from "../../../../shared/schemas";
import { useFormState } from "../hooks/useFormState";
import { useApiMutation } from "../hooks/useApiMutation";
import { FormField } from "../primitives/FormField";
import { FormSelect } from "../primitives/FormSelect";
import { FormCheckbox } from "../primitives/FormCheckbox";
import { FormActions } from "../primitives/FormActions";
import { Modal } from "../primitives/Modal";

interface Props {
  open: boolean;
  onClose: () => void;
  onCreated: () => void;
}

type JurisdictionCode = "NG" | "GH" | "ZA" | "KE" | "SN" | "CM" | "MZ" | "AO" | "EW" | "PT";

const INITIAL = {
  tenantId: "tenant-demo",
  title: "",
  primaryJurisdictionCode: "NG" as const,
  additionalJurisdictions: [] as JurisdictionCode[],
  languageOfRecord: "en" as const,
  createdByUserId: "user-solicitor",
  jointMatter: false,
};

export function MatterCreateForm({ open, onClose, onCreated }: Props) {
  const { t } = useTranslation();
  const form = useFormState(createMatterSchema, INITIAL);
  const mutation = useApiMutation();
  const [showConfidentiality, setShowConfidentiality] = useState(false);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!form.validate()) return;
    const result = await mutation.mutate("/api/matters", form.values);
    if (result) {
      form.reset();
      onCreated();
      onClose();
    }
  }

  return (
    <Modal open={open} titleKey="matters.create_title" onClose={onClose}>
      <form onSubmit={handleSubmit} className="form-stack">
        <FormField
          name="title"
          labelKey="matters.title"
          value={form.values.title}
          error={form.errors.title}
          required
          onChange={(v) => form.handleChange("title", v)}
          onBlur={() => form.handleBlur("title")}
        />
        <FormSelect
          name="primaryJurisdictionCode"
          labelKey="matters.jurisdiction"
          value={form.values.primaryJurisdictionCode}
          error={form.errors.primaryJurisdictionCode}
          required
          options={[
            { value: "NG", labelKey: "options.jurisdiction_ng" },
            { value: "GH", labelKey: "options.jurisdiction_gh" },
            { value: "ZA", labelKey: "options.jurisdiction_za" },
            { value: "KE", labelKey: "options.jurisdiction_ke" },
            { value: "SN", labelKey: "options.jurisdiction_sn" },
            { value: "CM", labelKey: "options.jurisdiction_cm" },
            { value: "MZ", labelKey: "options.jurisdiction_mz" },
            { value: "AO", labelKey: "options.jurisdiction_ao" },
          ]}
          onChange={(v) => form.handleChange("primaryJurisdictionCode", v)}
        />
        <fieldset className="form-field">
          <legend className="form-field__label">{t("matters.additional_jurisdictions")}</legend>
          {[
            { value: "NG", label: t("options.jurisdiction_ng") },
            { value: "GH", label: t("options.jurisdiction_gh") },
            { value: "ZA", label: t("options.jurisdiction_za") },
            { value: "KE", label: t("options.jurisdiction_ke") },
            { value: "SN", label: t("options.jurisdiction_sn") },
            { value: "CM", label: t("options.jurisdiction_cm") },
            { value: "MZ", label: t("options.jurisdiction_mz") },
            { value: "AO", label: t("options.jurisdiction_ao") },
          ]
            .filter((j) => j.value !== form.values.primaryJurisdictionCode)
            .map((j) => (
              <label key={j.value} className="form-field__checkbox-label">
                <input
                  type="checkbox"
                  checked={(form.values.additionalJurisdictions ?? []).includes(j.value as JurisdictionCode)}
                  onChange={(e) => {
                    const code = j.value as JurisdictionCode;
                    const current = form.values.additionalJurisdictions ?? [];
                    const next = e.target.checked
                      ? [...current, code]
                      : current.filter((c) => c !== code);
                    form.handleChange("additionalJurisdictions", next);
                  }}
                />
                {j.label}
              </label>
            ))}
        </fieldset>
        <FormSelect
          name="languageOfRecord"
          labelKey="matters.language"
          value={form.values.languageOfRecord ?? "en"}
          options={[
            { value: "en", labelKey: "options.lang_en" },
            { value: "fr", labelKey: "options.lang_fr" },
            { value: "pt", labelKey: "options.lang_pt" },
            { value: "es", labelKey: "options.lang_es" },
          ]}
          onChange={(v) => form.handleChange("languageOfRecord", v)}
        />
        <FormCheckbox
          name="jointMatter"
          labelKey="matters.joint_matter"
          checked={form.values.jointMatter ?? false}
          onChange={(v) => {
            form.handleChange("jointMatter", v);
            if (v) setShowConfidentiality(true);
          }}
        />
        {showConfidentiality && form.values.jointMatter && (
          <div className="form-field__hint" role="status">
            {t("matters.confidentiality_notice")}
          </div>
        )}
        {mutation.error && <div className="form-error" role="alert">{mutation.error}</div>}
        <FormActions onCancel={onClose} submitLabelKey="matters.create" loading={mutation.loading} />
      </form>
    </Modal>
  );
}
