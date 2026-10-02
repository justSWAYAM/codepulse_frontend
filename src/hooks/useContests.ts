import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { toast } from 'sonner';
import {
  contestApi,
  type ContestStatus,
  type CreateContestPayload,
  type UpdateContestPayload,
  type AssignCandidatesPayload,
} from '../api/contestApi';

// ── Query Keys ──

export const contestKeys = {
  all: ['contests'] as const,
  list: (params?: { status?: ContestStatus; page?: number; size?: number }) =>
    [...contestKeys.all, 'list', params] as const,
  detail: (id: string) => [...contestKeys.all, 'detail', id] as const,
  candidates: (id: string) => [...contestKeys.all, 'candidates', id] as const,
};

// ── Queries ──

export const useContests = (params?: { status?: ContestStatus; page?: number; size?: number }) => {
  return useQuery({
    queryKey: contestKeys.list(params),
    queryFn: () => contestApi.list(params),
    staleTime: 30_000,
  });
};

export const useContest = (id: string) => {
  return useQuery({
    queryKey: contestKeys.detail(id),
    queryFn: () => contestApi.getById(id),
    enabled: !!id,
  });
};

// ── Mutations ──

export const useCreateContest = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (payload: CreateContestPayload) => contestApi.create(payload),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: contestKeys.all });
      // Caller handles the redirect after creation
    },
    onError: () => {
      // Let caller handle inline error display, don't show a generic toast here
    },
  });
};

export const useUpdateContest = (id: string) => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (payload: UpdateContestPayload) => contestApi.update(id, payload),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: contestKeys.detail(id) });
      queryClient.invalidateQueries({ queryKey: contestKeys.all });
      toast.success('Contest updated successfully');
    },
  });
};

export const usePublishContest = (id: string) => {
  const queryClient = useQueryClient();

  return useMutation({
    onError: () => {}, // ContestDetailPage toasts the error itself
    mutationFn: () => contestApi.publish(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: contestKeys.detail(id) });
      queryClient.invalidateQueries({ queryKey: contestKeys.all });
      toast.success('Contest published successfully!');
    },
  });
};

export const useAssignCandidates = (contestId: string) => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (payload: AssignCandidatesPayload) =>
      contestApi.assignCandidates(contestId, payload),
    onSuccess: (result) => {
      queryClient.invalidateQueries({ queryKey: contestKeys.detail(contestId) });
      queryClient.invalidateQueries({ queryKey: contestKeys.candidates(contestId) });
      queryClient.invalidateQueries({ queryKey: contestKeys.all }); // candidateCount on the list
      toast.success(
        `${result.assignedCount} assigned, ${result.alreadyAssignedCount} already enrolled`
      );
    },
  });
};
