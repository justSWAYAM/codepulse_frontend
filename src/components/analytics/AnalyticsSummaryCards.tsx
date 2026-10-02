import React from 'react';
import { Card } from '../ui';
import { formatDuration, formatScore } from '../../lib/format';
import { formatPercent } from '../../lib/analytics';
import type { ContestAnalytics } from '../../api/analyticsApi';

/** Same look as DashboardHome's StatCard: label, big tabular number, one-line hint. */
const Tile: React.FC<{ label: string; value: React.ReactNode; hint: string }> = ({ label, value, hint }) => (
  <Card className="p-4 sm:p-5">
    <p className="text-[13px] font-medium text-fg-muted">{label}</p>
    <p className="tabular mt-2 font-display text-[24px] font-semibold leading-8 tracking-[-0.03em] text-fg sm:text-[28px] sm:leading-9">
      {value}
    </p>
    <p className="mt-1 text-[12px] text-fg-subtle">{hint}</p>
  </Card>
);

export const AnalyticsSummaryCards: React.FC<{ analytics: ContestAnalytics }> = ({ analytics }) => {
  const { scores, coverage, durationMinutes } = analytics;
  const max = scores.maxScore;
  return (
    <div className="grid grid-cols-2 gap-3 lg:grid-cols-5">
      <Tile
        label="Candidates"
        value={
          <>
            {scores.participants}
            <span className="text-[15px] font-normal text-fg-subtle"> / {coverage.totalCandidates}</span>
          </>
        }
        hint={`${coverage.absent} absent · ${coverage.inProgress} in progress`}
      />
      <Tile
        label="Mean score"
        value={
          <>
            {formatScore(scores.mean)}
            <span className="text-[15px] font-normal text-fg-subtle"> / {formatScore(max)}</span>
          </>
        }
        hint={scores.mean != null && max > 0 ? formatPercent(scores.mean / max) : 'No scores yet'}
      />
      <Tile label="Median score" value={formatScore(scores.median)} hint={`σ ${formatScore(scores.stdDev)}`} />
      <Tile label="Median time" value={formatDuration(scores.medianTimeSeconds)} hint={`of ${durationMinutes} min`} />
      <Tile
        label="Range"
        value={scores.min != null ? `${formatScore(scores.min)}–${formatScore(scores.max)}` : '—'}
        hint="lowest – highest"
      />
    </div>
  );
};
