import apiClient from '../lib/apiClient';
import type { ApiWrapper } from './auth';
import type { ContestStatus } from './contestApi';
import type { SubmissionStatus } from './submissionApi';
import type { SessionStatus } from './sessionApi';

/*
 * Module 9 results. Every call here is wrapped in ApiWrapper { success, data } —
 * including POST /submissions/{id}/evaluate, unlike the rest of /submissions/*.
 *
 * The backend omits null fields from JSON, so "nullable" fields are also optional:
 * read them with `?? null` / `!= null`, never `=== null`.
 */

export type ResultStatus = 'SCORED' | 'NEEDS_REVIEW' | 'ABSENT';
export type ReviewReason = 'UNRESOLVED_SYSTEM_ERROR' | 'OVERRIDE_OUTDATED';

export interface ResultReadiness {
  totalCandidates: number;
  inProgress: number;
  judging: number;
  missing: number;
  scored: number;
  needsReview: number;
  absent: number;
  contestCompleted: boolean;
  published: boolean;
  readyToPublish: boolean;
}

export interface QuestionColumn {
  questionId: string;
  title: string;
  orderIndex: number;
  points: number;
}

export interface QuestionScoreCell {
  questionId: string;
  finalScore: number;
  maxPoints: number;
  /** Has a counted SUBMIT. */
  attempted: boolean;
  adjusted: boolean;
}

export interface LeaderboardEntry {
  resultId: string;
  /** Missing for ABSENT candidates. */
  rank?: number | null;
  candidateId: string;
  candidateName: string;
  candidateEmail?: string | null;
  candidateRollNumber?: string | null;
  status: ResultStatus;
  reviewReasons: ReviewReason[];
  totalScore: number;
  autoScore: number;
  maxScore: number;
  adjusted: boolean;
  timeTakenSeconds?: number | null;
  questionScores: QuestionScoreCell[];
}

export interface LeaderboardResponse {
  contestId: string;
  contestTitle: string;
  contestStatus: ContestStatus;
  published: boolean;
  publishedAt?: string | null;
  publishedByName?: string | null;
  maxScore: number;
  questions: QuestionColumn[];
  readiness: ResultReadiness;
  entries: LeaderboardEntry[];
}

export interface ManualEvaluationResponse {
  id: string;
  submissionId: string;
  questionId: string;
  /** Missing/null = reverted to the automatic score. */
  adjustedScore?: number | null;
  comments: string;
  evaluatorId: string;
  evaluatorName?: string | null;
  evaluatedAt: string;
}

export interface CountedSubmissionView {
  id: string;
  language: string;
  status: SubmissionStatus;
  passedCount?: number | null;
  totalCount?: number | null;
  submittedAt: string;
}

export interface QuestionResultView {
  questionId: string;
  title: string;
  orderIndex: number;
  maxPoints: number;
  autoScore: number;
  finalScore: number;
  countedSubmission?: CountedSubmissionView | null;
  submitAttempts: number;
  systemErrorCount: number;
  activeOverride?: ManualEvaluationResponse | null;
  overrideOutdated: boolean;
  history: ManualEvaluationResponse[];
}

/** Staff view of one candidate's result. */
export interface ResultResponse {
  resultId: string;
  contestId: string;
  candidateId: string;
  candidateName: string;
  candidateEmail?: string | null;
  candidateRollNumber?: string | null;
  /** Missing = ABSENT. */
  sessionId?: string | null;
  sessionStatus?: SessionStatus | null;
  startedAt?: string | null;
  submittedAt?: string | null;
  status: ResultStatus;
  reviewReasons: ReviewReason[];
  totalScore: number;
  autoScore: number;
  maxScore: number;
  rank?: number | null;
  rankedCount: number;
  timeTakenSeconds?: number | null;
  published: boolean;
  computedAt: string;
  questions: QuestionResultView[];
}

export interface MyQuestionResult {
  questionId: string;
  title: string;
  orderIndex: number;
  maxPoints: number;
  finalScore: number;
  /** Missing = not attempted. */
  verdict?: SubmissionStatus | null;
  passedCount?: number | null;
  totalCount?: number | null;
  countedSubmissionId?: string | null;
  adjusted: boolean;
}

/** Candidate view. Before publishing only contestId, contestTitle and published:false arrive. */
export interface MyResultResponse {
  contestId: string;
  contestTitle: string;
  published: boolean;
  publishedAt?: string | null;
  status?: ResultStatus | null;
  totalScore?: number | null;
  maxScore?: number | null;
  rank?: number | null;
  rankedCount?: number | null;
  adjusted?: boolean | null;
  questions?: MyQuestionResult[];
}

export interface ManualEvaluationPayload {
  /** null = revert to the automatic score. */
  adjustedScore: number | null;
  comments: string;
}

export const resultApi = {
  leaderboard: async (contestId: string): Promise<LeaderboardResponse> => {
    const { data } = await apiClient.get<ApiWrapper<LeaderboardResponse>>(`/contests/${contestId}/results`);
    return data.data;
  },

  candidate: async (contestId: string, candidateId: string): Promise<ResultResponse> => {
    const { data } = await apiClient.get<ApiWrapper<ResultResponse>>(
      `/contests/${contestId}/results/candidates/${candidateId}`,
    );
    return data.data;
  },

  /** 200 with published:false before publishing — a normal answer, not an error. */
  mine: async (contestId: string): Promise<MyResultResponse> => {
    const { data } = await apiClient.get<ApiWrapper<MyResultResponse>>(`/contests/${contestId}/results/me`);
    return data.data;
  },

  recompute: async (contestId: string): Promise<LeaderboardResponse> => {
    const { data } = await apiClient.post<ApiWrapper<LeaderboardResponse>>(`/contests/${contestId}/results/recompute`);
    return data.data;
  },

  publish: async (contestId: string, acknowledgeFlagged: boolean): Promise<LeaderboardResponse> => {
    const { data } = await apiClient.post<ApiWrapper<LeaderboardResponse>>(`/contests/${contestId}/results/publish`, {
      acknowledgeFlagged,
    });
    return data.data;
  },

  unpublish: async (contestId: string, reason: string): Promise<LeaderboardResponse> => {
    const { data } = await apiClient.post<ApiWrapper<LeaderboardResponse>>(`/contests/${contestId}/results/unpublish`, {
      reason,
    });
    return data.data;
  },

  /** Wrapped, unlike the rest of /submissions/*. Returns the candidate's updated result. */
  evaluate: async (submissionId: string, payload: ManualEvaluationPayload): Promise<ResultResponse> => {
    const { data } = await apiClient.post<ApiWrapper<ResultResponse>>(`/submissions/${submissionId}/evaluate`, payload);
    return data.data;
  },
};
