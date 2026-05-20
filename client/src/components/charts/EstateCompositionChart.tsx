import { PieChart, Pie, Cell, ResponsiveContainer, Tooltip, Legend } from "recharts";
import { useTranslation } from "react-i18next";
import { useChartColors } from "./useChartColors";

interface AssetClassSummary {
  assetClass: string;
  count: number;
  totalValue: number;
  currency: string;
}

interface Props {
  data: AssetClassSummary[];
  netWorth?: number;
  currency?: string;
}

export function EstateCompositionChart({ data, netWorth, currency = "GBP" }: Props) {
  const { t } = useTranslation();
  const colors = useChartColors();

  const chartData = data.map((d) => ({
    name: d.assetClass.replaceAll("_", " "),
    value: d.totalValue,
  }));

  const fmt = (n: number) => `${currency} ${n.toLocaleString()}`;

  return (
    <div aria-label={t("charts.estate_composition")} role="img" style={{ width: "100%", height: 300, position: "relative" }}>
      <ResponsiveContainer>
        <PieChart>
          <Pie
            data={chartData}
            cx="50%"
            cy="50%"
            innerRadius="55%"
            outerRadius="80%"
            paddingAngle={2}
            dataKey="value"
          >
            {chartData.map((_entry, index) => (
              <Cell key={index} fill={colors[index % colors.length]} />
            ))}
          </Pie>
          <Tooltip formatter={(value: number) => fmt(value)} />
          <Legend />
        </PieChart>
      </ResponsiveContainer>
      {netWorth !== undefined && (
        <div style={{
          position: "absolute",
          top: "50%",
          left: "50%",
          transform: "translate(-50%, -50%)",
          textAlign: "center",
          pointerEvents: "none",
        }}>
          <div style={{ fontSize: 12, color: "var(--color-text-muted)" }}>{t("charts.net_worth")}</div>
          <div style={{ fontSize: 18, fontWeight: 700, color: "var(--color-text)" }}>{fmt(netWorth)}</div>
        </div>
      )}
    </div>
  );
}
