import apiClient from '../lib/apiClient';

// ── Types ──

export type UserRole = 'CANDIDATE' | 'EVALUATOR' | 'ADMIN';

// The backend wraps all responses in this envelope
interface ApiWrapper<T> {
  success: boolean;
  data: T;
  message: string;
  timestamp: string;
  traceId: string;
}

// Mirrors backend common/dto/PagedResponse
interface PagedResponse<T> {
  content: T[];
  page: number;
  size: number;
  totalElements: number;
  totalPages: number;
}

export interface UserRecord {
  id: string;
  email: string;
  fullName: string;
  role: UserRole;
  isActive: boolean;
  createdAt: string;
  rollNumber?: string;
  year?: number;
  branch?: string;
  division?: string;
  batch?: string;
}

export interface UsersResponse {
  users: UserRecord[];
  total: number;
  page: number;
  pageSize: number;
}

export interface CreateUserPayload {
  email: string;
  fullName: string;
  role: UserRole;
  password?: string;
  rollNumber?: string;
  year?: number;
  branch?: string;
  division?: string;
  batch?: string;
}

export interface UpdateUserPayload {
  fullName?: string;
  role?: UserRole;
  isActive?: boolean;
  rollNumber?: string;
  year?: number;
  branch?: string;
  division?: string;
  batch?: string;
}

export interface BulkImportResponse {
  totalProcessed: number;
  successCount: number;
  failureCount: number;
  results: Array<{
    row: number;
    email: string;
    success: boolean;
    error?: string;
  }>;
}

export interface UserProfile {
  id: string;
  email: string;
  fullName: string;
  role: UserRole;
  isActive: boolean;
  createdAt: string;
  rollNumber?: string;
  year?: number;
  branch?: string;
  division?: string;
  batch?: string;
}

export interface UpdateProfilePayload {
  fullName: string;
}

export interface ChangePasswordPayload {
  currentPassword: string;
  newPassword: string;
}

// ── API Functions ──
// All endpoints return { success, data, message, ... } — we unwrap .data

export const userApi = {
  getUsers: async (params?: {
    page?: number;
    pageSize?: number;
    search?: string;
    role?: UserRole;
  }): Promise<UsersResponse> => {
    // Spring's Pageable expects `page` and `size` (not pageSize)
    const { pageSize, ...rest } = params ?? {};
    const { data } = await apiClient.get<ApiWrapper<PagedResponse<UserRecord>>>('/users', {
      params: { ...rest, ...(pageSize !== undefined ? { size: pageSize } : {}) },
    });
    return {
      users: data.data.content,
      total: data.data.totalElements,
      page: data.data.page,
      pageSize: data.data.size,
    };
  },

  createUser: async (payload: CreateUserPayload): Promise<UserRecord> => {
    const { data } = await apiClient.post<ApiWrapper<UserRecord>>('/users', payload);
    return data.data;
  },

  updateUser: async (
    id: string,
    payload: UpdateUserPayload
  ): Promise<UserRecord> => {
    const { data } = await apiClient.put<ApiWrapper<UserRecord>>(`/users/${id}`, payload);
    return data.data;
  },

  deactivateUser: async (id: string): Promise<UserRecord> => {
    const { data } = await apiClient.patch<ApiWrapper<UserRecord>>(
      `/users/${id}/deactivate`
    );
    return data.data;
  },

  reactivateUser: async (id: string): Promise<UserRecord> => {
    const { data } = await apiClient.patch<ApiWrapper<UserRecord>>(
      `/users/${id}/reactivate`
    );
    return data.data;
  },

  bulkImport: async (file: File): Promise<BulkImportResponse> => {
    const formData = new FormData();
    formData.append('file', file);
    const { data } = await apiClient.post<ApiWrapper<any>>(
      '/users/bulk-import',
      formData,
      { headers: { 'Content-Type': 'multipart/form-data' } }
    );
    const raw = data.data;
    return {
      totalProcessed: raw.totalRows || 0,
      successCount: raw.succeededCount || 0,
      failureCount: raw.failedCount || 0,
      results: (raw.errors || []).map((err: any) => ({
        row: err.rowNumber,
        email: 'N/A', // Backend does not return email for errors
        success: false,
        error: err.reason
      }))
    };
  },

  getProfile: async (): Promise<UserProfile> => {
    const { data } = await apiClient.get<ApiWrapper<UserProfile>>('/users/me');
    return data.data;
  },

  updateProfile: async (
    payload: UpdateProfilePayload
  ): Promise<UserProfile> => {
    const { data } = await apiClient.put<ApiWrapper<UserProfile>>('/users/me', payload);
    return data.data;
  },

  changePassword: async (payload: ChangePasswordPayload): Promise<void> => {
    await apiClient.patch('/users/me/password', payload);
  },
};
