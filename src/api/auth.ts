import apiClient from '../lib/apiClient';

export interface LoginPayload {
  email: string;
  password: string;
}

export interface LoginUser {
  id: string;
  email: string;
  fullName: string;
  role: 'CANDIDATE' | 'EVALUATOR' | 'ADMIN';
  rollNumber?: string;
}

export interface LoginResponse {
  accessToken: string;
  tokenType: string;
  expiresIn: number;
  user: LoginUser;
}

// The backend wraps all responses in { success, data, message, timestamp, traceId }
interface ApiWrapper<T> {
  success: boolean;
  data: T;
  message: string;
  timestamp: string;
  traceId: string;
}

export const authApi = {
  login: async (payload: LoginPayload): Promise<LoginResponse> => {
    const { data } = await apiClient.post<ApiWrapper<LoginResponse>>('/auth/login', payload);
    return data.data;
  },

  logout: async (): Promise<void> => {
    await apiClient.post('/auth/logout');
  },

  refresh: async (): Promise<{ accessToken: string }> => {
    const { data } = await apiClient.post<ApiWrapper<{ accessToken: string }>>('/auth/refresh');
    return data.data;
  },
};
