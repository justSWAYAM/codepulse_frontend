import apiClient from '../lib/apiClient';

// ── Types ──

export type ContestStatus = 'DRAFT' | 'PUBLISHED' | 'ONGOING' | 'COMPLETED';
export type ContestCandidateStatus = 'INVITED' | 'IN_PROGRESS' | 'COMPLETED';

interface ApiWrapper<T> {
  success: boolean;
  data: T;
  message: string;
  timestamp: string;
  traceId: string | null;
}

export interface PagedData<T> {
  content: T[];
  page: number;
  size: number;
  totalElements: number;
  totalPages: number;
}

export interface ContestRecord {
  id: string;
  title: string;
  description: string | null;
  startTime: string;   // ISO 8601 UTC
  endTime: string;
  durationMinutes: number;
  allowedLanguages: string[];
  status: ContestStatus;
  candidateCount: number;
  createdAt: string;
}

export interface ContestCandidate {
  id: string;
  email: string;
  fullName: string;
  role: string;
  active: boolean;
  createdAt: string;
}

export interface ContestDetailRecord extends ContestRecord {
  candidates: ContestCandidate[] | null;
}

export interface CreateContestPayload {
  title: string;
  description?: string;
  startTime: string;
  endTime: string;
  durationMinutes: number;
  allowedLanguages: string[];
}

export interface UpdateContestPayload {
  title?: string;
  description?: string;
  startTime?: string;
  endTime?: string;
  durationMinutes?: number;
  allowedLanguages?: string[];
}

export interface AssignCandidatesPayload {
  candidateIds: string[];
}

export interface AssignCandidatesResult {
  assignedCount: number;
  alreadyAssignedCount: number;
  notFoundCount: number;
  failedIds: string[];
}

// ── API Functions ──

export const contestApi = {
  list: async (params?: {
    status?: ContestStatus;
    page?: number;
    size?: number;
  }): Promise<PagedData<ContestRecord>> => {
    const { data } = await apiClient.get<ApiWrapper<PagedData<ContestRecord>>>('/contests', { params });
    return data.data;
  },

  getById: async (id: string): Promise<ContestDetailRecord> => {
    const { data } = await apiClient.get<ApiWrapper<ContestDetailRecord>>(`/contests/${id}`);
    return data.data;
  },

  create: async (payload: CreateContestPayload): Promise<ContestRecord> => {
    const { data } = await apiClient.post<ApiWrapper<ContestRecord>>('/contests', payload);
    return data.data;
  },

  update: async (id: string, payload: UpdateContestPayload): Promise<ContestRecord> => {
    const { data } = await apiClient.put<ApiWrapper<ContestRecord>>(`/contests/${id}`, payload);
    return data.data;
  },

  publish: async (id: string): Promise<ContestRecord> => {
    const { data } = await apiClient.post<ApiWrapper<ContestRecord>>(`/contests/${id}/publish`);
    return data.data;
  },

  assignCandidates: async (
    id: string,
    payload: AssignCandidatesPayload
  ): Promise<AssignCandidatesResult> => {
    const { data } = await apiClient.post<ApiWrapper<AssignCandidatesResult>>(
      `/contests/${id}/candidates`,
      payload
    );
    return data.data;
  },

  getCandidates: async (id: string): Promise<ContestCandidate[]> => {
    const { data } = await apiClient.get<ApiWrapper<ContestCandidate[]>>(`/contests/${id}/candidates`);
    return data.data;
  },
};
