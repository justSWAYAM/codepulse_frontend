import React, { useState, useEffect, useCallback, useMemo, useRef } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { ChevronLeft, ChevronRight, Code2, FileText, Send, WifiOff } from 'lucide-react';
import { toast } from 'sonner';

import { useContest } from '../hooks/useContests';
import { useQueryClient } from '@tanstack/react-query';
import { sessionKeys, useAssessmentSession, useSubmitSession } from '../hooks/useAssessmentSession';
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
import { Badge, BrandMark, Button, Segmented, ThemeToggle } from '../components/ui';
import { getErrorMessage } from '../lib/apiError';
import { cn } from '../lib/cn';

import type { QuestionCandidateRecord } from '../api/questionApi';

type Pane = 'problem' | 'code';

const SIDEBAR_WIDTH = 260;      // px — navigator sidebar
const MIN_PROBLEM_W = 280;      // px — minimum problem panel width
const MIN_EDITOR_W  = 360;      // px — minimum editor width
const DEFAULT_SPLIT = 0.42;     // fraction of remaining space for problem panel

/**
 * AssessmentPage — the exam-taking shell (focus mode, outside AppShell).
 *
 * Layout (xl+):
 *   [Nav sidebar (collapsible)] | [Problem panel (resizable)] | [drag handle] | [Code editor]
 *
 * Below xl: Problem | Code switch as before.
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

  const { data: questionsRaw = [] } = useQuestions(contestId!, sessionIsActive);

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
  const queryClient = useQueryClient();
  const [showSubmitDialog, setShowSubmitDialog] = useState(false);

  const handleSubmit = async () => {
    try {
      await submitMutation.mutateAsync();
      setShowSubmitDialog(false);
    } catch (err: unknown) {
      setShowSubmitDialog(false);
      const status = (err as { response?: { status?: number } })?.response?.status;
      if (status !== 409 && status !== 422) {
        toast.error(getErrorMessage(err, 'Failed to submit exam'));
      } else {
        // Already submitted or timed out on the server: show the ended screen now
        queryClient.invalidateQueries({ queryKey: sessionKeys.detail(contestId!) });
      }
    }
  };

  // ── Question state ──
  const [activeQuestionId, setActiveQuestionId] = useState<string>('');
  const [visitedIds, setVisitedIds] = useState<Set<string>>(new Set());
  const [sidebarOpen, setSidebarOpen] = useState(true);
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
    return () => { window.removeEventListener('online', on); window.removeEventListener('offline', off); };
  }, []);

  // ── Drag-to-resize ──
  const containerRef = useRef<HTMLDivElement>(null);
  // problemFraction is the fraction of the resizable area (after sidebar) used by the problem panel
  const [problemFraction, setProblemFraction] = useState(DEFAULT_SPLIT);
  const dragging = useRef(false);

  const onDragStart = useCallback((e: React.PointerEvent) => {
    e.currentTarget.setPointerCapture(e.pointerId);
    dragging.current = true;
  }, []);

  const onDragMove = useCallback((e: React.PointerEvent) => {
    if (!dragging.current || !containerRef.current) return;
    const rect = containerRef.current.getBoundingClientRect();
    const sidebarW = sidebarOpen ? SIDEBAR_WIDTH : 0;
    const available = rect.width - sidebarW;
    const rawProblemW = e.clientX - rect.left - sidebarW;
    const clampedW = Math.max(MIN_PROBLEM_W, Math.min(rawProblemW, available - MIN_EDITOR_W));
    setProblemFraction(clampedW / available);
  }, [sidebarOpen]);

  const onDragEnd = useCallback(() => { dragging.current = false; }, []);

  // ── Redirect when there's no session ──
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
    <div className="flex h-dvh max-h-dvh flex-col overflow-hidden bg-canvas">
      {/* ── Header ── */}
      <header className="z-[var(--z-sticky)] flex h-14 shrink-0 items-center gap-2 border-b border-line bg-surface px-3 sm:px-4">
        <BrandMark size={28} withWordmark={false} />


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
          You're offline — reconnecting…
        </div>
      )}

      {/* ── Body ── */}
      <div
        ref={containerRef}
        className="flex min-h-0 flex-1 select-none"
        onPointerMove={onDragMove}
        onPointerUp={onDragEnd}
        onPointerLeave={onDragEnd}
      >
        {/* ── Collapsible sidebar (all breakpoints) ── */}
        <div className="relative flex shrink-0">
          <aside
            className={cn(
              'flex flex-col border-r border-line bg-surface overflow-hidden transition-[width] duration-200 ease-out',
              sidebarOpen ? 'w-[260px]' : 'w-0 border-r-0',
            )}
            aria-hidden={!sidebarOpen}
          >
            <div className="flex h-11 shrink-0 items-center justify-between border-b border-line px-4">
              <span className="font-mono text-[11px] font-medium uppercase tracking-[0.08em] text-fg-subtle">Questions</span>
              <span className="tabular text-[12px] text-fg-subtle">{acceptedCount}/{questions.length}</span>
            </div>
            <div className="flex-1 overflow-y-auto px-2">{questionList}</div>
          </aside>

          {/* Edge toggle tab */}
          <button
            type="button"
            aria-label={sidebarOpen ? 'Collapse question list' : 'Expand question list'}
            onClick={() => setSidebarOpen((o) => !o)}
            className={cn(
              'absolute top-1/2 -translate-y-1/2 z-20 flex items-center justify-center',
              'h-12 w-4 rounded-r-md border border-l-0 border-line bg-surface',
              'text-fg-subtle hover:text-fg hover:bg-canvas transition-colors duration-150 cursor-pointer shadow-sm',
              sidebarOpen ? 'right-0 translate-x-full' : 'right-0 translate-x-full',
            )}
          >
            {sidebarOpen
              ? <ChevronLeft className="size-3" />
              : <ChevronRight className="size-3" />}
          </button>
        </div>

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

          {/* ── xl+ resizable split ── */}
          <div className="flex min-h-0 flex-1">
            {/* Problem panel */}
            <div
              className={cn('min-w-0 bg-surface overflow-hidden', pane === 'code' && 'hidden xl:block')}
              style={{ flex: `0 0 ${(problemFraction * 100).toFixed(2)}%` }}
            >
              {activeQuestion ? (
                <QuestionPanel question={activeQuestion} />
              ) : (
                <EmptyState title="No questions yet" message="This contest has no questions to show. Tell your invigilator." />
              )}
            </div>

            {/* Drag handle (xl+ only) */}
            <div
              className={cn(
                'hidden xl:flex items-center justify-center w-[5px] shrink-0 cursor-col-resize bg-transparent group hover:bg-primary/10 active:bg-primary/20 transition-colors duration-150 z-10',
                pane === 'code' && 'xl:hidden',
              )}
              onPointerDown={onDragStart}
              role="separator"
              aria-label="Drag to resize panels"
              aria-orientation="vertical"
            >
              <div className="h-10 w-[3px] rounded-full bg-line group-hover:bg-primary/50 transition-colors duration-150" />
            </div>

            {/* Code editor panel — kept mounted to preserve state */}
            <div
              className={cn(
                'min-w-0 border-line overflow-hidden',
                pane === 'code' ? 'flex flex-1' : 'hidden xl:flex',
              )}
              style={{ flex: `1 1 0%` }}
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
