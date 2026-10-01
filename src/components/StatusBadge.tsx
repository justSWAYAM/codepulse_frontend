import React from 'react';

interface StatusBadgeProps {
  active: boolean;
}

export const StatusBadge: React.FC<StatusBadgeProps> = ({ active }) => {
  return (
    <span
      className={`inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-[11px] font-semibold border tracking-wide ${
        active
          ? 'bg-primary/10 text-primary-text border-primary/20'
          : 'bg-fg/5 text-fg-subtle border-line'
      }`}
    >
      <span
        className={`w-1.5 h-1.5 rounded-full ${
          active ? 'bg-primary' : 'bg-fg/30'
        }`}
      />
      {active ? 'Active' : 'Inactive'}
    </span>
  );
};
