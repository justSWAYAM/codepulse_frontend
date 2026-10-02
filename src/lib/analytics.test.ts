import { describe, expect, it } from 'vitest';
import {
  bucketLabel,
  bucketMinutesLabel,
  bucketPointsLabel,
  failureMixText,
  formatPercent,
  largestBucket,
  outcomeShares,
  verdictSegments,
} from './analytics';
import { analyticsPollInterval, ANALYTICS_POLL_MS } from '../hooks/useAnalytics';
import type { AnalyticsCoverage, Bucket, QuestionStats, TestCaseStats } from '../api/analyticsApi';

const bucket = (index: number, count = 0): Bucket => ({ index, fromRatio: (index - 1) / 10, toRatio: index / 10, count });

describe('formatting', () => {
  it('formats percentages with at most 1 decimal', () => {
    expect(formatPercent(0.425)).toBe('42.5 %');
    expect(formatPercent(1)).toBe('100 %');
    expect(formatPercent(0)).toBe('0 %');
    expect(formatPercent(null)).toBe('—');
  });

  it('labels buckets at both ends', () => {
    expect(bucketLabel(bucket(1))).toBe('0–10 %');
    expect(bucketLabel(bucket(10))).toBe('90–100 %');
    expect(bucketPointsLabel(bucket(5), 150)).toBe('60–75 pts');
    expect(bucketMinutesLabel(bucket(2), 60)).toBe('6–12 min');
  });

  it('finds the largest bucket, first on ties, null when empty', () => {
    expect(largestBucket([bucket(1), bucket(2)])).toBeNull();
    expect(largestBucket([bucket(1, 2), bucket(2, 5), bucket(3, 5)])?.index).toBe(2);
  });
});

describe('outcomeShares', () => {
  const q = (over: Partial<QuestionStats>) => ({ participants: 5, attempted: 3, fullMarks: 2, partial: 1, zero: 2, ...over }) as QuestionStats;

  it('splits zero into attempted-but-zero and not attempted, summing to 1', () => {
    const s = outcomeShares(q({}));
    expect(s).toEqual({ full: 0.4, partial: 0.2, zero: 0, notAttempted: 0.4 });
    expect(s.full + s.partial + s.zero + s.notAttempted).toBeCloseTo(1);
  });

  it('never goes negative and handles no participants', () => {
    expect(outcomeShares(q({ zero: 0 })).zero).toBe(0);
    expect(outcomeShares(q({ participants: 0 }))).toEqual({ full: 0, partial: 0, zero: 0, notAttempted: 0 });
  });
});

describe('test cases and verdicts', () => {
  it('summarises failures', () => {
    const t = { wrongAnswer: 3, timeLimit: 1, memoryLimit: 0, runtimeError: 0, compilationError: 0 } as TestCaseStats;
    expect(failureMixText(t)).toBe('3 WA · 1 TLE');
    expect(failureMixText({ ...t, wrongAnswer: 0, timeLimit: 0 })).toBe('');
  });

  it('turns verdict counts into shares', () => {
    expect(verdictSegments([{ status: 'ACCEPTED', count: 3 }, { status: 'WRONG_ANSWER', count: 1 }]).map((v) => v.share)).toEqual([0.75, 0.25]);
  });
});

describe('analytics polling', () => {
  it('polls only while provisional', () => {
    expect(analyticsPollInterval({ provisional: true } as AnalyticsCoverage)).toBe(ANALYTICS_POLL_MS);
    expect(analyticsPollInterval({ provisional: false } as AnalyticsCoverage)).toBe(false);
    expect(analyticsPollInterval(undefined)).toBe(false);
  });
});
