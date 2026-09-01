import React, { useState, useEffect } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import {
  User,
  Mail,
  Shield,
  Calendar,
  Lock,
  Loader2,
  Eye,
  EyeOff,
} from 'lucide-react';
import { motion } from 'framer-motion';
import { useAuth } from '../context/AuthContext';
import { useCurrentUser, useUpdateProfile, useChangePassword } from '../hooks/useUsers';
import { RoleBadge } from '../components/RoleBadge';
import { StatusBadge } from '../components/StatusBadge';
import { LoadingState } from '../components/states/LoadingState';

const container = {
  hidden: { opacity: 0 },
  show: {
    opacity: 1,
    transition: { staggerChildren: 0.08, delayChildren: 0.1 },
  },
};

const item = {
  hidden: { opacity: 0, y: 12 },
  show: { opacity: 1, y: 0, transition: { duration: 0.35 } },
};

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
    updateMutation.mutate({ fullName: data.name });
  };

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
      <div>
        <label className="block text-sm font-medium text-ink mb-1.5">Full Name</label>
        <input
          type="text"
          className={`w-full px-3.5 py-2.5 rounded-lg border text-sm bg-background placeholder:text-ink/30 focus:outline-none focus:ring-2 focus:ring-accent-compile/30 focus:border-accent-compile transition-all ${
            errors.fullName ? 'border-accent-error' : 'border-hairline'
          }`}
          {...register('fullName')}
        />
        {errors.fullName && (
          <p className="mt-1 text-xs text-accent-error">{errors.fullName.message}</p>
        )}
      </div>
      <div className="flex justify-end">
        <motion.button
          type="submit"
          disabled={updateMutation.isPending || !isDirty}
          whileHover={{ scale: 1.01 }}
          whileTap={{ scale: 0.97 }}
          className="px-4 py-2 rounded-lg bg-accent-compile text-white text-sm font-medium hover:bg-accent-compile-hover transition-colors disabled:opacity-40 disabled:cursor-not-allowed cursor-pointer flex items-center gap-2"
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
  );
};

// ── Change Password Form ──
const passwordSchema = z
  .object({
    currentPassword: z.string().min(1, 'Current password is required'),
    newPassword: z.string().min(6, 'New password must be at least 6 characters'),
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
    <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
      {serverError && (
        <div className="p-3 rounded-lg bg-accent-error/10 border border-accent-error/20">
          <p className="text-sm text-accent-error">{serverError}</p>
        </div>
      )}

      {/* Current Password */}
      <div>
        <label className="block text-sm font-medium text-ink mb-1.5">Current Password</label>
        <div className="relative">
          <Lock className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-ink/30" />
          <input
            type={showCurrent ? 'text' : 'password'}
            placeholder="••••••••"
            className={`w-full pl-10 pr-10 py-2.5 rounded-lg border text-sm bg-background placeholder:text-ink/30 focus:outline-none focus:ring-2 focus:ring-accent-compile/30 focus:border-accent-compile transition-all ${
              errors.currentPassword ? 'border-accent-error' : 'border-hairline'
            }`}
            {...register('currentPassword')}
          />
          <button
            type="button"
            onClick={() => setShowCurrent(!showCurrent)}
            className="absolute right-3 top-1/2 -translate-y-1/2 text-ink/30 hover:text-ink/60 transition-colors cursor-pointer"
          >
            {showCurrent ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
          </button>
        </div>
        {errors.currentPassword && (
          <p className="mt-1 text-xs text-accent-error">{errors.currentPassword.message}</p>
        )}
      </div>

      {/* New Password */}
      <div>
        <label className="block text-sm font-medium text-ink mb-1.5">New Password</label>
        <div className="relative">
          <Lock className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-ink/30" />
          <input
            type={showNew ? 'text' : 'password'}
            placeholder="••••••••"
            className={`w-full pl-10 pr-10 py-2.5 rounded-lg border text-sm bg-background placeholder:text-ink/30 focus:outline-none focus:ring-2 focus:ring-accent-compile/30 focus:border-accent-compile transition-all ${
              errors.newPassword ? 'border-accent-error' : 'border-hairline'
            }`}
            {...register('newPassword')}
          />
          <button
            type="button"
            onClick={() => setShowNew(!showNew)}
            className="absolute right-3 top-1/2 -translate-y-1/2 text-ink/30 hover:text-ink/60 transition-colors cursor-pointer"
          >
            {showNew ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
          </button>
        </div>
        {errors.newPassword && (
          <p className="mt-1 text-xs text-accent-error">{errors.newPassword.message}</p>
        )}
      </div>

      {/* Confirm Password */}
      <div>
        <label className="block text-sm font-medium text-ink mb-1.5">Confirm New Password</label>
        <div className="relative">
          <Lock className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-ink/30" />
          <input
            type="password"
            placeholder="••••••••"
            className={`w-full pl-10 pr-4 py-2.5 rounded-lg border text-sm bg-background placeholder:text-ink/30 focus:outline-none focus:ring-2 focus:ring-accent-compile/30 focus:border-accent-compile transition-all ${
              errors.confirmPassword ? 'border-accent-error' : 'border-hairline'
            }`}
            {...register('confirmPassword')}
          />
        </div>
        {errors.confirmPassword && (
          <p className="mt-1 text-xs text-accent-error">{errors.confirmPassword.message}</p>
        )}
      </div>

      <div className="flex justify-end">
        <motion.button
          type="submit"
          disabled={changeMutation.isPending}
          whileHover={{ scale: 1.01 }}
          whileTap={{ scale: 0.97 }}
          className="px-4 py-2 rounded-lg bg-ink text-white text-sm font-medium hover:bg-ink/90 transition-colors disabled:opacity-60 disabled:cursor-not-allowed cursor-pointer flex items-center gap-2"
        >
          {changeMutation.isPending ? (
            <>
              <Loader2 className="w-3.5 h-3.5 animate-spin" />
              Changing...
            </>
          ) : (
            'Change Password'
          )}
        </motion.button>
      </div>
    </form>
  );
};

// ── Main Profile Page ──
const ProfilePage: React.FC = () => {
  const { user: authUser } = useAuth();
  const { data: profile, isLoading } = useCurrentUser();

  const displayUser = profile || authUser;
  // 'profile' uses 'fullName', 'authUser' uses 'name'
  const displayName = (displayUser as any)?.fullName || (displayUser as any)?.name || '';

  if (isLoading) {
    return <LoadingState message="Loading profile..." />;
  }

  return (
    <motion.div variants={container} initial="hidden" animate="show" className="max-w-2xl">
      {/* Header */}
      <motion.div variants={item} className="mb-8">
        <h1 className="font-display text-2xl md:text-3xl font-bold text-ink mb-1">
          My Profile
        </h1>
        <p className="text-sm text-ink/50">Manage your account information</p>
      </motion.div>

      {/* Profile Overview Card */}
      <motion.div
        variants={item}
        className="p-6 rounded-2xl bg-surface border border-hairline mb-6"
      >
        <div className="flex items-start gap-4 mb-6">
          {/* Avatar */}
          <div className="w-16 h-16 rounded-2xl bg-gradient-to-br from-accent-compile to-accent-syntax flex items-center justify-center text-white text-2xl font-bold uppercase shrink-0">
            {displayUser?.fullName?.charAt(0) || 'U'}
          </div>
          <div className="flex-1 min-w-0">
            <h2 className="font-display text-xl font-semibold text-ink truncate">
              {displayUser?.fullName}
            </h2>
            <div className="flex items-center flex-wrap gap-2 mt-2">
              <RoleBadge role={displayUser?.role || 'CANDIDATE'} />
              {profile && <StatusBadge active={profile.isActive} />}
            </div>
          </div>
        </div>

        {/* Info grid */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div className="flex items-center gap-3 p-3 rounded-xl bg-background">
            <Mail className="w-4 h-4 text-ink/30" />
            <div>
              <p className="text-[11px] text-ink/40 uppercase tracking-wider">Email</p>
              <p className="text-sm text-ink font-mono">{displayUser?.email}</p>
            </div>
          </div>
          <div className="flex items-center gap-3 p-3 rounded-xl bg-background">
            <Shield className="w-4 h-4 text-ink/30" />
            <div>
              <p className="text-[11px] text-ink/40 uppercase tracking-wider">Role</p>
              <p className="text-sm text-ink">{displayUser?.role}</p>
            </div>
          </div>
          {profile?.createdAt && (
            <div className="flex items-center gap-3 p-3 rounded-xl bg-background sm:col-span-2">
              <Calendar className="w-4 h-4 text-ink/30" />
              <div>
                <p className="text-[11px] text-ink/40 uppercase tracking-wider">
                  Member Since
                </p>
                <p className="text-sm text-ink">
                  {new Date(profile.createdAt).toLocaleDateString('en-US', {
                    month: 'long',
                    day: 'numeric',
                    year: 'numeric',
                  })}
                </p>
              </div>
            </div>
          )}
        </div>
      </motion.div>

      {/* Update Name Card */}
      <motion.div
        variants={item}
        className="p-6 rounded-2xl bg-surface border border-hairline mb-6"
      >
        <div className="flex items-center gap-3 mb-4">
          <div className="w-9 h-9 rounded-xl bg-accent-compile/10 flex items-center justify-center">
            <User className="w-4 h-4 text-accent-compile" />
          </div>
          <div>
            <h3 className="font-display text-base font-semibold text-ink">
              Personal Information
            </h3>
            <p className="text-xs text-ink/40">Update your display name</p>
          </div>
        </div>
        <ProfileForm userName={displayUser?.fullName || ''} />
      </motion.div>

      {/* Change Password Card */}
      <motion.div
        variants={item}
        className="p-6 rounded-2xl bg-surface border border-hairline"
      >
        <div className="flex items-center gap-3 mb-4">
          <div className="w-9 h-9 rounded-xl bg-ink/5 flex items-center justify-center">
            <Lock className="w-4 h-4 text-ink/40" />
          </div>
          <div>
            <h3 className="font-display text-base font-semibold text-ink">
              Change Password
            </h3>
            <p className="text-xs text-ink/40">Update your account password</p>
          </div>
        </div>
        <ChangePasswordForm />
      </motion.div>
    </motion.div>
  );
};

export default ProfilePage;
