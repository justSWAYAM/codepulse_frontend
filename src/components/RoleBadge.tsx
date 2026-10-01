import React from 'react';
import type { UserRole } from '../api/userApi';
import { Badge, type Tone } from './ui';

const CONFIG: Record<UserRole, { label: string; tone: Tone }> = {
  ADMIN: { label: 'Admin', tone: 'primary' },
  EVALUATOR: { label: 'Evaluator', tone: 'info' },
  CANDIDATE: { label: 'Candidate', tone: 'neutral' },
};

export const RoleBadge: React.FC<{ role: UserRole }> = ({ role }) => {
  const c = CONFIG[role] ?? CONFIG.CANDIDATE;
  return (
    <Badge tone={c.tone} size="sm">
      {c.label}
    </Badge>
  );
};
