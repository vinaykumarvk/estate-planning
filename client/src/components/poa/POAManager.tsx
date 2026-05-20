import { useState } from "react";
import { FileText, Plus, Trash2, ShieldCheck, User, UserCheck } from "lucide-react";
import { useTranslation } from "react-i18next";
import { useMatterContext } from "../hooks/useMatterContext";
import { useApiMutation } from "../hooks/useApiMutation";
import { useApiQuery } from "../hooks/useApiQuery";
import { T } from "../primitives/T";
import { Modal } from "../primitives/Modal";
import { FormSelect } from "../primitives/FormSelect";
import { FormTextarea } from "../primitives/FormTextarea";
import { FormActions } from "../primitives/FormActions";
import { StatusBadge } from "../primitives/StatusBadge";
import { EmptyState } from "../primitives/EmptyState";
import { ConfirmDialog } from "../primitives/ConfirmDialog";

interface POARecord {
  id: string;
  recordType: string;
  title: string;
  reviewStatus: string;
  evidenceRefs: string[];
  payload: {
    instrumentType?: string;
    principalId?: string;
    agentId?: string;
    alternateAgentId?: string;
    activationType?: string;
    scope?: string;
    registrationStatus?: string;
    notes?: string;
  };
}

interface POAListPayload {
  records: POARecord[];
}

const INSTRUMENT_TYPE_OPTIONS = [
  { value: "durable_financial", labelKey: "poa.type_durable_financial" },
  { value: "healthcare", labelKey: "poa.type_healthcare" },
  { value: "advance_decision", labelKey: "poa.type_advance_decision" },
  { value: "enduring_power", labelKey: "poa.type_enduring_power" },
];

const ACTIVATION_TYPE_OPTIONS = [
  { value: "immediate", labelKey: "poa.activation_immediate" },
  { value: "springing", labelKey: "poa.activation_springing" },
];

const REGISTRATION_STATUS_OPTIONS = [
  { value: "not_registered", labelKey: "poa.status_not_registered" },
  { value: "pending", labelKey: "poa.status_pending" },
  { value: "registered", labelKey: "poa.status_registered" },
];

export function POAManager() {
  const { t } = useTranslation();
  const { matterId, workspace, refreshWorkspace } = useMatterContext();
  const mutation = useApiMutation();
  const docMutation = useApiMutation();
  const poaQuery = useApiQuery<POAListPayload>(
    `/api/matters/${matterId}/estate-planning/records?recordType=incapacity_instrument`
  );

  const [showAdd, setShowAdd] = useState(false);
  const [deleteId, setDeleteId] = useState<string | null>(null);

  // Form state
  const [instrumentType, setInstrumentType] = useState("");
  const [principalId, setPrincipalId] = useState("");
  const [agentId, setAgentId] = useState("");
  const [alternateAgentId, setAlternateAgentId] = useState("");
  const [activationType, setActivationType] = useState("");
  const [scope, setScope] = useState("");
  const [registrationStatus, setRegistrationStatus] = useState("not_registered");
  const [notes, setNotes] = useState("");

  const poas = poaQuery.data?.records ?? [];
  const people = workspace?.people ?? [];

  const peopleOptions = people.map((p) => ({ value: p.id, label: p.legalName }));

  function personName(id: string | undefined): string {
    if (!id) return t("common.unknown");
    return people.find((p) => p.id === id)?.legalName ?? id;
  }

  function instrumentLabel(type: string | undefined): string {
    if (!type) return t("common.unknown");
    const opt = INSTRUMENT_TYPE_OPTIONS.find((o) => o.value === type);
    return opt ? t(opt.labelKey) : type.replaceAll("_", " ");
  }

  function resetForm() {
    setInstrumentType("");
    setPrincipalId("");
    setAgentId("");
    setAlternateAgentId("");
    setActivationType("");
    setScope("");
    setRegistrationStatus("not_registered");
    setNotes("");
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();

    const title = `${instrumentLabel(instrumentType)} - ${personName(principalId)}`;

    const result = await mutation.mutate(`/api/matters/${matterId}/estate-planning/records`, {
      recordType: "incapacity_instrument",
      title,
      personId: principalId || undefined,
      reviewStatus: "pending",
      payload: {
        instrumentType: instrumentType || undefined,
        principalId: principalId || undefined,
        agentId: agentId || undefined,
        alternateAgentId: alternateAgentId || undefined,
        activationType: activationType || undefined,
        scope: scope || undefined,
        registrationStatus: registrationStatus || undefined,
        notes: notes || undefined,
      },
      evidenceRefs: [],
    });
    if (result) {
      setShowAdd(false);
      resetForm();
      poaQuery.refetch();
      refreshWorkspace();
    }
  }

  async function handleDelete() {
    if (!deleteId) return;
    await mutation.mutate(
      `/api/matters/${matterId}/estate-planning/records/${deleteId}`,
      undefined,
      "DELETE"
    );
    setDeleteId(null);
    poaQuery.refetch();
    refreshWorkspace();
  }

  async function handleGenerateDocument(poaId: string) {
    await docMutation.mutate(
      `/api/planning/matters/${matterId}/documents/estate-planning`,
      { documentType: "incapacity_instruction", recordId: poaId }
    );
  }

  return (
    <div className="content-grid">
      <section className="panel span-2">
        <div className="panel-header">
          <h3>
            <ShieldCheck aria-hidden="true" size={16} /> <T k="poa.title" />
          </h3>
          <button type="button" onClick={() => setShowAdd(true)}>
            <Plus aria-hidden="true" size={14} /> <T k="poa.create_poa" />
          </button>
        </div>

        {poas.length === 0 ? (
          <EmptyState
            messageKey="poa.empty"
            actionKey="poa.create_poa"
            onAction={() => setShowAdd(true)}
          />
        ) : (
          <div className="card-grid">
            {poas.map((poa) => (
              <div key={poa.id} className="card">
                <div className="card-header">
                  <h4>{poa.title}</h4>
                  <StatusBadge
                    status={instrumentLabel(poa.payload.instrumentType)}
                  />
                </div>
                <ul className="card-details">
                  <li>
                    <User aria-hidden="true" size={12} />
                    <span className="card-label"><T k="poa.principal" /></span>
                    <strong>{personName(poa.payload.principalId)}</strong>
                  </li>
                  <li>
                    <UserCheck aria-hidden="true" size={12} />
                    <span className="card-label"><T k="poa.agent" /></span>
                    <strong>{personName(poa.payload.agentId)}</strong>
                  </li>
                  <li>
                    <ShieldCheck aria-hidden="true" size={12} />
                    <span className="card-label"><T k="poa.activation_type" /></span>
                    <strong>
                      {poa.payload.activationType
                        ? poa.payload.activationType.replaceAll("_", " ")
                        : t("common.unknown")}
                    </strong>
                  </li>
                  <li>
                    <FileText aria-hidden="true" size={12} />
                    <span className="card-label"><T k="poa.registration_status" /></span>
                    <StatusBadge
                      status={
                        poa.payload.registrationStatus
                          ? poa.payload.registrationStatus.replaceAll("_", " ")
                          : "unknown"
                      }
                      variant={
                        poa.payload.registrationStatus === "registered"
                          ? "success"
                          : poa.payload.registrationStatus === "pending"
                            ? "warning"
                            : "default"
                      }
                    />
                  </li>
                </ul>
                <div className="card-actions">
                  <button
                    type="button"
                    onClick={() => handleGenerateDocument(poa.id)}
                    disabled={docMutation.loading}
                  >
                    <FileText aria-hidden="true" size={14} />{" "}
                    <T k="poa.generate_document" />
                  </button>
                  <button
                    type="button"
                    className="icon-button icon-button--danger"
                    onClick={() => setDeleteId(poa.id)}
                    aria-label={t("common.delete")}
                  >
                    <Trash2 size={14} />
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
      </section>

      <Modal
        open={showAdd}
        titleKey="poa.create_poa"
        onClose={() => {
          setShowAdd(false);
          resetForm();
        }}
        wide
      >
        <form onSubmit={handleSubmit}>
          <FormSelect
            name="instrumentType"
            labelKey="poa.instrument_type"
            value={instrumentType}
            options={INSTRUMENT_TYPE_OPTIONS}
            onChange={setInstrumentType}
            required
          />
          <FormSelect
            name="principalId"
            labelKey="poa.principal"
            value={principalId}
            options={peopleOptions}
            onChange={setPrincipalId}
            required
          />
          <FormSelect
            name="agentId"
            labelKey="poa.agent"
            value={agentId}
            options={peopleOptions}
            onChange={setAgentId}
            required
          />
          <FormSelect
            name="alternateAgentId"
            labelKey="poa.alternate_agent"
            value={alternateAgentId}
            options={peopleOptions}
            onChange={setAlternateAgentId}
          />
          <FormSelect
            name="activationType"
            labelKey="poa.activation_type"
            value={activationType}
            options={ACTIVATION_TYPE_OPTIONS}
            onChange={setActivationType}
            required
          />
          <FormTextarea
            name="scope"
            labelKey="poa.scope"
            value={scope}
            onChange={setScope}
            rows={3}
          />
          <FormSelect
            name="registrationStatus"
            labelKey="poa.registration_status"
            value={registrationStatus}
            options={REGISTRATION_STATUS_OPTIONS}
            onChange={setRegistrationStatus}
          />
          <FormTextarea
            name="notes"
            labelKey="poa.notes"
            value={notes}
            onChange={setNotes}
            rows={3}
          />

          {mutation.error && (
            <div className="form-field__error" role="alert">
              {mutation.error}
            </div>
          )}
          <FormActions
            onCancel={() => {
              setShowAdd(false);
              resetForm();
            }}
            loading={mutation.loading}
          />
        </form>
      </Modal>

      <ConfirmDialog
        open={!!deleteId}
        titleKey="poa.delete_title"
        messageKey="poa.delete_confirm"
        destructive
        onConfirm={handleDelete}
        onCancel={() => setDeleteId(null)}
      />
    </div>
  );
}
