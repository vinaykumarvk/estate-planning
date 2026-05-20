import { Wallet, AlertTriangle } from "lucide-react";
import { useMatterContext } from "../hooks/useMatterContext";
import { useApiQuery } from "../hooks/useApiQuery";
import { T } from "../primitives/T";
import { StatusBadge } from "../primitives/StatusBadge";
import { EmptyState } from "../primitives/EmptyState";
import { formatDate } from "../../lib/format";
import { EstateCompositionChart } from "../charts/EstateCompositionChart";

interface AssetClassSummary {
  assetClass: string;
  count: number;
  totalValue: number;
  currency: string;
}

interface StaleValuation {
  assetId: string;
  description: string;
  valuationDate: string;
  monthsStale: number;
}

interface BalanceSheetResult {
  totalAssets: number;
  totalLiabilities: number;
  netWorth: number;
  byAssetClass: AssetClassSummary[];
  staleValuations: StaleValuation[];
}

export function BalanceSheet() {
  const { matterId } = useMatterContext();
  const query = useApiQuery<{ balanceSheet: BalanceSheetResult }>(
    `/api/matters/${matterId}/balance-sheet`
  );

  const bs = query.data?.balanceSheet;
  const fmt = (n: number, ccy = "GBP") => `${ccy} ${n.toLocaleString()}`;

  if (query.loading) return <div className="loading-state"><T k="common.loading" /></div>;
  if (query.error) return <div className="error-state" role="alert">{query.error}</div>;
  if (!bs) return <EmptyState messageKey="balance.empty" />;

  return (
    <div className="content-grid">
      <section className="panel span-2">
        <div className="panel-header">
          <h3><Wallet aria-hidden="true" size={16} /> <T k="balance.title" /></h3>
          <button type="button" onClick={query.refetch}><T k="common.refresh" /></button>
        </div>
        <div className="metric-grid">
          <div className="metric"><span><T k="balance.total_assets" /></span><strong>{fmt(bs.totalAssets)}</strong></div>
          <div className="metric"><span><T k="balance.total_liabilities" /></span><strong>{fmt(bs.totalLiabilities)}</strong></div>
          <div className="metric"><span><T k="balance.net_worth" /></span><strong className={bs.netWorth >= 0 ? "text-success" : "text-danger"}>{fmt(bs.netWorth)}</strong></div>
        </div>
      </section>

      <section className="panel">
        <div className="panel-header">
          <h3><T k="balance.by_asset_class" /></h3>
        </div>
        {bs.byAssetClass.length > 0 && (
          <EstateCompositionChart data={bs.byAssetClass} netWorth={bs.netWorth} />
        )}
        <ul className="compact-list mt-2">
          {bs.byAssetClass.map((ac) => (
            <li key={ac.assetClass}>
              <span>{ac.assetClass.replaceAll("_", " ")}</span>
              <strong>{fmt(ac.totalValue, ac.currency)}</strong>
              <em>{ac.count} {ac.count === 1 ? "item" : "items"}</em>
            </li>
          ))}
        </ul>
      </section>

      {bs.staleValuations.length > 0 && (
        <section className="panel">
          <div className="panel-header">
            <h3><AlertTriangle aria-hidden="true" size={16} /> <T k="balance.stale_valuations" /></h3>
            <StatusBadge status={`${bs.staleValuations.length} stale`} variant="warning" />
          </div>
          <ul className="compact-list">
            {bs.staleValuations.map((sv) => (
              <li key={sv.assetId}>
                <span>{sv.description}</span>
                <strong>{sv.monthsStale} months</strong>
                <em>{formatDate(sv.valuationDate)}</em>
              </li>
            ))}
          </ul>
        </section>
      )}
    </div>
  );
}
