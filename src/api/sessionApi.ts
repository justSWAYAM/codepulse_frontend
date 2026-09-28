import apiClient from '../lib/apiClient';
import type { ApiWrapper } from './auth';

// ── Types ──

export type SessionStatus =
  | 'NOT_YET_STARTED'
  | 'IN_PROGRESS'
  | 'SUBMITTED'
  | 'AUTO_SUBMITTED'
  | 'EXPIRED';            // reserved — no UI path produces it (Section 4.5)

export interface StartSessionResponse {
  sessionId: string;
  contestId: string;
  status: SessionStatus;
  startedAt: string;      // ISO 8601
  endsAt: string;         // ISO 8601, server-computed
  serverTime: string;     // ISO 8601, the server's "now" at response time
  remainingSeconds: number;
  resumed: boolean;       // false = new session, true = existing returned
}

export interface SessionStatusResponse {
  sessionId: string;
  contestId: string;
  status: SessionStatus;
  startedAt: string;
  endsAt: string;
  submittedAt: string | null;   // null while IN_PROGRESS
  serverTime: string;
  remainingSeconds: number;     // 0 unless IN_PROGRESS
}

// ── API Functions ──

export const sessionApi = {

  start: async (contestId: string): Promise<StartSessionResponse> => {
    const { data } = await apiClient.post<ApiWrapper<StartSessionResponse>>(
      `/contests/${contestId}/session/start`
    );
    return data.data;
  },

  // 404 means "no session yet" — callers must treat it as a normal outcome,
  // not surface it as an error (Section 4.2 and ExamEntryCard).
  getStatus: async (contestId: string): Promise<SessionStatusResponse> => {
    const { data } = await apiClient.get<ApiWrapper<SessionStatusResponse>>(
      `/contests/${contestId}/session`
    );
    return data.data;
  },

  submit: async (contestId: string): Promise<SessionStatusResponse> => {
    const { data } = await apiClient.post<ApiWrapper<SessionStatusResponse>>(
      `/contests/${contestId}/session/submit`
    );
    return data.data;
  },
};
