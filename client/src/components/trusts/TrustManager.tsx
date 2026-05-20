import { useState } from "react";
import { FileText, Plus, Trash2, Shield, Users, Landmark } from "lucide-react";
import { useTranslation } from "react-i18next";
import { useMatterContext } from "../hooks/useMatterContext";
import { useApiMutation } from "../hooks/useApiMutation";
import { useApiQuery } from "../hooks/useApiQuery";
import { T } from "../primitives/T";
import { Modal } from "../primitives/Modal";
import { FormField } from "../primitives/FormField";
import { FormSelect } from "../primitives/FormSelect";
import { FormTextarea } from "../primitives/FormTextarea";
import { FormCheckbox } from "../primitives/FormCheckbox";
import { FormActions } from "../primitives/FormActions";
import { StatusBadge } from "../primitives/StatusBadge";
import { EmptyState } from "../primitives/EmptyState";
import { ConfirmDialog } from "../primitives/ConfirmDialog";

interface TrustRecord {
  id: string;
  recordType: string;
  title: string;
  reviewStatus: string;
  evidenceRefs: string[];
  payload: {
    trustType?: string;
    settlorId?: string;
    trusteeId?: string;
    successorTrusteeId?: string;
    beneficiaryIds?: string[];
    distributionRules?: string;
    linkedAssetIds?: string[];
  };
}

interface TrustListPayload {
  records: TrustRecord[];
}

const TRUST_TYPE_OPTIONS = [
  { value: "revocable_living", labelKey: "trusts.type_revocable_living" },
  { value: "testamentary", labelKey: "trusts.type_testamentary" },
  { value: "education", labelKey: "trusts.type_education" },
  { value: "special_needs", labelKey: "trusts.type_special_needs" },
  { value: "charitable", labelKey: "trusts.type_charitable" },
];

export function TrustManager() {
  const { t } = useTranslation();
  const { matterId, workspace, refreshWorkspace } = useMatterContext();
  const mutation = useApiMutation();
  const docMutation = useApiMutation();
  const trustQuery = useApiQuery<TrustListPayload>(
    `/api/matters/${matterId}/estate-planning/records?recordType=trust_structure`
  );

  const [showAdd, setShowAdd] = useState(false);
  const [deleteId, setDeleteId] = useState<string | null>(null);

  // Form state
  const [trustName, setTrustName] = useState("");
  const [trustType, setTrustType] = useState("");
  const [settlorId, setSettlorId] = useState("");
  const [trusteeId, setTrusteeId] = useState("");
  const [successorTrusteeId, setSuccessorTrusteeId] = useState("");
  const [beneficiaryIds, setBeneficiaryIds] = useState("");
  const [distributionRules, setDistributionRules] = useState("");
  const [linkedAssetIds, setLinkedAssetIds] = useState<string[]>([]);

  const trusts = trustQuery.data?.records ?? [];
  const people = workspace?.people ?? [];
  const assets = workspace?.assets ?? [];

  const peopleOptions = people.map((p) => ({ value: p.id, label: p.legalName }));

  function personName(id: string | undefined): string {
    if (!id) return t("common.unknown");
    return people.find((p) => p.id === id)?.legalName ?? id;
  }

  function beneficiaryNames(ids: string[] | undefined): string {
    if (!ids || ids.length === 0) return t("trusts.no_beneficiaries");
    return ids.map((id) => personName(id)).join(", ");
  }

  function toggleAsset(assetId: string) {
    setLinkedAssetIds((current) =>
      current.includes(assetId)
        ? current.filter((id) => id !== assetId)
        : [...current, assetId]
    );
  }

  function resetForm() {
    setTrustName("");
    setTrustType("");
    setSettlorId("");
    setTrusteeId("");
    setSuccessorTrusteeId("");
    setBeneficiaryIds("");
    setDistributionRules("");
    setLinkedAssetIds([]);
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    const beneficiaryIdList = beneficiaryIds
      .split(",")
      .map((s) => s.trim())
      .filter(Boolean);

    const result = await mutation.mutate(`/api/matters/${matterId}/estate-planning/records`, {
      recordType: "trust_structure",
      title: trustName,
      personId: settlorId || undefined,
      reviewStatus: "pending",
      payload: {
        trustType,
        settlorId: settlorId || undefined,
        trusteeId: trusteeId || undefined,
        successorTrusteeId: successorTrusteeId || undefined,
        beneficiaryIds: beneficiaryIdList.length > 0 ? beneficiaryIdList : undefined,
        distributionRules: distributionRules || undefined,
        linkedAssetIds: linkedAssetIds.length > 0 ? linkedAssetIds : undefined,
      },
      evidenceRefs: [],
    });
    if (result) {
      setShowAdd(false);
      resetForm();
      trustQuery.refetch();
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
    trustQuery.refetch();
    refreshWorkspace();
  }

  async function handleGenerateDeed(trustId: string) {
    await docMutation.mutate(
      `/api/planning/matters/${matterId}/documents/estate-planning`,
      { documentType: "trust_memo", recordId: trustId }
    );
  }

  return (
    <div className="content-grid">
      <section className="panel span-2">
        <div className="panel-header">
          <h3>
            <Shield aria-hidden="true" size={16} /> <T k="trusts.title" />
          </h3>
          <button type="button" onClick={() => setShowAdd(true)}>
            <Plus aria-hidden="true" size={14} /> <T k="trusts.create_trust" />
          </button>
        </div>

        {trusts.length === 0 ? (
          <EmptyState
            messageKey="trusts.empty"
            actionKey="trusts.create_trust"
            onAction={() => setShowAdd(true)}
          />
        ) : (
          <div className="card-grid">
            {trusts.map((trust) => (
              <div key={trust.id} className="card">
                <div className="card-header">
                  <h4>{trust.title}</h4>
                  <StatusBadge
                    status={
                      trust.payload.trustType
                        ? trust.payload.trustType.replaceAll("_", " ")
                        : trust.reviewStatus
                    }
                  />
                </div>
                <ul className="card-details">
                  <li>
                    <Landmark aria-hidden="true" size={12} />
                    <span className="card-label"><T k="trusts.settlor" /></span>
                    <strong>{personName(trust.payload.settlorId)}</strong>
                  </li>
                  <li>
                    <Users aria-hidden="true" size={12} />
                    <span className="card-label"><T k="trusts.trustee" /></span>
                    <strong>{personName(trust.payload.trusteeId)}</strong>
                  </li>
                  <li>
                    <Users aria-hidden="true" size={12} />
                    <span className="card-label"><T k="trusts.beneficiaries" /></span>
                    <strong>{beneficiaryNames(trust.payload.beneficiaryIds)}</strong>
                  </li>
                  <li>
                    <FileText aria-hidden="true" size={12} />
                    <span className="card-label"><T k="trusts.linked_assets" /></span>
                    <strong>
                      {trust.payload.linkedAssetIds?.length ?? 0} {t("trusts.assets_linked")}
                    </strong>
                  </li>
                </ul>
                <div className="card-actions">
                  <button
                    type="button"
                    onClick={() => handleGenerateDeed(trust.id)}
                    disabled={docMutation.loading}
                  >
                    <FileText aria-hidden="true" size={14} />{" "}
                    <T k="trusts.generate_deed" />
                  </button>
                  <button
                    type="button"
                    className="icon-button icon-button--danger"
                    onClick={() => setDeleteId(trust.id)}
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
        titleKey="trusts.create_trust"
        onClose={() => {
          setShowAdd(false);
          resetForm();
        }}
        wide
      >
        <form onSubmit={handleSubmit}>
          <FormField
            name="trustName"
            labelKey="trusts.trust_name"
            value={trustName}
            onChange={setTrustName}
            required
          />
          <FormSelect
            name="trustType"
            labelKey="trusts.trust_type"
            value={trustType}
            options={TRUST_TYPE_OPTIONS}
            onChange={setTrustType}
            required
          />
          <FormSelect
            name="settlorId"
            labelKey="trusts.settlor"
            value={settlorId}
            options={peopleOptions}
            onChange={setSettlorId}
            required
          />
          <FormSelect
            name="trusteeId"
            labelKey="trusts.trustee"
            value={trusteeId}
            options={peopleOptions}
            onChange={setTrusteeId}
            required
          />
          <FormSelect
            name="successorTrusteeId"
            labelKey="trusts.successor_trustee"
            value={successorTrusteeId}
            options={peopleOptions}
            onChange={setSuccessorTrusteeId}
          />

          <fieldset className="form-field">
            <legend className="form-field__label">
              <T k="trusts.beneficiaries" />
            </legend>
            <div className="checkbox-group">
              {people.map((person) => {
                const selected = beneficiaryIds
                  .split(",")
                  .map((s) => s.trim())
                  .includes(person.id);
                return (
                  <label key={person.id} className="form-field__checkbox-label">
                    <input
                      type="checkbox"
                      checked={selected}
                      onChange={() => {
                        const current = beneficiaryIds
                          .split(",")
                          .map((s) => s.trim())
                          .filter(Boolean);
                        const next = selected
                          ? current.filter((id) => id !== person.id)
                          : [...current, person.id];
                        setBeneficiaryIds(next.join(", "));
                      }}
                    />
                    {person.legalName}
                  </label>
                );
              })}
            </div>
          </fieldset>

          <FormTextarea
            name="distributionRules"
            labelKey="trusts.distribution_rules"
            value={distributionRules}
            onChange={setDistributionRules}
            rows={3}
          />

          {assets.length > 0 && (
            <fieldset className="form-field">
              <legend className="form-field__label">
                <T k="trusts.linked_assets" />
              </legend>
              <div className="checkbox-group">
                {assets.map((asset) => (
                  <FormCheckbox
                    key={asset.id}
                    name={`asset-${asset.id}`}
                    labelKey={`${asset.description} (${asset.currency} ${asset.valuation.toLocaleString()})`}
                    checked={linkedAssetIds.includes(asset.id)}
                    onChange={() => toggleAsset(asset.id)}
                  />
                ))}
              </div>
            </fieldset>
          )}

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
        titleKey="trusts.delete_title"
        messageKey="trusts.delete_confirm"
        destructive
        onConfirm={handleDelete}
        onCancel={() => setDeleteId(null)}
      />
    </div>
  );
}
