import React, { useState, useEffect, useCallback, useMemo } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { Terminal, Send, Loader2, AlertTriangle, Menu, X, WifiOff } from 'lucide-react';
import { toast } from 'sonner';

import { useContest } from '../hooks/useContests';
import { useAssessmentSession, useSubmitSession } from '../hooks/useAssessmentSession';
import { useSessionTimer } from '../hooks/useSessionTimer';
import { useQuestions } from '../hooks/useQuestions';

import { CountdownTimer } from '../components/session/CountdownTimer';
import { SessionStatusBadge } from '../components/session/SessionStatusBadge';
import { QuestionNavigator } from '../components/session/QuestionNavigator';
import { QuestionPanel } from '../components/session/QuestionPanel';
import { EditorSlot } from '../components/session/EditorSlot';
import { SubmitExamDialog } from '../components/session/SubmitExamDialog';
import { SessionEndedScreen } from '../components/session/SessionEndedScreen';
import { LoadingState } from '../components/states/LoadingState';
import { ErrorState } from '../components/states/ErrorState';

import type { QuestionCandidateRecord } from '../api/questionApi';

/**
 * AssessmentPage — the exam-taking shell.
 *
 * Route: /dashboard/contests/:contestId/assessment
 * Access: Candidate only (via ProtectedRoute roles={['CANDIDATE']})
 *
 * On load: useAssessmentSession(contestId).
 *   - 404 → redirect to contest page
 *   - IN_PROGRESS → render exam
 *   - Any ended status → render SessionEndedScreen
 *
 * Layout: three-region, full-viewport (Section 3.3)
 *   Header | QuestionNavigator (sidebar) | QuestionPanel (center) | EditorSlot (right)
 */
const AssessmentPage: React.FC = () => {
  const { contestId } = useParams<{ contestId: string }>();
  const navigate = useNavigate();

  // ── Data fetching ──
  const {
    data: session,
    isLoading: sessionLoading,
    isError: sessionError,
    error: sessionErr,
    dataUpdatedAt: sessionReceivedAt,
  } = useAssessmentSession(contestId!);

  const { data: contest } = useContest(contestId!);

  const sessionIsActive = !!session && session.status === 'IN_PROGRESS';

  // Questions — gated on active session (Section 4.3)
  const { data: questionsRaw = [] } = useQuestions(contestId!, sessionIsActive);

  // Cast to candidate records since we're in candidate context.
  // Copy before sorting — .sort() mutates, and this array is the query cache.
  const questions = useMemo(
    () =>
      sessionIsActive
        ? [...(questionsRaw as QuestionCandidateRecord[])].sort(
            (a, b) => a.orderIndex - b.orderIndex
          )
        : [],
    [questionsRaw, sessionIsActive]
  );

  // ── Timer ──
  const { remainingSeconds, isExpired } = useSessionTimer(session, sessionReceivedAt);

  // ── Submit ──
  const submitMutation = useSubmitSession(contestId!);
  const [showSubmitDialog, setShowSubmitDialog] = useState(false);

  const handleSubmit = async () => {
    setShowSubmitDialog(false);
    try {
      await submitMutation.mutateAsync();
    } catch (err: unknown) {
      const status = (err as { response?: { status?: number } })?.response?.status;
      if (status === 409 || status === 422) {
        // Already ended — not an error, just show ended screen
        // The query will refetch and show the correct state
      } else {
        const msg =
          (err as { response?: { data?: { message?: string } } })?.response?.data?.message ??
          'Failed to submit exam';
        toast.error(msg);
      }
    }
  };

  // ── Question state ──
  const [activeQuestionId, setActiveQuestionId] = useState<string>('');
  const [visitedIds, setVisitedIds] = useState<Set<string>>(new Set());
  const [sidebarOpen, setSidebarOpen] = useState(false);

  // Set initial active question when questions load
  useEffect(() => {
    if (questions.length > 0 && !activeQuestionId) {
      setActiveQuestionId(questions[0].id);
      setVisitedIds(new Set([questions[0].id]));
    }
  }, [questions, activeQuestionId]);

  const handleSelectQuestion = useCallback((id: string) => {
    setActiveQuestionId(id);
    setVisitedIds((prev) => new Set([...prev, id]));
    setSidebarOpen(false);
  }, []);

  const activeQuestion = questions.find((q) => q.id === activeQuestionId);

  // ── beforeunload guard (Section 8.3) ──
  useEffect(() => {
    if (!sessionIsActive) return;

    const handler = (e: BeforeUnloadEvent) => {
      e.preventDefault();
      // Modern browsers ignore custom messages; the native dialog is shown
    };

    window.addEventListener('beforeunload', handler);
    return () => window.removeEventListener('beforeunload', handler);
  }, [sessionIsActive]);

  // ── Network status indicator ──
  const [isOnline, setIsOnline] = useState(navigator.onLine);
  useEffect(() => {
    const handleOnline = () => setIsOnline(true);
    const handleOffline = () => setIsOnline(false);
    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);
    return () => {
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('offline', handleOffline);
    };
  }, []);

  // ── Redirect when there's no session ──
  // The backend answers GET /session with 200 + NOT_YET_STARTED (not 404) when the
  // candidate hasn't started; send them back to the contest page to start from there.
  const is404 = sessionError && (sessionErr as { response?: { status?: number } })?.response?.status === 404;
  const notStarted = is404 || session?.status === 'NOT_YET_STARTED';
  useEffect(() => {
    if (notStarted) {
      navigate(`/dashboard/contests/${contestId}`, { replace: true });
    }
  }, [notStarted, navigate, contestId]);

  // ── Loading state ──
  if (sessionLoading || notStarted) {
    return <LoadingState message="Loading your exam session..." />;
  }

  // ── Error state (non-404) ──
  if (sessionError && !is404) {
    const status = (sessionErr as { response?: { status?: number } })?.response?.status;
    const message = status === 403
      ? "You don't have access to this exam"
      : (sessionErr as { response?: { data?: { message?: string } } })?.response?.data?.message
        ?? 'Something went wrong loading your session.';
    return (
      <div className="min-h-screen bg-canvas flex items-center justify-center p-4">
        <ErrorState message={message} />
      </div>
    );
  }

  // ── Session ended → show ended screen ──
  if (session && session.status !== 'IN_PROGRESS') {
    return (
      <SessionEndedScreen
        status={session.status}
        contestId={contestId!}
        contestTitle={contest?.title}
      />
    );
  }

  // ── Active session: render the exam ──
  return (
    <div className="h-screen flex flex-col bg-canvas overflow-hidden">
      {/* ── Header ── */}
      <header className="h-14 bg-surface border-b border-line flex items-center justify-between px-4 shrink-0 z-30">
        {/* Left: brand + title */}
        <div className="flex items-center gap-3 min-w-0">
          {/* Mobile sidebar toggle */}
          <button
            onClick={() => setSidebarOpen(!sidebarOpen)}
            className="lg:hidden p-2 rounded-lg hover:bg-fg/5 transition-colors cursor-pointer"
          >
            {sidebarOpen ? <X className="w-4 h-4 text-fg" /> : <Menu className="w-4 h-4 text-fg" />}
          </button>

          <div className="w-7 h-7 rounded-lg bg-primary flex items-center justify-center shrink-0">
            <Terminal className="w-3.5 h-3.5 text-primary-text" />
          </div>
          <div className="min-w-0 hidden sm:block">
            <p className="text-sm font-display font-bold text-fg truncate">
              {contest?.title ?? 'Assessment'}
            </p>
          </div>
        </div>

        {/* Center: status + timer */}
        <div className="flex items-center gap-4">
          {!isOnline && (
            <div className="flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-warning-soft text-warning-text">
              <WifiOff className="w-3 h-3" />
              <span className="text-[11px] font-semibold">Reconnecting…</span>
            </div>
          )}
          <SessionStatusBadge status="IN_PROGRESS" />
          <CountdownTimer remainingSeconds={remainingSeconds} />
        </div>

        {/* Right: submit button */}
        <button
          onClick={() => setShowSubmitDialog(true)}
          disabled={isExpired || submitMutation.isPending}
          className="flex items-center gap-2 px-4 py-2 bg-primary text-white rounded-xl text-sm font-semibold hover:bg-primary-hover disabled:opacity-50 disabled:cursor-not-allowed transition-colors cursor-pointer"
        >
          {submitMutation.isPending ? (
            <Loader2 className="w-3.5 h-3.5 animate-spin" />
          ) : (
            <Send className="w-3.5 h-3.5" />
          )}
          <span className="hidden sm:inline">Submit Exam</span>
        </button>
      </header>

      {/* ── Body: three-region layout ── */}
      <div className="flex flex-1 overflow-hidden">
        {/* Sidebar — Question Navigator */}
        {/* Desktop: always visible */}
        <aside className="hidden lg:flex w-64 shrink-0 flex-col bg-surface border-r border-line overflow-y-auto" data-lenis-prevent>
          <div className="px-4 py-3 border-b border-line">
            <p className="text-[11px] font-semibold text-fg-subtle uppercase tracking-wider">
              Questions ({questions.length})
            </p>
          </div>
          <div className="flex-1 overflow-y-auto px-2">
            {questions.length > 0 && (
              <QuestionNavigator
                questions={questions}
                activeId={activeQuestionId}
                visitedIds={visitedIds}
                onSelect={handleSelectQuestion}
              />
            )}
          </div>
        </aside>

        {/* Mobile sidebar overlay */}
        <AnimatePresence>
          {sidebarOpen && (
            <>
              <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                className="fixed inset-0 bg-fg/20 backdrop-blur-sm z-40 lg:hidden"
                onClick={() => setSidebarOpen(false)}
              />
              <motion.aside
                initial={{ x: -280 }}
                animate={{ x: 0 }}
                exit={{ x: -280 }}
                transition={{ type: 'spring', damping: 25, stiffness: 250 }}
                className="fixed left-0 top-14 bottom-0 w-[260px] bg-surface border-r border-line z-50 lg:hidden flex flex-col overflow-y-auto"
              >
                <div className="px-4 py-3 border-b border-line">
                  <p className="text-[11px] font-semibold text-fg-subtle uppercase tracking-wider">
                    Questions ({questions.length})
                  </p>
                </div>
                <div className="flex-1 overflow-y-auto px-2">
                  {questions.length > 0 && (
                    <QuestionNavigator
                      questions={questions}
                      activeId={activeQuestionId}
                      visitedIds={visitedIds}
                      onSelect={handleSelectQuestion}
                    />
                  )}
                </div>
              </motion.aside>
            </>
          )}
        </AnimatePresence>

        {/* Center — Question Panel */}
        <div className="flex-1 min-w-0 overflow-hidden">
          {activeQuestion ? (
            <QuestionPanel question={activeQuestion} />
          ) : (
            <div className="h-full flex items-center justify-center">
              <div className="text-center">
                <AlertTriangle className="w-8 h-8 text-fg-subtle mx-auto mb-3" />
                <p className="text-sm text-fg-subtle">Select a question to get started</p>
              </div>
            </div>
          )}
        </div>

        {/* Right — Editor Slot (Module 8 placeholder) */}
        <div className="hidden xl:flex w-[45%] shrink-0">
          <EditorSlot />
        </div>
      </div>

      {/* ── Submit Dialog ── */}
      <SubmitExamDialog
        isOpen={showSubmitDialog}
        onClose={() => setShowSubmitDialog(false)}
        onConfirm={handleSubmit}
        isSubmitting={submitMutation.isPending}
      />
    </div>
  );
};

export default AssessmentPage;
