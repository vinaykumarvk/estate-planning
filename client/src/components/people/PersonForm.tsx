import { useTranslation } from "react-i18next";
import { createPersonSchema } from "../../../../shared/schemas";
import { useMatterContext } from "../hooks/useMatterContext";
import { useFormState } from "../hooks/useFormState";
import { useApiMutation } from "../hooks/useApiMutation";
import { FormField } from "../primitives/FormField";
import { FormSelect } from "../primitives/FormSelect";
import { FormDateInput } from "../primitives/FormDateInput";
import { FormActions } from "../primitives/FormActions";
import { Modal } from "../primitives/Modal";

interface Props {
  open: boolean;
  onClose: () => void;
  onSaved: () => void;
  editPerson?: { id: string; legalName: string; email?: string; nationality?: string; residenceCountry?: string; domicileCountry?: string; habitualResidence?: string; taxResidency?: string; maritalStatus?: string; preferredLanguage?: string; dateOfBirth?: string } | null;
}

export function PersonForm({ open, onClose, onSaved, editPerson }: Props) {
  const { matterId } = useMatterContext();
  const { t } = useTranslation();

  const initial = {
    tenantId: "tenant-demo",
    matterId,
    legalName: editPerson?.legalName ?? "",
    preferredName: "",
    dateOfBirth: editPerson?.dateOfBirth ? new Date(editPerson.dateOfBirth) : undefined,
    email: editPerson?.email ?? "",
    nationality: editPerson?.nationality ?? "",
    residenceCountry: editPerson?.residenceCountry ?? "",
    domicileCountry: editPerson?.domicileCountry ?? "",
    habitualResidence: editPerson?.habitualResidence ?? "",
    taxResidency: editPerson?.taxResidency ?? "",
    maritalStatus: editPerson?.maritalStatus ?? "",
    preferredLanguage: (editPerson?.preferredLanguage ?? "en") as "en" | "fr" | "pt" | "es",
  };

  const form = useFormState(createPersonSchema, initial as any);
  const mutation = useApiMutation();

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!form.validate()) return;
    const path = editPerson
      ? `/api/matters/${matterId}/people/${editPerson.id}`
      : `/api/matters/${matterId}/people`;
    const method = editPerson ? "PATCH" : "POST";
    const result = await mutation.mutate(path, form.values, method);
    if (result) {
      form.reset();
      onSaved();
      onClose();
    }
  }

  return (
    <Modal open={open} titleKey={editPerson ? "people.edit_title" : "people.add_title"} onClose={onClose}>
      <form onSubmit={handleSubmit} className="form-stack">
        <FormField name="legalName" labelKey="people.legal_name" value={String(form.values.legalName ?? "")} error={form.errors.legalName} required onChange={(v) => form.handleChange("legalName", v)} />
        <FormField name="email" labelKey="people.email" value={String(form.values.email ?? "")} error={form.errors.email} type="email" onChange={(v) => form.handleChange("email", v)} />
        <FormDateInput name="dateOfBirth" labelKey="people.dob" value={form.values.dateOfBirth ? new Date(form.values.dateOfBirth as any).toISOString().split("T")[0] : ""} onChange={(v) => form.handleChange("dateOfBirth", v ? new Date(v) : undefined)} />
        <FormField name="nationality" labelKey="people.nationality" value={String(form.values.nationality ?? "")} onChange={(v) => form.handleChange("nationality", v)} />
        <FormField name="domicileCountry" labelKey="people.domicile" value={String(form.values.domicileCountry ?? "")} onChange={(v) => form.handleChange("domicileCountry", v)} />
        <FormField name="habitualResidence" labelKey="people.residence" value={String(form.values.habitualResidence ?? "")} onChange={(v) => form.handleChange("habitualResidence", v)} />
        <FormField name="taxResidency" labelKey="people.tax_residency" value={String(form.values.taxResidency ?? "")} onChange={(v) => form.handleChange("taxResidency", v)} />
        <FormSelect name="maritalStatus" labelKey="people.marital_status" value={String(form.values.maritalStatus ?? "")} options={[
          { value: "", labelKey: "common.select" },
          { value: "single", labelKey: "options.legal_single" },
          { value: "married", labelKey: "options.legal_married" },
          { value: "civil_partnership", labelKey: "options.legal_civil_partnership" },
          { value: "divorced", labelKey: "options.legal_divorced" },
          { value: "cohabiting", labelKey: "options.legal_cohabiting" },
        ]} onChange={(v) => form.handleChange("maritalStatus", v)} />
        <FormSelect name="religion" labelKey="people.religion" value={String((form.values as any).religion ?? "")} options={[
          { value: "", labelKey: "common.select" },
          { value: "christianity", labelKey: "options.religion_christianity" },
          { value: "islam", labelKey: "options.religion_islam" },
          { value: "traditional", labelKey: "options.religion_traditional" },
          { value: "hinduism", labelKey: "options.religion_hinduism" },
          { value: "judaism", labelKey: "options.religion_judaism" },
          { value: "none", labelKey: "options.religion_none" },
          { value: "other", labelKey: "options.religion_other" },
        ]} onChange={(v) => form.handleChange("religion" as any, v)} />
        <FormSelect name="legalSystemPref" labelKey="people.legal_system_pref" value={String((form.values as any).legalSystemPref ?? "")} options={[
          { value: "", labelKey: "common.select" },
          { value: "common_law", labelKey: "options.legal_system_common_law" },
          { value: "civil_law", labelKey: "options.legal_system_civil_law" },
          { value: "customary_law", labelKey: "options.legal_system_customary" },
          { value: "islamic_law", labelKey: "options.legal_system_islamic" },
          { value: "mixed", labelKey: "options.legal_system_mixed" },
        ]} onChange={(v) => form.handleChange("legalSystemPref" as any, v)} />
        <FormSelect name="preferredLanguage" labelKey="people.language" value={String(form.values.preferredLanguage ?? "en")} options={[{ value: "en", labelKey: "options.lang_en" }, { value: "fr", labelKey: "options.lang_fr" }, { value: "pt", labelKey: "options.lang_pt" }, { value: "es", labelKey: "options.lang_es" }]} onChange={(v) => form.handleChange("preferredLanguage", v)} />
        {mutation.error && <div className="form-error" role="alert">{mutation.error}</div>}
        <FormActions onCancel={onClose} submitLabelKey="common.save" loading={mutation.loading} />
      </form>
    </Modal>
  );
}
