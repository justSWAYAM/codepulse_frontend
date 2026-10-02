import { useMutation, useQueries, useQuery, useQueryClient } from '@tanstack/react-query';
import { useEffect, useRef, useState } from 'react';
import {
  submissionApi,
  type CodePayload,
  type ContestSubmissionFilters,
  type SubmissionCandidateView,
  type SubmissionSummary,
  type SubmissionType,
} from '../api/submissionApi';
import type { PagedData } from '../api/contestApi';
import { isFinal } from '../lib/verdicts';

export const submissionKeys = {
  detail: (id: string) => ['submission', id] as const,
  evaluatorDetail: (id: string) => ['submission', 'evaluator', id] as const,
  mine: (questionId: string) => ['mySubmissions', questionId] as const,
  // Under mine(questionId), so invalidating mine() refreshes the counts too
  count: (questionId: string, type: SubmissionType) => ['mySubmissions', questionId, 'count', type] as const,
  contest: (contestId: string, filters: ContestSubmissionFilters) => ['contestSubmissions', contestId, filters] as const,
  contestAll: (contestId: string) => ['contestSubmissions', contestId] as const,
};

/** Polling cadence while the judge works, and when to stop (there is no server-side recovery job). */
export const POLL_INTERVAL_MS = 1500;
export const POLL_TIMEOUT_MS = 90_000;

// Errors from run/submit are shown inline next to the editor, not as toasts
const inlineError = { onError: () => {} };

// ── Candidate ──

export interface RunResult {
  detail: SubmissionCandidateView;
}

/** Run is synchronous on the server and returns each sample's result directly. */
export const useRunCode = (questionId: string) => {
  const qc = useQueryClient();
  return useMutation({
    ...inlineError,
    mutationKey: ['run', questionId],
    mutationFn: async (payload: CodePayload): Promise<RunResult> => ({ detail: await submissionApi.run(payload) }),
    onSuccess: () => qc.invalidateQueries({ queryKey: submissionKeys.mine(questionId) }),
  });
};

export const useSubmitCode = (questionId: string) => {
  const qc = useQueryClient();
  return useMutation({
    ...inlineError,
    mutationKey: ['submit', questionId],
    mutationFn: (payload: CodePayload) => submissionApi.submit(payload),
    onSuccess: () => qc.invalidateQueries({ queryKey: submissionKeys.mine(questionId) }),
  });
};

/**
 * Nothing more will change: a final verdict, or no verdict at all because the
 * session ended and results stay hidden until they are published.
 */
const settled = (detail: SubmissionCandidateView | undefined) =>
  !!detail && (detail.status == null || isFinal(detail.status));

/** Candidate view of one submission; polls while PENDING, gives up after POLL_TIMEOUT_MS. */
export const useSubmissionDetail = (submissionId: string | null, questionId?: string) => {
  const qc = useQueryClient();
  const startedAt = useRef<{ id: string | null; at: number }>({ id: null, at: 0 });
  if (startedAt.current.id !== submissionId) startedAt.current = { id: submissionId, at: Date.now() };
  // Polling stops silently at the timeout; re-render then so the UI can say so
  const [, setTick] = useState(0);
  const pollStart = startedAt.current.at;
  useEffect(() => {
    if (!submissionId) return;
    const t = setTimeout(() => setTick((n) => n + 1), POLL_TIMEOUT_MS - (Date.now() - pollStart) + 50);
    return () => clearTimeout(t);
  }, [submissionId, pollStart]);

  const query = useQuery({
    queryKey: submissionKeys.detail(submissionId ?? ''),
    queryFn: async () => {
      const detail = await submissionApi.getForCandidate(submissionId!);
      if (settled(detail) && questionId) {
        qc.invalidateQueries({ queryKey: submissionKeys.mine(questionId) });
      }
      return detail;
    },
    enabled: !!submissionId,
    staleTime: (q) => (settled(q.state.data) ? Infinity : 0),
    refetchInterval: (q) => {
      if (settled(q.state.data)) return false;
      if (Date.now() - startedAt.current.at > POLL_TIMEOUT_MS) return false;
      return POLL_INTERVAL_MS;
    },
    refetchIntervalInBackground: true,
  });

  const timedOut =
    !!submissionId &&
    !!query.data &&
    !settled(query.data) &&
    Date.now() - startedAt.current.at > POLL_TIMEOUT_MS;

  return {
    ...query,
    timedOut,
    /** Restart polling after a timeout. */
    retryPolling: () => {
      startedAt.current = { id: submissionId, at: Date.now() };
      setTick((n) => n + 1);
      query.refetch();
    },
  };
};

const hasPending = (page: PagedData<SubmissionSummary> | undefined) =>
  !!page?.content.some((s) => s.status === 'PENDING');

/**
 * History keeps polling on its own while a SUBMIT is judging. The detail poll only
 * lives while the results tab is on screen; without this, switching tabs or reloading
 * left Submit disabled behind a PENDING row that never refreshed.
 */
const historyQuery = (questionId: string, enabled: boolean) => ({
  queryKey: submissionKeys.mine(questionId),
  queryFn: () => submissionApi.myHistory(questionId, 0, 50),
  enabled,
  staleTime: 15_000,
  refetchInterval: (q: { state: { data?: PagedData<SubmissionSummary> } }) =>
    hasPending(q.state.data) ? 2000 : false,
});

export const useMySubmissions = (questionId: string | undefined, enabled = true) =>
  useQuery(historyQuery(questionId ?? '', !!questionId && enabled));

/**
 * Runs and Submits used on a question. Counted server-side (totalElements of a
 * type-filtered page), because a 50-row history page can't count up to the 100-run cap.
 */
export const useSubmissionCounts = (questionId: string) => {
  const [runs, submits] = useQueries({
    queries: (['RUN', 'SUBMIT'] as const).map((type) => ({
      queryKey: submissionKeys.count(questionId, type),
      queryFn: () => submissionApi.myHistory(questionId, 0, 1, type),
      staleTime: 15_000,
      select: (page: PagedData<SubmissionSummary>) => page.totalElements,
    })),
  });
  return { runsUsed: runs.data ?? 0, submitsUsed: submits.data ?? 0 };
};

export type QuestionProgress = 'accepted' | 'attempted' | 'pending';

/** Per-question progress for the navigator, derived from each question's SUBMIT history. */
export const useQuestionProgress = (questionIds: string[], enabled = true) => {
  const results = useQueries({
    queries: questionIds.map((id) => historyQuery(id, enabled)),
  });

  const progress: Record<string, QuestionProgress | undefined> = {};
  questionIds.forEach((id, i) => {
    const submits = results[i]?.data?.content.filter((s) => s.type === 'SUBMIT') ?? [];
    if (submits.some((s) => s.status === 'ACCEPTED')) progress[id] = 'accepted';
    else if (submits.some((s) => s.status === 'PENDING')) progress[id] = 'pending';
    else if (submits.length > 0) progress[id] = 'attempted';
  });
  return progress;
};

// ── Evaluator / admin ──

export const useContestSubmissions = (contestId: string, filters: ContestSubmissionFilters, enabled = true) =>
  useQuery({
    queryKey: submissionKeys.contest(contestId, filters),
    queryFn: () => submissionApi.contestSubmissions(contestId, filters),
    enabled: !!contestId && enabled,
    placeholderData: (prev) => prev,
    staleTime: 10_000,
    // Keep the table fresh while anything on the current page is still being judged
    refetchInterval: (q) => (q.state.data?.content.some((r) => r.status === 'PENDING') ? 3000 : false),
  });

export const useEvaluatorSubmission = (submissionId: string | null) =>
  useQuery({
    queryKey: submissionKeys.evaluatorDetail(submissionId ?? ''),
    queryFn: () => submissionApi.getForEvaluator(submissionId!),
    enabled: !!submissionId,
    refetchInterval: (q) => (q.state.data && !isFinal(q.state.data.status) ? 2000 : false),
  });

export const useRejudge = (contestId: string) => {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (submissionId: string) => submissionApi.rejudge(submissionId),
    onSuccess: (_d, submissionId) => {
      qc.invalidateQueries({ queryKey: submissionKeys.contestAll(contestId) });
      qc.invalidateQueries({ queryKey: submissionKeys.evaluatorDetail(submissionId) });
    },
  });
};
