import React, { useState, useEffect, useRef } from 'react';
import { type ColumnDef } from '@tanstack/react-table';
import {
  UserPlus,
  FileSpreadsheet,
  MoreHorizontal,
  Pencil,
  UserX,
  UserCheck,
  Users,
  UserCheck2,
  UserMinus,
} from 'lucide-react';
import { motion } from 'framer-motion';
import { DataTable } from '../components/DataTable';
import { RoleBadge } from '../components/RoleBadge';
import { StatusBadge } from '../components/StatusBadge';
import { CreateUserDialog } from '../components/CreateUserDialog';
import { EditUserDialog } from '../components/EditUserDialog';
import { BulkImportDialog } from '../components/BulkImportDialog';
import { useUsers, useDeactivateUser, useReactivateUser } from '../hooks/useUsers';
import type { UserRecord } from '../api/userApi';
import { ErrorState } from '../components/states/ErrorState';

const container = {
  hidden: { opacity: 0 },
  show: {
    opacity: 1,
    transition: { staggerChildren: 0.06, delayChildren: 0.05 },
  },
};

const item = {
  hidden: { opacity: 0, y: 10 },
  show: { opacity: 1, y: 0, transition: { duration: 0.3 } },
};

// ─── Animated Number Ticker ───
const NumberTicker: React.FC<{ value: number }> = ({ value }) => {
  const [display, setDisplay] = useState(0);
  const ref = useRef<number | null>(null);

  useEffect(() => {
    const start = display;
    const diff = value - start;
    if (diff === 0) return;

    const duration = 600;
    const startTime = performance.now();

    const animate = (now: number) => {
      const elapsed = now - startTime;
      const progress = Math.min(elapsed / duration, 1);
      // ease out cubic
      const eased = 1 - Math.pow(1 - progress, 3);
      setDisplay(Math.round(start + diff * eased));
      if (progress < 1) {
        ref.current = requestAnimationFrame(animate);
      }
    };

    ref.current = requestAnimationFrame(animate);
    return () => {
      if (ref.current) cancelAnimationFrame(ref.current);
    };
  }, [value]);

  return <span>{display}</span>;
};

// ─── Row Actions Dropdown ───
const RowActions: React.FC<{
  user: UserRecord;
  onEdit: (user: UserRecord) => void;
  onToggleActive: (user: UserRecord) => void;
}> = ({ user, onEdit, onToggleActive }) => {
  const [open, setOpen] = useState(false);

  return (
    <div className="relative">
      <button
        onClick={() => setOpen(!open)}
        className="p-1.5 rounded-lg text-ink/30 hover:text-ink hover:bg-ink/5 transition-colors cursor-pointer"
      >
        <MoreHorizontal className="w-4 h-4" />
      </button>
      {open && (
        <>
          <div className="fixed inset-0 z-40" onClick={() => setOpen(false)} />
          <motion.div
            initial={{ opacity: 0, scale: 0.95, y: -4 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            transition={{ duration: 0.12 }}
            className="absolute right-0 top-full mt-1 w-44 bg-surface rounded-xl border border-hairline shadow-lg z-50 py-1"
          >
            <button
              onClick={() => {
                setOpen(false);
                onEdit(user);
              }}
              className="w-full flex items-center gap-2.5 px-3 py-2 text-sm text-ink/70 hover:bg-ink/5 hover:text-ink transition-colors cursor-pointer"
            >
              <Pencil className="w-3.5 h-3.5" />
              Edit
            </button>
            <button
              onClick={() => {
                setOpen(false);
                onToggleActive(user);
              }}
              className={`w-full flex items-center gap-2.5 px-3 py-2 text-sm transition-colors cursor-pointer ${
                user.isActive
                  ? 'text-accent-error/70 hover:bg-accent-error/5 hover:text-accent-error'
                  : 'text-accent-compile/70 hover:bg-accent-compile/5 hover:text-accent-compile'
              }`}
            >
              {user.isActive ? (
                <>
                  <UserX className="w-3.5 h-3.5" />
                  Deactivate
                </>
              ) : (
                <>
                  <UserCheck className="w-3.5 h-3.5" />
                  Reactivate
                </>
              )}
            </button>
          </motion.div>
        </>
      )}
    </div>
  );
};

// ─── Deactivation Confirm Dialog ───
const ConfirmDialog: React.FC<{
  open: boolean;
  user: UserRecord | null;
  onConfirm: () => void;
  onCancel: () => void;
  isPending: boolean;
}> = ({ open, user, onConfirm, onCancel, isPending }) => {
  if (!open || !user) return null;

  const isDeactivating = user.isActive;

  return (
    <>
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        className="fixed inset-0 bg-ink/20 backdrop-blur-sm z-50"
        onClick={onCancel}
      />
      <div className="fixed inset-0 flex items-center justify-center z-50 p-4">
        <motion.div
          initial={{ opacity: 0, scale: 0.95, y: 8 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          transition={{ duration: 0.2 }}
          className="bg-surface rounded-2xl border border-hairline shadow-lg w-full max-w-sm p-6"
          onClick={(e) => e.stopPropagation()}
        >
          <div
            className={`w-11 h-11 rounded-xl ${
              isDeactivating ? 'bg-accent-error/10' : 'bg-accent-compile/10'
            } flex items-center justify-center mb-4`}
          >
            {isDeactivating ? (
              <UserX className="w-5 h-5 text-accent-error" />
            ) : (
              <UserCheck className="w-5 h-5 text-accent-compile" />
            )}
          </div>
          <h3 className="font-display text-lg font-semibold text-ink mb-1">
            {isDeactivating ? 'Deactivate' : 'Reactivate'} User
          </h3>
          <p className="text-sm text-ink/50 mb-6">
            {isDeactivating
              ? `Are you sure you want to deactivate ${user.fullName}? They will no longer be able to log in.`
              : `Reactivate ${user.fullName}? They'll be able to log in again.`}
          </p>
          <div className="flex items-center justify-end gap-2">
            <button
              onClick={onCancel}
              className="px-4 py-2 rounded-lg text-sm font-medium text-ink/60 border border-hairline hover:border-ink/20 hover:text-ink transition-colors cursor-pointer"
            >
              Cancel
            </button>
            <motion.button
              onClick={onConfirm}
              disabled={isPending}
              whileHover={{ scale: 1.01 }}
              whileTap={{ scale: 0.97 }}
              className={`px-4 py-2 rounded-lg text-white text-sm font-medium transition-colors disabled:opacity-60 disabled:cursor-not-allowed cursor-pointer ${
                isDeactivating
                  ? 'bg-accent-error hover:bg-accent-error/90'
                  : 'bg-accent-compile hover:bg-accent-compile-hover'
              }`}
            >
              {isPending
                ? isDeactivating
                  ? 'Deactivating...'
                  : 'Reactivating...'
                : isDeactivating
                  ? 'Deactivate'
                  : 'Reactivate'}
            </motion.button>
          </div>
        </motion.div>
      </div>
    </>
  );
};

// ─── Main Page ───
const UserManagementPage: React.FC = () => {
  const [createOpen, setCreateOpen] = useState(false);
  const [bulkOpen, setBulkOpen] = useState(false);
  const [editUser, setEditUser] = useState<UserRecord | null>(null);
  const [confirmUser, setConfirmUser] = useState<UserRecord | null>(null);

  // The table pages/sorts client-side, so load everything (Spring caps size at 2000)
  const { data, isLoading, isError, refetch } = useUsers({ pageSize: 2000 });
  const deactivateMutation = useDeactivateUser();
  const reactivateMutation = useReactivateUser();

  const users = data?.users ?? [];
  const totalUsers = data?.total ?? users.length;
  const activeUsers = users.filter((u) => u.isActive).length;
  const inactiveUsers = users.filter((u) => !u.isActive).length;

  const handleToggleActive = (user: UserRecord) => {
    setConfirmUser(user);
  };

  const confirmToggle = () => {
    if (!confirmUser) return;
    if (confirmUser.isActive) {
      deactivateMutation.mutate(confirmUser.id, {
        onSuccess: () => setConfirmUser(null),
      });
    } else {
      reactivateMutation.mutate(confirmUser.id, {
        onSuccess: () => setConfirmUser(null),
      });
    }
  };

  const columns: ColumnDef<UserRecord, unknown>[] = [
    {
      accessorKey: 'fullName',
      header: 'Name',
      cell: ({ row }) => (
        <div>
          <p className="font-medium text-ink text-sm">{row.original.fullName}</p>
        </div>
      ),
    },
    {
      accessorKey: 'email',
      header: 'Email',
      cell: ({ row }) => (
        <span className="font-mono text-xs text-ink/60">{row.original.email}</span>
      ),
    },
    {
      accessorKey: 'role',
      header: 'Role',
      cell: ({ row }) => <RoleBadge role={row.original.role} />,
      enableSorting: true,
    },
    {
      accessorKey: 'isActive',
      header: 'Status',
      cell: ({ row }) => <StatusBadge active={row.original.isActive} />,
      enableSorting: true,
    },
    {
      accessorKey: 'createdAt',
      header: 'Created',
      cell: ({ row }) => (
        <span className="text-xs text-ink/40">
          {new Date(row.original.createdAt).toLocaleDateString('en-US', {
            month: 'short',
            day: 'numeric',
            year: 'numeric',
          })}
        </span>
      ),
      enableSorting: true,
    },
    {
      id: 'actions',
      header: '',
      cell: ({ row }) => (
        <RowActions
          user={row.original}
          onEdit={setEditUser}
          onToggleActive={handleToggleActive}
        />
      ),
      enableSorting: false,
    },
  ];

  if (isError) {
    return <ErrorState message="Failed to load users." onRetry={() => refetch()} />;
  }

  return (
    <>
      <motion.div variants={container} initial="hidden" animate="show">
        {/* Page Header */}
        <motion.div
          variants={item}
          className="flex flex-col md:flex-row md:items-center md:justify-between gap-4 mb-6"
        >
          <div>
            <h1 className="font-display text-2xl md:text-3xl font-bold text-ink mb-1">
              User Management
            </h1>
            <p className="text-sm text-ink/50">Create, manage, and import user accounts</p>
          </div>
          <div className="flex items-center gap-2">
            <motion.button
              onClick={() => setBulkOpen(true)}
              whileHover={{ scale: 1.02 }}
              whileTap={{ scale: 0.97 }}
              className="px-4 py-2.5 rounded-lg text-sm font-medium text-ink/60 border border-hairline hover:border-ink/20 hover:text-ink transition-colors cursor-pointer flex items-center gap-2"
            >
              <FileSpreadsheet className="w-4 h-4" />
              <span className="hidden sm:inline">Bulk Import</span>
            </motion.button>
            <motion.button
              onClick={() => setCreateOpen(true)}
              whileHover={{ scale: 1.02 }}
              whileTap={{ scale: 0.97 }}
              className="px-4 py-2.5 rounded-lg bg-accent-compile text-white text-sm font-medium hover:bg-accent-compile-hover transition-colors cursor-pointer flex items-center gap-2 relative overflow-hidden group"
            >
              {/* shimmer effect */}
              <span className="absolute inset-0 bg-gradient-to-r from-transparent via-white/10 to-transparent -translate-x-full group-hover:translate-x-full transition-transform duration-700" />
              <UserPlus className="w-4 h-4 relative z-10" />
              <span className="relative z-10 hidden sm:inline">Create User</span>
            </motion.button>
          </div>
        </motion.div>

        {/* Stats */}
        <motion.div variants={item} className="grid grid-cols-3 gap-3 mb-6">
          <div className="p-4 rounded-xl bg-surface border border-hairline">
            <div className="flex items-center gap-3">
              <div className="w-9 h-9 rounded-lg bg-ink/5 flex items-center justify-center">
                <Users className="w-4 h-4 text-ink/40" />
              </div>
              <div>
                <p className="text-xl font-bold font-display text-ink">
                  <NumberTicker value={totalUsers} />
                </p>
                <p className="text-[11px] text-ink/40">Total Users</p>
              </div>
            </div>
          </div>
          <div className="p-4 rounded-xl bg-surface border border-hairline">
            <div className="flex items-center gap-3">
              <div className="w-9 h-9 rounded-lg bg-accent-compile/10 flex items-center justify-center">
                <UserCheck2 className="w-4 h-4 text-accent-compile" />
              </div>
              <div>
                <p className="text-xl font-bold font-display text-accent-compile">
                  <NumberTicker value={activeUsers} />
                </p>
                <p className="text-[11px] text-ink/40">Active</p>
              </div>
            </div>
          </div>
          <div className="p-4 rounded-xl bg-surface border border-hairline">
            <div className="flex items-center gap-3">
              <div className="w-9 h-9 rounded-lg bg-ink/5 flex items-center justify-center">
                <UserMinus className="w-4 h-4 text-ink/30" />
              </div>
              <div>
                <p className="text-xl font-bold font-display text-ink/50">
                  <NumberTicker value={inactiveUsers} />
                </p>
                <p className="text-[11px] text-ink/40">Inactive</p>
              </div>
            </div>
          </div>
        </motion.div>

        {/* Table */}
        <motion.div variants={item}>
          <DataTable
            columns={columns}
            data={users}
            isLoading={isLoading}
            emptyMessage="No users found. Create one to get started."
          />
        </motion.div>
      </motion.div>

      {/* Dialogs */}
      <CreateUserDialog open={createOpen} onClose={() => setCreateOpen(false)} />
      <EditUserDialog
        open={!!editUser}
        user={editUser}
        onClose={() => setEditUser(null)}
      />
      <BulkImportDialog open={bulkOpen} onClose={() => setBulkOpen(false)} />
      <ConfirmDialog
        open={!!confirmUser}
        user={confirmUser}
        onConfirm={confirmToggle}
        onCancel={() => setConfirmUser(null)}
        isPending={deactivateMutation.isPending || reactivateMutation.isPending}
      />
    </>
  );
};

export default UserManagementPage;
