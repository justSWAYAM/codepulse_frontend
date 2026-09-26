import apiClient from '../lib/apiClient';
import type { ApiWrapper } from './auth';
import type { Difficulty } from '../components/DifficultyBadge';
import type { TestCaseAdminRecord, TestCaseSampleRecord } from './testCaseApi';

export interface QuestionAdminRecord {
  id: string;
  contestId: string;
  title: string;
  description: string;
  difficulty: Difficulty;
  points: number;
  timeLimitMs: number;
  memoryLimitKb: number;
  orderIndex: number;
  createdAt: string;
  createdBy: string;
  testCases: TestCaseAdminRecord[];
}

export interface QuestionCandidateRecord {
  id: string;
  contestId: string;
  title: string;
  description: string;
  difficulty: Difficulty;
  points: number;
  timeLimitMs: number;
  memoryLimitKb: number;
  orderIndex: number;
  sampleTestCases: TestCaseSampleRecord[];
}

export type QuestionRecord = QuestionAdminRecord | QuestionCandidateRecord;

export interface CreateQuestionPayload {
  title: string;
  description: string;
  difficulty: Difficulty;
  points: number;
  timeLimitMs: number;
  memoryLimitKb: number;
}

export interface UpdateQuestionPayload {
  title?: string;
  description?: string;
  difficulty?: Difficulty;
  points?: number;
  timeLimitMs?: number;
  memoryLimitKb?: number;
}

export interface ReorderQuestionsPayload {
  orderedIds: string[];
}

export const questionApi = {
  getQuestions: async (contestId: string): Promise<QuestionRecord[]> => {
    const { data } = await apiClient.get<ApiWrapper<QuestionRecord[]>>(`/contests/${contestId}/questions`);
    return data.data;
  },

  getQuestion: async (contestId: string, questionId: string): Promise<QuestionRecord> => {
    const { data } = await apiClient.get<ApiWrapper<QuestionRecord>>(`/contests/${contestId}/questions/${questionId}`);
    return data.data;
  },

  createQuestion: async (contestId: string, payload: CreateQuestionPayload): Promise<QuestionAdminRecord> => {
    const { data } = await apiClient.post<ApiWrapper<QuestionAdminRecord>>(`/contests/${contestId}/questions`, payload);
    return data.data;
  },

  updateQuestion: async (contestId: string, questionId: string, payload: UpdateQuestionPayload): Promise<QuestionAdminRecord> => {
    const { data } = await apiClient.put<ApiWrapper<QuestionAdminRecord>>(`/contests/${contestId}/questions/${questionId}`, payload);
    return data.data;
  },

  deleteQuestion: async (contestId: string, questionId: string): Promise<void> => {
    await apiClient.delete(`/contests/${contestId}/questions/${questionId}`);
  },

  reorderQuestions: async (contestId: string, payload: ReorderQuestionsPayload): Promise<QuestionAdminRecord[]> => {
    const { data } = await apiClient.patch<ApiWrapper<QuestionAdminRecord[]>>(`/contests/${contestId}/questions/reorder`, payload);
    return data.data;
  },
};
