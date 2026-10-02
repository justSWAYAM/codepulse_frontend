import React from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';
import { Eye } from 'lucide-react';
import { Button, Card, Eyebrow, Field, Input, Select, Textarea } from '../ui';

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
    .max(512000, 'Maximum 512,000 KB (500 MB), the judge limit'),
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
    <form onSubmit={handleSubmit(onSubmit)} noValidate>
      <Card className="overflow-hidden">
        <div className="grid lg:grid-cols-2">
          {/* Left: fields */}
          <div className="space-y-5 p-5 sm:p-6">
            <Field label="Title" error={errors.title?.message} required>
              {(p) => <Input {...p} {...register('title')} placeholder="e.g., Two Sum" />}
            </Field>

            <Field label="Difficulty" error={errors.difficulty?.message}>
              {(p) => (
                <Select {...p} {...register('difficulty')}>
                  <option value="EASY">Easy</option>
                  <option value="MEDIUM">Medium</option>
                  <option value="HARD">Hard</option>
                </Select>
              )}
            </Field>

            <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
              <Field label="Points" error={errors.points?.message}>
                {(p) => (
                  <Input {...p} type="number" className="tabular" {...register('points', { valueAsNumber: true })} />
                )}
              </Field>
              <Field label="Time limit (ms)" error={errors.timeLimitMs?.message}>
                {(p) => (
                  <Input
                    {...p}
                    type="number"
                    className="tabular"
                    {...register('timeLimitMs', { valueAsNumber: true })}
                  />
                )}
              </Field>
              <Field label="Memory limit (KB)" error={errors.memoryLimitKb?.message}>
                {(p) => (
                  <Input
                    {...p}
                    type="number"
                    className="tabular"
                    {...register('memoryLimitKb', { valueAsNumber: true })}
                  />
                )}
              </Field>
            </div>

            <Field label="Description" hint="Markdown supported. The preview updates as you type." error={errors.description?.message} required>
              {(p) => (
                <Textarea
                  {...p}
                  {...register('description')}
                  spellCheck={false}
                  className="min-h-[320px] resize-y font-mono text-[13px]"
                  placeholder="Write question description in Markdown format…"
                />
              )}
            </Field>
          </div>

          {/* Right: live preview */}
          <div className="flex min-w-0 flex-col border-t border-line bg-surface-2/40 lg:border-t-0 lg:border-l">
            <div className="flex items-center gap-2 border-b border-line px-5 py-3 sm:px-6">
              <Eye className="size-3.5 text-fg-subtle" aria-hidden />
              <Eyebrow>Preview</Eyebrow>
            </div>
            <div className="scroll-thin min-h-[200px] flex-1 overflow-y-auto px-5 py-5 sm:px-6 lg:max-h-[720px]">
              {descriptionValue ? (
                <div className="prose-cp">
                  <ReactMarkdown remarkPlugins={[remarkGfm]}>{descriptionValue}</ReactMarkdown>
                </div>
              ) : (
                <p className="text-sm text-fg-subtle">The rendered description appears here as you write it.</p>
              )}
            </div>
          </div>
        </div>

        {/* Actions */}
        <div className="flex flex-col-reverse gap-2 border-t border-line bg-surface-2/60 px-5 py-4 sm:flex-row sm:justify-end sm:px-6">
          <Button variant="secondary" onClick={() => window.history.back()} disabled={isPending}>
            Cancel
          </Button>
          <Button type="submit" loading={isPending}>
            Save question
          </Button>
        </div>
      </Card>
    </form>
  );
};
