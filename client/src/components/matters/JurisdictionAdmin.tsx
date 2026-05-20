import { useState } from "react";
import { useTranslation } from "react-i18next";
import { useApiMutation } from "../hooks/useApiMutation";
import { useApiQuery } from "../hooks/useApiQuery";

interface TenantJurisdiction {
  code: string;
  enabled: boolean;
}

export function JurisdictionAdmin() {
  const { t } = useTranslation();
  const { data, refetch } = useApiQuery<{ jurisdictions: TenantJurisdiction[] }>("/api/admin/tenants/tenant-demo/jurisdictions");
  const mutation = useApiMutation();
  const [toggling, setToggling] = useState<string | null>(null);

  const jurisdictions = data?.jurisdictions ?? [
    { code: "NG", enabled: true },
    { code: "GH", enabled: true },
    { code: "ZA", enabled: true },
    { code: "KE", enabled: true },
    { code: "SN", enabled: true },
    { code: "CM", enabled: true },
    { code: "MZ", enabled: true },
    { code: "AO", enabled: true },
  ];

  async function handleToggle(code: string, enabled: boolean) {
    setToggling(code);
    await mutation.mutate(`/api/admin/tenants/tenant-demo/jurisdictions`, {
      tenantId: "tenant-demo",
      jurisdictionCode: code,
      enabled,
      actorUserId: "user-solicitor",
    }, "PATCH");
    refetch();
    setToggling(null);
  }

  return (
    <div className="panel">
      <h3>{t("admin.jurisdictions_title")}</h3>
      <ul className="compact-list">
        {jurisdictions.map((j) => (
          <li key={j.code}>
            <span>{t(`options.jurisdiction_${j.code.toLowerCase()}`) || j.code}</span>
            <label className="toggle-switch">
              <input
                type="checkbox"
                checked={j.enabled}
                disabled={toggling === j.code}
                onChange={(e) => handleToggle(j.code, e.target.checked)}
              />
              <span className="toggle-switch__slider" />
            </label>
          </li>
        ))}
      </ul>
      {mutation.error && <div className="form-error" role="alert">{mutation.error}</div>}
    </div>
  );
}
