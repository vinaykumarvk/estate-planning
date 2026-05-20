import { BarChart, Bar, XAxis, YAxis, ResponsiveContainer, Tooltip, Legend, Cell } from "recharts";
import { useTranslation } from "react-i18next";
import { useChartColors } from "./useChartColors";

interface ComparisonResult {
  scenarios: Array<{
    scenarioId: string;
    scenarioName: string;
    householdIht: number;
    secondDeathIht: number;
    totalFamilyIht: number;
  }>;
  bestScenarioId: string;
  maxSavings: number;
}

interface Props {
  comparison: ComparisonResult;
}

export function ScenarioComparisonChart({ comparison }: Props) {
  const { t } = useTranslation();
  const colors = useChartColors();

  const data = comparison.scenarios.map((s) => ({
    name: s.scenarioName,
    householdIht: s.householdIht,
    totalFamilyIht: s.totalFamilyIht,
    isBest: s.scenarioId === comparison.bestScenarioId,
  }));

  return (
    <div aria-label={t("charts.scenario_comparison")} role="img" style={{ width: "100%", height: 300 }}>
      <ResponsiveContainer>
        <BarChart data={data} margin={{ top: 10, right: 10, bottom: 10, left: 10 }}>
          <XAxis dataKey="name" tick={{ fontSize: 11, fill: "var(--color-text-muted)" }} />
          <YAxis tick={{ fontSize: 11, fill: "var(--color-text-muted)" }} tickFormatter={(v) => `£${(v / 1000).toFixed(0)}k`} />
          <Tooltip formatter={(value: number) => `£${value.toLocaleString()}`} />
          <Legend />
          <Bar name={t("charts.household_iht")} dataKey="householdIht" fill={colors[0]} radius={[4, 4, 0, 0]}>
            {data.map((entry, index) => (
              <Cell key={index} fill={entry.isBest ? colors[2] : colors[0]} opacity={entry.isBest ? 1 : 0.7} />
            ))}
          </Bar>
          <Bar name={t("charts.total_family_iht")} dataKey="totalFamilyIht" fill={colors[1]} radius={[4, 4, 0, 0]}>
            {data.map((entry, index) => (
              <Cell key={index} fill={entry.isBest ? colors[3] : colors[1]} opacity={entry.isBest ? 1 : 0.7} />
            ))}
          </Bar>
        </BarChart>
      </ResponsiveContainer>
    </div>
  );
}
