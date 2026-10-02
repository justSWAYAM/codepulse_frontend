import React from 'react';

interface TooltipEntry {
  name?: unknown;
  value?: unknown;
  color?: string;
  payload?: Record<string, unknown>;
}

interface ChartTooltipProps {
  /** Injected by Recharts. */
  active?: boolean;
  payload?: ReadonlyArray<TooltipEntry>;
  label?: unknown;
  /** Row field shown as the heading (defaults to the axis label). */
  titleKey?: string;
  /** Row field shown under the heading, e.g. the bucket in points or minutes. */
  subtitleKey?: string;
  formatValue?: (value: number) => string;
}

/** App-styled tooltip (like the Tooltip primitive), never Recharts' default white box. */
export const ChartTooltip: React.FC<ChartTooltipProps> = ({ active, payload, label, titleKey, subtitleKey, formatValue }) => {
  if (!active || !payload || payload.length === 0) return null;
  const row = payload[0].payload ?? {};
  const title = titleKey ? row[titleKey] : label;
  const subtitle = subtitleKey ? row[subtitleKey] : null;

  return (
    <div className="rounded-lg bg-fg px-2.5 py-1.5 text-[12px] text-canvas shadow-pop">
      <p className="font-medium">{String(title ?? '')}</p>
      {subtitle != null && <p className="opacity-75">{String(subtitle)}</p>}
      <ul className="mt-0.5 space-y-0.5">
        {payload.map((p, i) => (
          <li key={i} className="tabular flex items-center gap-1.5">
            {payload.length > 1 && <span aria-hidden className="size-2 rounded-sm" style={{ background: p.color }} />}
            {payload.length > 1 && <span className="opacity-75">{String(p.name)}:</span>}
            <span>{formatValue ? formatValue(Number(p.value)) : String(p.value)}</span>
          </li>
        ))}
      </ul>
    </div>
  );
};
