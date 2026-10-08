import { useQuery } from '@tanstack/react-query';
import { importApi } from './importApi';
import type { QuestionType } from './types';

export function useImportTemplate(type: QuestionType | null, enabled = true) {
  return useQuery({
    queryKey: ['library', 'import-template', type],
    queryFn: () => importApi.getTemplate(type as QuestionType),
    enabled: enabled && type !== null,
    staleTime: 5 * 60 * 1000,
  });
}
