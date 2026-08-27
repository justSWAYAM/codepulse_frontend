import React, { useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { Link } from 'react-router-dom';
import { ArrowLeft, Loader2, Mail, Lock } from 'lucide-react';
import { motion } from 'framer-motion';
import { AuthLayout } from '../layouts/AuthLayout';
import { useLogin } from '../hooks/useAuth';

const loginSchema = z.object({
  email: z.string().min(1, 'Email is required').email('Enter a valid email address'),
  password: z.string().min(1, 'Password is required'),
});

type LoginFormData = z.infer<typeof loginSchema>;

const LoginPage: React.FC = () => {
  const loginMutation = useLogin();
  const [serverError, setServerError] = useState<string | null>(null);

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
          setServerError('Invalid email or password. Please try again.');
        } else {
          setServerError(
            axiosError.response?.data?.message || 'Something went wrong. Please try again.'
          );
        }
      },
    });
  };

  return (
    <AuthLayout>
      <motion.div
        initial={{ opacity: 0, y: 16 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.4, ease: 'easeOut' }}
        className="w-full max-w-[420px]"
      >
        <div className="bg-surface rounded-2xl border border-hairline p-8 shadow-sm">
          {/* Back to home */}
          <Link
            to="/"
            className="inline-flex items-center gap-1.5 text-sm text-ink/50 hover:text-ink transition-colors mb-6"
          >
            <ArrowLeft className="w-4 h-4" />
            Back to home
          </Link>

          <h1 className="font-display text-2xl font-bold text-ink mb-1">Welcome back</h1>
          <p className="text-sm text-ink/50 mb-8">Log in to your CodePulse account</p>

          {/* Server error */}
          {serverError && (
            <div className="mb-4 p-3 rounded-lg bg-accent-error/10 border border-accent-error/20">
              <p className="text-sm text-accent-error">{serverError}</p>
            </div>
          )}

          <form onSubmit={handleSubmit(onSubmit)} className="space-y-5">
            {/* Email */}
            <div>
              <label htmlFor="email" className="block text-sm font-medium text-ink mb-1.5">
                Email
              </label>
              <div className="relative">
                <Mail className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-ink/30" />
                <input
                  id="email"
                  type="email"
                  autoComplete="email"
                  placeholder="you@institution.edu"
                  className={`w-full pl-10 pr-4 py-2.5 rounded-lg border text-sm bg-background placeholder:text-ink/30 focus:outline-none focus:ring-2 focus:ring-accent-compile/30 focus:border-accent-compile transition-all ${
                    errors.email ? 'border-accent-error' : 'border-hairline'
                  }`}
                  {...register('email')}
                />
              </div>
              {errors.email && (
                <p className="mt-1.5 text-xs text-accent-error">{errors.email.message}</p>
              )}
            </div>

            {/* Password */}
            <div>
              <label htmlFor="password" className="block text-sm font-medium text-ink mb-1.5">
                Password
              </label>
              <div className="relative">
                <Lock className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-ink/30" />
                <input
                  id="password"
                  type="password"
                  autoComplete="current-password"
                  placeholder="••••••••"
                  className={`w-full pl-10 pr-4 py-2.5 rounded-lg border text-sm bg-background placeholder:text-ink/30 focus:outline-none focus:ring-2 focus:ring-accent-compile/30 focus:border-accent-compile transition-all ${
                    errors.password ? 'border-accent-error' : 'border-hairline'
                  }`}
                  {...register('password')}
                />
              </div>
              {errors.password && (
                <p className="mt-1.5 text-xs text-accent-error">{errors.password.message}</p>
              )}
            </div>

            {/* Submit */}
            <motion.button
              type="submit"
              disabled={loginMutation.isPending}
              whileHover={{ scale: 1.01 }}
              whileTap={{ scale: 0.97 }}
              className="w-full py-2.5 rounded-lg bg-accent-compile text-white font-medium text-sm hover:bg-accent-compile-hover transition-colors disabled:opacity-60 disabled:cursor-not-allowed cursor-pointer flex items-center justify-center gap-2"
            >
              {loginMutation.isPending ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin" />
                  Logging in...
                </>
              ) : (
                'Log in'
              )}
            </motion.button>
          </form>

          {/* Account note */}
          <p className="mt-6 text-xs text-center text-ink/40 leading-relaxed">
            Accounts are created by your institution admin.
            <br />
            Contact them if you don't have one yet.
          </p>
        </div>
      </motion.div>
    </AuthLayout>
  );
};

export default LoginPage;
