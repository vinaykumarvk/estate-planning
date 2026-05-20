import { BarChart, Bar, XAxis, YAxis, ResponsiveContainer, Tooltip, Cell, ReferenceLine } from "recharts";
import { useTranslation } from "react-i18next";
import { useChartColors } from "./useChartColors";

interface IhtCalcResult {
  netEstate: number;
  nrbUsed: number;
  rnrb: number;
  taxableEstate: number;
  ihtDue: number;
  exemptionsApplied: Record<string, number>;
  taperRelief: number;
}

interface Props {
  calculation: IhtCalcResult;
}

export function IhtWaterfallChart({ calculation }: Props) {
  const { t } = useTranslation();
  const colors = useChartColors();

  const totalExemptions = Object.values(calculation.exemptionsApplied).reduce((a, b) => a + b, 0);

  const data = [
    { name: t("charts.gross_estate"), value: calculation.netEstate, type: "total" },
    { name: t("charts.exemptions"), value: -totalExemptions, type: "deduction" },
    { name: t("charts.nrb"), value: -calculation.nrbUsed, type: "deduction" },
    { name: t("charts.rnrb"), value: -calculation.rnrb, type: "deduction" },
    { name: t("charts.taxable"), value: calculation.taxableEstate, type: "subtotal" },
    { name: t("charts.iht_due"), value: calculation.ihtDue, type: "result" },
  ];

  const fmt = (n: number) => `£${Math.abs(n).toLocaleString()}`;

  return (
    <div aria-label={t("charts.iht_waterfall")} role="img" style={{ width: "100%", height: 300 }}>
      <ResponsiveContainer>
        <BarChart data={data} margin={{ top: 10, right: 10, bottom: 10, left: 10 }}>
          <XAxis dataKey="name" tick={{ fontSize: 11, fill: "var(--color-text-muted)" }} />
          <YAxis tick={{ fontSize: 11, fill: "var(--color-text-muted)" }} tickFormatter={(v) => `£${(v / 1000).toFixed(0)}k`} />
          <Tooltip formatter={(value: number) => fmt(value)} />
          <ReferenceLine y={0} stroke="var(--color-border)" />
          <Bar dataKey="value" radius={[4, 4, 0, 0]}>
            {data.map((entry, index) => (
              <Cell
                key={index}
                fill={
                  entry.type === "total" ? colors[0] :
                  entry.type === "deduction" ? colors[2] :
                  entry.type === "subtotal" ? colors[4] :
                  colors[6]
                }
              />
            ))}
          </Bar>
        </BarChart>
      </ResponsiveContainer>
    </div>
  );
}
