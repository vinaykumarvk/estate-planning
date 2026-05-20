import { useState } from "react";
import { Plus, UserCheck } from "lucide-react";
import { useTranslation } from "react-i18next";
import { useMatterContext } from "../hooks/useMatterContext";
import { useApiQuery } from "../hooks/useApiQuery";
import { EmptyState } from "../primitives/EmptyState";
import { GiftForm } from "./GiftForm";
import { FiduciaryForm } from "./FiduciaryForm";

interface Disposition {
  id: string;
  giftType: string;
  beneficiaryLabel: string;
  amount?: number;
  percentage?: number;
  currency?: string;
  fiduciaryRole?: string;
}

export function DispositionList({ scenarioId }: { scenarioId: string }) {
  const { t } = useTranslation();
  const { matterId } = useMatterContext();
  const { data, refetch } = useApiQuery<{ dispositions: Disposition[] }>(`/api/matters/${matterId}/scenarios/${scenarioId}/dispositions`);
  const [showGift, setShowGift] = useState(false);
  const [showFiduciary, setShowFiduciary] = useState(false);

  const dispositions = data?.dispositions ?? [];

  return (
    <div>
      <div className="panel-header">
        <h4>{t("dispositions.title")}</h4>
        <div className="button-row">
          <button type="button" onClick={() => setShowFiduciary(true)}><UserCheck aria-hidden="true" size={14} /> {t("dispositions.appoint_fiduciary")}</button>
          <button type="button" onClick={() => setShowGift(true)}><Plus aria-hidden="true" size={14} /> {t("dispositions.add_gift")}</button>
        </div>
      </div>
      {dispositions.length === 0 ? (
        <EmptyState messageKey="dispositions.empty" actionKey="dispositions.add_gift" onAction={() => setShowGift(true)} />
      ) : (
        <ul className="compact-list">
          {dispositions.map((d) => (
            <li key={d.id}>
              <span>{d.beneficiaryLabel}</span>
              <strong>{d.fiduciaryRole ?? d.giftType}</strong>
              <em>{d.amount ? `${d.currency ?? "NGN"} ${d.amount.toLocaleString()}` : d.percentage ? `${d.percentage}%` : ""}</em>
            </li>
          ))}
        </ul>
      )}
      <GiftForm open={showGift} onClose={() => setShowGift(false)} onSaved={refetch} scenarioId={scenarioId} />
      <FiduciaryForm open={showFiduciary} onClose={() => setShowFiduciary(false)} onSaved={refetch} scenarioId={scenarioId} />
    </div>
  );
}
