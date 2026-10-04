import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { toast } from 'sonner';
import { libraryApi, type CreateLibraryQuestionPayload, type LibraryQueryParams } from '../api/libraryApi';
import { questionKeys } from './useQuestions';

export const libraryKeys = {
  all: ['library'] as const,
  subjects: ['library', 'subjects'] as const,
  questions: (params: LibraryQueryParams) => ['library', 'questions', params] as const,
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

export const useLibraryQuestions = (params: LibraryQueryParams) =>
  useQuery({
    queryKey: libraryKeys.questions(params),
    queryFn: () => libraryApi.getQuestions(params),
    placeholderData: (previous) => previous,
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