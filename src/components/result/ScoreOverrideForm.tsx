import React, { useEffect, useMemo, useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { AlertTriangle, Lock, RotateCcw, Save } from 'lucide-react';
import { toast } from 'sonner';
import { Button, Field, Input, Textarea } from '../ui';
import { useManualEvaluation } from '../../hooks/useResults';
import { getErrorMessage } from '../../lib/apiError';
import { formatScore } from '../../lib/format';
import type { QuestionResultView } from '../../api/resultApi';
import { overrideSchema } from '../../lib/results';

const revertSchema = z.object({
  comments: z.string().trim().min(1, 'Say why you’re reverting.').max(2000, 'Keep it under 2000 characters.'),
});

interface ScoreOverrideFormProps {
  contestId: string;
  candidateId: string;
  question: QuestionResultView;
  disabled?: boolean;
  disabledReason?: string;
}

const relative = new Intl.RelativeTimeFormat(undefined, { numeric: 'auto' });
const ago = (iso: string) => {
  const minutes = Math.round((new Date(iso).getTime() - Date.now()) / 60_000);
  if (Math.abs(minutes) < 60) return relative.format(minutes, 'minute');
  const hours = Math.round(minutes / 60);
  if (Math.abs(hours) < 24) return relative.format(hours, 'hour');
  return relative.format(Math.round(hours / 24), 'day');
};

export const ScoreOverrideForm: React.FC<ScoreOverrideFormProps> = ({ contestId, candidateId, question, disabled, disabledReason }) => {
  const evaluate = useManualEvaluation(contestId, candidateId);
  const [reverting, setReverting] = useState(false);
  const counted = question.countedSubmission ?? null;
  const active = question.activeOverride ?? null;
  const locked = !!disabled || !counted;

  const schema = useMemo(() => overrideSchema(question.maxPoints), [question.maxPoints]);
  type FormData = z.infer<typeof schema>;
  const form = useForm<FormData>({
    resolver: zodResolver(schema),
    defaultValues: { adjustedScore: question.finalScore, comments: '' },
  });
  const revertForm = useForm<z.infer<typeof revertSchema>>({ resolver: zodResolver(revertSchema), defaultValues: { comments: '' } });

  // Another question selected, or the server returned a new score
  useEffect(() => {
    form.reset({ adjustedScore: question.finalScore, comments: '' });
    revertForm.reset({ comments: '' });
    setReverting(false);
    evaluate.reset();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [question.questionId, question.finalScore]);

  const save = form.handleSubmit(({ adjustedScore, comments }) => {
    if (!counted) return;
    evaluate.mutate(
      { submissionId: counted.id, adjustedScore, comments: comments.trim() },
      { onSuccess: () => toast.success('Score updated') },
    );
  });

  const revert = revertForm.handleSubmit(({ comments }) => {
    if (!counted) return;
    evaluate.mutate(
      { submissionId: counted.id, adjustedScore: null, comments: comments.trim() },
      { onSuccess: () => toast.success('Reverted to the automatic score') },
    );
  });

  return (
    <section aria-labelledby="score-heading" className="rounded-2xl border border-line bg-surface p-4 sm:p-5">
      <h3 id="score-heading" className="font-display text-[14px] font-semibold tracking-[-0.015em] text-fg">
        Score
      </h3>
      <p className="tabular mt-1 text-[13px] text-fg-muted">
        Automatic score: {formatScore(question.autoScore)} / {question.maxPoints}
      </p>

      {active && (
        <div className="mt-3 rounded-xl bg-primary-soft px-3.5 py-2.5 text-[13px] leading-5 text-primary-text">
          <p className="tabular font-medium">
            Adjusted to {formatScore(active.adjustedScore)} by {active.evaluatorName ?? 'an evaluator'}, {ago(active.evaluatedAt)}
          </p>
          <p className="mt-0.5 whitespace-pre-wrap">{active.comments}</p>
        </div>
      )}

      {question.overrideOutdated && (
        <p className="mt-3 flex items-start gap-2 rounded-xl border border-warning/30 bg-warning-soft px-3.5 py-2.5 text-[13px] leading-5 text-warning-text">
          <AlertTriangle className="mt-0.5 size-4 shrink-0" aria-hidden />
          This adjustment was made on an earlier submission. Review it against the counted one.
        </p>
      )}

      {locked && disabledReason && (
        <p className="mt-3 flex items-start gap-2 text-[13px] text-fg-muted">
          <Lock className="mt-0.5 size-4 shrink-0 text-fg-subtle" aria-hidden />
          {disabledReason}
        </p>
      )}

      <form onSubmit={save} className="mt-4 space-y-3" noValidate>
        <Field
          label={`Final score (out of ${question.maxPoints})`}
          required
          error={form.formState.errors.adjustedScore?.message}
        >
          {(a11y) => (
            <Input
              {...a11y}
              type="number"
              inputMode="decimal"
              step="0.01"
              min={0}
              max={question.maxPoints}
              disabled={locked}
              className="tabular sm:w-40"
              {...form.register('adjustedScore', { valueAsNumber: true })}
            />
          )}
        </Field>
        <Field label="Comment" required error={form.formState.errors.comments?.message}>
          {(a11y) => (
            <Textarea
              {...a11y}
              rows={3}
              disabled={locked}
              placeholder="Why are you adjusting this score? (internal, not shown to the candidate)"
              {...form.register('comments')}
            />
          )}
        </Field>

        {evaluate.isError && (
          <p role="alert" className="rounded-xl bg-danger-soft px-3.5 py-2.5 text-[13px] leading-5 text-danger-text">
            {getErrorMessage(evaluate.error, 'Couldn’t save the score.')}
          </p>
        )}

        <div className="flex flex-wrap gap-2">
          <Button type="submit" size="sm" disabled={locked} loading={evaluate.isPending && !reverting} leadingIcon={<Save className="size-3.5" />}>
            Save adjusted score
          </Button>
          {active && !reverting && (
            <Button type="button" size="sm" variant="secondary" disabled={locked} onClick={() => setReverting(true)} leadingIcon={<RotateCcw className="size-3.5" />}>
              Revert to automatic score
            </Button>
          )}
        </div>
      </form>

      {active && reverting && (
        <form onSubmit={revert} className="mt-4 space-y-3 border-t border-line pt-4" noValidate>
          <Field label="Why revert?" required error={revertForm.formState.errors.comments?.message}>
            {(a11y) => <Textarea {...a11y} rows={2} disabled={locked} {...revertForm.register('comments')} />}
          </Field>
          <div className="flex flex-wrap gap-2">
            <Button type="submit" size="sm" variant="secondary" disabled={locked} loading={evaluate.isPending} leadingIcon={<RotateCcw className="size-3.5" />}>
              Revert to {formatScore(question.autoScore)}
            </Button>
            <Button type="button" size="sm" variant="ghost" onClick={() => setReverting(false)} disabled={evaluate.isPending}>
              Cancel
            </Button>
          </div>
        </form>
      )}
    </section>
  );
};
