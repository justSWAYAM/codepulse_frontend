import React, { useId } from 'react';
import { cn } from '../../lib/cn';

const control =
  'w-full rounded-xl border border-line bg-surface px-3.5 text-sm text-fg placeholder:text-fg-subtle ' +
  'transition-[border-color,box-shadow] duration-150 ease-out ' +
  'hover-fine:border-line-strong focus:outline-none focus:border-primary focus:ring-3 focus:ring-ring/40 ' +
  'disabled:cursor-not-allowed disabled:opacity-60 aria-invalid:border-danger aria-invalid:focus:ring-danger/25';

export const controlClass = control;

export const Input = React.forwardRef<HTMLInputElement, React.InputHTMLAttributes<HTMLInputElement>>(
  function Input({ className, ...rest }, ref) {
    return <input ref={ref} className={cn(control, 'h-10', className)} {...rest} />;
  },
);

export const Textarea = React.forwardRef<HTMLTextAreaElement, React.TextareaHTMLAttributes<HTMLTextAreaElement>>(
  function Textarea({ className, ...rest }, ref) {
    return <textarea ref={ref} className={cn(control, 'min-h-24 py-2.5 leading-6', className)} {...rest} />;
  },
);

/** Native select: accessible and fast; styled to match the inputs. */
export const Select = React.forwardRef<HTMLSelectElement, React.SelectHTMLAttributes<HTMLSelectElement>>(
  function Select({ className, children, ...rest }, ref) {
    return (
      <select
        ref={ref}
        className={cn(
          control,
          'h-10 appearance-none pr-9 bg-no-repeat bg-[length:16px] bg-[position:right_12px_center]',
          "bg-[url(\"data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 24 24' fill='none' stroke='%23767c96' stroke-width='2' stroke-linecap='round' stroke-linejoin='round'%3E%3Cpath d='m6 9 6 6 6-6'/%3E%3C/svg%3E\")]",
          className,
        )}
        {...rest}
      >
        {children}
      </select>
    );
  },
);

export const Label: React.FC<React.LabelHTMLAttributes<HTMLLabelElement>> = ({ className, ...rest }) => (
  <label className={cn('block text-[13px] font-medium text-fg', className)} {...rest} />
);

interface FieldProps {
  label?: React.ReactNode;
  hint?: React.ReactNode;
  error?: string;
  required?: boolean;
  className?: string;
  /** Render prop receives the id + aria wiring for the control. */
  children: (props: { id: string; 'aria-invalid'?: boolean; 'aria-describedby'?: string }) => React.ReactNode;
}

/** Label + control + hint/error, wired for screen readers. The error sits beside its field. */
export const Field: React.FC<FieldProps> = ({ label, hint, error, required, className, children }) => {
  const id = useId();
  const describedBy = error ? `${id}-error` : hint ? `${id}-hint` : undefined;
  return (
    <div className={cn('space-y-1.5', className)}>
      {label && (
        <Label htmlFor={id}>
          {label}
          {required && <span className="ml-0.5 text-danger-text" aria-hidden>*</span>}
        </Label>
      )}
      {children({ id, 'aria-invalid': error ? true : undefined, 'aria-describedby': describedBy })}
      {error ? (
        <p id={`${id}-error`} className="text-[12px] leading-4 text-danger-text">{error}</p>
      ) : hint ? (
        <p id={`${id}-hint`} className="text-[12px] leading-4 text-fg-subtle">{hint}</p>
      ) : null}
    </div>
  );
};
