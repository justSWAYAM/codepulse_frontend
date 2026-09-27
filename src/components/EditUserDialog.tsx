import React, { useEffect } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { X, Loader2, Pencil } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { useUpdateUser } from '../hooks/useUsers';
import type { UserRecord, UserRole } from '../api/userApi';

const editUserSchema = z.object({
  role: z.enum(['CANDIDATE', 'EVALUATOR', 'ADMIN'] as const),
  isActive: z.boolean(),
  rollNumber: z.string().optional(),
  year: z.number().optional(),
  branch: z.enum(['CSE', 'CE', 'ECS', 'MECH', '']).optional(),
  division: z.enum(['A', 'B', 'C', '']).optional(),
  batch: z.enum(['A', 'B', 'C', 'D', '']).optional(),
});

type EditUserFormData = z.infer<typeof editUserSchema>;

interface EditUserDialogProps {
  open: boolean;
  user: UserRecord | null;
  onClose: () => void;
}

export const EditUserDialog: React.FC<EditUserDialogProps> = ({ open, user: editingUser, onClose }) => {
  const updateMutation = useUpdateUser();

  const {
    register,
    handleSubmit,
    reset,
    setValue,
    watch,
    formState: { errors },
  } = useForm<EditUserFormData>({
    resolver: zodResolver(editUserSchema),
    defaultValues: { role: 'CANDIDATE', isActive: true },
  });

  const selectedBranch = watch('branch');

  useEffect(() => {
    if (editingUser) {
      setValue('role', editingUser.role);
      setValue('isActive', editingUser.isActive);
      if (editingUser.role === 'CANDIDATE') {
        setValue('year', editingUser.year || undefined);
        setValue('branch', (editingUser.branch as any) || '');
        setValue('division', (editingUser.division as any) || '');
        setValue('batch', (editingUser.batch as any) || '');
        setValue('rollNumber', editingUser.rollNumber || '');
      }
    }
  }, [editingUser, setValue]);

  const onSubmit = (data: EditUserFormData) => {
    if (!editingUser) return;
    
    const payload: any = { role: data.role as UserRole, isActive: data.isActive };
    if (data.role === 'CANDIDATE') {
      if (data.rollNumber) payload.rollNumber = data.rollNumber;
      if (data.year) payload.year = data.year;
      if (data.branch) payload.branch = data.branch;
      if (data.division && !['MECH', 'ECS'].includes(data.branch || '')) payload.division = data.division;
      if (data.batch) payload.batch = data.batch;
    }

    updateMutation.mutate(
      {
        id: editingUser.id,
        payload,
      },
      {
        onSuccess: () => {
          onClose();
        },
      }
    );
  };

  const handleClose = () => {
    reset();
    onClose();
  };

  return (
    <AnimatePresence>
      {open && editingUser && (
        <>
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-ink/20 backdrop-blur-sm z-50"
            onClick={handleClose}
          />

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
                  <div className="w-9 h-9 rounded-xl bg-accent-syntax/10 flex items-center justify-center">
                    <Pencil className="w-4 h-4 text-accent-syntax" />
                  </div>
                  <div>
                    <h2 className="font-display text-lg font-semibold text-ink">Edit User</h2>
                    <p className="text-xs text-ink/40">{editingUser.fullName} · {editingUser.email}</p>
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
                </div>

                {editingUser.role === 'CANDIDATE' && (
                  <>
                    <div className="grid grid-cols-2 gap-4">
                      {/* Year */}
                      <div>
                        <label className="block text-sm font-medium text-ink mb-1.5">Year</label>
                        <select
                          className={`w-full px-3.5 py-2.5 rounded-lg border text-sm bg-background focus:outline-none focus:ring-2 focus:ring-accent-compile/30 focus:border-accent-compile transition-all border-hairline`}
                          defaultValue={editingUser.year || ""}
                          {...register('year', { valueAsNumber: true })}
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
                        <label className="block text-sm font-medium text-ink mb-1.5">Branch</label>
                        <select
                          className={`w-full px-3.5 py-2.5 rounded-lg border text-sm bg-background focus:outline-none focus:ring-2 focus:ring-accent-compile/30 focus:border-accent-compile transition-all border-hairline`}
                          defaultValue={editingUser.branch || ""}
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
                        <label className="block text-sm font-medium text-ink mb-1.5">Division</label>
                        <select
                          className={`w-full px-3.5 py-2.5 rounded-lg border text-sm bg-background focus:outline-none focus:ring-2 focus:ring-accent-compile/30 focus:border-accent-compile transition-all border-hairline disabled:opacity-50 disabled:cursor-not-allowed`}
                          defaultValue={editingUser.division || ""}
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
                        <label className="block text-sm font-medium text-ink mb-1.5">Batch</label>
                        <select
                          className={`w-full px-3.5 py-2.5 rounded-lg border text-sm bg-background focus:outline-none focus:ring-2 focus:ring-accent-compile/30 focus:border-accent-compile transition-all border-hairline`}
                          defaultValue={editingUser.batch || ""}
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
                      <label className="block text-sm font-medium text-ink mb-1.5">Roll Number</label>
                      <input
                        type="text"
                        placeholder="e.g. 123456"
                        defaultValue={editingUser.rollNumber || ""}
                        className={`w-full px-3.5 py-2.5 rounded-lg border text-sm bg-background placeholder:text-ink/30 focus:outline-none focus:ring-2 focus:ring-accent-compile/30 focus:border-accent-compile transition-all border-hairline`}
                        {...register('rollNumber')}
                      />
                    </div>
                  </>
                )}

                {/* Status */}
                <div>
                  <label className="block text-sm font-medium text-ink mb-1.5">Status</label>
                  <label className="flex items-center gap-3 cursor-pointer">
                    <input
                      type="checkbox"
                      className="w-4 h-4 rounded border-hairline text-accent-compile focus:ring-accent-compile/30 cursor-pointer"
                      {...register('isActive')}
                    />
                    <span className="text-sm text-ink/70">Active</span>
                  </label>
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
                    disabled={updateMutation.isPending}
                    whileHover={{ scale: 1.01 }}
                    whileTap={{ scale: 0.97 }}
                    className="px-4 py-2 rounded-lg bg-accent-compile text-white text-sm font-medium hover:bg-accent-compile-hover transition-colors disabled:opacity-60 disabled:cursor-not-allowed cursor-pointer flex items-center gap-2"
                  >
                    {updateMutation.isPending ? (
                      <>
                        <Loader2 className="w-3.5 h-3.5 animate-spin" />
                        Saving...
                      </>
                    ) : (
                      'Save Changes'
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
