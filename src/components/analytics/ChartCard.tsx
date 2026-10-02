import React, { useId, useState } from 'react';
import { Table2 } from 'lucide-react';
import { Card } from '../ui';

export interface ChartTable {
  columns: string[];
  rows: (string | number)[][];
}

interface ChartCardProps {
  title: string;
  description?: string;
  /** aria-label of the chart: what it shows in one sentence. */
  summary: string;
  legend?: { label: string; color: string }[];
  table: ChartTable;
  footnote?: React.ReactNode;
  children: React.ReactNode;
}

const DataTableView: React.FC<{ table: ChartTable; caption: string; className?: string }> = ({ table, caption, className }) => (
  <table className={className}>
    <caption className="sr-only">{caption}</caption>
    <thead>
      <tr>
        {table.columns.map((c) => (
          <th key={c} scope="col" className="px-3 py-1.5 text-left text-[12px] font-medium text-fg-subtle">
            {c}
          </th>
        ))}
      </tr>
    </thead>
    <tbody>
      {table.rows.map((row, i) => (
        <tr key={i} className="border-t border-line">
          {row.map((cell, j) => (
            <td key={j} className="tabular px-3 py-1.5 text-[13px] text-fg-muted">
              {cell}
            </td>
          ))}
        </tr>
      ))}
    </tbody>
  </table>
);

/**
 * Frame for every chart. An SVG chart says nothing to a screen reader, so each one has an
 * aria-label summary, a visually hidden data table, and a "Show as table" toggle for everyone.
 */
export const ChartCard: React.FC<ChartCardProps> = ({ title, description, summary, legend, table, footnote, children }) => {
  const [asTable, setAsTable] = useState(false);
  const headingId = useId();

  return (
    <Card className="flex flex-col p-5" aria-labelledby={headingId}>
      <div className="flex items-start justify-between gap-3">
        <div className="min-w-0">
          <h3 id={headingId} className="font-display text-[14px] font-semibold tracking-[-0.015em] text-fg">
            {title}
          </h3>
          {description && <p className="mt-0.5 text-[12.5px] text-fg-muted">{description}</p>}
        </div>
        <button
          type="button"
          onClick={() => setAsTable((v) => !v)}
          aria-pressed={asTable}
          className="inline-flex shrink-0 items-center gap-1.5 rounded-lg px-2 py-1 text-[12px] font-medium text-fg-muted hover-fine:bg-surface-2 hover-fine:text-fg"
        >
          <Table2 className="size-3.5" aria-hidden />
          {asTable ? 'Show as chart' : 'Show as table'}
        </button>
      </div>

      {legend && legend.length > 0 && !asTable && (
        <ul className="mt-3 flex flex-wrap gap-x-4 gap-y-1 text-[12px] text-fg-muted" aria-label="Legend">
          {legend.map((l) => (
            <li key={l.label} className="inline-flex items-center gap-1.5">
              <span aria-hidden className="size-2.5 rounded-sm" style={{ background: l.color }} />
              {l.label}
            </li>
          ))}
        </ul>
      )}

      <div className="mt-3 min-h-0 flex-1">
        {asTable ? (
          <div className="overflow-x-auto">
            <DataTableView table={table} caption={title} className="w-full" />
          </div>
        ) : (
          <>
            <div role="img" aria-label={summary} className="h-60">
              {children}
            </div>
            <DataTableView table={table} caption={title} className="sr-only" />
          </>
        )}
      </div>

      {footnote && <p className="mt-2 text-[12px] text-fg-subtle">{footnote}</p>}
    </Card>
  );
};
