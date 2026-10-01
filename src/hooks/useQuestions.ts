import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { toast } from 'sonner';
import type {
  CreateQuestionPayload,
  UpdateQuestionPayload,
  ReorderQuestionsPayload,
  QuestionRecord,
} from '../api/questionApi';
import { questionApi } from '../api/questionApi';

export const questionKeys = {
  all: (contestId: string) => ['questions', contestId] as const,
  detail: (contestId: string, questionId: string) =>
    ['questions', contestId, questionId] as const,
};

// List
export const useQuestions = (contestId: string, enabled = true) =>
  useQuery({
    queryKey: questionKeys.all(contestId),
    queryFn: () => questionApi.getQuestions(contestId),
    enabled: !!contestId && enabled,
  });

// Single
export const useQuestion = (contestId: string, questionId: string) =>
  useQuery({
    queryKey: questionKeys.detail(contestId, questionId),
    queryFn: () => questionApi.getQuestion(contestId, questionId),
    enabled: !!contestId && !!questionId,
  });

// Create
export const useCreateQuestion = (contestId: string) => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (payload: CreateQuestionPayload) =>
      questionApi.createQuestion(contestId, payload),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: questionKeys.all(contestId) });
      toast.success('Question created successfully');
    },
  });
};

// Update
export const useUpdateQuestion = (contestId: string, questionId: string) => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (payload: UpdateQuestionPayload) =>
      questionApi.updateQuestion(contestId, questionId, payload),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: questionKeys.all(contestId) });
      queryClient.invalidateQueries({ queryKey: questionKeys.detail(contestId, questionId) });
      toast.success('Question updated successfully');
    },
  });
};

// Delete
export const useDeleteQuestion = (contestId: string) => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (questionId: string) =>
      questionApi.deleteQuestion(contestId, questionId),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: questionKeys.all(contestId) });
      toast.success('Question deleted');
    },
  });
};

// Reorder
export const useReorderQuestions = (contestId: string) => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (payload: ReorderQuestionsPayload) =>
      questionApi.reorderQuestions(contestId, payload),
    onMutate: async (payload) => {
      // Optimistic update
      await queryClient.cancelQueries({ queryKey: questionKeys.all(contestId) });
      const previous = queryClient.getQueryData<QuestionRecord[]>(questionKeys.all(contestId));
      
      if (previous) {
        // Reorder cached data by orderedIds
        const reordered = [...previous].sort((a, b) => {
          return payload.orderedIds.indexOf(a.id) - payload.orderedIds.indexOf(b.id);
        });
        queryClient.setQueryData(questionKeys.all(contestId), reordered);
      }
      return { previous };
    },
    onError: (_err, _vars, context) => {
      // Roll back on error
      if (context?.previous) {
        queryClient.setQueryData(questionKeys.all(contestId), context.previous);
      }
      toast.error('Reorder failed — reverted');
    },
    onSettled: () => {
      queryClient.invalidateQueries({ queryKey: questionKeys.all(contestId) });
    },
  });
};
