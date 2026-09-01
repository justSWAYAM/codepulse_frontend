import React from 'react';
import type { ContestStatus } from '../../api/contestApi';

interface ContestStatusBadgeProps {
  status: ContestStatus;
}

const STATUS_CONFIG: Record<
  ContestStatus,
  { label: string; color: string; bg: string; dot?: boolean }
> = {
  DRAFT:     { label: 'Draft',     color: '#6B7280', bg: '#F3F4F6' },
  PUBLISHED: { label: 'Published', color: '#E8A33D', bg: '#FFF9F0' },
  ONGOING:   { label: 'Live',      color: '#2F9E6E', bg: '#EFFAF5', dot: true },
  COMPLETED: { label: 'Completed', color: '#6366F1', bg: '#F5F3FF' },
};

export const ContestStatusBadge: React.FC<ContestStatusBadgeProps> = ({ status }) => {
  const config = STATUS_CONFIG[status];

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
