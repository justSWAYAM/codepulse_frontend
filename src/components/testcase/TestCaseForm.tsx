import React, { useId } from 'react';
import { useForm, Controller } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { cn } from '../../lib/cn';
import { Button, Field, Input, Textarea } from '../ui';

const testCaseSchema = z.object({
  input: z.string().min(1, 'Input is required'),
  expectedOutput: z.string().min(1, 'Expected output is required'),
  isSample: z.boolean(),
  weight: z
    .number({ message: 'Weight is required' })
    .int('Weight must be a whole number')
    .min(0, 'Weight cannot be negative'),
});

export type TestCaseFormData = z.infer<typeof testCaseSchema>;

interface TestCaseFormProps {
  onSubmit: (data: TestCaseFormData) => void;
  isPending: boolean;
  submitLabel?: string;
}

export const TestCaseForm: React.FC<TestCaseFormProps> = ({ onSubmit, isPending, submitLabel = 'Add test case' }) => {
  const switchId = useId();
  const {
    register,
    handleSubmit,
    control,
    formState: { errors },
  } = useForm<TestCaseFormData>({
    resolver: zodResolver(testCaseSchema),
    defaultValues: {
      input: '',
      expectedOutput: '',
      isSample: false,
      weight: 0,
    },
  });

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
      <div className="grid gap-4 sm:grid-cols-2">
        <Field label="Input" error={errors.input?.message} required>
          {(p) => (
            <Textarea
              {...p}
              {...register('input')}
              rows={5}
              spellCheck={false}
              className="resize-y font-mono text-[13px]"
              placeholder="Test case input…"
            />
          )}
        </Field>
        <Field label="Expected output" error={errors.expectedOutput?.message} required>
          {(p) => (
            <Textarea
              {...p}
              {...register('expectedOutput')}
              rows={5}
              spellCheck={false}
              className="resize-y font-mono text-[13px]"
              placeholder="Expected output…"
            />
          )}
        </Field>
      </div>

      <div className="flex flex-col gap-4 sm:flex-row sm:items-start">
        <div className="flex min-w-0 flex-1 items-start gap-3 rounded-xl border border-line bg-surface-2/60 p-3">
          <Controller
            name="isSample"
            control={control}
            render={({ field }) => (
              <button
                type="button"
                role="switch"
                id={switchId}
                aria-checked={field.value}
                aria-describedby={`${switchId}-hint`}
                onClick={() => field.onChange(!field.value)}
                className={cn(
                  'press-sm relative mt-0.5 inline-flex h-5 w-9 shrink-0 items-center rounded-full transition-colors duration-150',
                  field.value ? 'bg-primary' : 'bg-line-strong',
                )}
              >
                <span
                  className={cn(
                    'inline-block size-4 rounded-full bg-surface shadow-card transition-transform duration-150 ease-out',
                    field.value ? 'translate-x-[18px]' : 'translate-x-0.5',
                  )}
                />
              </button>
            )}
          />
          <div className="min-w-0">
            <label htmlFor={switchId} className="text-[13px] font-medium text-fg">
              Sample test case
            </label>
            <p id={`${switchId}-hint`} className="mt-0.5 text-[12px] leading-5 text-fg-subtle">
              Shown to candidates before they submit. Don't use one that reveals the intended approach.
            </p>
          </div>
        </div>

        <Field label="Weight" error={errors.weight?.message} className="sm:w-32">
          {(p) => (
            <Input
              {...p}
              type="number"
              step={1}
              min={0}
              {...register('weight', { valueAsNumber: true })}
              className="tabular font-mono"
            />
          )}
        </Field>
      </div>

      <div className="flex flex-col-reverse gap-3 border-t border-line pt-4 sm:flex-row sm:items-center sm:justify-between">
        <p className="text-[12px] leading-5 text-fg-subtle">
          Test cases can't be edited after creation. Delete and re-add one to change it.
        </p>
        <Button type="submit" loading={isPending}>
          {submitLabel}
        </Button>
      </div>
    </form>
  );
};
