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
  // Backend CreateUserRequest.password is @NotBlank, 8–64 chars
  password: z
    .string()
    .min(8, 'Password must be at least 8 characters')
    .max(64, 'Password must be at most 64 characters'),
  rollNumber: z
    .string()
    .regex(/^\d*$/, 'Roll number must be numeric')
    .optional(),
  year: z.number().optional(),
  branch: z.enum(['CSE', 'CE', 'ECS', 'MECH', '']).optional(),
  division: z.enum(['A', 'B', 'C', '']).optional(),
  batch: z.enum(['A', 'B', 'C', 'D', '']).optional(),
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
    watch,
    formState: { errors },
  } = useForm<CreateUserFormData>({
    resolver: zodResolver(createUserSchema),
    defaultValues: { email: '', name: '', role: 'CANDIDATE', password: '' },
  });

  const selectedRole = watch('role');
  const selectedBranch = watch('branch');

  const onSubmit = (data: CreateUserFormData) => {
    const payload = {
      email: data.email,
      fullName: data.name,
      role: data.role as UserRole,
      password: data.password,
      ...(data.role === 'CANDIDATE' && data.rollNumber ? { rollNumber: data.rollNumber } : {}),
      ...(data.role === 'CANDIDATE' && data.year ? { year: data.year } : {}),
      ...(data.role === 'CANDIDATE' && data.branch ? { branch: data.branch } : {}),
      ...(data.role === 'CANDIDATE' && data.division && !['MECH', 'ECS'].includes(data.branch || '') ? { division: data.division } : {}),
      ...(data.role === 'CANDIDATE' && data.batch ? { batch: data.batch } : {}),
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
            className="fixed inset-0 bg-fg/20 backdrop-blur-sm z-50"
            onClick={handleClose}
          />

          {/* Dialog */}
          <div className="fixed inset-0 flex items-center justify-center z-50 p-4">
            <motion.div
              initial={{ opacity: 0, scale: 0.95, y: 8 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95, y: 8 }}
              transition={{ duration: 0.2, ease: 'easeOut' }}
              className="bg-surface rounded-2xl border border-line shadow-lg w-full max-w-md"
              onClick={(e) => e.stopPropagation()}
            >
              {/* Header */}
              <div className="flex items-center justify-between p-6 border-b border-line">
                <div className="flex items-center gap-3">
                  <div className="w-9 h-9 rounded-xl bg-primary/10 flex items-center justify-center">
                    <UserPlus className="w-4 h-4 text-primary-text" />
                  </div>
                  <div>
                    <h2 className="font-display text-lg font-semibold text-fg">Create User</h2>
                    <p className="text-xs text-fg-subtle">Add a new user to the platform</p>
                  </div>
                </div>
                <button
                  onClick={handleClose}
                  className="p-1.5 rounded-lg text-fg-subtle hover:text-fg hover:bg-fg/5 transition-colors cursor-pointer"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>

              {/* Form */}
              <form onSubmit={handleSubmit(onSubmit)} className="p-6 space-y-4">
                {/* Name */}
                <div>
                  <label className="block text-sm font-medium text-fg mb-1.5">Full Name</label>
                  <input
                    type="text"
                    placeholder="John Doe"
                    className={`w-full px-3.5 py-2.5 rounded-lg border text-sm bg-canvas placeholder:text-fg-subtle focus:outline-none focus:ring-2 focus:ring-ring focus:border-primary transition ${
                      errors.name ? 'border-danger' : 'border-line'
                    }`}
                    {...register('name')}
                  />
                  {errors.name && (
                    <p className="mt-1 text-xs text-danger-text">{errors.name.message}</p>
                  )}
                </div>

                {/* Email */}
                <div>
                  <label className="block text-sm font-medium text-fg mb-1.5">Email</label>
                  <input
                    type="email"
                    placeholder="user@institution.edu"
                    className={`w-full px-3.5 py-2.5 rounded-lg border text-sm bg-canvas placeholder:text-fg-subtle focus:outline-none focus:ring-2 focus:ring-ring focus:border-primary transition ${
                      errors.email ? 'border-danger' : 'border-line'
                    }`}
                    {...register('email')}
                  />
                  {errors.email && (
                    <p className="mt-1 text-xs text-danger-text">{errors.email.message}</p>
                  )}
                </div>

                {/* Role */}
                <div>
                  <label className="block text-sm font-medium text-fg mb-1.5">Role</label>
                  <select
                    className={`w-full px-3.5 py-2.5 rounded-lg border text-sm bg-canvas focus:outline-none focus:ring-2 focus:ring-ring focus:border-primary transition ${
                      errors.role ? 'border-danger' : 'border-line'
                    }`}
                    {...register('role')}
                  >
                    <option value="CANDIDATE">Candidate</option>
                    <option value="EVALUATOR">Evaluator</option>
                    <option value="ADMIN">Admin</option>
                  </select>
                  {errors.role && (
                    <p className="mt-1 text-xs text-danger-text">{errors.role.message}</p>
                  )}
                </div>

                {selectedRole === 'CANDIDATE' && (
                  <>
                    <div className="grid grid-cols-2 gap-4">
                      {/* Year */}
                      <div>
                        <label className="block text-sm font-medium text-fg mb-1.5">Year</label>
                        <select
                          className={`w-full px-3.5 py-2.5 rounded-lg border text-sm bg-canvas focus:outline-none focus:ring-2 focus:ring-ring focus:border-primary transition border-line`}
                          {...register('year', {
                            // valueAsNumber turns the empty "Select" option into NaN, which fails
                            // z.number() and silently blocks submit — map it to undefined instead
                            setValueAs: (v) => (v === '' || v == null ? undefined : Number(v)),
                          })}
                        >
                          <option value="">Select</option>
                          <option value="1">1st Year</option>
                          <option value="2">2nd Year</option>
                          <option value="3">3rd Year</option>
                          <option value="4">4th Year</option>
                        </select>
                      </div>

                      {/* Branch */}
                      <div>
                        <label className="block text-sm font-medium text-fg mb-1.5">Branch</label>
                        <select
                          className={`w-full px-3.5 py-2.5 rounded-lg border text-sm bg-canvas focus:outline-none focus:ring-2 focus:ring-ring focus:border-primary transition border-line`}
                          {...register('branch')}
                        >
                          <option value="">Select</option>
                          <option value="CSE">CSE</option>
                          <option value="CE">CE</option>
                          <option value="ECS">ECS</option>
                          <option value="MECH">MECH</option>
                        </select>
                      </div>
                    </div>

                    <div className="grid grid-cols-2 gap-4">
                      {/* Division */}
                      <div>
                        <label className="block text-sm font-medium text-fg mb-1.5">Division</label>
                        <select
                          className={`w-full px-3.5 py-2.5 rounded-lg border text-sm bg-canvas focus:outline-none focus:ring-2 focus:ring-ring focus:border-primary transition border-line disabled:opacity-50 disabled:cursor-not-allowed`}
                          {...register('division')}
                          disabled={selectedBranch === 'MECH' || selectedBranch === 'ECS'}
                        >
                          <option value="">Select</option>
                          <option value="A">A</option>
                          <option value="B">B</option>
                          <option value="C">C</option>
                        </select>
                      </div>

                      {/* Batch */}
                      <div>
                        <label className="block text-sm font-medium text-fg mb-1.5">Batch</label>
                        <select
                          className={`w-full px-3.5 py-2.5 rounded-lg border text-sm bg-canvas focus:outline-none focus:ring-2 focus:ring-ring focus:border-primary transition border-line`}
                          {...register('batch')}
                        >
                          <option value="">Select</option>
                          <option value="A">A</option>
                          <option value="B">B</option>
                          <option value="C">C</option>
                          <option value="D">D</option>
                        </select>
                      </div>
                    </div>

                    {/* Roll Number */}
                    <div>
                      <label className="block text-sm font-medium text-fg mb-1.5">Roll Number</label>
                      <input
                        type="text"
                        placeholder="e.g. 123456"
                        className={`w-full px-3.5 py-2.5 rounded-lg border text-sm bg-canvas placeholder:text-fg-subtle focus:outline-none focus:ring-2 focus:ring-ring focus:border-primary transition ${
                          errors.rollNumber ? 'border-danger' : 'border-line'
                        }`}
                        {...register('rollNumber')}
                      />
                      {errors.rollNumber && (
                        <p className="mt-1 text-xs text-danger-text">{errors.rollNumber.message}</p>
                      )}
                    </div>
                  </>
                )}

                {/* Password */}
                <div>
                  <label className="block text-sm font-medium text-fg mb-1.5">
                    Password{' '}
                    <span className="font-normal text-fg-subtle">(min 8 characters)</span>
                  </label>
                  <input
                    type="password"
                    placeholder="••••••••"
                    className={`w-full px-3.5 py-2.5 rounded-lg border text-sm bg-canvas placeholder:text-fg-subtle focus:outline-none focus:ring-2 focus:ring-ring focus:border-primary transition ${
                      errors.password ? 'border-danger' : 'border-line'
                    }`}
                    {...register('password')}
                  />
                  {errors.password && (
                    <p className="mt-1 text-xs text-danger-text">{errors.password.message}</p>
                  )}
                </div>

                {/* Actions */}
                <div className="flex items-center justify-end gap-2 pt-2">
                  <button
                    type="button"
                    onClick={handleClose}
                    className="px-4 py-2 rounded-lg text-sm font-medium text-fg-muted border border-line hover:border-line-strong hover:text-fg transition-colors cursor-pointer"
                  >
                    Cancel
                  </button>
                  <motion.button
                    type="submit"
                    disabled={createMutation.isPending}
                    whileHover={{ scale: 1.01 }}
                    whileTap={{ scale: 0.97 }}
                    className="px-4 py-2 rounded-lg bg-primary text-white text-sm font-medium hover:bg-primary-hover transition-colors disabled:opacity-60 disabled:cursor-not-allowed cursor-pointer flex items-center gap-2"
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
