import apiClient from '../lib/apiClient';
import type { PagedData } from './contestApi';

/*
 * Module 7/8 submissions. NOTE: unlike the rest of the API, /submissions/* return the DTO
 * directly — there is no ApiWrapper { success, data } envelope. Errors are still wrapped.
 */

export type SubmissionStatus =
  | 'PENDING'
  | 'ACCEPTED'
  | 'WRONG_ANSWER'
  | 'COMPILATION_ERROR'
  | 'TIME_LIMIT_EXCEEDED'
  | 'MEMORY_LIMIT_EXCEEDED'
  | 'RUNTIME_ERROR'
  | 'SYSTEM_ERROR';

export type TestCaseResultStatus =
  | 'PASSED'
  | 'WRONG_ANSWER'
  | 'TIME_LIMIT_EXCEEDED'
  | 'MEMORY_LIMIT_EXCEEDED'
  | 'COMPILATION_ERROR'
  | 'RUNTIME_ERROR'
  | 'SYSTEM_ERROR';

export type SubmissionType = 'RUN' | 'SUBMIT';

/** Backend SupportedLanguage enum names. */
export type LanguageName = 'JAVA' | 'PYTHON' | 'CPP' | 'C' | 'JAVASCRIPT';

export interface CodePayload {
  questionId: string;
  language: string;
  sourceCode: string;
}

/** Returned by run, submit and the history list. */
export interface SubmissionSummary {
  id: string;
  questionId: string;
  type: SubmissionType;
  language: string;
  /** null once the session has ended: verdicts stay hidden until results are published */
  status: SubmissionStatus | null;
  score: number | null;
  passedCount: number | null;
  totalCount: number | null;
  submittedAt: string;
  /** True on the best-scoring SUBMIT — the one that counts toward the result. */
  counted: boolean;
}

export interface SampleResult {
  testCaseId: string;
  input: string | null;
  actualOutput: string | null;
  stderr: string | null;
  status: TestCaseResultStatus;
  timeMs: number | null;
  memoryKb: number | null;
}

/** GET /submissions/{id} as the owning candidate. Hidden tests arrive only as a summary. */
export interface SubmissionCandidateView {
  id: string;
  questionId: string;
  type: SubmissionType;
  language: string;
  status: SubmissionStatus | null;
  score: number | null;
  passedCount: number | null;
  totalCount: number | null;
  submittedAt: string;
  evaluatedAt: string | null;
  sourceCode: string;
  compileOutput: string | null;
  sampleResults: SampleResult[] | null;
  hiddenSummary: { passed: number; total: number } | null;
}

export interface EvaluatorTestCaseResult {
  testCaseId: string;
  input: string | null;
  expectedOutput: string | null;
  actualOutput: string | null;
  stderr: string | null;
  status: TestCaseResultStatus;
  timeMs: number | null;
  memoryKb: number | null;
  weight: number;
  sample: boolean;
}

/** GET /submissions/{id} as an evaluator or admin. */
export interface SubmissionEvaluatorView {
  id: string;
  sessionId: string;
  questionId: string;
  candidateId: string;
  type: SubmissionType;
  language: string;
  sourceCode: string;
  status: SubmissionStatus;
  score: number | null;
  passedCount: number | null;
  totalCount: number | null;
  compileOutput: string | null;
  submittedAt: string;
  evaluatedAt: string | null;
  testCaseResults: EvaluatorTestCaseResult[];
}

export interface ContestSubmissionRow {
  id: string;
  questionId: string;
  candidateId: string;
  candidateName: string | null;
  candidateEmail: string | null;
  candidateRollNumber: string | null;
  type: SubmissionType;
  language: string;
  status: SubmissionStatus;
  score: number | null;
  passedCount: number | null;
  totalCount: number | null;
  submittedAt: string;
}

export interface ContestSubmissionFilters {
  candidateId?: string;
  questionId?: string;
  type?: SubmissionType;
  status?: SubmissionStatus;
  page?: number;
  size?: number;
}

export const submissionApi = {
  /** Synchronous: runs against sample tests only and returns the summary. */
  /** Run is synchronous and returns the candidate view, sample outputs included. */
  run: async (payload: CodePayload): Promise<SubmissionCandidateView> => {
    const { data } = await apiClient.post<SubmissionCandidateView>('/submissions/run', payload);
    return data;
  },

  /** 202 Accepted with status PENDING; poll get() until it settles. */
  submit: async (payload: CodePayload): Promise<SubmissionSummary> => {
    const { data } = await apiClient.post<SubmissionSummary>('/submissions/submit', payload);
    return data;
  },

  getForCandidate: async (submissionId: string): Promise<SubmissionCandidateView> => {
    const { data } = await apiClient.get<SubmissionCandidateView>(`/submissions/${submissionId}`);
    return data;
  },

  getForEvaluator: async (submissionId: string): Promise<SubmissionEvaluatorView> => {
    const { data } = await apiClient.get<SubmissionEvaluatorView>(`/submissions/${submissionId}`);
    return data;
  },

  myHistory: async (
    questionId: string,
    page = 0,
    size = 20,
    type?: SubmissionType,
  ): Promise<PagedData<SubmissionSummary>> => {
    const { data } = await apiClient.get<PagedData<SubmissionSummary>>(`/questions/${questionId}/submissions/me`, {
      params: { page, size, ...(type ? { type } : {}) },
    });
    return data;
  },

  contestSubmissions: async (
    contestId: string,
    { page = 0, size = 20, ...filters }: ContestSubmissionFilters = {},
  ): Promise<PagedData<ContestSubmissionRow>> => {
    const { data } = await apiClient.get<PagedData<ContestSubmissionRow>>(`/contests/${contestId}/submissions`, {
      params: { page, size, ...filters },
    });
    return data;
  },

  rejudge: async (submissionId: string): Promise<void> => {
    await apiClient.post(`/submissions/${submissionId}/rejudge`);
  },
};
