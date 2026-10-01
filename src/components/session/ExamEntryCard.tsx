import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { Play, Clock, AlertTriangle, CheckCircle2, Timer, Lock, Loader2, RotateCw, RefreshCw } from 'lucide-react';
import type { ContestDetailRecord } from '../../api/contestApi';
import { useQueryClient } from '@tanstack/react-query';
import { useAssessmentSession, useStartSession } from '../../hooks/useAssessmentSession';
import { contestKeys } from '../../hooks/useContests';
import { toast } from 'sonner';

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

/**
 * ExamEntryCard — the candidate's start/resume entry point.
 * Session status is always read from the server once the assessment window opens.
 * See plan Section 6.2 for the full state table.
 */
export const ExamEntryCard: React.FC<ExamEntryCardProps> = ({ contest }) => {
  const navigate = useNavigate();
  const [showConfirm, setShowConfirm] = useState(false);

  const startMutation = useStartSession(contest.id);
  const queryClient = useQueryClient();
  // Only the server's status decides whether starting is allowed. The client clock can be
  // skewed, and the backend scheduler flips PUBLISHED -> ONGOING up to ~60s after startTime.
  const assessmentOpen = contest.status === 'ONGOING';
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
  const noSession = isNotStarted
    || sessionStatus === 'NOT_YET_STARTED'
    || (!sessionLoading && !sessionFetching && !isError && !session);
  const hasSession = !!session && !isError;

  const handleStartExam = async () => {
    setShowConfirm(false);
    try {
      await startMutation.mutateAsync();
      navigate(`/dashboard/contests/${contest.id}/assessment`);
    } catch (err: unknown) {
      const status = (err as { response?: { status?: number } })?.response?.status;
      const backendMessage = (err as { response?: { data?: { message?: string } } })?.response?.data?.message;
      const msg = status === 409 || /already completed|already submitted/i.test(backendMessage ?? '')
        ? 'You have already submitted this assessment.'
        : backendMessage ?? 'Failed to start exam';
      toast.error(msg);
    }
  };

  if (!assessmentOpen && contest.status !== 'COMPLETED') {
    return (
      <motion.div initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} className="bg-surface border border-hairline rounded-2xl p-6">
        <div className="flex items-start gap-4">
          <div className="w-10 h-10 rounded-xl bg-ink/5 flex items-center justify-center shrink-0"><Lock className="w-5 h-5 text-ink/40" /></div>
          <div className="flex-1">
            <h3 className="font-display text-base font-bold text-ink mb-1">Assessment</h3>
            {awaitingOpen ? (
              <p className="text-sm text-ink/60">The exam is opening — this updates automatically in a few seconds.</p>
            ) : (
              <p className="text-sm text-ink/60">Exam opens on <span className="font-medium text-ink">{formatDateTime(contest.startTime)}</span></p>
            )}
            <p className="text-xs text-ink/40 mt-2">Duration: {contest.durationMinutes} minutes</p>
          </div>
        </div>
      </motion.div>
    );
  }

  // Only block on the first load — background re-syncs (every 30s) shouldn't flash a spinner
  if (sessionLoading) {
    return (
      <motion.div initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} className="bg-surface border border-hairline rounded-2xl p-6">
        <div className="flex items-center gap-3 text-sm text-ink/60"><Loader2 className="w-4 h-4 animate-spin" />Checking your assessment status…</div>
      </motion.div>
    );
  }

  if (isForbidden) {
    const message = (error as { response?: { data?: { message?: string } } })?.response?.data?.message ?? "You don't have access to this exam.";
    return <div className="bg-surface border border-accent-error/20 rounded-2xl p-6"><div className="flex items-start gap-4"><AlertTriangle className="w-5 h-5 text-accent-error mt-1" /><div><h3 className="font-display text-base font-bold text-ink mb-1">Assessment</h3><p className="text-sm text-ink/60">{message}</p></div></div></div>;
  }

  if (isUnexpectedError) {
    return <div className="bg-surface border border-accent-syntax/20 rounded-2xl p-6"><div className="flex items-start gap-4"><RefreshCw className="w-5 h-5 text-accent-syntax mt-1" /><div><h3 className="font-display text-base font-bold text-ink mb-1">Assessment</h3><p className="text-sm text-ink/60">Unable to load your assessment right now.</p><button type="button" onClick={() => refetch()} className="mt-4 inline-flex items-center gap-2 px-4 py-2 rounded-xl border border-hairline text-sm font-medium text-ink cursor-pointer"><RefreshCw className="w-3.5 h-3.5" />Retry</button></div></div></div>;
  }

  if (hasSession && (session.status === 'SUBMITTED' || session.status === 'AUTO_SUBMITTED')) {
    return (
      <motion.div
        initial={{ opacity: 0, y: 8 }}
        animate={{ opacity: 1, y: 0 }}
        className="bg-surface border border-hairline rounded-2xl p-6"
      >
        <div className="flex items-start gap-4">
          <div className="w-10 h-10 rounded-xl bg-ink/5 flex items-center justify-center shrink-0">
            <Lock className="w-5 h-5 text-ink/40" />
          </div>
          <div className="flex-1">
            <div className="flex items-center gap-2 mb-1"><h3 className="font-display text-base font-bold text-ink">Assessment</h3><CheckCircle2 className="w-4 h-4 text-accent-compile" /></div>
            <p className="text-sm text-ink/60">You have already submitted this assessment.</p>
          </div>
        </div>
      </motion.div>
    );
  }

  if (assessmentOpen && hasSession && session.status === 'IN_PROGRESS') {
    return <motion.div initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} className="bg-surface border border-accent-compile/20 rounded-2xl p-6"><div className="flex items-start gap-4"><Timer className="w-5 h-5 text-accent-compile mt-1" /><div><h3 className="font-display text-base font-bold text-ink mb-1">Assessment</h3><p className="text-sm text-ink/60">Your exam is in progress.</p><button onClick={() => navigate(`/dashboard/contests/${contest.id}/assessment`)} className="mt-4 flex items-center gap-2 px-5 py-2.5 bg-accent-compile text-white rounded-xl text-sm font-semibold cursor-pointer"><RotateCw className="w-4 h-4" />Resume Exam</button></div></div></motion.div>;
  }

  // ── State: assessment window open → POST start/resume ──
  if (assessmentOpen && noSession) {
    return (
      <motion.div
        initial={{ opacity: 0, y: 8 }}
        animate={{ opacity: 1, y: 0 }}
        className="bg-surface border border-hairline rounded-2xl p-6"
      >
        <div className="flex items-start gap-4">
          <div className="w-10 h-10 rounded-xl bg-accent-compile/10 flex items-center justify-center shrink-0">
            <Play className="w-5 h-5 text-accent-compile" />
          </div>
          <div className="flex-1">
            <h3 className="font-display text-base font-bold text-ink mb-1">Assessment</h3>
            <div className="space-y-1 mb-4">
              <p className="text-sm text-ink/60">
                <Clock className="w-3.5 h-3.5 inline mr-1 text-ink/40" />
                Duration: <span className="font-medium text-ink">{contest.durationMinutes} minutes</span>
              </p>
              <p className="text-sm text-ink/60">
                <AlertTriangle className="w-3.5 h-3.5 inline mr-1 text-ink/40" />
                You get one attempt
              </p>
            </div>

            <AnimatePresence mode="wait">
              {!showConfirm ? (
                <motion.button
                  key="start-btn"
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  exit={{ opacity: 0 }}
                  onClick={() => setShowConfirm(true)}
                  className="flex items-center gap-2 px-5 py-2.5 bg-accent-compile text-white rounded-xl text-sm font-semibold hover:bg-accent-compile-hover transition-colors cursor-pointer"
                >
                  <Play className="w-4 h-4" />
                  Start Exam
                </motion.button>
              ) : (
                <motion.div
                  key="confirm"
                  initial={{ opacity: 0, y: 4 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0 }}
                  className="space-y-3"
                >
                  <div className="px-4 py-3 rounded-xl bg-accent-syntax/10 border border-accent-syntax/20">
                    <p className="text-sm text-ink/80">
                      Start the exam now? Your{' '}
                      <span className="font-semibold">{contest.durationMinutes}-minute</span>{' '}
                      timer begins immediately and cannot be paused. You only get one attempt.
                    </p>
                  </div>
                  <div className="flex gap-2">
                    <button
                      onClick={handleStartExam}
                      disabled={startMutation.isPending}
                      className="flex items-center gap-2 px-4 py-2 bg-accent-compile text-white rounded-xl text-sm font-semibold hover:bg-accent-compile-hover disabled:opacity-60 transition-colors cursor-pointer"
                    >
                      {startMutation.isPending ? (
                        <Loader2 className="w-3.5 h-3.5 animate-spin" />
                      ) : (
                        <Play className="w-3.5 h-3.5" />
                      )}
                      Yes, Start Now
                    </button>
                    <button
                      onClick={() => setShowConfirm(false)}
                      className="px-4 py-2 rounded-xl text-sm font-medium text-ink/60 border border-hairline hover:border-ink/20 transition-colors cursor-pointer"
                    >
                      Cancel
                    </button>
                  </div>
                </motion.div>
              )}
            </AnimatePresence>
          </div>
        </div>
      </motion.div>
    );
  }

  return null;
};
