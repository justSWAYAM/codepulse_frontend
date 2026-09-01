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
    formState: { errors },
  } = useForm<EditUserFormData>({
    resolver: zodResolver(editUserSchema),
    defaultValues: { role: 'CANDIDATE', isActive: true },
  });

  useEffect(() => {
    if (editingUser) {
      setValue('role', editingUser.role);
      setValue('active', editingUser.isActive);
    }
  }, [editingUser, setValue]);

  const onSubmit = (data: EditUserFormData) => {
    if (!editingUser) return;
    updateMutation.mutate(
      {
        id: editingUser.id,
        payload: { role: data.role as UserRole, isActive: data.isActive },
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

                {/* Status */}
                <div>
                  <label className="block text-sm font-medium text-ink mb-1.5">Status</label>
                  <label className="flex items-center gap-3 cursor-pointer">
                    <input
                      type="checkbox"
                      className="w-4 h-4 rounded border-hairline text-accent-compile focus:ring-accent-compile/30 cursor-pointer"
                      {...register('active')}
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
