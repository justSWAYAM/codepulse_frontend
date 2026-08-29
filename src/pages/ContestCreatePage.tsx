import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { ArrowLeft, Loader2 } from 'lucide-react';
import { motion } from 'framer-motion';
import { useCreateContest } from '../hooks/useContests';

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
  })
  .refine((d) => new Date(d.startTime) > new Date(), {
    message: 'Start time must be in the future',
    path: ['startTime'],
  });

type FormValues = z.infer<typeof schema>;

const ContestCreatePage: React.FC = () => {
  const navigate = useNavigate();
  const createContest = useCreateContest();
  const [apiError, setApiError] = useState<string | null>(null);
  const [description, setDescription] = useState('');

  const {
    register,
    handleSubmit,
    watch,
    setValue,
    formState: { errors },
  } = useForm<FormValues>({
    resolver: zodResolver(schema),
    defaultValues: {
      allowedLanguages: [],
      durationMinutes: 60,
    },
  });

  const startTime = watch('startTime');
  const endTime = watch('endTime');

  // Auto-compute durationMinutes from startTime and endTime
  useEffect(() => {
    if (startTime && endTime) {
      const diff = (new Date(endTime).getTime() - new Date(startTime).getTime()) / 60000;
      if (diff > 0) setValue('durationMinutes', Math.round(diff));
    }
  }, [startTime, endTime, setValue]);

  const toggleLanguage = (lang: string) => {
    const current = watch('allowedLanguages');
    const next = current.includes(lang)
      ? current.filter((l) => l !== lang)
      : [...current, lang];
    setValue('allowedLanguages', next, { shouldValidate: true });
  };

  const onSubmit = async (values: FormValues) => {
    setApiError(null);
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
      const msg =
        (err as { response?: { data?: { message?: string } } })?.response?.data?.message ??
        'Failed to create contest. Please try again.';
      setApiError(msg);
    }
  };

  const selectedLangs = watch('allowedLanguages');

  return (
    <div className="max-w-2xl mx-auto">
      {/* Header */}
      <div className="flex items-center gap-3 mb-6">
        <button
          onClick={() => navigate('/dashboard/contests')}
          className="p-2 rounded-xl text-ink/40 hover:text-ink hover:bg-ink/5 transition-colors cursor-pointer"
        >
          <ArrowLeft className="w-5 h-5" />
        </button>
        <div>
          <h1 className="font-display text-2xl font-bold text-ink">Create Contest</h1>
          <p className="text-sm text-ink/50">Set up a new coding contest</p>
        </div>
      </div>

      {/* Form card */}
      <motion.div
        initial={{ opacity: 0, y: 12 }}
        animate={{ opacity: 1, y: 0 }}
        className="bg-surface border border-hairline rounded-2xl p-6"
      >
        <form onSubmit={handleSubmit(onSubmit)} className="space-y-5">
          {/* Title */}
          <div>
            <label className="block text-sm font-medium text-ink mb-1.5">Title *</label>
            <input
              {...register('title')}
              placeholder="e.g. Mid-Semester Coding Exam"
              className="w-full px-4 py-2.5 rounded-xl border border-hairline bg-background text-ink text-sm placeholder:text-ink/30 focus:outline-none focus:border-ink/30 transition-colors"
            />
            {errors.title && (
              <p className="mt-1 text-xs text-accent-error">{errors.title.message}</p>
            )}
          </div>

          {/* Description */}
          <div>
            <label className="block text-sm font-medium text-ink mb-1.5">
              Description{' '}
              <span className="text-ink/40 font-normal">({description.length}/2000)</span>
            </label>
            <textarea
              {...register('description')}
              value={description}
              onChange={(e) => {
                setDescription(e.target.value);
                setValue('description', e.target.value);
              }}
              placeholder="Describe the contest, rules, and objectives..."
              rows={4}
              className="w-full px-4 py-2.5 rounded-xl border border-hairline bg-background text-ink text-sm placeholder:text-ink/30 focus:outline-none focus:border-ink/30 transition-colors resize-none"
            />
            {errors.description && (
              <p className="mt-1 text-xs text-accent-error">{errors.description.message}</p>
            )}
          </div>

          {/* Time inputs */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-ink mb-1.5">Start Time *</label>
              <input
                {...register('startTime')}
                type="datetime-local"
                className="w-full px-4 py-2.5 rounded-xl border border-hairline bg-background text-ink text-sm focus:outline-none focus:border-ink/30 transition-colors"
              />
              {errors.startTime && (
                <p className="mt-1 text-xs text-accent-error">{errors.startTime.message}</p>
              )}
            </div>
            <div>
              <label className="block text-sm font-medium text-ink mb-1.5">End Time *</label>
              <input
                {...register('endTime')}
                type="datetime-local"
                className="w-full px-4 py-2.5 rounded-xl border border-hairline bg-background text-ink text-sm focus:outline-none focus:border-ink/30 transition-colors"
              />
              {errors.endTime && (
                <p className="mt-1 text-xs text-accent-error">{errors.endTime.message}</p>
              )}
            </div>
          </div>

          {/* Duration */}
          <div>
            <label className="block text-sm font-medium text-ink mb-1.5">
              Duration (minutes) *
              <span className="text-ink/40 font-normal ml-1">— auto-computed, can be overridden</span>
            </label>
            <input
              {...register('durationMinutes', { valueAsNumber: true })}
              type="number"
              min={1}
              className="w-full px-4 py-2.5 rounded-xl border border-hairline bg-background text-ink text-sm focus:outline-none focus:border-ink/30 transition-colors"
            />
            {errors.durationMinutes && (
              <p className="mt-1 text-xs text-accent-error">{errors.durationMinutes.message}</p>
            )}
          </div>

          {/* Languages */}
          <div>
            <label className="block text-sm font-medium text-ink mb-2">
              Allowed Languages *
            </label>
            <div className="flex flex-wrap gap-2">
              {LANGUAGES.map((lang) => {
                const selected = selectedLangs.includes(lang);
                return (
                  <button
                    key={lang}
                    type="button"
                    onClick={() => toggleLanguage(lang)}
                    className={`font-mono text-xs px-3 py-1.5 rounded-lg border transition-all cursor-pointer ${
                      selected
                        ? 'bg-ink text-white border-ink'
                        : 'bg-background text-ink/60 border-hairline hover:border-ink/30'
                    }`}
                  >
                    {lang}
                  </button>
                );
              })}
            </div>
            {errors.allowedLanguages && (
              <p className="mt-1.5 text-xs text-accent-error">
                {errors.allowedLanguages.message}
              </p>
            )}
          </div>

          {/* API error */}
          {apiError && (
            <div className="px-4 py-3 rounded-xl bg-accent-error/5 border border-accent-error/20">
              <p className="text-sm text-accent-error">{apiError}</p>
            </div>
          )}

          {/* Submit */}
          <button
            type="submit"
            disabled={createContest.isPending}
            className="w-full flex items-center justify-center gap-2 px-4 py-3 rounded-xl bg-accent-compile text-white text-sm font-semibold hover:bg-accent-compile/90 disabled:opacity-60 disabled:cursor-not-allowed transition-colors cursor-pointer"
          >
            {createContest.isPending ? (
              <>
                <Loader2 className="w-4 h-4 animate-spin" />
                Creating…
              </>
            ) : (
              'Create Contest'
            )}
          </button>
        </form>
      </motion.div>
    </div>
  );
};

export default ContestCreatePage;
