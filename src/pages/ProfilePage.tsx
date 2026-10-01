import React, { useState, useEffect } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { AlertCircle, Eye, EyeOff, Lock, User } from 'lucide-react';
import { motion } from 'framer-motion';
import { useAuth } from '../context/AuthContext';
import { useCurrentUser, useUpdateProfile, useChangePassword } from '../hooks/useUsers';
import { RoleBadge } from '../components/RoleBadge';
import { StatusBadge } from '../components/StatusBadge';
import { LoadingState } from '../components/states/LoadingState';
import { Avatar } from '../layouts/AppShell';
import { Button, Card, CardBody, CardHeader, Field, IconButton, Input, PageHeader } from '../components/ui';

const EASE = [0.23, 1, 0.32, 1] as const;

const section = (i: number) => ({
  initial: { opacity: 0, y: 8 },
  animate: { opacity: 1, y: 0 },
  transition: { duration: 0.25, delay: i * 0.04, ease: EASE },
});

/** Password input with a show/hide toggle that keeps the field's aria wiring. */
const PasswordInput = React.forwardRef<
  HTMLInputElement,
  React.InputHTMLAttributes<HTMLInputElement> & { visible?: boolean; onToggle?: () => void }
>(function PasswordInput({ visible = false, onToggle, ...rest }, ref) {
  return (
    <div className="relative">
      <Input ref={ref} type={visible ? 'text' : 'password'} placeholder="••••••••" className={onToggle ? 'pr-11' : undefined} {...rest} />
      {onToggle && (
        <IconButton
          size="sm"
          aria-label={visible ? 'Hide password' : 'Show password'}
          aria-pressed={visible}
          onClick={onToggle}
          className="absolute right-1 top-1"
        >
          {visible ? <EyeOff className="size-4" /> : <Eye className="size-4" />}
        </IconButton>
      )}
    </div>
  );
});

// ── Profile Form ──
const profileSchema = z.object({
  fullName: z.string().min(1, 'Name is required').min(2, 'Name must be at least 2 characters'),
});

type ProfileFormData = z.infer<typeof profileSchema>;

const ProfileForm: React.FC<{ userName: string }> = ({ userName }) => {
  const updateMutation = useUpdateProfile();

  const {
    register,
    handleSubmit,
    reset,
    formState: { errors, isDirty },
  } = useForm<ProfileFormData>({
    resolver: zodResolver(profileSchema),
    defaultValues: { fullName: userName },
  });

  useEffect(() => {
    reset({ fullName: userName });
  }, [userName, reset]);

  const onSubmit = (data: ProfileFormData) => {
    updateMutation.mutate({ fullName: data.fullName });
  };

  return (
    <form onSubmit={handleSubmit(onSubmit)} noValidate className="space-y-4">
      <Field label="Full name" error={errors.fullName?.message}>
        {(p) => <Input {...p} type="text" autoComplete="name" {...register('fullName')} />}
      </Field>
      <div className="flex justify-end">
        <Button type="submit" loading={updateMutation.isPending} disabled={!isDirty && !updateMutation.isPending}>
          Save changes
        </Button>
      </div>
    </form>
  );
};

// ── Change Password Form ──
const passwordSchema = z
  .object({
    currentPassword: z.string().min(1, 'Current password is required'),
    newPassword: z.string().min(8, 'New password must be at least 8 characters').max(64, 'New password must be at most 64 characters'),
    confirmPassword: z.string().min(1, 'Please confirm your password'),
  })
  .refine((data) => data.newPassword === data.confirmPassword, {
    message: 'Passwords do not match',
    path: ['confirmPassword'],
  });

type PasswordFormData = z.infer<typeof passwordSchema>;

const ChangePasswordForm: React.FC = () => {
  const changeMutation = useChangePassword();
  const [serverError, setServerError] = useState<string | null>(null);
  const [showCurrent, setShowCurrent] = useState(false);
  const [showNew, setShowNew] = useState(false);

  const {
    register,
    handleSubmit,
    reset,
    formState: { errors },
  } = useForm<PasswordFormData>({
    resolver: zodResolver(passwordSchema),
    defaultValues: { currentPassword: '', newPassword: '', confirmPassword: '' },
  });

  const onSubmit = (data: PasswordFormData) => {
    setServerError(null);
    changeMutation.mutate(
      { currentPassword: data.currentPassword, newPassword: data.newPassword },
      {
        onSuccess: () => {
          reset();
        },
        onError: (error: unknown) => {
          const axiosError = error as {
            response?: { status?: number; data?: { message?: string } };
          };
          if (axiosError.response?.status === 401 || axiosError.response?.status === 400) {
            setServerError(
              axiosError.response?.data?.message || 'Current password is incorrect.'
            );
          } else {
            setServerError('Something went wrong. Please try again.');
          }
        },
      }
    );
  };

  return (
    <form onSubmit={handleSubmit(onSubmit)} noValidate className="space-y-4">
      {serverError && (
        <div
          role="alert"
          className="flex items-start gap-2 rounded-xl border border-danger/30 bg-danger-soft px-3 py-2.5 text-[13px] leading-5 text-danger-text"
        >
          <AlertCircle className="mt-0.5 size-4 shrink-0" aria-hidden />
          <p>{serverError}</p>
        </div>
      )}

      <Field label="Current password" error={errors.currentPassword?.message}>
        {(p) => (
          <PasswordInput
            {...p}
            autoComplete="current-password"
            visible={showCurrent}
            onToggle={() => setShowCurrent(!showCurrent)}
            {...register('currentPassword')}
          />
        )}
      </Field>

      <div className="grid gap-4 sm:grid-cols-2">
        <Field label="New password" hint="8–64 characters." error={errors.newPassword?.message}>
          {(p) => (
            <PasswordInput
              {...p}
              autoComplete="new-password"
              visible={showNew}
              onToggle={() => setShowNew(!showNew)}
              {...register('newPassword')}
            />
          )}
        </Field>

        <Field label="Confirm new password" error={errors.confirmPassword?.message}>
          {(p) => <PasswordInput {...p} autoComplete="new-password" {...register('confirmPassword')} />}
        </Field>
      </div>

      <div className="flex justify-end">
        <Button type="submit" loading={changeMutation.isPending}>
          Change password
        </Button>
      </div>
    </form>
  );
};

// ── Main Profile Page ──
const ProfilePage: React.FC = () => {
  const { user: authUser } = useAuth();
  const { data: profile, isLoading } = useCurrentUser();
  const displayUser = profile || authUser;

  if (isLoading) {
    return <LoadingState message="Loading profile…" />;
  }

  const details: { label: string; value?: string | number | null; mono?: boolean }[] = [
    { label: 'Email', value: displayUser?.email, mono: true },
    {
      label: 'Member since',
      value: profile?.createdAt
        ? new Date(profile.createdAt).toLocaleDateString('en-US', { month: 'long', day: 'numeric', year: 'numeric' })
        : null,
    },
    ...(displayUser?.role === 'CANDIDATE' && profile
      ? [
          { label: 'Roll number', value: profile.rollNumber, mono: true },
          { label: 'Year', value: profile.year },
          { label: 'Branch', value: profile.branch },
          { label: 'Division', value: profile.division },
          { label: 'Batch', value: profile.batch },
        ]
      : []),
  ];

  return (
    <div className="max-w-3xl space-y-6">
      <motion.div {...section(0)}>
        <PageHeader eyebrow="Account" title="My profile" description="Manage your account information and password." />
      </motion.div>

      <motion.div {...section(1)}>
        <Card>
          <div className="flex items-center gap-4 p-5 sm:p-6">
            <Avatar name={displayUser?.fullName} size={56} />
            <div className="min-w-0 flex-1">
              <h2 className="truncate font-display text-base font-semibold tracking-[-0.015em] text-fg">
                {displayUser?.fullName}
              </h2>
              <div className="mt-2 flex flex-wrap items-center gap-2">
                <RoleBadge role={displayUser?.role || 'CANDIDATE'} />
                {profile && <StatusBadge active={profile.isActive} />}
              </div>
            </div>
          </div>
          <dl className="grid grid-cols-1 gap-x-6 gap-y-4 border-t border-line px-5 py-5 sm:grid-cols-2 sm:px-6">
            {details
              .filter((d) => d.value !== null && d.value !== undefined && d.value !== '')
              .map((d) => (
                <div key={d.label} className="min-w-0">
                  <dt className="text-[12px] text-fg-subtle">{d.label}</dt>
                  <dd className={d.mono ? 'mt-0.5 truncate font-mono text-[13px] text-fg tabular' : 'mt-0.5 truncate text-sm text-fg tabular'}>
                    {d.value}
                  </dd>
                </div>
              ))}
          </dl>
        </Card>
      </motion.div>

      <motion.div {...section(2)}>
        <Card>
          <CardHeader icon={<User className="size-4" />} title="Personal information" description="Update your display name." />
          <CardBody>
            <ProfileForm userName={displayUser?.fullName || ''} />
          </CardBody>
        </Card>
      </motion.div>

      <motion.div {...section(3)}>
        <Card>
          <CardHeader icon={<Lock className="size-4" />} title="Change password" description="Use at least 8 characters." />
          <CardBody>
            <ChangePasswordForm />
          </CardBody>
        </Card>
      </motion.div>
    </div>
  );
};

export default ProfilePage;
