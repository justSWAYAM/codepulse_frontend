import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { toast } from 'sonner';
import { testCaseApi } from '../api/testCaseApi';
import type { CreateTestCasePayload } from '../api/testCaseApi';
import { questionKeys } from './useQuestions';

export const testCaseKeys = {
  all: (questionId: string) => ['testCases', questionId] as const,
};

// List
export const useTestCases = (questionId: string) =>
  useQuery({
    queryKey: testCaseKeys.all(questionId),
    queryFn: () => testCaseApi.getTestCases(questionId),
    enabled: !!questionId,
  });

// Create
export const useCreateTestCase = (contestId: string | undefined, questionId: string) => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (payload: CreateTestCasePayload) =>
      testCaseApi.createTestCase(questionId, payload),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: testCaseKeys.all(questionId) });
      if (contestId) {
        queryClient.invalidateQueries({ queryKey: questionKeys.detail(contestId, questionId) });
        queryClient.invalidateQueries({ queryKey: questionKeys.all(contestId) });
      }
      queryClient.invalidateQueries({ queryKey: ['library', 'question', questionId] });
      queryClient.invalidateQueries({ queryKey: ['library', 'questions'] });
      toast.success('Test case added');
    },
  });
};

// Delete
export const useDeleteTestCase = (contestId: string | undefined, questionId: string) => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (testCaseId: string) => testCaseApi.deleteTestCase(testCaseId),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: testCaseKeys.all(questionId) });
      if (contestId) {
        queryClient.invalidateQueries({ queryKey: questionKeys.detail(contestId, questionId) });
        queryClient.invalidateQueries({ queryKey: questionKeys.all(contestId) });
      }
      queryClient.invalidateQueries({ queryKey: ['library', 'question', questionId] });
      queryClient.invalidateQueries({ queryKey: ['library', 'questions'] });
      toast.success('Test case deleted');
    },
  });
};

// Bulk upload
export const useBulkUploadTestCases = (contestId: string | undefined, questionId: string) => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (file: File) => testCaseApi.bulkUploadTestCases(questionId, file),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: testCaseKeys.all(questionId) });
      if (contestId) {
        queryClient.invalidateQueries({ queryKey: questionKeys.detail(contestId, questionId) });
        queryClient.invalidateQueries({ queryKey: questionKeys.all(contestId) });
      }
      queryClient.invalidateQueries({ queryKey: ['library', 'question', questionId] });
      queryClient.invalidateQueries({ queryKey: ['library', 'questions'] });
      // No success toast here — TestCaseBulkUploadResultReport already gives a
      // detailed per-row outcome, same reasoning Module 2 used for BulkImportResult.
    },
  });
};
