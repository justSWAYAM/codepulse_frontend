import React from 'react';
import { Inbox } from 'lucide-react';

interface EmptyStateProps {
  message?: string;
}

export const EmptyState: React.FC<EmptyStateProps> = ({ message = 'Nothing here yet.' }) => {
  return (
    <div className="flex flex-col items-center justify-center py-20 gap-3">
      <Inbox className="h-8 w-8 text-fg-subtle" />
      <p className="text-sm text-fg-muted">{message}</p>
    </div>
  );
};
