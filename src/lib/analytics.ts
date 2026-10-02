import type { Bucket, QuestionStats, TestCaseStats } from '../api/analyticsApi';
import type { SubmissionStatus } from '../api/submissionApi';

/* Module 10 helpers: formatting and chart data. Kept out of component files for fast refresh. */

/** 0.425 → "42.5 %"; at most 1 decimal. */
export const formatPercent = (ratio: number | null | undefined) =>
  ratio == null || Number.isNaN(ratio) ? '—' : `${Number((ratio * 100).toFixed(1))} %`;

const pct = (r: number) => Math.round(r * 100);

/** "40–50 %" */
export const bucketLabel = (b: Bucket) => `${pct(b.fromRatio)}–${pct(b.toRatio)} %`;

/** "60–75 pts" for a 150-point contest. */
export const bucketPointsLabel = (b: Bucket, maxScore: number) =>
  `${Number((b.fromRatio * maxScore).toFixed(1))}–${Number((b.toRatio * maxScore).toFixed(1))} pts`;

/** "12–18 min" for a 60-minute contest. */
export const bucketMinutesLabel = (b: Bucket, durationMinutes: number) =>
  `${Math.round(b.fromRatio * durationMinutes)}–${Math.round(b.toRatio * durationMinutes)} min`;

export interface OutcomeShares {
  full: number;
  partial: number;
  zero: number;
  notAttempted: number;
}

/**
 * Shares of participants, summing to 1. The server's `zero` includes candidates who
 * didn't attempt, so "attempted but 0" is zero minus not-attempted (never below 0).
 */
export const outcomeShares = (q: QuestionStats): OutcomeShares => {
  if (q.participants <= 0) return { full: 0, partial: 0, zero: 0, notAttempted: 0 };
  const notAttempted = Math.max(0, q.participants - q.attempted);
  const zero = Math.max(0, q.zero - notAttempted);
  return {
    full: q.fullMarks / q.participants,
    partial: q.partial / q.participants,
    zero: zero / q.participants,
    notAttempted: notAttempted / q.participants,
  };
};

/** The bucket with the most candidates (first one on ties); null when all are empty. */
export const largestBucket = (buckets: Bucket[]): Bucket | null =>
  buckets.reduce<Bucket | null>((best, b) => (b.count > 0 && (!best || b.count > best.count) ? b : best), null);

/** "3 WA · 1 TLE"; empty string when nothing failed. */
export const failureMixText = (t: TestCaseStats) =>
  [
    [t.wrongAnswer, 'WA'],
    [t.timeLimit, 'TLE'],
    [t.memoryLimit, 'MLE'],
    [t.runtimeError, 'RE'],
    [t.compilationError, 'CE'],
  ]
    .filter(([n]) => (n as number) > 0)
    .map(([n, code]) => `${n} ${code}`)
    .join(' · ');

/** Verdict segments as shares of all SUBMITs, Accepted first (the server's order). */
export const verdictSegments = (verdicts: { status: SubmissionStatus; count: number }[]) => {
  const total = verdicts.reduce((s, v) => s + v.count, 0);
  return verdicts.map((v) => ({ ...v, share: total > 0 ? v.count / total : 0 }));
};
