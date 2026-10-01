import React from 'react';
import { AlertTriangle, RotateCw } from 'lucide-react';
import { Button } from '../ui';

interface ErrorStateProps {
  message?: string;
  onRetry?: () => void;
}

export const ErrorState: React.FC<ErrorStateProps> = ({ message = 'Something went wrong.', onRetry }) => (
  <div role="alert" className="flex flex-col items-center justify-center px-6 py-16 text-center">
    <div className="mb-4 flex size-12 items-center justify-center rounded-2xl bg-danger-soft text-danger-text">
      <AlertTriangle className="size-5" />
    </div>
    <p className="max-w-sm text-sm leading-6 text-fg-muted">{message}</p>
    {onRetry && (
      <Button variant="secondary" size="sm" className="mt-5" leadingIcon={<RotateCw className="size-3.5" />} onClick={onRetry}>
        Try again
      </Button>
    )}
  </div>
);
