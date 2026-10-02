import { useQuery } from '@tanstack/react-query';
import { analyticsApi, type AnalyticsCoverage } from '../api/analyticsApi';

export const analyticsKeys = {
  /** Invalidate this when results change (override, recompute, rejudge). */
  contest: (contestId: string) => ['analytics', contestId] as const,
  overview: (contestId: string) => ['analytics', contestId, 'overview'] as const,
  questions: (contestId: string) => ['analytics', contestId, 'questions'] as const,
  testCases: (contestId: string, questionId: string) => ['analytics', contestId, 'testCases', questionId] as const,
};

export const ANALYTICS_POLL_MS = 15_000;

/** Poll only while the numbers can still change. */
export const analyticsPollInterval = (coverage?: AnalyticsCoverage): number | false =>
  coverage?.provisional ? ANALYTICS_POLL_MS : false;

/** The roadmap's hook: contest overview. */
export const useContestAnalytics = (contestId: string, enabled = true) =>
  useQuery({
    queryKey: analyticsKeys.overview(contestId),
    queryFn: () => analyticsApi.overview(contestId),
    enabled: !!contestId && enabled,
    staleTime: 30_000,
    placeholderData: (prev) => prev,
    refetchInterval: (q) => analyticsPollInterval(q.state.data?.coverage),
  });

export const useQuestionAnalytics = (contestId: string, enabled = true) =>
  useQuery({
    queryKey: analyticsKeys.questions(contestId),
    queryFn: () => analyticsApi.questions(contestId),
    enabled: !!contestId && enabled,
    staleTime: 30_000,
    placeholderData: (prev) => prev,
    refetchInterval: (q) => analyticsPollInterval(q.state.data?.coverage),
  });

/** Fetched when the drill-down opens; no polling. */
export const useTestCaseAnalytics = (contestId: string, questionId: string | null) =>
  useQuery({
    queryKey: analyticsKeys.testCases(contestId, questionId ?? ''),
    queryFn: () => analyticsApi.testCases(contestId, questionId!),
    enabled: !!contestId && !!questionId,
    staleTime: 30_000,
    retry: (count, error) => (error as { response?: { status?: number } })?.response?.status !== 404 && count < 1,
  });
