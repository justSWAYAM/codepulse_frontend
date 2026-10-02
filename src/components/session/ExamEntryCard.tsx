import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { AlertTriangle, CheckCircle2, Clock, Code2, Lock, Play, RefreshCw, RotateCw, ShieldCheck, Timer } from 'lucide-react';
import { useQueryClient } from '@tanstack/react-query';
import { toast } from 'sonner';
import type { ContestDetailRecord } from '../../api/contestApi';
import { useAssessmentSession, useStartSession } from '../../hooks/useAssessmentSession';
import { contestKeys } from '../../hooks/useContests';
import { getErrorMessage } from '../../lib/apiError';
import { languageLabel } from '../../lib/languages';
import { cn } from '../../lib/cn';
import { Button, Spinner } from '../ui';
import { MyResultCard } from '../result/MyResultCard';

interface ExamEntryCardProps {
  contest: ContestDetailRecord;
}

function formatDateTime(isoString: string): string {
  return new Date(isoString).toLocaleString(undefined, {
    day: '2-digit',
    month: 'short',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  });
}

function hasStartTimePassed(contest: ContestDetailRecord): boolean {
  return Date.now() >= new Date(contest.startTime).getTime();
}

type Tone = 'neutral' | 'primary' | 'success' | 'warning' | 'danger';

const chip: Record<Tone, string> = {
  neutral: 'bg-surface-2 text-fg-subtle',
  primary: 'bg-primary-soft text-primary-text',
  success: 'bg-success-soft text-success-text',
  warning: 'bg-warning-soft text-warning-text',
  danger: 'bg-danger-soft text-danger-text',
};

const border: Record<Tone, string> = {
  neutral: 'border-line',
  primary: 'border-primary/25',
  success: 'border-success/25',
  warning: 'border-warning/30',
  danger: 'border-danger/30',
};

const Shell: React.FC<{ tone?: Tone; icon: React.ReactNode; title?: string; children: React.ReactNode }> = ({
  tone = 'neutral',
  icon,
  title = 'Assessment',
  children,
}) => (
  <section className={cn('rounded-2xl border bg-surface p-5 shadow-card sm:p-6', border[tone])}>
    <div className="flex items-start gap-4">
      <div className={cn('flex size-10 shrink-0 items-center justify-center rounded-xl [&>svg]:size-5', chip[tone])}>{icon}</div>
      <div className="min-w-0 flex-1">
        <h3 className="font-display text-[15px] font-semibold tracking-[-0.015em] text-fg">{title}</h3>
        <div className="mt-1 text-sm leading-6 text-fg-muted">{children}</div>
      </div>
    </div>
  </section>
);

const Fact: React.FC<{ icon: React.ReactNode; children: React.ReactNode }> = ({ icon, children }) => (
  <li className="flex items-center gap-2 text-[13px] text-fg-muted">
    <span className="text-fg-subtle [&>svg]:size-3.5" aria-hidden>
      {icon}
    </span>
    {children}
  </li>
);

/**
 * ExamEntryCard — the candidate's start/resume entry point.
 * Session status is always read from the server once the assessment window opens.
 */
export const ExamEntryCard: React.FC<ExamEntryCardProps> = ({ contest }) => {
  const navigate = useNavigate();
  const [showConfirm, setShowConfirm] = useState(false);

  const startMutation = useStartSession(contest.id);
  const queryClient = useQueryClient();
  // Only the server's status decides whether starting is allowed. The client clock can be
  // skewed, and the backend scheduler flips PUBLISHED -> ONGOING up to ~60s after startTime.
  const assessmentOpen = contest.status === 'ONGOING';

  // Re-render when the start time arrives, so a page opened early unlocks by itself
  const [, setStartTick] = useState(0);
  useEffect(() => {
    if (contest.status !== 'PUBLISHED') return;
    const msUntilStart = new Date(contest.startTime).getTime() - Date.now();
    if (msUntilStart <= 0) return;
    // setTimeout caps at ~24.8 days; re-check daily for anything further out
    const id = window.setTimeout(() => setStartTick((n) => n + 1), Math.min(msUntilStart + 250, 86_400_000));
    return () => window.clearTimeout(id);
  }, [contest.status, contest.startTime]);

  const awaitingOpen = contest.status === 'PUBLISHED' && hasStartTimePassed(contest);

  // While waiting for the scheduler to open the contest, poll its status
  useEffect(() => {
    if (!awaitingOpen) return;
    const id = window.setInterval(() => {
      queryClient.invalidateQueries({ queryKey: contestKeys.detail(contest.id) });
    }, 10_000);
    return () => window.clearInterval(id);
  }, [awaitingOpen, contest.id, queryClient]);

  const {
    data: session,
    isLoading: sessionLoading,
    isFetching: sessionFetching,
    isError,
    error,
    refetch,
  } = useAssessmentSession(contest.id, assessmentOpen || contest.status === 'COMPLETED');
  const isNotStarted = isError && (error as { response?: { status?: number } })?.response?.status === 404;
  const isForbidden = isError && (error as { response?: { status?: number } })?.response?.status === 403;
  const isUnexpectedError = isError && !isNotStarted && !isForbidden;
  const sessionStatus = session?.status;
  const noSession =
    isNotStarted || sessionStatus === 'NOT_YET_STARTED' || (!sessionLoading && !sessionFetching && !isError && !session);
  const hasSession = !!session && !isError;

  const handleStartExam = async () => {
    try {
      await startMutation.mutateAsync();
      setShowConfirm(false);
      navigate(`/dashboard/contests/${contest.id}/assessment`);
    } catch (err: unknown) {
      setShowConfirm(false);
      const status = (err as { response?: { status?: number } })?.response?.status;
      const backendMessage = (err as { response?: { data?: { message?: string } } })?.response?.data?.message;
      const msg =
        status === 409 || /already completed|already submitted/i.test(backendMessage ?? '')
          ? 'You have already submitted this assessment.'
          : getErrorMessage(err, 'Failed to start exam');
      toast.error(msg);
    }
  };

  if (!assessmentOpen && contest.status !== 'COMPLETED') {
    return (
      <Shell icon={<Lock />}>
        {awaitingOpen ? (
          <p className="flex items-center gap-2">
            <Spinner size={13} /> The exam is opening — this updates automatically in a few seconds.
          </p>
        ) : (
          <p>
            Exam opens on <span className="tabular font-medium text-fg">{formatDateTime(contest.startTime)}</span>
          </p>
        )}
        <p className="mt-1 text-[13px] text-fg-subtle">Duration: {contest.durationMinutes} minutes</p>
      </Shell>
    );
  }

  // Only block on the first load — background re-syncs (every 30s) shouldn't flash a spinner
  if (sessionLoading) {
    return (
      <Shell icon={<Spinner size={18} />}>
        <p>Checking your assessment status…</p>
      </Shell>
    );
  }

  if (isForbidden) {
    const message =
      (error as { response?: { data?: { message?: string } } })?.response?.data?.message ?? "You don't have access to this exam.";
    return (
      <Shell tone="danger" icon={<AlertTriangle />}>
        <p>{message}</p>
      </Shell>
    );
  }

  if (isUnexpectedError) {
    return (
      <Shell tone="warning" icon={<RefreshCw />}>
        <p>Unable to load your assessment right now.</p>
        <Button size="sm" variant="secondary" className="mt-4" leadingIcon={<RefreshCw className="size-3.5" />} onClick={() => refetch()}>
          Retry
        </Button>
      </Shell>
    );
  }

  if (hasSession && (session.status === 'SUBMITTED' || session.status === 'AUTO_SUBMITTED')) {
    // Module 9: once results are out, the score replaces the "you submitted" note
    if (contest.resultsPublished) return <MyResultCard contestId={contest.id} />;
    return (
      <Shell tone="success" icon={<CheckCircle2 />}>
        <p>You have already submitted this assessment.</p>
        <p className="mt-1 text-[13px] text-fg-subtle">Results appear here once the administrator publishes them.</p>
      </Shell>
    );
  }

  if (assessmentOpen && hasSession && session.status === 'IN_PROGRESS') {
    return (
      <Shell tone="primary" icon={<Timer />}>
        <p>Your exam is in progress — the timer is still running.</p>
        <Button
          className="mt-4"
          onClick={() => navigate(`/dashboard/contests/${contest.id}/assessment`)}
          leadingIcon={<RotateCw className="size-4" />}
        >
          Resume exam
        </Button>
      </Shell>
    );
  }

  // ── Assessment window open → POST start ──
  if (assessmentOpen && noSession) {
    return (
      <Shell tone="primary" icon={<Play />}>
        <ul className="mt-1 space-y-1.5">
          <Fact icon={<Clock />}>
            <span>
              Duration: <span className="tabular font-medium text-fg">{contest.durationMinutes} minutes</span>
            </span>
          </Fact>
          <Fact icon={<ShieldCheck />}>You get one attempt — the timer can’t be paused</Fact>
          {contest.allowedLanguages?.length > 0 && (
            <Fact icon={<Code2 />}>{contest.allowedLanguages.map(languageLabel).join(', ')}</Fact>
          )}
        </ul>

        {!showConfirm ? (
          <Button className="mt-5" onClick={() => setShowConfirm(true)} leadingIcon={<Play className="size-4" />}>
            Start exam
          </Button>
        ) : (
          <div className="mt-5 space-y-3">
            <div className="rounded-xl border border-warning/30 bg-warning-soft px-4 py-3 text-[13px] leading-5 text-warning-text">
              Start the exam now? Your <span className="font-semibold">{contest.durationMinutes}-minute</span> timer begins
              immediately and cannot be paused. You only get one attempt.
            </div>
            <div className="flex flex-wrap gap-2">
              <Button onClick={handleStartExam} loading={startMutation.isPending} leadingIcon={<Play className="size-4" />}>
                Yes, start now
              </Button>
              <Button variant="secondary" onClick={() => setShowConfirm(false)} disabled={startMutation.isPending}>
                Cancel
              </Button>
            </div>
          </div>
        )}
      </Shell>
    );
  }

  return null;
};
