import React from 'react';
import { Inbox } from 'lucide-react';

interface EmptyStateProps {
  message?: string;
  title?: string;
  icon?: React.ReactNode;
  /** Every empty screen offers a next step. */
  action?: React.ReactNode;
}

export const EmptyState: React.FC<EmptyStateProps> = ({ message = 'Nothing here yet.', title, icon, action }) => (
  <div className="flex flex-col items-center justify-center px-6 py-16 text-center">
    <div className="mb-4 flex size-12 items-center justify-center rounded-2xl bg-surface-2 text-fg-subtle ring-1 ring-inset ring-line">
      {icon ?? <Inbox className="size-5" />}
    </div>
    {title && <h3 className="font-display text-[15px] font-semibold tracking-[-0.015em] text-fg">{title}</h3>}
    <p className="mt-1 max-w-sm text-sm leading-6 text-fg-muted">{message}</p>
    {action && <div className="mt-5">{action}</div>}
  </div>
);
