import React from 'react';
import { cn } from '../../lib/cn';

export const Card: React.FC<React.HTMLAttributes<HTMLDivElement>> = ({ className, ...rest }) => (
  <div className={cn('rounded-2xl border border-line bg-surface shadow-card', className)} {...rest} />
);

interface CardHeaderProps extends Omit<React.HTMLAttributes<HTMLDivElement>, 'title'> {
  title: React.ReactNode;
  description?: React.ReactNode;
  actions?: React.ReactNode;
  icon?: React.ReactNode;
}

export const CardHeader: React.FC<CardHeaderProps> = ({ title, description, actions, icon, className, ...rest }) => (
  <div className={cn('flex items-start gap-3 px-5 pt-5 pb-4 sm:px-6', className)} {...rest}>
    {icon && (
      <div className="flex size-9 shrink-0 items-center justify-center rounded-xl bg-primary-soft text-primary-text">{icon}</div>
    )}
    <div className="min-w-0 flex-1">
      <h3 className="font-display text-[15px] font-semibold tracking-[-0.015em] text-fg">{title}</h3>
      {description && <p className="mt-0.5 text-[13px] leading-5 text-fg-muted">{description}</p>}
    </div>
    {actions && <div className="flex shrink-0 items-center gap-2">{actions}</div>}
  </div>
);

export const CardBody: React.FC<React.HTMLAttributes<HTMLDivElement>> = ({ className, ...rest }) => (
  <div className={cn('px-5 pb-5 sm:px-6 sm:pb-6', className)} {...rest} />
);

/** Page title row used at the top of every dashboard page. */
export const PageHeader: React.FC<{
  title: React.ReactNode;
  description?: React.ReactNode;
  eyebrow?: React.ReactNode;
  actions?: React.ReactNode;
  className?: string;
}> = ({ title, description, eyebrow, actions, className }) => (
  <div className={cn('flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between', className)}>
    <div className="min-w-0">
      {eyebrow && <div className="mb-2 font-mono text-[11px] font-medium uppercase tracking-[0.08em] text-fg-subtle">{eyebrow}</div>}
      <h1 className="font-display text-2xl font-semibold tracking-[-0.03em] text-fg sm:text-[28px] sm:leading-9">{title}</h1>
      {description && <p className="mt-1.5 max-w-[65ch] text-sm leading-6 text-fg-muted">{description}</p>}
    </div>
    {actions && <div className="flex shrink-0 flex-wrap items-center gap-2">{actions}</div>}
  </div>
);
