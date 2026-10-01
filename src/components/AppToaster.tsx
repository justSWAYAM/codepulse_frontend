import React from 'react';
import { Toaster } from 'sonner';
import { useTheme } from '../context/ThemeContext';

/** Sonner, themed from tokens. 4s lifetime (pauses on hover/focus). */
export const AppToaster: React.FC = () => {
  const { resolved } = useTheme();
  return (
    <Toaster
      theme={resolved}
      position="top-right"
      closeButton
      toastOptions={{
        duration: 4000,
        classNames: {
          toast:
            '!rounded-xl !border !border-line !bg-surface !text-fg !shadow-pop !font-sans !text-[13px] !gap-2.5',
          description: '!text-fg-muted',
          success: '[&_[data-icon]]:!text-success',
          error: '[&_[data-icon]]:!text-danger',
          warning: '[&_[data-icon]]:!text-warning',
          info: '[&_[data-icon]]:!text-info',
          closeButton: '!bg-surface !border-line !text-fg-subtle',
        },
      }}
    />
  );
};
