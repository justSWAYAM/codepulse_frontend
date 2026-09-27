import { useMutation, useQueryClient } from '@tanstack/react-query';
import { useNavigate, useLocation } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { type LoginPayload } from '../api/auth';
import { toast } from 'sonner';

export const useLogin = () => {
  const { login } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();

  const from = (location.state as { from?: { pathname: string } })?.from?.pathname || '/dashboard';

  return useMutation({
    mutationFn: async (payload: LoginPayload) => {
      await login(payload);
    },
    onSuccess: () => {
      toast.success('Logged in successfully');
      navigate(from, { replace: true });
    },
    // Don't use the global error handler — we show inline errors
    onError: () => {
      // Error is handled inline in the LoginForm component
    },
  });
};

export const useLogout = () => {
  const { logout } = useAuth();
  const navigate = useNavigate();
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async () => {
      await logout();
    },
    onSuccess: () => {
      queryClient.clear();
      navigate('/login', { replace: true });
    },
  });
};
