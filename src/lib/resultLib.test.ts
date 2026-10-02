import { describe, expect, it } from 'vitest';
import { formatDuration, formatScore } from './format';
import { getErrorMessage } from './apiError';
import { leaderboardPollInterval, LEADERBOARD_POLL_MS } from '../hooks/useResults';
import { filterEntries, overrideSchema, publishBlocker } from './results';
import type { LeaderboardEntry, LeaderboardResponse, ResultReadiness } from '../api/resultApi';

const readiness = (over: Partial<ResultReadiness> = {}): ResultReadiness => ({
  totalCandidates: 3,
  inProgress: 0,
  judging: 0,
  missing: 0,
  scored: 2,
  needsReview: 0,
  absent: 1,
  contestCompleted: true,
  published: false,
  readyToPublish: true,
  ...over,
});

describe('format helpers', () => {
  it('shows scores with at most 2 decimals and no trailing zeros', () => {
    expect(formatScore(42.5)).toBe('42.5');
    expect(formatScore(42)).toBe('42');
    expect(formatScore(33.333)).toBe('33.33');
    expect(formatScore(null)).toBe('—');
  });

  it('formats time taken', () => {
    expect(formatDuration(3720)).toBe('1h 02m');
    expect(formatDuration(41 * 60 + 5)).toBe('41m');
    expect(formatDuration(35)).toBe('35s');
    expect(formatDuration(undefined)).toBe('–');
  });
});

describe('leaderboard polling', () => {
  const board = (r: Partial<ResultReadiness>, published = false) =>
    ({ published, readiness: readiness(r) }) as LeaderboardResponse;

  it('polls while candidates are writing or being judged', () => {
    expect(leaderboardPollInterval(board({ inProgress: 2 }))).toBe(LEADERBOARD_POLL_MS);
    expect(leaderboardPollInterval(board({ judging: 1 }))).toBe(LEADERBOARD_POLL_MS);
  });

  it('stops once everything has settled or results are published', () => {
    expect(leaderboardPollInterval(board({}))).toBe(false);
    expect(leaderboardPollInterval(board({ inProgress: 2 }, true))).toBe(false);
    expect(leaderboardPollInterval(undefined)).toBe(false);
  });
});

describe('publish readiness', () => {
  it('explains the first blocking reason', () => {
    expect(publishBlocker(readiness())).toBeNull();
    expect(publishBlocker(readiness({ readyToPublish: false, contestCompleted: false }))).toMatch(/still running/);
    expect(publishBlocker(readiness({ readyToPublish: false, judging: 2 }))).toBe('2 candidate(s) still being judged');
  });
});

describe('leaderboard filters', () => {
  const entry = (over: Partial<LeaderboardEntry>): LeaderboardEntry => ({
    resultId: 'r',
    candidateId: 'c',
    candidateName: 'Asha',
    candidateEmail: 'asha@x.dev',
    candidateRollNumber: '22CS041',
    status: 'SCORED',
    reviewReasons: [],
    totalScore: 10,
    autoScore: 10,
    maxScore: 10,
    adjusted: false,
    questionScores: [],
    ...over,
  });
  const rows = [
    entry({ candidateId: 'a' }),
    entry({ candidateId: 'b', candidateName: 'Ravi', candidateRollNumber: '22CS017', status: 'NEEDS_REVIEW', adjusted: true }),
    entry({ candidateId: 'c', candidateName: 'Chitra', candidateRollNumber: null, status: 'ABSENT' }),
  ];

  it('filters by status and adjustment', () => {
    expect(filterEntries(rows, '', 'review').map((e) => e.candidateId)).toEqual(['b']);
    expect(filterEntries(rows, '', 'adjusted').map((e) => e.candidateId)).toEqual(['b']);
    expect(filterEntries(rows, '', 'absent').map((e) => e.candidateId)).toEqual(['c']);
  });

  it('searches name, roll number and email', () => {
    expect(filterEntries(rows, 'cs017', 'all').map((e) => e.candidateId)).toEqual(['b']);
    expect(filterEntries(rows, 'chit', 'all').map((e) => e.candidateId)).toEqual(['c']);
  });
});

describe('override validation', () => {
  const schema = overrideSchema(50);
  it('accepts 0..points with at most 2 decimals and a comment', () => {
    expect(schema.safeParse({ adjustedScore: 12.5, comments: 'ok' }).success).toBe(true);
    expect(schema.safeParse({ adjustedScore: 0, comments: 'ok' }).success).toBe(true);
  });
  it('rejects out of range, extra decimals, empty and missing comments', () => {
    expect(schema.safeParse({ adjustedScore: 51, comments: 'ok' }).success).toBe(false);
    expect(schema.safeParse({ adjustedScore: -1, comments: 'ok' }).success).toBe(false);
    expect(schema.safeParse({ adjustedScore: 1.555, comments: 'ok' }).success).toBe(false);
    expect(schema.safeParse({ adjustedScore: NaN, comments: 'ok' }).success).toBe(false);
    expect(schema.safeParse({ adjustedScore: 10, comments: '   ' }).success).toBe(false);
  });
});

describe('Module 9 error copy', () => {
  const err = (message: string, status = 409) => ({ response: { status, data: { message } } });
  it('shows the server message for RESULTS_NOT_READY (it carries the counts)', () => {
    expect(getErrorMessage(err("RESULTS_NOT_READY: Results aren't ready: 1 candidate(s) still taking the exam"))).toBe(
      "Results aren't ready: 1 candidate(s) still taking the exam",
    );
  });
  it('uses friendly copy for known codes', () => {
    expect(getErrorMessage(err('RESULTS_PUBLISHED_LOCKED: Results are published'))).toMatch(/Unpublish them/);
    expect(getErrorMessage(err('BAD_REQUEST: ADJUSTED_SCORE_OUT_OF_RANGE', 400))).toMatch(/between 0/);
  });
});
