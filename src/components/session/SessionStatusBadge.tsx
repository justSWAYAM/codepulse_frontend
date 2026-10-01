import React from 'react';
import type { SessionStatus } from '../../api/sessionApi';
import { Badge, type Tone } from '../ui';

const CONFIG: Record<SessionStatus, { label: string; tone: Tone; live?: boolean }> = {
  NOT_YET_STARTED: { label: 'Not started', tone: 'neutral' },
  IN_PROGRESS: { label: 'In progress', tone: 'success', live: true },
  SUBMITTED: { label: 'Submitted', tone: 'primary' },
  AUTO_SUBMITTED: { label: 'Auto-submitted', tone: 'warning' },
  EXPIRED: { label: 'Expired', tone: 'neutral' },
};

export const SessionStatusBadge: React.FC<{ status: SessionStatus }> = ({ status }) => {
  const c = CONFIG[status] ?? CONFIG.EXPIRED;
  return (
    <Badge tone={c.tone} size="sm" dot live={c.live}>
      {c.label}
    </Badge>
  );
};
