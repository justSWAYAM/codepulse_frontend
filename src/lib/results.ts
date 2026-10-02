import { z } from 'zod';
import type { LeaderboardEntry, ResultReadiness, ReviewReason } from '../api/resultApi';

/* Module 9 helpers shared by the result components (kept out of component files for fast refresh). */

export const REVIEW_REASON_TEXT: Record<ReviewReason, string> = {
  UNRESOLVED_SYSTEM_ERROR: 'A submission hit a judge error. Rejudge it.',
  OVERRIDE_OUTDATED: 'An adjusted score was made on a submission that no longer counts.',
};

export interface ChecklistRow {
  done: boolean;
  label: string;
  pending: string;
  /** Warns but doesn't block publishing (acknowledged in the dialog). */
  advisory?: boolean;
}

export const readinessRows = (r: ResultReadiness): ChecklistRow[] => [
  {
    done: r.contestCompleted,
    label: 'Contest finished',
    pending: 'The contest is still running. Results can be published after it ends.',
  },
  { done: r.inProgress === 0, label: 'No exams in progress', pending: `${r.inProgress} candidate(s) still taking the exam` },
  { done: r.judging === 0, label: 'Judging finished', pending: `${r.judging} candidate(s) still being judged` },
  { done: r.missing === 0, label: 'Every candidate has a result', pending: `${r.missing} result(s) missing. Press Recompute.` },
  { done: r.needsReview === 0, label: 'Flagged results reviewed', pending: `${r.needsReview} result(s) need review`, advisory: true },
];

/** First blocking reason, for the disabled Publish button's tooltip. */
export const publishBlocker = (r: ResultReadiness): string | null =>
  r.readyToPublish ? null : (readinessRows(r).find((row) => !row.done && !row.advisory)?.pending ?? null);

export type ResultFilter = 'all' | 'review' | 'adjusted' | 'absent';

export const RESULT_FILTERS: { value: ResultFilter; label: string }[] = [
  { value: 'all', label: 'All' },
  { value: 'review', label: 'Needs review' },
  { value: 'adjusted', label: 'Adjusted' },
  { value: 'absent', label: 'Absent' },
];

export const filterEntries = (entries: LeaderboardEntry[], query: string, filter: ResultFilter) => {
  const q = query.trim().toLowerCase();
  return entries.filter((e) => {
    if (filter === 'review' && e.status !== 'NEEDS_REVIEW') return false;
    if (filter === 'adjusted' && !e.adjusted) return false;
    if (filter === 'absent' && e.status !== 'ABSENT') return false;
    if (!q) return true;
    return [e.candidateName, e.candidateEmail, e.candidateRollNumber].some((v) => v?.toLowerCase().includes(q));
  });
};

const twoDecimals = (n: number) => Math.abs(Math.round(n * 100) - n * 100) < 1e-6;

/** Built per question: the upper bound is that question's points. Empty is an error, never 0. */
export const overrideSchema = (maxPoints: number) =>
  z.object({
    adjustedScore: z
      .number({ error: 'Enter a score.' })
      .refine((n) => !Number.isNaN(n), 'Enter a score.')
      .refine((n) => n >= 0, 'The score can’t be negative.')
      .refine((n) => n <= maxPoints, `The score can’t be more than ${maxPoints}.`)
      .refine(twoDecimals, 'Use at most 2 decimals.'),
    comments: z.string().trim().min(1, 'Say why you’re adjusting this score.').max(2000, 'Keep it under 2000 characters.'),
  });

