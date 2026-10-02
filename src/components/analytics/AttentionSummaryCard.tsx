import React from 'react';
import { Link } from 'react-router-dom';
import { ArrowRight } from 'lucide-react';
import { Card, Tooltip } from '../ui';
import { REVIEW_REASON_TEXT } from '../../lib/results';
import { cn } from '../../lib/cn';
import type { ContestAnalytics } from '../../api/analyticsApi';
import type { ReviewReason } from '../../api/resultApi';

interface Row {
  label: string;
  count: number;
  /** Results-tab filter that lists these candidates; counts only here, names live on the leaderboard. */
  filter?: 'review' | 'adjusted' | 'absent';
  tooltip?: string;
}

/** Pass 1 of the flagged-candidate summary; Module 13 adds proctoring flags. */
export const AttentionSummaryCard: React.FC<{ contestId: string; attention: ContestAnalytics['attention'] }> = ({
  contestId,
  attention,
}) => {
  const reasons = Object.entries(attention.needsReviewByReason ?? {})
    .filter(([, n]) => (n ?? 0) > 0)
    .map(([r, n]) => `${n}× ${REVIEW_REASON_TEXT[r as ReviewReason] ?? r}`)
    .join(' ');

  const rows: Row[] = [
    { label: 'Need review', count: attention.needsReview, filter: 'review', tooltip: reasons || undefined },
    { label: 'Adjusted by an evaluator', count: attention.adjusted, filter: 'adjusted' },
    { label: 'Time ran out', count: attention.autoSubmitted },
    { label: 'Absent', count: attention.absent, filter: 'absent' },
    { label: 'Finished with zero', count: attention.zeroScores },
  ];

  return (
    <Card className="p-5">
      <h3 className="font-display text-[14px] font-semibold tracking-[-0.015em] text-fg">Needs attention</h3>
      <p className="mt-0.5 text-[12.5px] text-fg-muted">Counts only · open a row to see who on the Results tab</p>
      <ul className="mt-3 divide-y divide-line">
        {rows.map((row) => {
          const content = (
            <>
              <span className={cn('flex-1', row.count === 0 ? 'text-fg-subtle' : 'text-fg')}>{row.label}</span>
              <span className={cn('tabular font-semibold', row.count === 0 ? 'text-fg-subtle' : 'text-fg')}>{row.count}</span>
              {row.filter && row.count > 0 && <ArrowRight className="size-3.5 text-fg-subtle" aria-hidden />}
            </>
          );
          const item =
            row.filter && row.count > 0 ? (
              <Link
                to={`/dashboard/contests/${contestId}?tab=results&rf=${row.filter}`}
                className="flex items-center gap-2 rounded-md py-2.5 text-[13px] hover-fine:bg-surface-2/60"
              >
                {content}
              </Link>
            ) : (
              <div className="flex items-center gap-2 py-2.5 text-[13px]">{content}</div>
            );
          return <li key={row.label}>{row.tooltip ? <Tooltip content={row.tooltip}>{item}</Tooltip> : item}</li>;
        })}
      </ul>
    </Card>
  );
};
