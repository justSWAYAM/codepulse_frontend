import { useMutation, useQueryClient } from '@tanstack/react-query';
import { importApi } from './importApi';
import { libraryKeys } from '../../../hooks/useLibrary';
import type { ImportQuestionsBody } from './types';

export function useImportQuestions() {
  const qc = useQueryClient();

  const preview = useMutation({
    mutationFn: (body: ImportQuestionsBody) => importApi.importQuestions(body, true),
    meta: { silent: true },
  });

  const confirm = useMutation({
    mutationFn: (body: ImportQuestionsBody) => importApi.importQuestions(body, false),
    meta: { silent: true },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: libraryKeys.all });
    },
  });

  return { preview, confirm };
}
