import React, { useState } from 'react';
import { getErrorMessage } from '../lib/apiError';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { Link } from 'react-router-dom';
import { AlertCircle, ArrowLeft, Eye, EyeOff } from 'lucide-react';
import { motion } from 'framer-motion';
import { AuthLayout } from '../layouts/AuthLayout';
import { useLogin } from '../hooks/useAuth';
import { Button, Card, Field, IconButton, Input } from '../components/ui';

const loginSchema = z.object({
  email: z.string().min(1, 'Email is required').email('Enter a valid email address'),
  password: z.string().min(1, 'Password is required'),
});

type LoginFormData = z.infer<typeof loginSchema>;

const LoginPage: React.FC = () => {
  const loginMutation = useLogin();
  const [serverError, setServerError] = useState<string | null>(null);
  const [showPassword, setShowPassword] = useState(false);

  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<LoginFormData>({
    resolver: zodResolver(loginSchema),
    defaultValues: { email: '', password: '' },
  });

  const onSubmit = (data: LoginFormData) => {
    setServerError(null);
    loginMutation.mutate(data, {
      onError: (error: unknown) => {
        const axiosError = error as { response?: { status?: number; data?: { message?: string } } };
        if (axiosError.response?.status === 401) {
          setServerError('Invalid email or password. Check them and try again.');
        } else {
          setServerError(getErrorMessage(error));
        }
      },
    });
  };

  return (
    <AuthLayout>
      <motion.div
        initial={{ opacity: 0, y: 8 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.25, ease: [0.23, 1, 0.32, 1] }}
      >
        <Card className="p-6 sm:p-8">
          <h1 className="font-display text-2xl font-semibold tracking-[-0.03em] text-fg">Welcome back</h1>
          <p className="mt-1 text-sm text-fg-muted">Log in to your CodePulse account.</p>

          {serverError && (
            <div
              role="alert"
              className="mt-6 flex items-start gap-2 rounded-xl border border-danger/30 bg-danger-soft px-3 py-2.5 text-[13px] leading-5 text-danger-text"
            >
              <AlertCircle className="mt-0.5 size-4 shrink-0" aria-hidden />
              <p>{serverError}</p>
            </div>
          )}

          <form onSubmit={handleSubmit(onSubmit)} noValidate className="mt-6 space-y-4">
            <Field label="Email" error={errors.email?.message}>
              {(p) => (
                <Input
                  {...p}
                  type="email"
                  autoComplete="email"
                  placeholder="you@institution.edu"
                  {...register('email')}
                />
              )}
            </Field>

            <Field label="Password" error={errors.password?.message}>
              {(p) => (
                <div className="relative">
                  <Input
                    {...p}
                    type={showPassword ? 'text' : 'password'}
                    autoComplete="current-password"
                    placeholder="••••••••"
                    className="pr-11"
                    {...register('password')}
                  />
                  <IconButton
                    size="sm"
                    aria-label={showPassword ? 'Hide password' : 'Show password'}
                    aria-pressed={showPassword}
                    onClick={() => setShowPassword((s) => !s)}
                    className="absolute right-1 top-1"
                  >
                    {showPassword ? <EyeOff className="size-4" /> : <Eye className="size-4" />}
                  </IconButton>
                </div>
              )}
            </Field>

            <Button type="submit" className="w-full" loading={loginMutation.isPending}>
              Log in
            </Button>
          </form>

          <p className="mt-6 text-center text-[13px] leading-5 text-fg-subtle">
            Accounts are created by your institution admin. Contact them if you don't have one yet.
          </p>
        </Card>

        <div className="mt-6 text-center">
          <Link
            to="/"
            className="inline-flex items-center gap-1.5 rounded-lg text-[13px] text-fg-muted transition-colors duration-150 hover-fine:text-fg"
          >
            <ArrowLeft className="size-3.5" aria-hidden />
            Back to home
          </Link>
        </div>
      </motion.div>
    </AuthLayout>
  );
};

export default LoginPage;
