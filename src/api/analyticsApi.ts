import apiClient from '../lib/apiClient';
import type { ApiWrapper } from './auth';
import type { ContestStatus } from './contestApi';
import type { SubmissionStatus } from './submissionApi';
import type { ReviewReason } from './resultApi';
import type { Difficulty } from '../components/DifficultyBadge';

/*
 * Module 10 analytics. Staff only, all wrapped in ApiWrapper. Ratios are 0..1.
 * Null fields are omitted from the JSON (backend non_null), so they are optional here.
 */

export interface AnalyticsCoverage {
  totalCandidates: number;
  withResult: number;
  inProgress: number;
  judging: number;
  absent: number;
  contestCompleted: boolean;
  provisional: boolean;
}

export interface Bucket {
  index: number;
  fromRatio: number;
  toRatio: number;
  count: number;
}

export interface ContestAnalytics {
  contestId: string;
  contestTitle: string;
  contestStatus: ContestStatus;
  durationMinutes: number;
  coverage: AnalyticsCoverage;
  scores: {
    maxScore: number;
    participants: number;
    mean?: number | null;
    median?: number | null;
    min?: number | null;
    max?: number | null;
    stdDev?: number | null;
    medianTimeSeconds?: number | null;
  };
  /** Always 10 buckets. */
  scoreDistribution: Bucket[];
  /** Always 10 buckets, as shares of the contest duration. */
  timeDistribution: Bucket[];
  noTimeCount: number;
  sessions: { submitted: number; autoSubmitted: number; inProgress: number; notStarted: number };
  attention: {
    needsReview: number;
    needsReviewByReason: Partial<Record<ReviewReason, number>>;
    adjusted: number;
    autoSubmitted: number;
    absent: number;
    zeroScores: number;
  };
}

export interface QuestionStats {
  questionId: string;
  title: string;
  orderIndex: number;
  points: number;
  difficulty: Difficulty;
  participants: number;
  attempted: number;
  fullMarks: number;
  partial: number;
  /** Includes candidates who didn't attempt the question. */
  zero: number;
  averageScore?: number | null;
  averageRatio?: number | null;
  /** Missing = not enough data. */
  observedDifficulty?: Difficulty | null;
  difficultyMatches: boolean;
  adjusted: number;
  submitCount: number;
  runCount: number;
  attemptsPerCandidate?: number | null;
  medianSecondsToAccepted?: number | null;
  solvers: number;
  verdicts: { status: SubmissionStatus; count: number }[];
  languages: { language: string; count: number }[];
}

export interface QuestionAnalytics {
  coverage: AnalyticsCoverage;
  questions: QuestionStats[];
}

export interface TestCaseStats {
  testCaseId: string;
  orderIndex: number;
  sample: boolean;
  weight: number;
  evaluated: number;
  passed: number;
  passRate: number;
  wrongAnswer: number;
  timeLimit: number;
  memoryLimit: number;
  runtimeError: number;
  compilationError: number;
  suspicious: boolean;
}

export interface TestCaseAnalytics {
  questionId: string;
  questionTitle: string;
  candidatesEvaluated: number;
  testCases: TestCaseStats[];
}

export const analyticsApi = {
  overview: async (contestId: string): Promise<ContestAnalytics> => {
    const { data } = await apiClient.get<ApiWrapper<ContestAnalytics>>(`/contests/${contestId}/analytics/overview`);
    return data.data;
  },

  questions: async (contestId: string): Promise<QuestionAnalytics> => {
    const { data } = await apiClient.get<ApiWrapper<QuestionAnalytics>>(`/contests/${contestId}/analytics/questions`);
    return data.data;
  },

  testCases: async (contestId: string, questionId: string): Promise<TestCaseAnalytics> => {
    const { data } = await apiClient.get<ApiWrapper<TestCaseAnalytics>>(
      `/contests/${contestId}/analytics/questions/${questionId}/test-cases`,
    );
    return data.data;
  },
};
