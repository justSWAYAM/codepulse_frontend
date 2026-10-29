import apiClient from '../lib/apiClient';
import type { ApiWrapper } from './auth';
import type { Difficulty } from '../components/DifficultyBadge';
import type { PagedData } from './contestApi';
import type { CreateQuestionPayload, QuestionAdminRecord } from './questionApi';
import type { TestCaseAdminRecord } from './testCaseApi';

export type LibraryQuestionType = 'DSA' | 'SQL' | 'MCQ' | 'THEORY';

export interface SubjectRecord {
  id: string;
  name: string;
  createdBy: string;
  createdAt: string;
}

export interface LibraryQuestionRecord {
  id: string;
  title: string;
  questionType: LibraryQuestionType;
  difficulty: Difficulty;
  points: number;
  subjectId: string | null;
  subjectName: string | null;
  authorName: string;
  createdAt: string;
}

export interface LibraryMcqOptionRecord {
  id: string;
  optionText: string;
  orderIndex: number;
  isCorrect?: boolean;
}

export interface LibraryQuestionDetailRecord {
  id: string;
  title: string;
  description: string;
  questionType: LibraryQuestionType;
  difficulty: Difficulty;
  points: number;
  timeLimitMs: number;
  memoryLimitKb: number;
  subjectId: string | null;
  subjectName: string | null;
  authorName: string;
  createdBy: string;
  createdAt: string;
  testCases: TestCaseAdminRecord[];
  options: LibraryMcqOptionRecord[];
  schemaSql: string | null;
  orderMatters: boolean | null;
  modelAnswer: string | null;
}

export interface LibraryQueryParams {
  subjectId?: string;
  type?: LibraryQuestionType;
  difficulty?: Difficulty;
  q?: string;
  page?: number;
  size?: number;
}

export interface CreateLibraryQuestionPayload extends CreateQuestionPayload {
  subjectId: string;
  questionType: LibraryQuestionType;
}

export interface UpdateLibraryQuestionPayload {
  subjectId?: string;
  title?: string;
  description?: string;
  difficulty?: Difficulty;
  points?: number;
  timeLimitMs?: number;
  memoryLimitKb?: number;
  schemaSql?: string;
  orderMatters?: boolean;
  modelAnswer?: string;
}

export const libraryApi = {
  getSubjects: async (): Promise<SubjectRecord[]> => {
    const { data } = await apiClient.get<ApiWrapper<SubjectRecord[]>>('/library/subjects');
    return data.data;
  },

  createSubject: async (name: string): Promise<SubjectRecord> => {
    const { data } = await apiClient.post<ApiWrapper<SubjectRecord>>('/library/subjects', { name });
    return data.data;
  },

  deleteSubject: async (id: string): Promise<void> => {
    await apiClient.delete(`/library/subjects/${id}`);
  },

  addQuestionsToSubject: async (subjectId: string, questionIds: string[]): Promise<void> => {
    await apiClient.post(`/library/subjects/${subjectId}/questions`, { questionIds });
  },

  getQuestions: async (params: LibraryQueryParams): Promise<PagedData<LibraryQuestionRecord>> => {
    const { data } = await apiClient.get<ApiWrapper<PagedData<LibraryQuestionRecord>>>('/library/questions', { params });
    return data.data;
  },

  getQuestion: async (id: string): Promise<LibraryQuestionDetailRecord> => {
    const { data } = await apiClient.get<ApiWrapper<LibraryQuestionDetailRecord>>(`/library/questions/${id}`);
    return data.data;
  },

  createQuestion: async (payload: CreateLibraryQuestionPayload): Promise<QuestionAdminRecord> => {
    const { data } = await apiClient.post<ApiWrapper<QuestionAdminRecord>>('/library/questions', payload);
    return data.data;
  },

  updateQuestion: async (id: string, payload: UpdateLibraryQuestionPayload): Promise<LibraryQuestionRecord> => {
    const { data } = await apiClient.put<ApiWrapper<LibraryQuestionRecord>>(`/library/questions/${id}`, payload);
    return data.data;
  },

  deleteQuestion: async (id: string): Promise<void> => {
    await apiClient.delete(`/library/questions/${id}`);
  },

  addToContest: async (contestId: string, questionIds: string[]): Promise<void> => {
    await apiClient.post(`/contests/${contestId}/questions/from-library`, { questionIds });
  },
};
