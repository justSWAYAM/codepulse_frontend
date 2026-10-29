import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { toast } from 'sonner';
import {
  libraryApi,
  type CreateLibraryQuestionPayload,
  type LibraryQueryParams,
  type UpdateLibraryQuestionPayload,
} from '../api/libraryApi';
import { questionKeys } from './useQuestions';

export const libraryKeys = {
  all: ['library'] as const,
  subjects: ['library', 'subjects'] as const,
  questions: (params: LibraryQueryParams) => ['library', 'questions', params] as const,
  question: (id: string) => ['library', 'question', id] as const,
};

export const useSubjects = () =>
  useQuery({
    queryKey: libraryKeys.subjects,
    queryFn: libraryApi.getSubjects,
    staleTime: 60_000,
  });

export const useCreateSubject = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (name: string) => libraryApi.createSubject(name),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: libraryKeys.subjects });
      toast.success('Subject folder created');
    },
  });
};

export const useDeleteSubject = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (id: string) => libraryApi.deleteSubject(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: libraryKeys.subjects });
      queryClient.invalidateQueries({ queryKey: ['library', 'questions'] });
      toast.success('Subject folder deleted');
    },
  });
};

export const useAddQuestionsToSubject = (subjectId?: string) => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (questionIds: string[]) => {
      if (!subjectId) throw new Error('Subject ID is required');
      return libraryApi.addQuestionsToSubject(subjectId, questionIds);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: libraryKeys.subjects });
      queryClient.invalidateQueries({ queryKey: ['library', 'questions'] });
      toast.success('Questions added to folder');
    },
  });
};

export const useLibraryQuestions = (params: LibraryQueryParams) =>
  useQuery({
    queryKey: libraryKeys.questions(params),
    queryFn: () => libraryApi.getQuestions(params),
    placeholderData: (previous) => previous,
  });

export const useLibraryQuestion = (id?: string) =>
  useQuery({
    queryKey: id ? libraryKeys.question(id) : ['library', 'question', 'none'],
    queryFn: () => libraryApi.getQuestion(id!),
    enabled: Boolean(id),
  });

export const useCreateLibraryQuestion = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (payload: CreateLibraryQuestionPayload) => libraryApi.createQuestion(payload),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['library', 'questions'] });
      toast.success('Library question created');
    },
  });
};

export const useUpdateLibraryQuestion = (id: string) => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (payload: UpdateLibraryQuestionPayload) => libraryApi.updateQuestion(id, payload),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: libraryKeys.question(id) });
      queryClient.invalidateQueries({ queryKey: ['library', 'questions'] });
      toast.success('Library question updated');
    },
  });
};

export const useDeleteLibraryQuestion = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (id: string) => libraryApi.deleteQuestion(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['library', 'questions'] });
      toast.success('Library question deleted');
    },
  });
};

export const useAddQuestionsToContest = (contestId: string) => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (questionIds: string[]) => libraryApi.addToContest(contestId, questionIds),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: questionKeys.all(contestId) });
      queryClient.invalidateQueries({ queryKey: ['contests', 'detail', contestId] });
      toast.success('Questions added to contest');
    },
  });
};
