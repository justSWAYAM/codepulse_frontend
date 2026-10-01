import apiClient, { refreshAccessToken } from '../lib/apiClient';

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
export interface ApiWrapper<T> {
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

  // Goes through the shared in-flight refresh so it never races the 401 interceptor
  refresh: async (): Promise<{ accessToken: string }> => {
    const accessToken = await refreshAccessToken();
    return { accessToken };
  },
};
