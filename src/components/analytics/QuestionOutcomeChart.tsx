import React from 'react';
import { Bar, BarChart, CartesianGrid, ResponsiveContainer, Tooltip, XAxis, YAxis } from 'recharts';
import { ChartCard } from './ChartCard';
import { ChartTooltip } from './ChartTooltip';
import { formatPercent, outcomeShares } from '../../lib/analytics';
import type { QuestionStats } from '../../api/analyticsApi';

const AXIS = { fill: 'var(--color-fg-subtle)', fontSize: 11 };

/** Status colours keep their meaning: green full, amber partial, red zero, neutral not attempted. */
const SEGMENTS = [
  { key: 'full', label: 'Full marks', color: 'var(--color-success)' },
  { key: 'partial', label: 'Partial', color: 'var(--color-warning)' },
  { key: 'zero', label: 'Zero', color: 'var(--color-danger)' },
  { key: 'notAttempted', label: 'Not attempted', color: 'var(--color-surface-3)' },
] as const;

/** The roadmap's QuestionPassRateChart: outcome shares per question, 100 % stacked. */
export const QuestionOutcomeChart: React.FC<{ questions: QuestionStats[]; onOpen: (questionId: string) => void }> = ({
  questions,
  onOpen,
}) => {
  const rows = questions.map((q, i) => ({ questionId: q.questionId, label: `Q${i + 1}`, title: q.title, ...outcomeShares(q) }));
  const hardest = [...rows].sort((a, b) => a.full - b.full)[0];

  return (
    <ChartCard
      title="Question outcomes"
      description="Share of candidates per outcome · click a bar for details"
      summary={
        hardest
          ? `Question outcomes: ${hardest.label}, ${hardest.title}, had the fewest full marks (${formatPercent(hardest.full)}).`
          : 'Question outcomes: no questions.'
      }
      legend={SEGMENTS.map((s) => ({ label: s.label, color: s.color }))}
      table={{
        columns: ['Question', ...SEGMENTS.map((s) => s.label)],
        rows: rows.map((r) => [`${r.label} ${r.title}`, ...SEGMENTS.map((s) => formatPercent(r[s.key]))]),
      }}
    >
      <ResponsiveContainer width="100%" height="100%">
        <BarChart data={rows} layout="vertical" margin={{ top: 4, right: 8, bottom: 0, left: -24 }}>
          <CartesianGrid horizontal={false} stroke="var(--color-line)" />
          <XAxis type="number" domain={[0, 1]} tickFormatter={(v: number) => `${Math.round(v * 100)}%`} tick={AXIS} tickLine={false} axisLine={false} />
          <YAxis type="category" dataKey="label" tick={AXIS} tickLine={false} axisLine={false} width={48} />
          <Tooltip cursor={{ fill: 'var(--color-surface-2)' }} content={<ChartTooltip titleKey="title" formatValue={formatPercent} />} />
          {SEGMENTS.map((s) => (
            <Bar
              key={s.key}
              dataKey={s.key}
              name={s.label}
              stackId="outcome"
              fill={s.color}
              isAnimationActive={false}
              cursor="pointer"
              onClick={(entry) => {
                const id = (entry as unknown as { payload?: { questionId?: string } }).payload?.questionId;
                if (id) onOpen(id);
              }}
            />
          ))}
        </BarChart>
      </ResponsiveContainer>
    </ChartCard>
  );
};
