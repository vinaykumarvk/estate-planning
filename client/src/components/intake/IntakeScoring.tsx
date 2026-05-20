import { useTranslation } from "react-i18next";
import { useMatterContext } from "../hooks/useMatterContext";
import { useApiQuery } from "../hooks/useApiQuery";

interface IntakeScore {
  intake: { totalModules: number; completeModules: number; score: number; missingCritical: string[] };
}

export function IntakeScoring() {
  const { t } = useTranslation();
  const { matterId } = useMatterContext();
  const { data } = useApiQuery<IntakeScore>(`/api/matters/${matterId}/intake-score`);

  const intake = data?.intake;

  return (
    <div className="panel">
      <h3>{t("intake.scoring_title")}</h3>
      <div className="progress">
        <span style={{ width: `${intake?.score ?? 0}%` }} />
      </div>
      <p>{t("intake.modules_complete", { complete: intake?.completeModules ?? 0, total: intake?.totalModules ?? 0 })}</p>
      {intake?.missingCritical?.length ? (
        <div>
          <h4>{t("intake.missing_critical")}</h4>
          <ul className="compact-list">
            {intake.missingCritical.map((item) => (
              <li key={item}><span>{item}</span><strong>{t("common.required")}</strong></li>
            ))}
          </ul>
        </div>
      ) : null}
    </div>
  );
}
