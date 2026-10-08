import apiClient from '../../../lib/apiClient';
import type { ApiWrapper } from '../../../api/auth';
import type { QuestionType, ImportQuestionsBody, ImportTemplate, QuestionImportResponse } from './types';

export const importApi = {
  getTemplate: (type: QuestionType): Promise<ImportTemplate> =>
    apiClient
      .get<ApiWrapper<ImportTemplate>>('/library/import-template', { params: { type } })
      .then((r) => r.data.data),

  importQuestions: (body: ImportQuestionsBody, dryRun: boolean): Promise<QuestionImportResponse> =>
    apiClient
      .post<ApiWrapper<QuestionImportResponse>>('/library/questions/import', body, { params: { dryRun } })
      .then((r) => r.data.data),
};

export function importErrorMessage(err: unknown): string {
  const data = (err as { response?: { data?: { code?: string; message?: string } } })?.response?.data;
  switch (data?.code) {
    case 'IMPORT_PAYLOAD_TOO_LARGE':
      return 'The pasted text is too large. Import fewer questions at a time.';
    case 'IMPORT_LIMIT_EXCEEDED':
      return data?.message ?? 'Too many questions in one import. Split the list into batches.';
    case 'IMPORT_PAYLOAD_INVALID':
      return data?.message ?? 'That is not valid JSON. Paste the exact output of the AI.';
    case 'SUBJECT_NOT_FOUND':
      return 'This folder no longer exists. Close the dialog and refresh the library.';
    default:
      return data?.message ?? 'Something went wrong. Please try again.';
  }
}
