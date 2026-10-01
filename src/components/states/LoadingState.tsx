import React from 'react';
import { Spinner } from '../ui';

export const LoadingState: React.FC<{ message?: string }> = ({ message = 'Loading…' }) => (
  <div className="flex flex-col items-center justify-center gap-3 py-16 text-fg-subtle">
    <Spinner size={20} />
    <p className="text-sm text-fg-muted">{message}</p>
  </div>
);
