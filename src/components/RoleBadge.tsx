import React from 'react';
import type { UserRole } from '../api/userApi';

interface RoleBadgeProps {
  role: UserRole;
}

const roleConfig: Record<UserRole, { label: string; classes: string }> = {
  ADMIN: {
    label: 'Admin',
    classes: 'bg-accent-compile/10 text-accent-compile border-accent-compile/20',
  },
  EVALUATOR: {
    label: 'Evaluator',
    classes: 'bg-accent-syntax/10 text-accent-syntax border-accent-syntax/20',
  },
  CANDIDATE: {
    label: 'Candidate',
    classes: 'bg-ink/5 text-ink/60 border-hairline',
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
