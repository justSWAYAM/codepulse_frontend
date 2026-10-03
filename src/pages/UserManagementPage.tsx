import React, { useMemo, useState } from 'react';
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
  Search,
  Trash2,
  X,
} from 'lucide-react';
import { motion } from 'framer-motion';
import { DataTable } from '../components/DataTable';
import { RoleBadge } from '../components/RoleBadge';
import { StatusBadge } from '../components/StatusBadge';
import { CreateUserDialog } from '../components/CreateUserDialog';
import { EditUserDialog } from '../components/EditUserDialog';
import { BulkImportDialog } from '../components/BulkImportDialog';
import { useUsers, useDeactivateUser, useReactivateUser, useDeleteUser } from '../hooks/useUsers';
import { useAuth } from '../context/AuthContext';
import type { UserRecord, UserRole } from '../api/userApi';
import { ErrorState } from '../components/states/ErrorState';
import {
  Button,
  Card,
  Dialog,
  IconButton,
  Input,
  Menu,
  MenuContent,
  MenuItem,
  MenuSeparator,
  MenuTrigger,
  PageHeader,
  Select,
  Skeleton,
} from '../components/ui';
import { cn } from '../lib/cn';

const enter = {
  initial: { opacity: 0, y: 8 },
  animate: { opacity: 1, y: 0 },
  transition: { duration: 0.25, ease: [0.23, 1, 0.32, 1] as const },
};

type StatusFilter = 'all' | 'active' | 'inactive';

// ─── Stat tile ───
const Stat: React.FC<{ label: string; value: number; icon: React.ReactNode; loading: boolean; accent?: boolean }> = ({
  label,
  value,
  icon,
  loading,
  accent,
}) => (
  <Card className="flex items-center gap-3 p-4">
    <div
      className={cn(
        'flex size-9 shrink-0 items-center justify-center rounded-xl',
        accent ? 'bg-primary-soft text-primary-text' : 'bg-surface-2 text-fg-subtle',
      )}
    >
      {icon}
    </div>
    <div className="min-w-0">
      {loading ? (
        <Skeleton className="my-1 h-5 w-10" />
      ) : (
        <p className="tabular font-display text-[20px] font-semibold leading-7 tracking-[-0.015em] text-fg">{value}</p>
      )}
      <p className="truncate text-[12px] text-fg-subtle">{label}</p>
    </div>
  </Card>
);

// ─── Row actions menu ───
const RowActions: React.FC<{
  user: UserRecord;
  onEdit: (user: UserRecord) => void;
  onToggleActive: (user: UserRecord) => void;
  onDelete?: (user: UserRecord) => void;
}> = ({ user, onEdit, onToggleActive, onDelete }) => (
  <div className="flex justify-end">
    <Menu>
      <MenuTrigger asChild>
        <IconButton aria-label={`Actions for ${user.fullName}`} size="sm">
          <MoreHorizontal className="size-4" />
        </IconButton>
      </MenuTrigger>
      <MenuContent className="min-w-44">
        <MenuItem icon={<Pencil />} onSelect={() => onEdit(user)}>
          Edit
        </MenuItem>
        <MenuSeparator />
        {user.isActive ? (
          <MenuItem icon={<UserX />} tone="danger" onSelect={() => onToggleActive(user)}>
            Deactivate
          </MenuItem>
        ) : (
          <MenuItem icon={<UserCheck />} onSelect={() => onToggleActive(user)}>
            Reactivate
          </MenuItem>
        )}
        {onDelete && (
          <MenuItem icon={<Trash2 />} tone="danger" onSelect={() => onDelete(user)}>
            Delete
          </MenuItem>
        )}
      </MenuContent>
    </Menu>
  </div>
);

// ─── Deactivate / reactivate confirmation ───
const ConfirmDialog: React.FC<{
  open: boolean;
  user: UserRecord | null;
  onConfirm: () => void;
  onCancel: () => void;
  isPending: boolean;
}> = ({ open, user, onConfirm, onCancel, isPending }) => {
  const isDeactivating = user?.isActive ?? true;

  return (
    <Dialog
      open={open && !!user}
      onOpenChange={(o) => !o && onCancel()}
      size="sm"
      tone={isDeactivating ? 'danger' : 'primary'}
      icon={isDeactivating ? <UserX className="size-[18px]" /> : <UserCheck className="size-[18px]" />}
      title={isDeactivating ? 'Deactivate user' : 'Reactivate user'}
      description={
        user
          ? isDeactivating
            ? `${user.fullName} will no longer be able to sign in. You can reactivate them later.`
            : `${user.fullName} will be able to sign in again.`
          : undefined
      }
      dismissible={!isPending}
      footer={
        <>
          <Button variant="secondary" onClick={onCancel} disabled={isPending}>
            Cancel
          </Button>
          <Button variant={isDeactivating ? 'danger' : 'primary'} onClick={onConfirm} loading={isPending}>
            {isDeactivating ? 'Deactivate' : 'Reactivate'}
          </Button>
        </>
      }
    />
  );
};

// ─── Delete confirmation ───
const DeleteDialog: React.FC<{
  user: UserRecord | null;
  onConfirm: () => void;
  onCancel: () => void;
  isPending: boolean;
}> = ({ user, onConfirm, onCancel, isPending }) => (
  <Dialog
    open={!!user}
    onOpenChange={(o) => !o && onCancel()}
    size="sm"
    tone="danger"
    icon={<Trash2 className="size-[18px]" />}
    title="Delete user"
    description={
      user
        ? `Permanently delete ${user.fullName} (${user.email})? Their contest enrolments, submissions and results will also be deleted. This cannot be undone.`
        : undefined
    }
    dismissible={!isPending}
    footer={
      <>
        <Button variant="secondary" onClick={onCancel} disabled={isPending}>
          Cancel
        </Button>
        <Button variant="danger" onClick={onConfirm} loading={isPending}>
          Delete
        </Button>
      </>
    }
  />
);

// ─── Main Page ───
const UserManagementPage: React.FC = () => {
  const [createOpen, setCreateOpen] = useState(false);
  const [bulkOpen, setBulkOpen] = useState(false);
  const [editUser, setEditUser] = useState<UserRecord | null>(null);
  const [confirmUser, setConfirmUser] = useState<UserRecord | null>(null);
  const [deleteUser, setDeleteUser] = useState<UserRecord | null>(null);
  const { user: currentUser } = useAuth();
  const [search, setSearch] = useState('');
  const [roleFilter, setRoleFilter] = useState<UserRole | 'all'>('all');
  const [statusFilter, setStatusFilter] = useState<StatusFilter>('all');

  // The table pages/sorts client-side, so load everything (Spring caps size at 2000)
  const { data, isLoading, isError, refetch } = useUsers({ pageSize: 2000 });
  const deactivateMutation = useDeactivateUser();
  const reactivateMutation = useReactivateUser();
  const deleteMutation = useDeleteUser();

  const users = useMemo(() => data?.users ?? [], [data]);
  const totalUsers = data?.total ?? users.length;
  const activeUsers = users.filter((u) => u.isActive).length;
  const inactiveUsers = users.filter((u) => !u.isActive).length;

  const q = search.trim().toLowerCase();
  const hasFilters = q !== '' || roleFilter !== 'all' || statusFilter !== 'all';

  // Client-side narrowing of the already-loaded list (no extra request)
  const filteredUsers = useMemo(
    () =>
      users.filter(
        (u) =>
          (roleFilter === 'all' || u.role === roleFilter) &&
          (statusFilter === 'all' || (statusFilter === 'active' ? u.isActive : !u.isActive)) &&
          (!q ||
            u.fullName.toLowerCase().includes(q) ||
            u.email.toLowerCase().includes(q) ||
            (u.rollNumber ?? '').toLowerCase().includes(q)),
      ),
    [users, roleFilter, statusFilter, q],
  );

  const clearFilters = () => {
    setSearch('');
    setRoleFilter('all');
    setStatusFilter('all');
  };

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

  // On failure (e.g. the user authored content) the dialog stays open; the global handler toasts why
  const confirmDelete = () => {
    if (!deleteUser) return;
    deleteMutation.mutate(deleteUser.id, {
      onSuccess: () => setDeleteUser(null),
    });
  };

  const columns: ColumnDef<UserRecord, unknown>[] = [
    {
      accessorKey: 'fullName',
      header: 'Name',
      cell: ({ row }) => (
        <div className="flex min-w-0 items-center gap-3">
          <span
            aria-hidden
            className="flex size-8 shrink-0 items-center justify-center rounded-full bg-surface-2 text-[12px] font-medium text-fg-muted ring-1 ring-inset ring-line"
          >
            {row.original.fullName.trim().charAt(0).toUpperCase() || '?'}
          </span>
          <span className="truncate font-medium text-fg">{row.original.fullName}</span>
        </div>
      ),
    },
    {
      accessorKey: 'email',
      header: 'Email',
      cell: ({ row }) => <span className="font-mono text-[12px] text-fg-muted">{row.original.email}</span>,
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
        <span className="tabular whitespace-nowrap text-[13px] text-fg-subtle">
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
      header: () => <span className="sr-only">Actions</span>,
      cell: ({ row }) => (
        <RowActions
          user={row.original}
          onEdit={setEditUser}
          onToggleActive={handleToggleActive}
          // An admin can't delete their own account
          onDelete={row.original.id === currentUser?.id ? undefined : setDeleteUser}
        />
      ),
      enableSorting: false,
    },
  ];

  if (isError) {
    return <ErrorState message="Couldn't load users. Check your connection and try again." onRetry={() => refetch()} />;
  }

  return (
    <>
      <div className="space-y-6">
        <PageHeader
          eyebrow="Admin"
          title="User management"
          description="Create, manage and import user accounts."
          actions={
            <>
              <Button variant="secondary" onClick={() => setBulkOpen(true)} leadingIcon={<FileSpreadsheet className="size-4" />}>
                Bulk import
              </Button>
              <Button onClick={() => setCreateOpen(true)} leadingIcon={<UserPlus className="size-4" />}>
                Add user
              </Button>
            </>
          }
        />

        <motion.div {...enter} className="grid grid-cols-1 gap-3 sm:grid-cols-3">
          <Stat label="Total users" value={totalUsers} loading={isLoading} icon={<Users className="size-4" />} />
          <Stat label="Active" value={activeUsers} loading={isLoading} accent icon={<UserCheck2 className="size-4" />} />
          <Stat label="Inactive" value={inactiveUsers} loading={isLoading} icon={<UserMinus className="size-4" />} />
        </motion.div>

        <div className="space-y-3">
          <Card className="flex flex-col gap-3 p-3 sm:flex-row sm:items-center">
            <div className="relative min-w-0 flex-1">
              <Search className="pointer-events-none absolute left-3 top-1/2 size-4 -translate-y-1/2 text-fg-subtle" aria-hidden />
              <Input
                type="search"
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                placeholder="Search by name, email or roll number…"
                aria-label="Search users"
                className="pl-9"
              />
            </div>
            <div className="grid grid-cols-2 gap-3 sm:flex sm:items-center">
              <Select
                aria-label="Filter by role"
                value={roleFilter}
                onChange={(e) => setRoleFilter(e.target.value as UserRole | 'all')}
                className="sm:w-40"
              >
                <option value="all">All roles</option>
                <option value="CANDIDATE">Candidate</option>
                <option value="EVALUATOR">Evaluator</option>
                <option value="ADMIN">Admin</option>
              </Select>
              <Select
                aria-label="Filter by status"
                value={statusFilter}
                onChange={(e) => setStatusFilter(e.target.value as StatusFilter)}
                className="sm:w-36"
              >
                <option value="all">All statuses</option>
                <option value="active">Active</option>
                <option value="inactive">Inactive</option>
              </Select>
            </div>
            {hasFilters && (
              <Button variant="ghost" size="sm" onClick={clearFilters} leadingIcon={<X className="size-3.5" />}>
                Clear
              </Button>
            )}
          </Card>

          {hasFilters && !isLoading && (
            <p className="tabular px-1 text-[12px] text-fg-subtle" aria-live="polite">
              Showing {filteredUsers.length} of {users.length} users
            </p>
          )}

          <DataTable
            columns={columns}
            data={filteredUsers}
            isLoading={isLoading}
            emptyMessage={
              hasFilters
                ? 'No users match these filters. Try a different search or clear the filters.'
                : 'No users yet. Add one or bulk import a CSV to get started.'
            }
          />
        </div>
      </div>

      {/* Dialogs */}
      <CreateUserDialog open={createOpen} onClose={() => setCreateOpen(false)} />
      <EditUserDialog open={!!editUser} user={editUser} onClose={() => setEditUser(null)} />
      <BulkImportDialog open={bulkOpen} onClose={() => setBulkOpen(false)} />
      <ConfirmDialog
        open={!!confirmUser}
        user={confirmUser}
        onConfirm={confirmToggle}
        onCancel={() => setConfirmUser(null)}
        isPending={deactivateMutation.isPending || reactivateMutation.isPending}
      />
      <DeleteDialog
        user={deleteUser}
        onConfirm={confirmDelete}
        onCancel={() => setDeleteUser(null)}
        isPending={deleteMutation.isPending}
      />
    </>
  );
};

export default UserManagementPage;
