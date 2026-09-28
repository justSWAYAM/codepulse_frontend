import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { sessionApi, type StartSessionResponse, type SessionStatusResponse } from '../api/sessionApi';
import { contestKeys } from './useContests';

// ── Query Keys ──

export const sessionKeys = {
  detail: (contestId: string) => ['session', contestId] as const,
};

/** Convert a StartSessionResponse into the shape of SessionStatusResponse
 *  so the cache stays uniform after a `start` call. */
function toStatusResponse(start: StartSessionResponse): SessionStatusResponse {
  return {
    sessionId: start.sessionId,
    contestId: start.contestId,
    status: start.status,
    startedAt: start.startedAt,
    endsAt: start.endsAt,
    submittedAt: null,
    serverTime: start.serverTime,
    remainingSeconds: start.remainingSeconds,
  };
}

// ── Queries ──

export const useAssessmentSession = (contestId: string, enabled = true) =>
  useQuery({
    queryKey: sessionKeys.detail(contestId),
    queryFn: () => sessionApi.getStatus(contestId),
    enabled: !!contestId && enabled,
    retry: false,
    refetchInterval: (query) =>
      query.state.data?.status === 'IN_PROGRESS' ? 30_000 : false,  // periodic re-sync
    refetchOnMount: 'always',
    refetchOnWindowFocus: false,
    staleTime: 0,
  });

// ── Mutations ──

export const useStartSession = (contestId: string) => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: () => sessionApi.start(contestId),
    onSuccess: (data) => {
      queryClient.setQueryData(sessionKeys.detail(contestId), toStatusResponse(data));
      queryClient.invalidateQueries({ queryKey: sessionKeys.detail(contestId) });
      queryClient.invalidateQueries({ queryKey: contestKeys.detail(contestId) });  // ContestCandidateStatus changed
    },
  });
};

export const useSubmitSession = (contestId: string) => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: () => sessionApi.submit(contestId),
    onSuccess: async (data) => {
      queryClient.setQueryData(sessionKeys.detail(contestId), data);
      const canonicalSession = await queryClient.fetchQuery({
        queryKey: sessionKeys.detail(contestId),
        queryFn: () => sessionApi.getStatus(contestId),
        retry: false,
      });
      queryClient.setQueryData(sessionKeys.detail(contestId), canonicalSession);
      queryClient.invalidateQueries({ queryKey: contestKeys.detail(contestId) });
    },
  });
};
