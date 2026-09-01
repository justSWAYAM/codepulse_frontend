import React from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { X, Loader2, UserPlus } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { useCreateUser } from '../hooks/useUsers';
import type { UserRole } from '../api/userApi';

const createUserSchema = z.object({
  email: z.string().min(1, 'Email is required').email('Enter a valid email address'),
  name: z.string().min(1, 'Full name is required').min(2, 'Name must be at least 2 characters'),
  role: z.enum(['CANDIDATE', 'EVALUATOR', 'ADMIN'] as const),
  password: z.string().min(6, 'Password must be at least 6 characters').optional().or(z.literal('')),
});

type CreateUserFormData = z.infer<typeof createUserSchema>;

interface CreateUserDialogProps {
  open: boolean;
  onClose: () => void;
}

export const CreateUserDialog: React.FC<CreateUserDialogProps> = ({ open, onClose }) => {
  const createMutation = useCreateUser();

  const {
    register,
    handleSubmit,
    reset,
    formState: { errors },
  } = useForm<CreateUserFormData>({
    resolver: zodResolver(createUserSchema),
    defaultValues: { email: '', name: '', role: 'CANDIDATE', password: '' },
  });

  const onSubmit = (data: CreateUserFormData) => {
    const payload = {
      email: data.email,
      fullName: data.name,
      role: data.role as UserRole,
      ...(data.password ? { password: data.password } : {}),
    };
    createMutation.mutate(payload, {
      onSuccess: () => {
        reset();
        onClose();
      },
    });
  };

  const handleClose = () => {
    reset();
    onClose();
  };

  return (
    <AnimatePresence>
      {open && (
        <>
          {/* Backdrop */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-ink/20 backdrop-blur-sm z-50"
            onClick={handleClose}
          />

          {/* Dialog */}
          <div className="fixed inset-0 flex items-center justify-center z-50 p-4">
            <motion.div
              initial={{ opacity: 0, scale: 0.95, y: 8 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95, y: 8 }}
              transition={{ duration: 0.2, ease: 'easeOut' }}
              className="bg-surface rounded-2xl border border-hairline shadow-lg w-full max-w-md"
              onClick={(e) => e.stopPropagation()}
            >
              {/* Header */}
              <div className="flex items-center justify-between p-6 border-b border-hairline">
                <div className="flex items-center gap-3">
                  <div className="w-9 h-9 rounded-xl bg-accent-compile/10 flex items-center justify-center">
                    <UserPlus className="w-4 h-4 text-accent-compile" />
                  </div>
                  <div>
                    <h2 className="font-display text-lg font-semibold text-ink">Create User</h2>
                    <p className="text-xs text-ink/40">Add a new user to the platform</p>
                  </div>
                </div>
                <button
                  onClick={handleClose}
                  className="p-1.5 rounded-lg text-ink/30 hover:text-ink hover:bg-ink/5 transition-colors cursor-pointer"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>

              {/* Form */}
              <form onSubmit={handleSubmit(onSubmit)} className="p-6 space-y-4">
                {/* Name */}
                <div>
                  <label className="block text-sm font-medium text-ink mb-1.5">Full Name</label>
                  <input
                    type="text"
                    placeholder="John Doe"
                    className={`w-full px-3.5 py-2.5 rounded-lg border text-sm bg-background placeholder:text-ink/30 focus:outline-none focus:ring-2 focus:ring-accent-compile/30 focus:border-accent-compile transition-all ${
                      errors.name ? 'border-accent-error' : 'border-hairline'
                    }`}
                    {...register('name')}
                  />
                  {errors.name && (
                    <p className="mt-1 text-xs text-accent-error">{errors.name.message}</p>
                  )}
                </div>

                {/* Email */}
                <div>
                  <label className="block text-sm font-medium text-ink mb-1.5">Email</label>
                  <input
                    type="email"
                    placeholder="user@institution.edu"
                    className={`w-full px-3.5 py-2.5 rounded-lg border text-sm bg-background placeholder:text-ink/30 focus:outline-none focus:ring-2 focus:ring-accent-compile/30 focus:border-accent-compile transition-all ${
                      errors.email ? 'border-accent-error' : 'border-hairline'
                    }`}
                    {...register('email')}
                  />
                  {errors.email && (
                    <p className="mt-1 text-xs text-accent-error">{errors.email.message}</p>
                  )}
                </div>

                {/* Role */}
                <div>
                  <label className="block text-sm font-medium text-ink mb-1.5">Role</label>
                  <select
                    className={`w-full px-3.5 py-2.5 rounded-lg border text-sm bg-background focus:outline-none focus:ring-2 focus:ring-accent-compile/30 focus:border-accent-compile transition-all ${
                      errors.role ? 'border-accent-error' : 'border-hairline'
                    }`}
                    {...register('role')}
                  >
                    <option value="CANDIDATE">Candidate</option>
                    <option value="EVALUATOR">Evaluator</option>
                    <option value="ADMIN">Admin</option>
                  </select>
                  {errors.role && (
                    <p className="mt-1 text-xs text-accent-error">{errors.role.message}</p>
                  )}
                </div>

                {/* Password */}
                <div>
                  <label className="block text-sm font-medium text-ink mb-1.5">
                    Password{' '}
                    <span className="font-normal text-ink/40">(optional — auto-generated if empty)</span>
                  </label>
                  <input
                    type="password"
                    placeholder="••••••••"
                    className={`w-full px-3.5 py-2.5 rounded-lg border text-sm bg-background placeholder:text-ink/30 focus:outline-none focus:ring-2 focus:ring-accent-compile/30 focus:border-accent-compile transition-all ${
                      errors.password ? 'border-accent-error' : 'border-hairline'
                    }`}
                    {...register('password')}
                  />
                  {errors.password && (
                    <p className="mt-1 text-xs text-accent-error">{errors.password.message}</p>
                  )}
                </div>

                {/* Actions */}
                <div className="flex items-center justify-end gap-2 pt-2">
                  <button
                    type="button"
                    onClick={handleClose}
                    className="px-4 py-2 rounded-lg text-sm font-medium text-ink/60 border border-hairline hover:border-ink/20 hover:text-ink transition-colors cursor-pointer"
                  >
                    Cancel
                  </button>
                  <motion.button
                    type="submit"
                    disabled={createMutation.isPending}
                    whileHover={{ scale: 1.01 }}
                    whileTap={{ scale: 0.97 }}
                    className="px-4 py-2 rounded-lg bg-accent-compile text-white text-sm font-medium hover:bg-accent-compile-hover transition-colors disabled:opacity-60 disabled:cursor-not-allowed cursor-pointer flex items-center gap-2"
                  >
                    {createMutation.isPending ? (
                      <>
                        <Loader2 className="w-3.5 h-3.5 animate-spin" />
                        Creating...
                      </>
                    ) : (
                      'Create User'
                    )}
                  </motion.button>
                </div>
              </form>
            </motion.div>
          </div>
        </>
      )}
    </AnimatePresence>
  );
};
