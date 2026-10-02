import React from 'react';
import { Bar, BarChart, CartesianGrid, ResponsiveContainer, Tooltip, XAxis, YAxis } from 'recharts';
import { ChartCard } from './ChartCard';
import { ChartTooltip } from './ChartTooltip';
import { bucketLabel, bucketMinutesLabel, bucketPointsLabel, largestBucket } from '../../lib/analytics';
import type { Bucket } from '../../api/analyticsApi';

const AXIS = { fill: 'var(--color-fg-subtle)', fontSize: 11 };
const candidates = (n: number) => `${n} candidate${n === 1 ? '' : 's'}`;

const BucketBars: React.FC<{ rows: { label: string; detail: string; count: number }[] }> = ({ rows }) => (
  <ResponsiveContainer width="100%" height="100%">
    <BarChart data={rows} margin={{ top: 4, right: 4, bottom: 0, left: -20 }}>
      <CartesianGrid vertical={false} stroke="var(--color-line)" />
      <XAxis dataKey="label" tick={AXIS} tickLine={false} axisLine={{ stroke: 'var(--color-line)' }} interval={0} angle={-30} textAnchor="end" height={44} />
      <YAxis allowDecimals={false} tick={AXIS} tickLine={false} axisLine={false} />
      <Tooltip cursor={{ fill: 'var(--color-surface-2)' }} content={<ChartTooltip subtitleKey="detail" formatValue={candidates} />} />
      <Bar dataKey="count" name="Candidates" fill="var(--color-primary)" radius={[4, 4, 0, 0]} isAnimationActive={false} />
    </BarChart>
  </ResponsiveContainer>
);

/** How total scores spread across 10 bands of the max score. */
export const ScoreDistributionChart: React.FC<{ buckets: Bucket[]; maxScore: number }> = ({ buckets, maxScore }) => {
  const rows = buckets.map((b) => ({ label: bucketLabel(b), detail: bucketPointsLabel(b, maxScore), count: b.count }));
  const top = largestBucket(buckets);
  return (
    <ChartCard
      title="Score distribution"
      description="Candidates per band of the maximum score"
      summary={
        top
          ? `Score distribution: the largest group, ${candidates(top.count)}, scored ${bucketLabel(top)}.`
          : 'Score distribution: no scores yet.'
      }
      table={{ columns: ['Score band', 'Points', 'Candidates'], rows: rows.map((r) => [r.label, r.detail, r.count]) }}
    >
      <BucketBars rows={rows} />
    </ChartCard>
  );
};

/** Time to the last counted submission, as a share of the contest duration. */
export const TimeAnalysisChart: React.FC<{ buckets: Bucket[]; durationMinutes: number; noTimeCount: number }> = ({
  buckets,
  durationMinutes,
  noTimeCount,
}) => {
  const rows = buckets.map((b) => ({ label: bucketLabel(b), detail: bucketMinutesLabel(b, durationMinutes), count: b.count }));
  const top = largestBucket(buckets);
  return (
    <ChartCard
      title="Time taken"
      description="From each candidate’s start to their last scoring submission"
      summary={
        top
          ? `Time taken: most candidates, ${candidates(top.count)}, finished in ${bucketMinutesLabel(top, durationMinutes)}.`
          : 'Time taken: no data yet.'
      }
      table={{ columns: ['Share of duration', 'Minutes', 'Candidates'], rows: rows.map((r) => [r.label, r.detail, r.count]) }}
      footnote={noTimeCount > 0 ? `${candidates(noTimeCount)} had no scored submission and aren’t shown.` : undefined}
    >
      <BucketBars rows={rows} />
    </ChartCard>
  );
};
