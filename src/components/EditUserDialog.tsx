import React, { useEffect, useId } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { Pencil } from 'lucide-react';
import { useUpdateUser } from '../hooks/useUsers';
import type { UserRecord, UserRole } from '../api/userApi';
import { Button, Dialog, Field, Input, Select } from './ui';

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
  const formId = useId();
  const activeId = useId();
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
  const noDivision = selectedBranch === 'MECH' || selectedBranch === 'ECS';

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
      },
    );
  };

  const handleClose = () => {
    reset();
    onClose();
  };

  return (
    <Dialog
      open={open && !!editingUser}
      onOpenChange={(o) => !o && handleClose()}
      title="Edit user"
      description={
        editingUser ? (
          <>
            {editingUser.fullName} · <span className="font-mono text-[12px]">{editingUser.email}</span>
          </>
        ) : undefined
      }
      icon={<Pencil className="size-[18px]" />}
      dismissible={!updateMutation.isPending}
      footer={
        <>
          <Button variant="secondary" onClick={handleClose} disabled={updateMutation.isPending}>
            Cancel
          </Button>
          <Button type="submit" form={formId} loading={updateMutation.isPending}>
            Save changes
          </Button>
        </>
      }
    >
      {editingUser && (
        <form id={formId} onSubmit={handleSubmit(onSubmit)} className="space-y-4" noValidate>
          <Field label="Role" error={errors.role?.message} required>
            {(p) => (
              <Select {...p} {...register('role')}>
                <option value="CANDIDATE">Candidate</option>
                <option value="EVALUATOR">Evaluator</option>
                <option value="ADMIN">Admin</option>
              </Select>
            )}
          </Field>

          {editingUser.role === 'CANDIDATE' && (
            <div className="space-y-4 rounded-xl border border-line bg-surface-2/60 p-4">
              <div className="grid grid-cols-2 gap-3">
                <Field label="Year">
                  {(p) => (
                    <Select {...p} defaultValue={editingUser.year || ''} {...register('year', { valueAsNumber: true })}>
                      <option value="">Select</option>
                      <option value="1">1st Year</option>
                      <option value="2">2nd Year</option>
                      <option value="3">3rd Year</option>
                      <option value="4">4th Year</option>
                    </Select>
                  )}
                </Field>
                <Field label="Branch">
                  {(p) => (
                    <Select {...p} defaultValue={editingUser.branch || ''} {...register('branch')}>
                      <option value="">Select</option>
                      <option value="CSE">CSE</option>
                      <option value="CE">CE</option>
                      <option value="ECS">ECS</option>
                      <option value="MECH">MECH</option>
                    </Select>
                  )}
                </Field>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <Field label="Division" hint={noDivision ? `Not used for ${selectedBranch}` : undefined}>
                  {(p) => (
                    <Select {...p} defaultValue={editingUser.division || ''} {...register('division')} disabled={noDivision}>
                      <option value="">Select</option>
                      <option value="A">A</option>
                      <option value="B">B</option>
                      <option value="C">C</option>
                    </Select>
                  )}
                </Field>
                <Field label="Batch">
                  {(p) => (
                    <Select {...p} defaultValue={editingUser.batch || ''} {...register('batch')}>
                      <option value="">Select</option>
                      <option value="A">A</option>
                      <option value="B">B</option>
                      <option value="C">C</option>
                      <option value="D">D</option>
                    </Select>
                  )}
                </Field>
              </div>

              <Field label="Roll number" error={errors.rollNumber?.message}>
                {(p) => (
                  <Input
                    {...p}
                    type="text"
                    inputMode="numeric"
                    placeholder="e.g. 123456"
                    className="tabular"
                    defaultValue={editingUser.rollNumber || ''}
                    {...register('rollNumber')}
                  />
                )}
              </Field>
            </div>
          )}

          <div className="flex items-start gap-3 rounded-xl border border-line px-4 py-3">
            <input
              id={activeId}
              type="checkbox"
              className="mt-0.5 size-4 shrink-0 cursor-pointer rounded accent-[var(--primary)] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring/50"
              {...register('isActive')}
            />
            <label htmlFor={activeId} className="min-w-0 cursor-pointer">
              <span className="block text-[13px] font-medium text-fg">Active</span>
              <span className="block text-[12px] text-fg-subtle">Inactive users can't sign in.</span>
            </label>
          </div>
        </form>
      )}
    </Dialog>
  );
};
