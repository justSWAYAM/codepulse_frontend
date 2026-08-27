import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { toast } from 'sonner';
import {
  userApi,
  type UserRole,
  type CreateUserPayload,
  type UpdateUserPayload,
  type UpdateProfilePayload,
  type ChangePasswordPayload,
} from '../api/userApi';

// ── Query Keys ──

export const userKeys = {
  all: ['users'] as const,
  list: (params?: { page?: number; pageSize?: number; search?: string; role?: UserRole }) =>
    [...userKeys.all, 'list', params] as const,
  profile: ['profile'] as const,
};

// ── Queries ──

export const useUsers = (params?: {
  page?: number;
  pageSize?: number;
  search?: string;
  role?: UserRole;
}) => {
  return useQuery({
    queryKey: userKeys.list(params),
    queryFn: () => userApi.getUsers(params),
  });
};

export const useCurrentUser = () => {
  return useQuery({
    queryKey: userKeys.profile,
    queryFn: () => userApi.getProfile(),
  });
};

// ── Mutations ──

export const useCreateUser = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (payload: CreateUserPayload) => userApi.createUser(payload),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: userKeys.all });
      toast.success('User created successfully');
    },
  });
};

export const useUpdateUser = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ id, payload }: { id: string; payload: UpdateUserPayload }) =>
      userApi.updateUser(id, payload),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: userKeys.all });
      toast.success('User updated successfully');
    },
  });
};

export const useDeactivateUser = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (id: string) => userApi.deactivateUser(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: userKeys.all });
      toast.success('User status updated');
    },
  });
};

export const useBulkImportUsers = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (file: File) => userApi.bulkImport(file),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: userKeys.all });
    },
  });
};

export const useUpdateProfile = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (payload: UpdateProfilePayload) => userApi.updateProfile(payload),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: userKeys.profile });
      toast.success('Profile updated successfully');
    },
  });
};

export const useChangePassword = () => {
  return useMutation({
    mutationFn: (payload: ChangePasswordPayload) => userApi.changePassword(payload),
    onSuccess: () => {
      toast.success('Password changed successfully');
    },
    // Don't use global error handler — inline error display like LoginForm
    onError: () => {},
  });
};
