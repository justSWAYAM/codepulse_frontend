import React from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';

const questionSchema = z.object({
  title: z
    .string()
    .min(1, 'Title is required')
    .max(255, 'Title must not exceed 255 characters'),
  description: z.string().min(1, 'Description is required'),
  difficulty: z.enum(['EASY', 'MEDIUM', 'HARD']),
  points: z
    .number()
    .min(1, 'Minimum 1 point')
    .max(1000, 'Maximum 1000 points'),
  timeLimitMs: z
    .number()
    .min(100, 'Minimum 100ms')
    .max(10000, 'Maximum 10,000ms'),
  memoryLimitKb: z
    .number()
    .min(4096, 'Minimum 4096 KB (4 MB)')
    .max(1048576, 'Maximum 1,048,576 KB (1 GB)'),
});

export type QuestionFormData = z.infer<typeof questionSchema>;

interface QuestionFormProps {
  defaultValues?: Partial<QuestionFormData>;
  onSubmit: (data: QuestionFormData) => void;
  isPending: boolean;
}

export const QuestionForm: React.FC<QuestionFormProps> = ({
  defaultValues,
  onSubmit,
  isPending,
}) => {
  const {
    register,
    handleSubmit,
    watch,
    formState: { errors },
  } = useForm<QuestionFormData>({
    resolver: zodResolver(questionSchema),
    defaultValues: {
      title: defaultValues?.title || '',
      description: defaultValues?.description || '',
      difficulty: defaultValues?.difficulty || 'MEDIUM',
      points: defaultValues?.points || 100,
      timeLimitMs: defaultValues?.timeLimitMs || 2000,
      memoryLimitKb: defaultValues?.memoryLimitKb || 262144,
    },
  });

  const descriptionValue = watch('description');

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="flex flex-col md:flex-row gap-6 h-full">
      {/* Left Column: Form Fields */}
      <div data-lenis-prevent className="flex-1 space-y-6 md:w-[60%] overflow-y-auto pr-2 pb-20">
        <div>
          <label className="block text-sm font-medium text-fg mb-1">Title</label>
          <input
            {...register('title')}
            className={`w-full px-4 py-2 rounded-lg border ${
              errors.title ? 'border-danger' : 'border-line'
            } focus:outline-none focus:ring-2 focus:ring-ring`}
            placeholder="e.g., Two Sum"
          />
          {errors.title && (
            <p className="mt-1 text-sm text-danger-text">{errors.title.message}</p>
          )}
        </div>

        <div>
          <label className="block text-sm font-medium text-fg mb-1">Difficulty</label>
          <select
            {...register('difficulty')}
            className={`w-full px-4 py-2 rounded-lg border ${
              errors.difficulty ? 'border-danger' : 'border-line'
            } focus:outline-none focus:ring-2 focus:ring-ring bg-surface`}
          >
            <option value="EASY">EASY</option>
            <option value="MEDIUM">MEDIUM</option>
            <option value="HARD">HARD</option>
          </select>
          {errors.difficulty && (
            <p className="mt-1 text-sm text-danger-text">{errors.difficulty.message}</p>
          )}
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div>
            <label className="block text-sm font-medium text-fg mb-1">Points</label>
            <input
              type="number"
              {...register('points', { valueAsNumber: true })}
              className={`w-full px-4 py-2 rounded-lg border ${
                errors.points ? 'border-danger' : 'border-line'
              } focus:outline-none focus:ring-2 focus:ring-ring`}
            />
            {errors.points && (
              <p className="mt-1 text-sm text-danger-text">{errors.points.message}</p>
            )}
          </div>
          <div>
            <label className="block text-sm font-medium text-fg mb-1">Time Limit (ms)</label>
            <input
              type="number"
              {...register('timeLimitMs', { valueAsNumber: true })}
              className={`w-full px-4 py-2 rounded-lg border ${
                errors.timeLimitMs ? 'border-danger' : 'border-line'
              } focus:outline-none focus:ring-2 focus:ring-ring`}
            />
            {errors.timeLimitMs && (
              <p className="mt-1 text-sm text-danger-text">{errors.timeLimitMs.message}</p>
            )}
          </div>
          <div>
            <label className="block text-sm font-medium text-fg mb-1">Memory Limit (KB)</label>
            <input
              type="number"
              {...register('memoryLimitKb', { valueAsNumber: true })}
              className={`w-full px-4 py-2 rounded-lg border ${
                errors.memoryLimitKb ? 'border-danger' : 'border-line'
              } focus:outline-none focus:ring-2 focus:ring-ring`}
            />
            {errors.memoryLimitKb && (
              <p className="mt-1 text-sm text-danger-text">{errors.memoryLimitKb.message}</p>
            )}
          </div>
        </div>

        <div className="flex-1 flex flex-col min-h-[400px]">
          <label className="block text-sm font-medium text-fg mb-1">
            Description (Markdown)
          </label>
          <textarea
            data-lenis-prevent
            {...register('description')}
            className={`w-full flex-1 min-h-[300px] px-4 py-3 rounded-lg border font-mono text-sm ${
              errors.description ? 'border-danger' : 'border-line'
            } focus:outline-none focus:ring-2 focus:ring-ring resize-y`}
            placeholder="Write question description in Markdown format..."
          />
          {errors.description && (
            <p className="mt-1 text-sm text-danger-text">{errors.description.message}</p>
          )}
        </div>
      </div>

      {/* Right Column: Markdown Preview */}
      <div data-lenis-prevent className="flex-1 md:w-[40%] flex flex-col bg-surface-2 border border-line rounded-lg p-6 overflow-y-auto pb-20 sticky top-0 h-full max-h-screen">
        <h3 className="text-sm font-semibold text-fg-muted uppercase tracking-wider mb-4">Preview</h3>
        <div data-lenis-prevent className="prose prose-slate prose-sm max-w-none prose-pre:bg-surface prose-pre:border prose-pre:border-line prose-pre:text-fg overflow-y-auto">
          {descriptionValue ? (
            <ReactMarkdown remarkPlugins={[remarkGfm]}>
              {descriptionValue}
            </ReactMarkdown>
          ) : (
            <p className="text-fg-subtle italic">Preview will appear here...</p>
          )}
        </div>
      </div>

      {/* Fixed bottom actions */}
      <div className="fixed bottom-0 left-0 right-0 bg-surface border-t border-line p-4 px-8 flex justify-end gap-4 md:pl-64 z-10 shadow-sm">
        <button
          type="button"
          onClick={() => window.history.back()}
          className="px-6 py-2 text-fg font-medium hover:bg-surface-2 rounded-lg transition-colors"
          disabled={isPending}
        >
          Cancel
        </button>
        <button
          type="submit"
          className="px-6 py-2 bg-primary text-white font-medium rounded-lg hover:bg-primary-hover transition-colors disabled:opacity-50"
          disabled={isPending}
        >
          {isPending ? 'Saving...' : 'Save Question'}
        </button>
      </div>
    </form>
  );
};
