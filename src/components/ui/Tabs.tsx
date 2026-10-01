import React from 'react';
import * as RT from '@radix-ui/react-tabs';
import { cn } from '../../lib/cn';

export const Tabs = RT.Root;
export const TabsContent: React.FC<RT.TabsContentProps> = ({ className, ...rest }) => (
  <RT.Content className={cn('outline-none', className)} {...rest} />
);

/** Underline tabs. Weight never changes between states; colour marks selection. */
export const TabsList: React.FC<RT.TabsListProps> = ({ className, ...rest }) => (
  <RT.List
    className={cn('flex items-center gap-1 overflow-x-auto border-b border-line [scrollbar-width:none]', className)}
    {...rest}
  />
);

export const TabsTrigger: React.FC<RT.TabsTriggerProps & { icon?: React.ReactNode; count?: number }> = ({
  className,
  icon,
  count,
  children,
  ...rest
}) => (
  <RT.Trigger
    className={cn(
      'relative -mb-px inline-flex h-10 shrink-0 items-center gap-2 px-3 text-[13px] font-medium text-fg-subtle outline-none',
      'transition-colors duration-150 hover-fine:text-fg',
      'after:absolute after:inset-x-2 after:bottom-0 after:h-[2px] after:rounded-full after:bg-transparent after:transition-colors after:duration-150',
      'data-[state=active]:text-fg data-[state=active]:after:bg-primary',
      'focus-visible:rounded-lg focus-visible:outline-2 focus-visible:outline-ring',
      className,
    )}
    {...rest}
  >
    {icon && <span className="[&>svg]:size-4">{icon}</span>}
    {children}
    {count !== undefined && (
      <span className="tabular rounded-full bg-surface-2 px-1.5 text-[11px] leading-[18px] text-fg-muted">{count}</span>
    )}
  </RT.Trigger>
);

/** Segmented control for 2–4 options (e.g. Problem | Code on narrow screens). */
export const Segmented = <T extends string>({
  value,
  onChange,
  options,
  className,
  'aria-label': ariaLabel,
}: {
  value: T;
  onChange: (v: T) => void;
  options: { value: T; label: React.ReactNode }[];
  className?: string;
  'aria-label': string;
}) => (
  <div role="radiogroup" aria-label={ariaLabel} className={cn('inline-flex rounded-xl bg-surface-2 p-1', className)}>
    {options.map((o) => (
      <button
        key={o.value}
        type="button"
        role="radio"
        aria-checked={value === o.value}
        onClick={() => onChange(o.value)}
        className={cn(
          'h-8 flex-1 rounded-lg px-3 text-[13px] font-medium transition-[background-color,color,box-shadow] duration-150',
          value === o.value ? 'bg-surface text-fg shadow-card' : 'text-fg-subtle hover-fine:text-fg',
        )}
      >
        {o.label}
      </button>
    ))}
  </div>
);
