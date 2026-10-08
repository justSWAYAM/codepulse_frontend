import { MutationCache, QueryClient } from '@tanstack/react-query';
import { toast } from 'sonner';
import { getErrorMessage } from './apiError';

export const queryClient = new QueryClient({
  mutationCache: new MutationCache({
    onError: (error: unknown, _variables: unknown, _context: unknown, mutation) => {
      if ((mutation.meta as { silent?: boolean } | undefined)?.silent) return;
      toast.error(getErrorMessage(error));
    },
  }),
  defaultOptions: {
    queries: {
      staleTime: 5 * 60 * 1000, // 5 minutes
      retry: 1,
      refetchOnWindowFocus: false,
    },
  },
});
