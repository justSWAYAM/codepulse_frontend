import React from 'react';
import type { UserRole } from '../api/userApi';

interface RoleBadgeProps {
  role: UserRole;
}

const roleConfig: Record<UserRole, { label: string; classes: string }> = {
  ADMIN: {
    label: 'Admin',
    classes: 'bg-primary/10 text-primary-text border-primary/20',
  },
  EVALUATOR: {
    label: 'Evaluator',
    classes: 'bg-warning-soft text-warning-text border-warning/30',
  },
  CANDIDATE: {
    label: 'Candidate',
    classes: 'bg-fg/5 text-fg-muted border-line',
  },
};

export const RoleBadge: React.FC<RoleBadgeProps> = ({ role }) => {
  const config = roleConfig[role] || roleConfig.CANDIDATE;

  return (
    <span
      className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-[11px] font-semibold border tracking-wide ${config.classes}`}
    >
      {config.label}
    </span>
  );
};
