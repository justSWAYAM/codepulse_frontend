import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { toast } from 'sonner';
import { resultApi, type LeaderboardResponse, type ManualEvaluationPayload } from '../api/resultApi';
import { contestKeys } from './useContests';

export const resultKeys = {
  all: ['results'] as const,
  /** Invalidate this for "everything about a contest's results". */
  contest: (contestId: string) => ['results', contestId] as const,
  leaderboard: (contestId: string) => ['results', contestId, 'leaderboard'] as const,
  candidate: (contestId: string, candidateId: string) => ['results', contestId, 'candidate', candidateId] as const,
  mine: (contestId: string) => ['results', contestId, 'me'] as const,
};

export const LEADERBOARD_POLL_MS = 5000;

const status = (error: unknown) => (error as { response?: { status?: number } })?.response?.status;

/** Keep refreshing while candidates are still writing or being judged, and stop once published. */
export const leaderboardPollInterval = (data: LeaderboardResponse | undefined): number | false =>
  data && !data.published && (data.readiness.inProgress > 0 || data.readiness.judging > 0) ? LEADERBOARD_POLL_MS : false;

export const useResults = (contestId: string, enabled = true) =>
  useQuery({
    queryKey: resultKeys.leaderboard(contestId),
    queryFn: () => resultApi.leaderboard(contestId),
    enabled: !!contestId && enabled,
    staleTime: 10_000,
    placeholderData: (prev) => prev,
    refetchInterval: (q) => leaderboardPollInterval(q.state.data),
  });

export const useCandidateResult = (contestId: string, candidateId: string) =>
  useQuery({
    queryKey: resultKeys.candidate(contestId, candidateId),
    queryFn: () => resultApi.candidate(contestId, candidateId),
    enabled: !!contestId && !!candidateId,
    staleTime: 10_000,
    // 404 RESULT_NOT_FOUND is an answer (still in progress), not a failure
    retry: (count, error) => status(error) !== 404 && count < 1,
  });

export const useMyResult = (contestId: string, enabled = true) =>
  useQuery({
    queryKey: resultKeys.mine(contestId),
    queryFn: () => resultApi.mine(contestId),
    enabled: !!contestId && enabled,
    staleTime: 60_000,
    retry: (count, error) => status(error) !== 404 && count < 1,
  });

/** Publish state lives on the contest too: refresh cards and headers as well as results. */
const useInvalidatePublishState = (contestId: string) => {
  const qc = useQueryClient();
  return (data: LeaderboardResponse) => {
    qc.setQueryData(resultKeys.leaderboard(contestId), data);
    qc.invalidateQueries({ queryKey: resultKeys.contest(contestId) });
    qc.invalidateQueries({ queryKey: contestKeys.all });
  };
};

export const useRecomputeResults = (contestId: string) => {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: () => resultApi.recompute(contestId),
    onSuccess: (data) => {
      qc.setQueryData(resultKeys.leaderboard(contestId), data);
      qc.invalidateQueries({ queryKey: resultKeys.contest(contestId) });
      toast.success('Results recomputed');
    },
  });
};

// The dialogs and forms below show errors inline, so they opt out of the global error toast
const inlineErrors = { onError: () => undefined };

export const usePublishResults = (contestId: string) => {
  const refresh = useInvalidatePublishState(contestId);
  return useMutation({
    ...inlineErrors,
    mutationFn: (acknowledgeFlagged: boolean) => resultApi.publish(contestId, acknowledgeFlagged),
    onSuccess: refresh,
  });
};

export const useUnpublishResults = (contestId: string) => {
  const refresh = useInvalidatePublishState(contestId);
  return useMutation({
    ...inlineErrors,
    mutationFn: (reason: string) => resultApi.unpublish(contestId, reason),
    onSuccess: refresh,
  });
};

export const useManualEvaluation = (contestId: string, candidateId: string) => {
  const qc = useQueryClient();
  return useMutation({
    ...inlineErrors,
    mutationFn: ({ submissionId, ...payload }: ManualEvaluationPayload & { submissionId: string }) =>
      resultApi.evaluate(submissionId, payload),
    onSuccess: (data) => {
      // The response is the whole updated result; ranks moved, so the leaderboard is stale
      qc.setQueryData(resultKeys.candidate(contestId, candidateId), data);
      qc.invalidateQueries({ queryKey: resultKeys.leaderboard(contestId) });
    },
  });
};
