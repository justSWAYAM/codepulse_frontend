import React from 'react';
import { cn } from '../../lib/cn';
import { Spinner } from './Spinner';

type Variant = 'primary' | 'secondary' | 'ghost' | 'danger' | 'success';
type Size = 'sm' | 'md' | 'lg';

const variants: Record<Variant, string> = {
  primary: 'bg-primary text-primary-fg hover-fine:bg-primary-hover shadow-[inset_0_1px_0_rgb(255_255_255/0.12)]',
  secondary: 'bg-surface text-fg border border-line hover-fine:bg-surface-2 hover-fine:border-line-strong',
  ghost: 'text-fg-muted hover-fine:bg-surface-2 hover-fine:text-fg',
  danger: 'bg-danger text-white hover-fine:brightness-110',
  success: 'bg-success text-white hover-fine:brightness-110',
};

const sizes: Record<Size, string> = {
  sm: 'h-8 px-3 text-[13px] gap-1.5 rounded-lg',
  md: 'h-10 px-4 text-sm gap-2 rounded-xl',
  lg: 'h-12 px-6 text-[15px] gap-2 rounded-xl',
};

export interface ButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: Variant;
  size?: Size;
  /** Keeps the label and width; shows a spinner and swallows presses. */
  loading?: boolean;
  leadingIcon?: React.ReactNode;
  trailingIcon?: React.ReactNode;
}

export const Button = React.forwardRef<HTMLButtonElement, ButtonProps>(function Button(
  { variant = 'primary', size = 'md', loading, leadingIcon, trailingIcon, className, children, disabled, onClick, type = 'button', ...rest },
  ref,
) {
  return (
    <button
      ref={ref}
      type={type}
      // aria-disabled (not disabled) while loading keeps focus on the button
      disabled={disabled}
      aria-disabled={loading || undefined}
      aria-busy={loading || undefined}
      onClick={loading ? (e) => e.preventDefault() : onClick}
      className={cn(
        'press relative inline-flex shrink-0 select-none items-center justify-center font-medium whitespace-nowrap',
        'disabled:opacity-50 disabled:cursor-not-allowed',
        variants[variant],
        sizes[size],
        loading && 'cursor-progress',
        className,
      )}
      {...rest}
    >
      {loading ? (
        <>
          <span className="invisible inline-flex items-center gap-[inherit]">
            {leadingIcon}
            {children}
            {trailingIcon}
          </span>
          <span className="absolute inset-0 flex items-center justify-center">
            <Spinner size={size === 'sm' ? 14 : 16} />
          </span>
        </>
      ) : (
        <>
          {leadingIcon}
          {children}
          {trailingIcon}
        </>
      )}
    </button>
  );
});

export interface IconButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  'aria-label': string;
  size?: 'sm' | 'md';
  variant?: 'ghost' | 'secondary';
}

export const IconButton = React.forwardRef<HTMLButtonElement, IconButtonProps>(function IconButton(
  { size = 'md', variant = 'ghost', className, type = 'button', ...rest },
  ref,
) {
  return (
    <button
      ref={ref}
      type={type}
      className={cn(
        'press-sm relative inline-flex shrink-0 items-center justify-center rounded-lg text-fg-muted',
        // 44px touch target even when the control looks smaller
        'after:absolute after:-inset-1 after:content-[""] pointer-coarse:after:-inset-2.5',
        'hover-fine:text-fg disabled:opacity-40 disabled:cursor-not-allowed',
        variant === 'ghost' ? 'hover-fine:bg-surface-2' : 'border border-line bg-surface hover-fine:bg-surface-2',
        size === 'sm' ? 'size-8' : 'size-9',
        className,
      )}
      {...rest}
    />
  );
});
