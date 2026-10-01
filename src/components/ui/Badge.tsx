import React from 'react';
import { cn } from '../../lib/cn';

export type Tone = 'neutral' | 'primary' | 'success' | 'warning' | 'danger' | 'info';

const tones: Record<Tone, { badge: string; dot: string }> = {
  neutral: { badge: 'bg-surface-2 text-fg-muted border-line', dot: 'bg-fg-subtle' },
  primary: { badge: 'bg-primary-soft text-primary-text border-primary/20', dot: 'bg-primary' },
  success: { badge: 'bg-success-soft text-success-text border-success/20', dot: 'bg-success' },
  warning: { badge: 'bg-warning-soft text-warning-text border-warning/25', dot: 'bg-warning' },
  danger: { badge: 'bg-danger-soft text-danger-text border-danger/20', dot: 'bg-danger' },
  info: { badge: 'bg-info-soft text-info-text border-info/20', dot: 'bg-info' },
};

export interface BadgeProps extends React.HTMLAttributes<HTMLSpanElement> {
  tone?: Tone;
  /** Leading dot; colour is never the only signal, so a label always accompanies it. */
  dot?: boolean;
  /** Pulse the dot (live states only). */
  live?: boolean;
  icon?: React.ReactNode;
  size?: 'sm' | 'md';
}

export const Badge: React.FC<BadgeProps> = ({ tone = 'neutral', dot, live, icon, size = 'md', className, children, ...rest }) => (
  <span
    className={cn(
      'inline-flex shrink-0 items-center gap-1.5 rounded-full border font-medium whitespace-nowrap',
      size === 'sm' ? 'h-5 px-2 text-[11px]' : 'h-6 px-2.5 text-[12px]',
      tones[tone].badge,
      className,
    )}
    {...rest}
  >
    {dot && (
      <span className="relative flex size-1.5" aria-hidden>
        {live && <span className={cn('absolute inset-0 rounded-full opacity-60 motion-safe:animate-ping', tones[tone].dot)} />}
        <span className={cn('relative size-1.5 rounded-full', tones[tone].dot)} />
      </span>
    )}
    {icon}
    {children}
  </span>
);
