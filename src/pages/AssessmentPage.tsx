import React, { useState, useEffect, useCallback, useMemo } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { Code2, FileText, ListOrdered, Send, WifiOff } from 'lucide-react';
import { toast } from 'sonner';

import { useContest } from '../hooks/useContests';
import { useAssessmentSession, useSubmitSession } from '../hooks/useAssessmentSession';
import { useSessionTimer } from '../hooks/useSessionTimer';
import { useQuestions } from '../hooks/useQuestions';
import { useQuestionProgress } from '../hooks/useSubmissions';

import { CountdownTimer } from '../components/session/CountdownTimer';
import { QuestionNavigator } from '../components/session/QuestionNavigator';
import { QuestionPanel } from '../components/session/QuestionPanel';
import { SubmitExamDialog } from '../components/session/SubmitExamDialog';
import { SessionEndedScreen } from '../components/session/SessionEndedScreen';
import { CodeEditorPanel } from '../components/editor/CodeEditorPanel';
import { LoadingState } from '../components/states/LoadingState';
import { ErrorState } from '../components/states/ErrorState';
import { EmptyState } from '../components/states/EmptyState';
import { Badge, BrandMark, Button, IconButton, Segmented, Sheet, ThemeToggle } from '../components/ui';
import { getErrorMessage } from '../lib/apiError';
import { cn } from '../lib/cn';

import type { QuestionCandidateRecord } from '../api/questionApi';

type Pane = 'problem' | 'code';

/**
 * AssessmentPage — the exam-taking shell (focus mode, outside AppShell).
 *
 * Route: /dashboard/contests/:contestId/assessment   Access: CANDIDATE
 *   - no session / NOT_YET_STARTED → back to the contest page
 *   - IN_PROGRESS → exam
 *   - any ended status → SessionEndedScreen
 *
 * Layout: header | navigator | problem | editor (xl+). Below xl, problem and code
 * share the space behind a Problem | Code switch — the editor is never hidden away.
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

  // Questions — gated on active session
  const { data: questionsRaw = [] } = useQuestions(contestId!, sessionIsActive);

  // Copy before sorting — .sort() mutates, and this array is the query cache.
  const questions = useMemo(
    () =>
      sessionIsActive
        ? [...(questionsRaw as QuestionCandidateRecord[])].sort((a, b) => a.orderIndex - b.orderIndex)
        : [],
    [questionsRaw, sessionIsActive],
  );

  const questionIds = useMemo(() => questions.map((q) => q.id), [questions]);
  const progress = useQuestionProgress(questionIds, sessionIsActive);

  // ── Timer ──
  const { remainingSeconds, isExpired } = useSessionTimer(session, sessionReceivedAt);

  // ── Submit exam ──
  const submitMutation = useSubmitSession(contestId!);
  const [showSubmitDialog, setShowSubmitDialog] = useState(false);

  const handleSubmit = async () => {
    try {
      await submitMutation.mutateAsync();
      setShowSubmitDialog(false);
    } catch (err: unknown) {
      setShowSubmitDialog(false);
      const status = (err as { response?: { status?: number } })?.response?.status;
      // 409/422 = already ended — not an error; the refetch shows the ended screen
      if (status !== 409 && status !== 422) {
        toast.error(getErrorMessage(err, 'Failed to submit exam'));
      }
    }
  };

  // ── Question state ──
  const [activeQuestionId, setActiveQuestionId] = useState<string>('');
  const [visitedIds, setVisitedIds] = useState<Set<string>>(new Set());
  const [navOpen, setNavOpen] = useState(false);
  const [pane, setPane] = useState<Pane>('problem');

  useEffect(() => {
    if (questions.length > 0 && !activeQuestionId) {
      setActiveQuestionId(questions[0].id);
      setVisitedIds(new Set([questions[0].id]));
    }
  }, [questions, activeQuestionId]);

  const handleSelectQuestion = useCallback((id: string) => {
    setActiveQuestionId(id);
    setVisitedIds((prev) => new Set([...prev, id]));
    setNavOpen(false);
    setPane('problem');
  }, []);

  const activeQuestion = questions.find((q) => q.id === activeQuestionId);
  const activeIndex = questions.findIndex((q) => q.id === activeQuestionId);

  useEffect(() => {
    document.title = contest?.title ? `${contest.title} · CodePulse` : 'Assessment · CodePulse';
  }, [contest?.title]);

  // ── beforeunload guard ──
  useEffect(() => {
    if (!sessionIsActive) return;
    const handler = (e: BeforeUnloadEvent) => e.preventDefault();
    window.addEventListener('beforeunload', handler);
    return () => window.removeEventListener('beforeunload', handler);
  }, [sessionIsActive]);

  // ── Network status ──
  const [isOnline, setIsOnline] = useState(navigator.onLine);
  useEffect(() => {
    const on = () => setIsOnline(true);
    const off = () => setIsOnline(false);
    window.addEventListener('online', on);
    window.addEventListener('offline', off);
    return () => {
      window.removeEventListener('online', on);
      window.removeEventListener('offline', off);
    };
  }, []);

  // ── Redirect when there's no session ──
  // The backend answers GET /session with 200 + NOT_YET_STARTED (not 404) when the
  // candidate hasn't started; send them back to the contest page to start from there.
  const is404 = sessionError && (sessionErr as { response?: { status?: number } })?.response?.status === 404;
  const notStarted = is404 || session?.status === 'NOT_YET_STARTED';
  useEffect(() => {
    if (notStarted) navigate(`/dashboard/contests/${contestId}`, { replace: true });
  }, [notStarted, navigate, contestId]);

  if (sessionLoading || notStarted) {
    return (
      <div className="flex min-h-dvh items-center justify-center bg-canvas">
        <LoadingState message="Loading your exam session…" />
      </div>
    );
  }

  if (sessionError && !is404) {
    const status = (sessionErr as { response?: { status?: number } })?.response?.status;
    const message =
      status === 403 ? "You don't have access to this exam" : getErrorMessage(sessionErr, 'Something went wrong loading your session.');
    return (
      <div className="flex min-h-dvh items-center justify-center bg-canvas p-4">
        <ErrorState message={message} />
      </div>
    );
  }

  if (session && session.status !== 'IN_PROGRESS') {
    return <SessionEndedScreen status={session.status} contestId={contestId!} contestTitle={contest?.title} />;
  }

  const questionList =
    questions.length > 0 ? (
      <QuestionNavigator
        questions={questions}
        activeId={activeQuestionId}
        visitedIds={visitedIds}
        onSelect={handleSelectQuestion}
        progress={progress}
      />
    ) : null;

  const acceptedCount = questionIds.filter((id) => progress[id] === 'accepted').length;

  return (
    <div className="flex h-dvh flex-col overflow-hidden bg-canvas">
      {/* ── Header ── */}
      <header className="z-[var(--z-sticky)] flex h-14 shrink-0 items-center gap-3 border-b border-line bg-surface px-3 sm:px-4">
        <IconButton aria-label="Open question list" className="lg:hidden" onClick={() => setNavOpen(true)}>
          <ListOrdered className="size-5" />
        </IconButton>
        <BrandMark size={28} withWordmark={false} className="hidden sm:inline-flex" />
        <div className="min-w-0">
          <p className="truncate font-display text-[14px] font-semibold tracking-[-0.015em] text-fg">
            {contest?.title ?? 'Assessment'}
          </p>
          {questions.length > 0 && (
            <p className="tabular hidden text-[12px] text-fg-subtle sm:block">
              Question {activeIndex + 1} of {questions.length} · {acceptedCount} accepted
            </p>
          )}
        </div>

        <div className="flex-1" />

        {!isOnline && (
          <Badge tone="warning" icon={<WifiOff className="size-3" />} className="hidden sm:inline-flex">
            Reconnecting…
          </Badge>
        )}
        <CountdownTimer remainingSeconds={remainingSeconds} />
        <ThemeToggle className="hidden sm:inline-flex" />
        <Button
          size="sm"
          onClick={() => setShowSubmitDialog(true)}
          disabled={isExpired}
          loading={submitMutation.isPending}
          leadingIcon={<Send className="size-3.5" />}
        >
          <span className="hidden sm:inline">Submit exam</span>
          <span className="sm:hidden">Finish</span>
        </Button>
      </header>

      {!isOnline && (
        <div role="status" className="shrink-0 bg-warning-soft px-4 py-1.5 text-center text-[12px] font-medium text-warning-text sm:hidden">
          You’re offline — reconnecting…
        </div>
      )}

      {/* ── Body ── */}
      <div className="flex min-h-0 flex-1">
        <aside className="hidden w-64 shrink-0 flex-col border-r border-line bg-surface lg:flex">
          <div className="flex h-11 items-center justify-between border-b border-line px-4">
            <span className="font-mono text-[11px] font-medium uppercase tracking-[0.08em] text-fg-subtle">Questions</span>
            <span className="tabular text-[12px] text-fg-subtle">
              {acceptedCount}/{questions.length}
            </span>
          </div>
          <div className="flex-1 overflow-y-auto px-2">{questionList}</div>
        </aside>

        <Sheet open={navOpen} onOpenChange={setNavOpen} side="left" width="max-w-[300px]" title="Questions">
          <div className="px-2">{questionList}</div>
        </Sheet>

        <div className="flex min-w-0 flex-1 flex-col">
          {/* Problem | Code switch below xl */}
          <div className="flex shrink-0 items-center border-b border-line bg-surface px-3 py-2 xl:hidden">
            <Segmented<Pane>
              aria-label="Show problem or code"
              value={pane}
              onChange={setPane}
              className="w-full sm:w-72"
              options={[
                { value: 'problem', label: <span className="inline-flex items-center gap-1.5"><FileText className="size-3.5" />Problem</span> },
                { value: 'code', label: <span className="inline-flex items-center gap-1.5"><Code2 className="size-3.5" />Code</span> },
              ]}
            />
          </div>

          <div className="flex min-h-0 flex-1">
            <div className={cn('min-w-0 flex-1 bg-surface', pane === 'code' && 'hidden xl:block')}>
              {activeQuestion ? (
                <QuestionPanel question={activeQuestion} />
              ) : (
                <EmptyState title="No questions yet" message="This contest has no questions to show. Tell your invigilator." />
              )}
            </div>

            {/* Kept mounted when hidden so the editor keeps its state */}
            <div
              className={cn(
                'min-w-0 border-line xl:flex xl:w-[52%] xl:shrink-0 xl:border-l',
                pane === 'code' ? 'flex flex-1' : 'hidden',
              )}
            >
              {activeQuestion && contestId && (
                <CodeEditorPanel
                  contestId={contestId}
                  question={activeQuestion}
                  allowedLanguages={contest?.allowedLanguages ?? []}
                  disabled={isExpired}
                />
              )}
            </div>
          </div>
        </div>
      </div>

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
