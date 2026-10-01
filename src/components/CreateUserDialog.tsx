import React, { useId } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { UserPlus } from 'lucide-react';
import { useCreateUser } from '../hooks/useUsers';
import type { UserRole } from '../api/userApi';
import { Button, Dialog, Field, Input, Select } from './ui';

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
  const formId = useId();
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
  const noDivision = selectedBranch === 'MECH' || selectedBranch === 'ECS';

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
    <Dialog
      open={open}
      onOpenChange={(o) => !o && handleClose()}
      title="Create user"
      description="Add a new account to the platform."
      icon={<UserPlus className="size-[18px]" />}
      dismissible={!createMutation.isPending}
      footer={
        <>
          <Button variant="secondary" onClick={handleClose} disabled={createMutation.isPending}>
            Cancel
          </Button>
          <Button type="submit" form={formId} loading={createMutation.isPending} leadingIcon={<UserPlus className="size-4" />}>
            Create user
          </Button>
        </>
      }
    >
      <form id={formId} onSubmit={handleSubmit(onSubmit)} className="space-y-4" noValidate>
        <Field label="Full name" error={errors.name?.message} required>
          {(p) => <Input {...p} type="text" placeholder="John Doe" autoComplete="off" {...register('name')} />}
        </Field>

        <Field label="Email" error={errors.email?.message} required>
          {(p) => <Input {...p} type="email" placeholder="user@institution.edu" autoComplete="off" {...register('email')} />}
        </Field>

        <Field label="Role" error={errors.role?.message} required>
          {(p) => (
            <Select {...p} {...register('role')}>
              <option value="CANDIDATE">Candidate</option>
              <option value="EVALUATOR">Evaluator</option>
              <option value="ADMIN">Admin</option>
            </Select>
          )}
        </Field>

        {selectedRole === 'CANDIDATE' && (
          <div className="space-y-4 rounded-xl border border-line bg-surface-2/60 p-4">
            <div className="grid grid-cols-2 gap-3">
              <Field label="Year">
                {(p) => (
                  <Select
                    {...p}
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
                  </Select>
                )}
              </Field>
              <Field label="Branch">
                {(p) => (
                  <Select {...p} {...register('branch')}>
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
                  <Select {...p} {...register('division')} disabled={noDivision}>
                    <option value="">Select</option>
                    <option value="A">A</option>
                    <option value="B">B</option>
                    <option value="C">C</option>
                  </Select>
                )}
              </Field>
              <Field label="Batch">
                {(p) => (
                  <Select {...p} {...register('batch')}>
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
              {(p) => <Input {...p} type="text" inputMode="numeric" placeholder="e.g. 123456" className="tabular" {...register('rollNumber')} />}
            </Field>
          </div>
        )}

        <Field label="Password" hint="8–64 characters." error={errors.password?.message} required>
          {(p) => <Input {...p} type="password" placeholder="••••••••" autoComplete="new-password" {...register('password')} />}
        </Field>
      </form>
    </Dialog>
  );
};
