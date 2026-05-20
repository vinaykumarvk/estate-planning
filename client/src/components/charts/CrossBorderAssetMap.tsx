import { useTranslation } from "react-i18next";
import { useChartColors } from "./useChartColors";

interface JurisdictionAssets {
  jurisdiction: string;
  count: number;
  totalValue: number;
  currency: string;
}

interface Props {
  data: JurisdictionAssets[];
}

// Simplified coordinate positions for jurisdictions on the SVG canvas (0-400 x 0-400)
const POSITIONS: Record<string, { x: number; y: number }> = {
  NG: { x: 175, y: 215 },  // Nigeria
  GH: { x: 155, y: 210 },  // Ghana
  ZA: { x: 220, y: 340 },  // South Africa
  KE: { x: 260, y: 235 },  // Kenya
  SN: { x: 120, y: 195 },  // Senegal
  CM: { x: 195, y: 225 },  // Cameroon
  MZ: { x: 255, y: 305 },  // Mozambique
  AO: { x: 195, y: 275 },  // Angola
  EW: { x: 150, y: 80 },   // England & Wales
  PT: { x: 120, y: 110 },  // Portugal
  GB: { x: 150, y: 80 },   // Great Britain (alias for EW)
};

export function CrossBorderAssetMap({ data }: Props) {
  const { t } = useTranslation();
  const colors = useChartColors();

  const fmt = (n: number, ccy: string) => `${ccy} ${n >= 1_000_000 ? `${(n / 1_000_000).toFixed(1)}M` : `${(n / 1_000).toFixed(0)}K`}`;

  return (
    <div aria-label={t("charts.cross_border_map")} role="img">
      <svg viewBox="0 0 400 400" style={{ width: "100%", maxHeight: 380, background: "var(--color-surface-muted)", borderRadius: 8 }}>
        {/* Simplified UK outline */}
        <path d="M140,55 L155,50 L165,60 L160,75 L155,90 L145,95 L135,85 L138,70 Z" fill="var(--color-border)" stroke="var(--color-border-strong)" strokeWidth="1" opacity="0.4" />

        {/* Simplified Africa outline */}
        <path d="M130,160 L180,150 L220,155 L260,160 L285,180 L290,210 L280,240 L270,270 L255,300 L240,330 L220,350 L200,355 L185,345 L175,320 L170,290 L165,260 L155,240 L140,220 L125,200 L120,180 Z" fill="var(--color-border)" stroke="var(--color-border-strong)" strokeWidth="1" opacity="0.4" />

        {/* Connection lines from UK to Africa */}
        <line x1="150" y1="95" x2="180" y2="155" stroke="var(--color-brand)" strokeWidth="1" strokeDasharray="4,4" opacity="0.3" />

        {/* Jurisdiction badges */}
        {data.map((item, index) => {
          const pos = POSITIONS[item.jurisdiction];
          if (!pos) return null;
          return (
            <g key={item.jurisdiction} transform={`translate(${pos.x}, ${pos.y})`}>
              <circle r="22" fill={colors[index % colors.length]} opacity="0.9" />
              <text y="-5" textAnchor="middle" fill="white" fontSize="10" fontWeight="700">{item.jurisdiction}</text>
              <text y="7" textAnchor="middle" fill="white" fontSize="8">{item.count} assets</text>
              <text y="17" textAnchor="middle" fill="white" fontSize="7" opacity="0.85">{fmt(item.totalValue, item.currency)}</text>
            </g>
          );
        })}
      </svg>
    </div>
  );
}
