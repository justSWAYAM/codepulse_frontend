import React from 'react';
import type { ContestStatus } from '../../api/contestApi';
import { Badge, type Tone } from '../ui';

const CONFIG: Record<ContestStatus, { label: string; tone: Tone; live?: boolean }> = {
  DRAFT: { label: 'Draft', tone: 'neutral' },
  PUBLISHED: { label: 'Scheduled', tone: 'info' },
  ONGOING: { label: 'Live', tone: 'success', live: true },
  COMPLETED: { label: 'Completed', tone: 'neutral' },
};

export const ContestStatusBadge: React.FC<{ status: ContestStatus; size?: 'sm' | 'md' }> = ({ status, size = 'sm' }) => {
  const c = CONFIG[status] ?? CONFIG.DRAFT;
  return (
    <Badge tone={c.tone} size={size} dot live={c.live}>
      {c.label}
    </Badge>
  );
};
