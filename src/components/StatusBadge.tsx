import React from 'react';

interface StatusBadgeProps {
  active: boolean;
}

export const StatusBadge: React.FC<StatusBadgeProps> = ({ active }) => {
  return (
    <span
      className={`inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-[11px] font-semibold border tracking-wide ${
        active
          ? 'bg-accent-compile/10 text-accent-compile border-accent-compile/20'
          : 'bg-ink/5 text-ink/40 border-hairline'
      }`}
    >
      <span
        className={`w-1.5 h-1.5 rounded-full ${
          active ? 'bg-accent-compile' : 'bg-ink/30'
        }`}
      />
      {active ? 'Active' : 'Inactive'}
    </span>
  );
};
