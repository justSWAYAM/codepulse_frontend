import React from 'react';
import type { SessionStatus } from '../../api/sessionApi';

interface SessionStatusBadgeProps {
  status: SessionStatus;
}

/**
 * SessionStatusBadge — wraps the generic badge pattern from ContestStatusBadge.
 *
 * IN_PROGRESS  → green (active)
 * SUBMITTED    → neutral
 * AUTO_SUBMITTED → amber
 * EXPIRED (reserved) → neutral fallback
 */
const STATUS_CONFIG: Record<SessionStatus, { label: string; color: string; bg: string; dot?: boolean }> = {
  IN_PROGRESS:    { label: 'In Progress',      color: '#2F9E6E', bg: '#EFFAF5', dot: true },
  SUBMITTED:      { label: 'Submitted',        color: '#6B7280', bg: '#F3F4F6' },
  AUTO_SUBMITTED: { label: 'Auto-Submitted',   color: '#E8A33D', bg: '#FFF9F0' },
  EXPIRED:        { label: 'Expired',           color: '#6B7280', bg: '#F3F4F6' },
};

export const SessionStatusBadge: React.FC<SessionStatusBadgeProps> = ({ status }) => {
  const config = STATUS_CONFIG[status] ?? STATUS_CONFIG.EXPIRED;

  return (
    <span
      className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-[11px] font-semibold tracking-wide"
      style={{ color: config.color, backgroundColor: config.bg }}
    >
      {config.dot ? (
        <span
          className="w-1.5 h-1.5 rounded-full animate-pulse"
          style={{ backgroundColor: config.color }}
        />
      ) : (
        <span
          className="w-1.5 h-1.5 rounded-full"
          style={{ backgroundColor: config.color }}
        />
      )}
      {config.label}
    </span>
  );
};
