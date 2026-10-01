import { useMutation, useQueries, useQuery, useQueryClient } from '@tanstack/react-query';
import { useEffect, useRef, useState } from 'react';
import {
  submissionApi,
  type CodePayload,
  type ContestSubmissionFilters,
  type SubmissionCandidateView,
  type SubmissionSummary,
} from '../api/submissionApi';
import { isFinal } from '../lib/verdicts';

export const submissionKeys = {
  detail: (id: string) => ['submission', id] as const,
  evaluatorDetail: (id: string) => ['submission', 'evaluator', id] as const,
  mine: (questionId: string) => ['mySubmissions', questionId] as const,
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
  summary: SubmissionSummary;
  detail: SubmissionCandidateView;
}

/**
 * Run is synchronous on the server but its response carries no per-test output,
 * so we follow up with the detail view to show each sample's result.
 */
export const useRunCode = (questionId: string) => {
  const qc = useQueryClient();
  return useMutation({
    ...inlineError,
    mutationKey: ['run', questionId],
    mutationFn: async (payload: CodePayload): Promise<RunResult> => {
      const summary = await submissionApi.run(payload);
      const detail = await submissionApi.getForCandidate(summary.id);
      return { summary, detail };
    },
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
      if (isFinal(detail.status) && questionId) {
        qc.invalidateQueries({ queryKey: submissionKeys.mine(questionId) });
      }
      return detail;
    },
    enabled: !!submissionId,
    staleTime: (q) => (isFinal(q.state.data?.status) ? Infinity : 0),
    refetchInterval: (q) => {
      if (isFinal(q.state.data?.status)) return false;
      if (Date.now() - startedAt.current.at > POLL_TIMEOUT_MS) return false;
      return POLL_INTERVAL_MS;
    },
    refetchIntervalInBackground: true,
  });

  const timedOut =
    !!submissionId &&
    !!query.data &&
    !isFinal(query.data.status) &&
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

export const useMySubmissions = (questionId: string | undefined, enabled = true) =>
  useQuery({
    queryKey: submissionKeys.mine(questionId ?? ''),
    queryFn: () => submissionApi.myHistory(questionId!, 0, 50),
    enabled: !!questionId && enabled,
    staleTime: 15_000,
  });

export type QuestionProgress = 'accepted' | 'attempted' | 'pending';

/** Per-question progress for the navigator, derived from each question's SUBMIT history. */
export const useQuestionProgress = (questionIds: string[], enabled = true) => {
  const results = useQueries({
    queries: questionIds.map((id) => ({
      queryKey: submissionKeys.mine(id),
      queryFn: () => submissionApi.myHistory(id, 0, 50),
      enabled,
      staleTime: 15_000,
    })),
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
