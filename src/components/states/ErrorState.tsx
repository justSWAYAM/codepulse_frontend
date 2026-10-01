import React from 'react';
import { AlertCircle } from 'lucide-react';

interface ErrorStateProps {
  message?: string;
  onRetry?: () => void;
}

export const ErrorState: React.FC<ErrorStateProps> = ({
  message = 'Something went wrong.',
  onRetry,
}) => {
  return (
    <div className="flex flex-col items-center justify-center py-20 gap-3">
      <AlertCircle className="h-8 w-8 text-danger-text" />
      <p className="text-sm text-fg-muted">{message}</p>
      {onRetry && (
        <button
          onClick={onRetry}
          className="mt-2 px-4 py-2 text-sm font-medium rounded-lg bg-primary text-white hover:bg-primary-hover transition-colors cursor-pointer"
        >
          Try again
        </button>
      )}
    </div>
  );
};
