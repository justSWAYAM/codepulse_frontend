import React, { useEffect, useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { Link } from 'react-router-dom';
import { ArrowLeft, Check, Lock, Plus } from 'lucide-react';
import { Button, ButtonLink, Card, Field, Input, PageHeader, Textarea } from '../components/ui';
import { LoadingState } from '../components/states/LoadingState';
import { EmptyState } from '../components/states/EmptyState';
import { LANGUAGES as LANGUAGE_META } from '../lib/languages';
import { getErrorMessage } from '../lib/apiError';
import { cn } from '../lib/cn';
import { useContest, useCreateContest, useUpdateContest } from '../hooks/useContests';

const LANGUAGES = ['JAVA', 'PYTHON', 'CPP', 'C', 'JAVASCRIPT'] as const;

const schema = z
  .object({
    title: z.string().min(3, 'Title must be at least 3 characters').max(255),
    description: z.string().max(2000, 'Max 2000 characters').optional(),
    startTime: z.string().min(1, 'Start time is required'),
    endTime: z.string().min(1, 'End time is required'),
    durationMinutes: z.number().min(1, 'Duration must be at least 1 minute'),
    allowedLanguages: z.array(z.string()).min(1, 'Select at least one language'),
  })
  .refine((d) => new Date(d.endTime) > new Date(d.startTime), {
    message: 'End time must be after start time',
    path: ['endTime'],
  });
// "Start time must be in the future" is checked in onSubmit: when editing it only
// applies if the schedule changed, matching ContestService.updateContest

type FormValues = z.infer<typeof schema>;

// ISO instant -> value for <input type="datetime-local"> in the viewer's timezone
const toLocalInput = (iso: string) => {
  const d = new Date(iso);
  const pad = (n: number) => String(n).padStart(2, '0');
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}T${pad(d.getHours())}:${pad(d.getMinutes())}`;
};

/** Create a contest, or edit a DRAFT one at /contests/:id/edit */
const ContestCreatePage: React.FC = () => {
  const navigate = useNavigate();
  const { id } = useParams<{ id: string }>();
  const isEdit = !!id;
  const createContest = useCreateContest();
  const updateContest = useUpdateContest(id ?? '');
  const { data: contest, isLoading } = useContest(id ?? '');
  const [apiError, setApiError] = useState<string | null>(null);
  const [description, setDescription] = useState('');

  const {
    register,
    handleSubmit,
    watch,
    setValue,
    setError,
    reset,
    formState: { errors, dirtyFields },
  } = useForm<FormValues>({
    resolver: zodResolver(schema),
    defaultValues: {
      allowedLanguages: [],
      durationMinutes: 60,
    },
  });

  // Prefill once the contest loads
  useEffect(() => {
    if (!contest) return;
    reset({
      title: contest.title,
      description: contest.description ?? '',
      startTime: toLocalInput(contest.startTime),
      endTime: toLocalInput(contest.endTime),
      durationMinutes: contest.durationMinutes,
      allowedLanguages: contest.allowedLanguages,
    });
    setDescription(contest.description ?? '');
  }, [contest, reset]);

  const startTime = watch('startTime');
  const endTime = watch('endTime');
  const scheduleChanged = !!dirtyFields.startTime || !!dirtyFields.endTime;

  // Suggest durationMinutes from the window, but only until the admin types their own:
  // a 60-minute exam inside a 3-hour window must not be reset to 180.
  // When editing, keep the saved duration until the schedule itself changes.
  const durationEdited = !!dirtyFields.durationMinutes;
  useEffect(() => {
    if (durationEdited || !startTime || !endTime || (isEdit && !scheduleChanged)) return;
    const diff = (new Date(endTime).getTime() - new Date(startTime).getTime()) / 60000;
    if (diff > 0) setValue('durationMinutes', Math.round(diff));
  }, [startTime, endTime, setValue, durationEdited, isEdit, scheduleChanged]);

  const toggleLanguage = (lang: string) => {
    const current = watch('allowedLanguages');
    const next = current.includes(lang)
      ? current.filter((l) => l !== lang)
      : [...current, lang];
    setValue('allowedLanguages', next, { shouldValidate: true, shouldDirty: true });
  };

  const onSubmit = async (values: FormValues) => {
    setApiError(null);
    if ((!isEdit || scheduleChanged) && new Date(values.startTime) <= new Date()) {
      setError('startTime', { message: 'Start time must be in the future' });
      return;
    }

    if (isEdit) {
      // Send only what changed so untouched times aren't re-validated server-side
      const payload: Parameters<typeof updateContest.mutateAsync>[0] = {};
      if (dirtyFields.title) payload.title = values.title;
      if (dirtyFields.description) payload.description = values.description ?? '';
      if (scheduleChanged) {
        payload.startTime = new Date(values.startTime).toISOString();
        payload.endTime = new Date(values.endTime).toISOString();
      }
      // The duration may also be auto-adjusted from a schedule change, not just typed
      if (values.durationMinutes !== contest?.durationMinutes) payload.durationMinutes = values.durationMinutes;
      if (dirtyFields.allowedLanguages) payload.allowedLanguages = values.allowedLanguages;
      try {
        await updateContest.mutateAsync(payload);
        navigate(`/dashboard/contests/${id}`);
      } catch (err: unknown) {
        setApiError(getErrorMessage(err, 'Failed to save changes. Please try again.'));
      }
      return;
    }

    try {
      const result = await createContest.mutateAsync({
        title: values.title,
        description: values.description,
        startTime: new Date(values.startTime).toISOString(),
        endTime: new Date(values.endTime).toISOString(),
        durationMinutes: values.durationMinutes,
        allowedLanguages: values.allowedLanguages,
      });
      navigate(`/dashboard/contests/${result.id}`);
    } catch (err: unknown) {
      setApiError(getErrorMessage(err, 'Failed to create contest. Please try again.'));
    }
  };

  const selectedLangs = watch('allowedLanguages');
  const backTo = isEdit ? `/dashboard/contests/${id}` : '/dashboard/contests';

  if (isEdit && isLoading) return <LoadingState message="Loading contest…" />;

  if (isEdit && (!contest || contest.status !== 'DRAFT')) {
    return (
      <Card className="mx-auto mt-8 max-w-md">
        <EmptyState
          icon={<Lock className="size-5" />}
          title={contest ? 'Only draft contests can be edited' : 'Contest not found'}
          message={
            contest
              ? 'This contest has been published, so its details are locked.'
              : 'This contest doesn’t exist or has been removed.'
          }
          action={
            <ButtonLink
              to={contest ? backTo : '/dashboard/contests'}
              variant="secondary"
              size="sm"
              leadingIcon={<ArrowLeft className="size-4" />}
            >
              {contest ? 'Back to contest' : 'Back to contests'}
            </ButtonLink>
          }
        />
      </Card>
    );
  }

  return (
    <div className="mx-auto max-w-2xl space-y-6">
      <div>
        <Link
          to={backTo}
          className="mb-3 inline-flex items-center gap-1.5 rounded-lg text-[13px] text-fg-muted hover-fine:text-fg"
        >
          <ArrowLeft className="size-4" />
          {isEdit ? 'Back to contest' : 'Contests'}
        </Link>
        {isEdit ? (
          <PageHeader title="Edit contest" description="Change the details, schedule or languages while the contest is still a draft." />
        ) : (
          <PageHeader title="Create contest" description="Set the schedule and languages. You’ll add questions and candidates next." />
        )}
      </div>

      <Card>
        <form onSubmit={handleSubmit(onSubmit)} noValidate>
          <div className="space-y-5 p-5 sm:p-6">
            <Field label="Title" required error={errors.title?.message}>
              {(p) => <Input {...p} {...register('title')} placeholder="e.g. Mid-semester coding exam" />}
            </Field>

            <Field
              label={
                <span className="flex w-full items-center justify-between">
                  Description
                  <span className="tabular font-normal text-fg-subtle">{description.length}/2000</span>
                </span>
              }
              error={errors.description?.message}
            >
              {(p) => (
                <Textarea
                  {...p}
                  {...register('description')}
                  value={description}
                  onChange={(e) => {
                    setDescription(e.target.value);
                    setValue('description', e.target.value, { shouldDirty: true });
                  }}
                  placeholder="Rules, topics and anything candidates should know…"
                  rows={4}
                  className="resize-y"
                />
              )}
            </Field>

            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
              <Field label="Starts" required error={errors.startTime?.message}>
                {(p) => <Input {...p} {...register('startTime')} type="datetime-local" className="tabular" />}
              </Field>
              <Field label="Ends" required error={errors.endTime?.message}>
                {(p) => <Input {...p} {...register('endTime')} type="datetime-local" className="tabular" />}
              </Field>
            </div>

            <Field
              label="Duration (minutes)"
              required
              hint="Each candidate’s timer. Filled in from the window above — you can shorten it."
              error={errors.durationMinutes?.message}
            >
              {(p) => <Input {...p} {...register('durationMinutes', { valueAsNumber: true })} type="number" min={1} className="tabular sm:w-40" />}
            </Field>

            <fieldset>
              <legend className="mb-2 text-[13px] font-medium text-fg">
                Allowed languages<span className="ml-0.5 text-danger-text" aria-hidden>*</span>
              </legend>
              <div className="flex flex-wrap gap-2">
                {LANGUAGES.map((lang) => {
                  const selected = selectedLangs.includes(lang);
                  return (
                    <button
                      key={lang}
                      type="button"
                      role="checkbox"
                      aria-checked={selected}
                      onClick={() => toggleLanguage(lang)}
                      className={cn(
                        'press inline-flex h-9 items-center gap-1.5 rounded-xl border px-3 text-[13px] font-medium',
                        selected
                          ? 'border-primary/40 bg-primary-soft text-primary-text'
                          : 'border-line bg-surface text-fg-muted hover-fine:border-line-strong hover-fine:text-fg',
                      )}
                    >
                      {selected ? <Check className="size-3.5" strokeWidth={2.5} /> : <Plus className="size-3.5" />}
                      {LANGUAGE_META[lang].label}
                    </button>
                  );
                })}
              </div>
              {errors.allowedLanguages && (
                <p className="mt-1.5 text-[12px] text-danger-text">{errors.allowedLanguages.message}</p>
              )}
            </fieldset>

            {apiError && (
              <div role="alert" className="rounded-xl border border-danger/30 bg-danger-soft px-4 py-3 text-sm text-danger-text">
                {apiError}
              </div>
            )}
          </div>

          <div className="flex flex-col-reverse gap-2 border-t border-line bg-surface-2/50 px-5 py-4 sm:flex-row sm:justify-end sm:px-6">
            <Button variant="secondary" onClick={() => navigate(backTo)}>
              Cancel
            </Button>
            <Button type="submit" loading={isEdit ? updateContest.isPending : createContest.isPending}>
              {isEdit ? 'Save changes' : 'Create contest'}
            </Button>
          </div>
        </form>
      </Card>
    </div>
  );
};

export default ContestCreatePage;
