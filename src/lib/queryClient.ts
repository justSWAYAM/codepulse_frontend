import { QueryClient } from '@tanstack/react-query';
import { toast } from 'sonner';
import { getErrorMessage } from './apiError';

export const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      staleTime: 5 * 60 * 1000, // 5 minutes
      retry: 1,
      refetchOnWindowFocus: false,
    },
    mutations: {
      onError: (error: unknown) => {
        toast.error(getErrorMessage(error));
      },
    },
  },
});
