import { QueryClient } from '@tanstack/react-query';
import { toast } from 'sonner';

export const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      staleTime: 5 * 60 * 1000, // 5 minutes
      retry: 1,
      refetchOnWindowFocus: false,
    },
    mutations: {
      onError: (error: unknown) => {
        const message =
          (error as { response?: { data?: { message?: string } } })?.response
            ?.data?.message || 'Something went wrong. Please try again.';
        toast.error(message);
      },
    },
  },
});
