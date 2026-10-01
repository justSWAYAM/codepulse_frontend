import React from 'react';
import * as RD from '@radix-ui/react-dialog';
import { X } from 'lucide-react';
import { cn } from '../../lib/cn';
import { IconButton } from './Button';

/**
 * Modal dialog: focus trap, Escape, focus returns to the trigger, body scroll lock (Radix).
 * Centred; enters from scale(0.96) + opacity, exits faster. Scrim shares timing.
 */
interface DialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  title: React.ReactNode;
  description?: React.ReactNode;
  icon?: React.ReactNode;
  /** Tone of the icon chip — 'danger' for destructive confirmations. */
  tone?: 'primary' | 'danger' | 'warning';
  size?: 'sm' | 'md' | 'lg' | 'xl';
  children?: React.ReactNode;
  footer?: React.ReactNode;
  /** Block closing on scrim click / Escape (e.g. while a mutation runs). */
  dismissible?: boolean;
  className?: string;
}

const widths = { sm: 'max-w-md', md: 'max-w-lg', lg: 'max-w-2xl', xl: 'max-w-4xl' };
const chip = {
  primary: 'bg-primary-soft text-primary-text',
  danger: 'bg-danger-soft text-danger-text',
  warning: 'bg-warning-soft text-warning-text',
};

export const Dialog: React.FC<DialogProps> = ({
  open,
  onOpenChange,
  title,
  description,
  icon,
  tone = 'primary',
  size = 'md',
  children,
  footer,
  dismissible = true,
  className,
}) => (
  <RD.Root open={open} onOpenChange={(o) => (dismissible || o ? onOpenChange(o) : undefined)}>
    <RD.Portal>
      <RD.Overlay className="fixed inset-0 z-[var(--z-overlay)] bg-scrim backdrop-blur-[2px] data-[state=open]:animate-fade-in data-[state=closed]:animate-fade-out" />
      <div className="pointer-events-none fixed inset-0 z-[var(--z-overlay)] flex items-end justify-center p-0 sm:items-center sm:p-6">
        <RD.Content
          onOpenAutoFocus={(e) => {
            // Autofocus on desktop only — on touch it throws up the keyboard
            if (window.matchMedia('(pointer: coarse)').matches) e.preventDefault();
          }}
          className={cn(
            'pointer-events-auto flex max-h-[92dvh] w-full flex-col overflow-hidden bg-surface shadow-pop',
            'rounded-t-3xl sm:rounded-2xl border border-line',
            'data-[state=open]:animate-pop-in data-[state=closed]:animate-pop-out',
            widths[size],
            className,
          )}
        >
          <div className="flex items-start gap-3 px-5 pt-5 pb-4 sm:px-6">
            {icon && <div className={cn('flex size-10 shrink-0 items-center justify-center rounded-xl', chip[tone])}>{icon}</div>}
            <div className="min-w-0 flex-1 pt-0.5">
              <RD.Title className="font-display text-[17px] font-semibold leading-6 tracking-[-0.015em] text-fg">{title}</RD.Title>
              {description ? (
                <RD.Description className="mt-1 text-[13px] leading-5 text-fg-muted">{description}</RD.Description>
              ) : (
                <RD.Description className="sr-only">{typeof title === 'string' ? title : 'Dialog'}</RD.Description>
              )}
            </div>
            {dismissible && (
              <RD.Close asChild>
                <IconButton aria-label="Close" size="sm" className="-mr-1.5 -mt-1">
                  <X className="size-4" />
                </IconButton>
              </RD.Close>
            )}
          </div>
          {children && <div className="min-h-0 flex-1 overflow-y-auto px-5 pb-5 sm:px-6">{children}</div>}
          {footer && (
            <div className="flex flex-col-reverse gap-2 border-t border-line bg-surface-2/60 px-5 py-4 sm:flex-row sm:justify-end sm:px-6">
              {footer}
            </div>
          )}
        </RD.Content>
      </div>
    </RD.Portal>
  </RD.Root>
);

/** Side sheet (drawer) from the right — details panels, mobile nav. */
interface SheetProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  title: React.ReactNode;
  description?: React.ReactNode;
  side?: 'right' | 'left';
  width?: string;
  children: React.ReactNode;
  headerActions?: React.ReactNode;
  className?: string;
}

export const Sheet: React.FC<SheetProps> = ({
  open,
  onOpenChange,
  title,
  description,
  side = 'right',
  width = 'max-w-xl',
  children,
  headerActions,
  className,
}) => (
  <RD.Root open={open} onOpenChange={onOpenChange}>
    <RD.Portal>
      <RD.Overlay className="fixed inset-0 z-[var(--z-sheet)] bg-scrim data-[state=open]:animate-fade-in data-[state=closed]:animate-fade-out" />
      <RD.Content
        className={cn(
          'fixed inset-y-0 z-[var(--z-sheet)] flex w-full flex-col bg-surface shadow-pop outline-none overscroll-contain',
          side === 'right'
            ? 'right-0 border-l border-line data-[state=open]:animate-sheet-in data-[state=closed]:animate-sheet-out'
            : 'left-0 border-r border-line data-[state=open]:animate-[sheet-in-left_320ms_var(--ease-drawer)] data-[state=closed]:animate-[sheet-out-left_240ms_var(--ease-drawer)]',
          width,
          className,
        )}
      >
        <div className="flex items-start gap-3 border-b border-line px-5 py-4">
          <div className="min-w-0 flex-1">
            <RD.Title className="font-display text-[16px] font-semibold tracking-[-0.015em] text-fg">{title}</RD.Title>
            {description ? (
              <RD.Description className="mt-0.5 text-[13px] text-fg-muted">{description}</RD.Description>
            ) : (
              <RD.Description className="sr-only">{typeof title === 'string' ? title : 'Panel'}</RD.Description>
            )}
          </div>
          {headerActions}
          <RD.Close asChild>
            <IconButton aria-label="Close" size="sm">
              <X className="size-4" />
            </IconButton>
          </RD.Close>
        </div>
        <div className="min-h-0 flex-1 overflow-y-auto">{children}</div>
      </RD.Content>
    </RD.Portal>
  </RD.Root>
);
