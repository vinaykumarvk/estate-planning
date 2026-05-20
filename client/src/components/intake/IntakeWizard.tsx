import { useState } from "react";
import { Link, Pencil, Plus } from "lucide-react";
import { useTranslation } from "react-i18next";
import { useMatterContext } from "../hooks/useMatterContext";
import { useApiMutation } from "../hooks/useApiMutation";
import { useApiQuery } from "../hooks/useApiQuery";
import { Stepper } from "../primitives/Stepper";
import { FormSelect } from "../primitives/FormSelect";
import { FormField } from "../primitives/FormField";
import { FormCheckbox } from "../primitives/FormCheckbox";
import { FormActions } from "../primitives/FormActions";
import { EmptyState } from "../primitives/EmptyState";
import { PersonForm } from "../people/PersonForm";
import { RelationshipForm } from "../people/RelationshipForm";
import { AssetValuationForm } from "../assets/AssetValuationForm";
import { formatDate } from "../../lib/format";
import { Modal } from "../primitives/Modal";

const INTAKE_STEPS = [
  { key: "jurisdiction", labelKey: "intake.step_jurisdiction" },
  { key: "client_profile", labelKey: "intake.step_client_profile" },
  { key: "connecting_factors", labelKey: "intake.step_connecting_factors" },
  { key: "relationships", labelKey: "intake.step_relationships" },
  { key: "assets", labelKey: "intake.step_assets" },
  { key: "planning_scenario", labelKey: "intake.step_planning_scenario" },
  { key: "privacy_consent", labelKey: "intake.step_privacy_consent" },
  { key: "professional_disclaimer", labelKey: "intake.step_professional_disclaimer" },
];

interface WorkflowModule {
  name: string;
  status: "complete" | "incomplete" | "not_started";
  validationErrors: string[];
}

interface IntakeWorkflowResponse {
  workflow: {
    matterId: string;
    currentModule: string;
    modules: WorkflowModule[];
  };
}

export function IntakeWizard() {
  const { t } = useTranslation();
  const { matterId, workspace, refreshWorkspace } = useMatterContext();
  const { data, refetch } = useApiQuery<IntakeWorkflowResponse>(
    `/api/matters/${matterId}/intake-workflow`
  );
  const advanceMutation = useApiMutation();
  const [stepIndex, setStepIndex] = useState(0);

  const modules = data?.workflow?.modules ?? [];
  const currentStep = INTAKE_STEPS[stepIndex];

  const stepStatus = modules.find((m) => m.name === currentStep?.key);
  const isComplete = stepStatus?.status === "complete";

  async function handleAdvance() {
    if (!currentStep) return;
    await advanceMutation.mutate(
      `/api/matters/${matterId}/intake-workflow/advance`,
      { matterId, currentModule: currentStep.key }
    );
    refetch();
    if (stepIndex < INTAKE_STEPS.length - 1) {
      setStepIndex(stepIndex + 1);
    }
  }

  function handleDataChanged() {
    refreshWorkspace();
    refetch();
  }

  return (
    <div className="panel">
      <h3>{t("intake.wizard_title")}</h3>
      <Stepper
        steps={INTAKE_STEPS.map((s) => ({ key: s.key, labelKey: s.labelKey }))}
        currentIndex={stepIndex}
        onStepClick={setStepIndex}
      />

      <div className="intake-step-content">
        <h4>{currentStep ? t(currentStep.labelKey) : ""}</h4>
        <p className="form-field__hint">
          {isComplete ? t("intake.step_completed") : t("intake.step_pending")}
        </p>

        {stepStatus?.validationErrors && stepStatus.validationErrors.length > 0 && !isComplete && (
          <ul className="intake-validation-errors">
            {stepStatus.validationErrors.map((err) => (
              <li key={err} className="form-field__error">{err}</li>
            ))}
          </ul>
        )}

        {currentStep?.key === "jurisdiction" && (
          <JurisdictionStep onSaved={handleDataChanged} />
        )}
        {currentStep?.key === "client_profile" && (
          <ClientProfileStep onSaved={handleDataChanged} />
        )}
        {currentStep?.key === "connecting_factors" && (
          <ConnectingFactorsStep onSaved={handleDataChanged} />
        )}
        {currentStep?.key === "relationships" && (
          <RelationshipsStep onSaved={handleDataChanged} />
        )}
        {currentStep?.key === "assets" && (
          <AssetsStep onSaved={handleDataChanged} />
        )}
        {currentStep?.key === "planning_scenario" && (
          <PlanningScenarioStep onSaved={handleDataChanged} />
        )}
        {currentStep?.key === "privacy_consent" && (
          <ConsentStep consentType="privacy_notice" onSaved={handleDataChanged} />
        )}
        {currentStep?.key === "professional_disclaimer" && (
          <ConsentStep consentType="professional_disclaimer" onSaved={handleDataChanged} />
        )}

        {advanceMutation.error && (
          <div className="form-error" role="alert">{advanceMutation.error}</div>
        )}

        <div className="form-actions" style={{ marginTop: 16 }}>
          {stepIndex > 0 && (
            <button type="button" className="form-actions__cancel" onClick={() => setStepIndex(stepIndex - 1)}>
              {t("intake.previous_step")}
            </button>
          )}
          {isComplete && stepIndex < INTAKE_STEPS.length - 1 && (
            <button type="button" onClick={handleAdvance} disabled={advanceMutation.loading}>
              {t("intake.next_step")}
            </button>
          )}
          {isComplete && stepIndex === INTAKE_STEPS.length - 1 && (
            <button type="button" className="form-actions__submit" onClick={handleAdvance} disabled={advanceMutation.loading}>
              {t("intake.complete")}
            </button>
          )}
        </div>
      </div>
    </div>
  );
}

/* ─── Step: Jurisdiction ─── */

function JurisdictionStep({ onSaved }: { onSaved: () => void }) {
  const { t } = useTranslation();
  const { matterId, workspace } = useMatterContext();
  const mutation = useApiMutation();

  const [jurisdiction, setJurisdiction] = useState(
    workspace?.matter.primaryJurisdictionCode ?? "NG"
  );
  const [language, setLanguage] = useState(
    workspace?.matter.languageOfRecord ?? "en"
  );

  async function handleSave() {
    const result = await mutation.mutate(
      `/api/matters/${matterId}`,
      { primaryJurisdictionCode: jurisdiction, languageOfRecord: language },
      "PATCH"
    );
    if (result) onSaved();
  }

  return (
    <div className="form-stack">
      <FormSelect
        name="primaryJurisdictionCode"
        labelKey="matters.jurisdiction"
        value={jurisdiction}
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
        required
        onChange={setJurisdiction}
      />
      <FormSelect
        name="languageOfRecord"
        labelKey="matters.language"
        value={language}
        options={[
          { value: "en", labelKey: "options.lang_en" },
          { value: "fr", labelKey: "options.lang_fr" },
          { value: "pt", labelKey: "options.lang_pt" },
          { value: "es", labelKey: "options.lang_es" },
        ]}
        required
        onChange={setLanguage}
      />
      {mutation.error && <div className="form-error" role="alert">{mutation.error}</div>}
      <button type="button" onClick={handleSave} disabled={mutation.loading}>
        {mutation.loading ? t("common.saving") : t("common.save")}
      </button>
    </div>
  );
}

/* ─── Step: Client Profile ─── */

function ClientProfileStep({ onSaved }: { onSaved: () => void }) {
  const { t } = useTranslation();
  const { workspace } = useMatterContext();
  const [showAdd, setShowAdd] = useState(false);

  const people = workspace?.people ?? [];

  return (
    <div className="form-stack">
      <p className="form-field__hint">{t("intake.client_profile_hint")}</p>
      {people.length === 0 ? (
        <EmptyState messageKey="people.empty" actionKey="people.add_person" onAction={() => setShowAdd(true)} />
      ) : (
        <ul className="compact-list">
          {people.map((person) => (
            <li key={person.id}>
              <span>{person.legalName}</span>
              <strong>{person.dateOfBirth ? formatDate(person.dateOfBirth) : t("intake.dob_missing")}</strong>
              <em>{person.email ?? ""}</em>
            </li>
          ))}
        </ul>
      )}
      <button type="button" onClick={() => setShowAdd(true)}>
        <Plus aria-hidden="true" size={14} /> {t("people.add_person")}
      </button>
      <PersonForm
        open={showAdd}
        onClose={() => setShowAdd(false)}
        onSaved={() => { setShowAdd(false); onSaved(); }}
      />
    </div>
  );
}

/* ─── Step: Connecting Factors ─── */

function ConnectingFactorsStep({ onSaved }: { onSaved: () => void }) {
  const { t } = useTranslation();
  const { workspace } = useMatterContext();
  const [editPersonId, setEditPersonId] = useState<string | null>(null);

  const people = workspace?.people ?? [];
  const editPerson = people.find((p) => p.id === editPersonId);

  // Transform null values to undefined for PersonForm compatibility
  const editPersonProps = editPerson
    ? {
        id: editPerson.id,
        legalName: editPerson.legalName,
        email: editPerson.email ?? undefined,
        nationality: editPerson.nationality ?? undefined,
        residenceCountry: editPerson.residenceCountry ?? undefined,
        domicileCountry: editPerson.domicileCountry ?? undefined,
        habitualResidence: editPerson.habitualResidence ?? undefined,
        taxResidency: editPerson.taxResidency ?? undefined,
        preferredLanguage: editPerson.preferredLanguage,
        dateOfBirth: editPerson.dateOfBirth ?? undefined,
      }
    : null;

  return (
    <div className="form-stack">
      <p className="form-field__hint">{t("intake.connecting_factors_hint")}</p>
      {people.length === 0 ? (
        <p className="form-field__hint">{t("intake.add_people_first")}</p>
      ) : (
        <ul className="compact-list">
          {people.map((person) => (
            <li key={person.id}>
              <span>{person.legalName}</span>
              <strong>{person.domicileCountry ?? t("intake.not_set")}</strong>
              <em>{person.habitualResidence ?? t("intake.not_set")}</em>
              <button
                type="button"
                className="icon-button"
                onClick={() => setEditPersonId(person.id)}
                aria-label={t("common.edit")}
              >
                <Pencil size={14} />
              </button>
            </li>
          ))}
        </ul>
      )}
      {editPersonProps && (
        <PersonForm
          open={!!editPersonProps}
          onClose={() => setEditPersonId(null)}
          onSaved={() => { setEditPersonId(null); onSaved(); }}
          editPerson={editPersonProps}
        />
      )}
    </div>
  );
}

/* ─── Step: Relationships ─── */

function RelationshipsStep({ onSaved }: { onSaved: () => void }) {
  const { t } = useTranslation();
  const { workspace } = useMatterContext();
  const [showAdd, setShowAdd] = useState(false);

  const people = workspace?.people ?? [];
  const relationships = workspace?.relationships ?? [];

  function personName(id: string) {
    return people.find((p) => p.id === id)?.legalName ?? id;
  }

  return (
    <div className="form-stack">
      <p className="form-field__hint">{t("intake.relationships_hint")}</p>
      {relationships.length === 0 ? (
        <EmptyState messageKey="intake.no_relationships" actionKey="people.add_relationship" onAction={() => setShowAdd(true)} />
      ) : (
        <ul className="compact-list">
          {relationships.map((rel) => (
            <li key={rel.id}>
              <span>{personName(rel.fromPersonId)}</span>
              <strong>{rel.relationshipType}</strong>
              <em>{personName(rel.toPersonId)}</em>
            </li>
          ))}
        </ul>
      )}
      {people.length >= 2 && (
        <button type="button" onClick={() => setShowAdd(true)}>
          <Link aria-hidden="true" size={14} /> {t("people.add_relationship")}
        </button>
      )}
      {people.length < 2 && (
        <p className="form-field__hint">{t("intake.need_two_people")}</p>
      )}
      <RelationshipForm
        open={showAdd}
        onClose={() => setShowAdd(false)}
        onSaved={() => { setShowAdd(false); onSaved(); }}
        people={people}
      />
    </div>
  );
}

/* ─── Step: Assets ─── */

function AssetsStep({ onSaved }: { onSaved: () => void }) {
  const { t } = useTranslation();
  const { workspace } = useMatterContext();
  const [showAdd, setShowAdd] = useState(false);

  const assets = workspace?.assets ?? [];

  return (
    <div className="form-stack">
      <p className="form-field__hint">{t("intake.assets_hint")}</p>
      {assets.length === 0 ? (
        <EmptyState messageKey="assets.empty" actionKey="assets.add_asset" onAction={() => setShowAdd(true)} />
      ) : (
        <ul className="compact-list">
          {assets.map((asset) => (
            <li key={asset.id}>
              <span>{asset.description}</span>
              <strong>{asset.currency} {asset.valuation.toLocaleString()}</strong>
              <em>{asset.assetClass} &middot; {asset.situsCountry}</em>
            </li>
          ))}
        </ul>
      )}
      <button type="button" onClick={() => setShowAdd(true)}>
        <Plus aria-hidden="true" size={14} /> {t("assets.add_asset")}
      </button>
      <AssetValuationForm
        open={showAdd}
        onClose={() => setShowAdd(false)}
        onSaved={() => { setShowAdd(false); onSaved(); }}
      />
    </div>
  );
}

/* ─── Step: Planning Scenario ─── */

function PlanningScenarioStep({ onSaved }: { onSaved: () => void }) {
  const { t } = useTranslation();
  const { matterId, workspace } = useMatterContext();
  const mutation = useApiMutation();
  const [showCreate, setShowCreate] = useState(false);
  const [name, setName] = useState("");
  const [comparisonBase, setComparisonBase] = useState(false);

  const scenarios = workspace?.scenarios ?? [];

  async function handleCreate(e: React.FormEvent) {
    e.preventDefault();
    if (!name.trim()) return;
    const result = await mutation.mutate(`/api/matters/${matterId}/scenarios`, {
      tenantId: "tenant-demo",
      matterId,
      name,
      comparisonBase,
    });
    if (result) {
      setName("");
      setComparisonBase(false);
      setShowCreate(false);
      onSaved();
    }
  }

  return (
    <div className="form-stack">
      <p className="form-field__hint">{t("intake.scenario_hint")}</p>
      {scenarios.length === 0 ? (
        <EmptyState messageKey="scenarios.empty" actionKey="scenarios.create" onAction={() => setShowCreate(true)} />
      ) : (
        <ul className="compact-list">
          {scenarios.map((s) => (
            <li key={s.id}>
              <span>{s.name}</span>
              <strong>{s.status}</strong>
            </li>
          ))}
        </ul>
      )}
      <button type="button" onClick={() => setShowCreate(true)}>
        <Plus aria-hidden="true" size={14} /> {t("scenarios.create")}
      </button>
      <Modal open={showCreate} titleKey="scenarios.create" onClose={() => setShowCreate(false)}>
        <form onSubmit={handleCreate} className="form-stack">
          <FormField
            name="scenarioName"
            labelKey="scenarios.name"
            value={name}
            required
            onChange={setName}
          />
          <FormCheckbox
            name="comparisonBase"
            labelKey="scenarios.comparison_base"
            checked={comparisonBase}
            onChange={setComparisonBase}
          />
          {mutation.error && <div className="form-error" role="alert">{mutation.error}</div>}
          <FormActions onCancel={() => setShowCreate(false)} loading={mutation.loading} />
        </form>
      </Modal>
    </div>
  );
}

/* ─── Step: Consent (privacy & disclaimer) ─── */

function ConsentStep({ consentType, onSaved }: { consentType: string; onSaved: () => void }) {
  const { t } = useTranslation();
  const { matterId, workspace } = useMatterContext();
  const mutation = useApiMutation();

  const consents = workspace?.consents ?? [];
  const consent = consents.find((c) => c.consentType === consentType);

  async function handleAcknowledge() {
    if (!consent) return;
    const result = await mutation.mutate(
      `/api/matters/${matterId}/consents/${consent.id}/acknowledge`,
      { actorUserId: "user-solicitor" }
    );
    if (result) onSaved();
  }

  const labelKey = consentType === "privacy_notice"
    ? "intake.privacy_notice"
    : "intake.professional_disclaimer";

  return (
    <div className="form-stack">
      <p className="form-field__hint">{t(labelKey)}</p>
      {consent?.acknowledged ? (
        <div className="status-badge status-badge--success">{t("common.acknowledged")}</div>
      ) : (
        <button type="button" onClick={handleAcknowledge} disabled={mutation.loading || !consent}>
          {mutation.loading ? t("common.saving") : t("intake.acknowledge")}
        </button>
      )}
      {mutation.error && <div className="form-error" role="alert">{mutation.error}</div>}
    </div>
  );
}
