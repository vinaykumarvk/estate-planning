import { useState } from "react";
import { Plus, Trash2 } from "lucide-react";
import { useTranslation } from "react-i18next";
import { useMatterContext } from "../hooks/useMatterContext";
import { useApiMutation } from "../hooks/useApiMutation";
import { EmptyState } from "../primitives/EmptyState";
import { ConfirmDialog } from "../primitives/ConfirmDialog";
import { AssetValuationForm } from "./AssetValuationForm";
import { DocumentUpload } from "./DocumentUpload";

export function AssetList() {
  const { t } = useTranslation();
  const { workspace, refreshWorkspace, matterId } = useMatterContext();
  const mutation = useApiMutation();
  const [showAdd, setShowAdd] = useState(false);
  const [deleteId, setDeleteId] = useState<string | null>(null);

  const assets = workspace?.assets ?? [];

  async function handleDelete() {
    if (!deleteId) return;
    await mutation.mutate(`/api/matters/${matterId}/assets/${deleteId}`, undefined, "DELETE");
    setDeleteId(null);
    refreshWorkspace();
  }

  return (
    <div className="panel">
      <div className="panel-header">
        <h3>{t("assets.title")}</h3>
        <button type="button" onClick={() => setShowAdd(true)}><Plus aria-hidden="true" size={14} /> {t("assets.add_asset")}</button>
      </div>
      {assets.length === 0 ? (
        <EmptyState messageKey="assets.empty" actionKey="assets.add_asset" onAction={() => setShowAdd(true)} />
      ) : (
        <ul className="compact-list">
          {assets.map((asset) => (
            <li key={asset.id}>
              <span>{asset.description}</span>
              <strong>{asset.currency} {asset.valuation.toLocaleString()}</strong>
              <em>{asset.assetClass} &middot; {asset.situsCountry}</em>
              <div className="list-item-actions">
                <DocumentUpload entityType="asset" entityId={asset.id} onUploaded={refreshWorkspace} />
                <button type="button" className="icon-button icon-button--danger" onClick={() => setDeleteId(asset.id)} aria-label={t("common.delete")}>
                  <Trash2 size={14} />
                </button>
              </div>
            </li>
          ))}
        </ul>
      )}
      <AssetValuationForm open={showAdd} onClose={() => setShowAdd(false)} onSaved={refreshWorkspace} />
      <ConfirmDialog open={!!deleteId} titleKey="assets.delete_title" messageKey="assets.delete_confirm" destructive onConfirm={handleDelete} onCancel={() => setDeleteId(null)} />
    </div>
  );
}
