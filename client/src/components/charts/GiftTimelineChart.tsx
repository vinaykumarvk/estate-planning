import { BarChart, Bar, XAxis, YAxis, ResponsiveContainer, Tooltip, Cell, ReferenceLine } from "recharts";
import { useTranslation } from "react-i18next";
import { useChartColors } from "./useChartColors";

interface TimelineGift {
  id: string;
  description: string;
  value: number;
  currency: string;
  yearsElapsed: number;
  taperReliefPercent: number;
  taperBand: string;
}

interface TimelineResult {
  gifts: TimelineGift[];
  cumulativeTotal: number;
  nrbRemaining: number;
}

interface Props {
  timeline: TimelineResult;
}

function getTaperColor(yearsElapsed: number, colors: string[]): string {
  if (yearsElapsed >= 7) return colors[2]; // green - fallen off
  if (yearsElapsed >= 5) return colors[4]; // amber
  if (yearsElapsed >= 3) return colors[5]; // orange
  return colors[6]; // red - recent
}

export function GiftTimelineChart({ timeline }: Props) {
  const { t } = useTranslation();
  const colors = useChartColors();

  const data = timeline.gifts.map((g) => ({
    name: g.description.slice(0, 20),
    value: g.value,
    years: g.yearsElapsed,
    relief: g.taperReliefPercent,
  }));

  return (
    <div aria-label={t("charts.gift_timeline")} role="img" style={{ width: "100%", height: Math.max(200, data.length * 50) }}>
      <ResponsiveContainer>
        <BarChart data={data} layout="vertical" margin={{ top: 10, right: 20, bottom: 10, left: 80 }}>
          <XAxis type="number" tick={{ fontSize: 11, fill: "var(--color-text-muted)" }} tickFormatter={(v) => `£${(v / 1000).toFixed(0)}k`} />
          <YAxis type="category" dataKey="name" tick={{ fontSize: 11, fill: "var(--color-text-muted)" }} width={75} />
          <Tooltip
            formatter={(value: number) => `£${value.toLocaleString()}`}
            labelFormatter={(label) => {
              const item = data.find((d) => d.name === label);
              return item ? `${label} (${item.years}yr, ${item.relief}% relief)` : label;
            }}
          />
          <ReferenceLine x={0} stroke="var(--color-border)" />
          <Bar dataKey="value" radius={[0, 4, 4, 0]}>
            {data.map((entry, index) => (
              <Cell key={index} fill={getTaperColor(entry.years, colors)} />
            ))}
          </Bar>
        </BarChart>
      </ResponsiveContainer>
    </div>
  );
}
