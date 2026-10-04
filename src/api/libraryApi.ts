import apiClient from '../lib/apiClient';
import type { ApiWrapper } from './auth';
import type { Difficulty } from '../components/DifficultyBadge';
import type { PagedData } from './contestApi';
import type { CreateQuestionPayload, QuestionAdminRecord } from './questionApi';

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

export const libraryApi = {
  getSubjects: async (): Promise<SubjectRecord[]> => {
    const { data } = await apiClient.get<ApiWrapper<SubjectRecord[]>>('/library/subjects');
    return data.data;
  },

  createSubject: async (name: string): Promise<SubjectRecord> => {
    const { data } = await apiClient.post<ApiWrapper<SubjectRecord>>('/library/subjects', { name });
    return data.data;
  },

  getQuestions: async (params: LibraryQueryParams): Promise<PagedData<LibraryQuestionRecord>> => {
    const { data } = await apiClient.get<ApiWrapper<PagedData<LibraryQuestionRecord>>>('/library/questions', { params });
    return data.data;
  },

  createQuestion: async (payload: CreateLibraryQuestionPayload): Promise<QuestionAdminRecord> => {
    const { data } = await apiClient.post<ApiWrapper<QuestionAdminRecord>>('/library/questions', payload);
    return data.data;
  },

  addToContest: async (contestId: string, questionIds: string[]): Promise<void> => {
    await apiClient.post(`/contests/${contestId}/questions/from-library`, { questionIds });
  },
};