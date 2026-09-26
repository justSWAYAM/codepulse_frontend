import React from 'react';
import { useForm, Controller } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { Loader2 } from 'lucide-react';

const testCaseSchema = z.object({
  input: z.string().min(1, 'Input is required'),
  expectedOutput: z.string().min(1, 'Expected output is required'),
  isSample: z.boolean(),
  weight: z
    .number()
    .min(0, 'Weight cannot be negative'),
});

export type TestCaseFormData = z.infer<typeof testCaseSchema>;

interface TestCaseFormProps {
  onSubmit: (data: TestCaseFormData) => void;
  isPending: boolean;
}

export const TestCaseForm: React.FC<TestCaseFormProps> = ({ onSubmit, isPending }) => {
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
    <form onSubmit={handleSubmit(onSubmit)} className="space-y-5">
      {/* Input */}
      <div>
        <label className="block text-sm font-medium text-ink/70 mb-1.5">Input</label>
        <textarea
          {...register('input')}
          rows={4}
          className={`w-full px-4 py-3 rounded-xl border font-mono text-sm bg-background resize-y ${
            errors.input ? 'border-accent-error' : 'border-hairline'
          } focus:outline-none focus:ring-2 focus:ring-accent-compile/40 focus:border-accent-compile transition-colors`}
          placeholder="Test case input..."
        />
        {errors.input && (
          <p className="mt-1 text-xs text-accent-error">{errors.input.message}</p>
        )}
      </div>

      {/* Expected Output */}
      <div>
        <label className="block text-sm font-medium text-ink/70 mb-1.5">Expected Output</label>
        <textarea
          {...register('expectedOutput')}
          rows={4}
          className={`w-full px-4 py-3 rounded-xl border font-mono text-sm bg-background resize-y ${
            errors.expectedOutput ? 'border-accent-error' : 'border-hairline'
          } focus:outline-none focus:ring-2 focus:ring-accent-compile/40 focus:border-accent-compile transition-colors`}
          placeholder="Expected output..."
        />
        {errors.expectedOutput && (
          <p className="mt-1 text-xs text-accent-error">{errors.expectedOutput.message}</p>
        )}
      </div>

      {/* Is Sample + Weight row */}
      <div className="flex items-start gap-6">
        {/* Is Sample switch */}
        <div className="flex-1">
          <div className="flex items-center gap-3">
            <Controller
              name="isSample"
              control={control}
              render={({ field }) => (
                <button
                  type="button"
                  role="switch"
                  aria-checked={field.value}
                  onClick={() => field.onChange(!field.value)}
                  className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors ${
                    field.value ? 'bg-accent-compile' : 'bg-ink/10'
                  }`}
                >
                  <span
                    className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform shadow-sm ${
                      field.value ? 'translate-x-6' : 'translate-x-1'
                    }`}
                  />
                </button>
              )}
            />
            <label className="text-sm font-medium text-ink">Sample Test Case</label>
          </div>
          <p className="text-xs text-ink/40 mt-1.5 ml-14">
            Visible to candidates before they submit — don't use for cases that reveal the intended approach
          </p>
        </div>

        {/* Weight */}
        <div className="w-32">
          <label className="block text-sm font-medium text-ink/70 mb-1.5">Weight</label>
          <input
            type="number"
            step="any"
            {...register('weight', { valueAsNumber: true })}
            className={`w-full px-3 py-2 rounded-lg border text-sm font-mono ${
              errors.weight ? 'border-accent-error' : 'border-hairline'
            } focus:outline-none focus:ring-2 focus:ring-accent-compile/40 focus:border-accent-compile transition-colors`}
          />
          {errors.weight && (
            <p className="mt-1 text-xs text-accent-error">{errors.weight.message}</p>
          )}
        </div>
      </div>

      {/* Footer note (Section 4.1) */}
      <p className="text-xs text-ink/30 italic">
        Test cases can't be edited after creation — delete and re-add if you need to change one.
      </p>

      {/* Submit */}
      <div className="flex justify-end pt-2">
        <button
          type="submit"
          disabled={isPending}
          className="px-5 py-2.5 rounded-xl bg-accent-compile text-white text-sm font-medium hover:bg-accent-compile-hover transition-colors disabled:opacity-40 disabled:cursor-not-allowed cursor-pointer flex items-center gap-2"
        >
          {isPending && <Loader2 className="w-4 h-4 animate-spin" />}
          {isPending ? 'Adding...' : 'Add Test Case'}
        </button>
      </div>
    </form>
  );
};
