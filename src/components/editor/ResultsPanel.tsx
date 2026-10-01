import React, { useState } from 'react';
import * as RT from '@radix-ui/react-tabs';
import { ChevronDown, Clock, Cpu, EyeOff, FileCode2, History, ListChecks, RotateCw, Star } from 'lucide-react';
import { cn } from '../../lib/cn';
import { Button, Spinner } from '../ui';
import { getErrorMessage } from '../../lib/apiError';
import { verdictOf } from '../../lib/verdicts';
import { languageLabel } from '../../lib/languages';
import type { SampleResult, SubmissionCandidateView, SubmissionSummary } from '../../api/submissionApi';
import { useSubmissionDetail } from '../../hooks/useSubmissions';
import { OutputBlock, VerdictBadge } from './VerdictBadge';
import { formatKb, formatMs } from '../../lib/format';

export type ResultsTab = 'results' | 'history';

export type LastAction =
  | { kind: 'run'; pending: boolean; error: unknown; detail: SubmissionCandidateView | null }
  | { kind: 'submit'; pending: boolean; error: unknown; submissionId: string | null }
  | null;

interface ResultsPanelProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  tab: ResultsTab;
  onTabChange: (tab: ResultsTab) => void;
  lastAction: LastAction;
  questionId: string;
  points: number;
  /** Number of sample test cases on this question — used as fallback when backend omits sampleResults. */
  sampleCount: number;
  history: SubmissionSummary[] | undefined;
  historyLoading: boolean;
  onLoadCode: (code: string, language: string) => void;
}

const rtf = new Intl.RelativeTimeFormat(undefined, { numeric: 'auto' });
function timeAgo(iso: string) {
  const diff = (new Date(iso).getTime() - Date.now()) / 1000;
  if (Math.abs(diff) < 45) return 'just now';
  if (Math.abs(diff) < 3600) return rtf.format(Math.round(diff / 60), 'minute');
  if (Math.abs(diff) < 86400) return rtf.format(Math.round(diff / 3600), 'hour');
  return new Intl.DateTimeFormat(undefined, { dateStyle: 'medium', timeStyle: 'short' }).format(new Date(iso));
}

const fmtScore = (score: number | null, points: number) =>
  score == null ? '—' : `${Number(score).toLocaleString(undefined, { maximumFractionDigits: 2 })} / ${points}`;

/* ─────────────────── Pieces ─────────────────── */

const Metric: React.FC<{ icon: React.ReactNode; children: React.ReactNode; label: string }> = ({ icon, children, label }) => (
  <span className="tabular inline-flex items-center gap-1 text-[12px] text-editor-muted" title={label}>
    <span aria-hidden className="[&>svg]:size-3.5">{icon}</span>
    <span className="sr-only">{label}: </span>
    {children}
  </span>
);

const SampleCard: React.FC<{ result: SampleResult; index: number; defaultOpen: boolean }> = ({ result, index, defaultOpen }) => {
  const [open, setOpen] = useState(defaultOpen);
  return (
    <div className="rounded-xl border border-editor-line bg-white/[0.02]">
      <button
        type="button"
        onClick={() => setOpen((o) => !o)}
        aria-expanded={open}
        className="flex h-11 w-full items-center gap-3 rounded-xl px-3 text-left hover-fine:bg-white/[0.03]"
      >
        <ChevronDown
          className={cn('size-4 shrink-0 text-editor-muted transition-transform duration-200 ease-out', !open && '-rotate-90')}
          aria-hidden
        />
        <span className="text-[13px] font-medium text-editor-fg">Sample {index + 1}</span>
        <VerdictBadge status={result.status} />
        <span className="ml-auto flex items-center gap-3">
          <Metric icon={<Clock />} label="Time">{formatMs(result.timeMs)}</Metric>
          <Metric icon={<Cpu />} label="Memory">{formatKb(result.memoryKb)}</Metric>
        </span>
      </button>
      {open && (
        <div className="grid gap-3 border-t border-editor-line p-3 md:grid-cols-2">
          <OutputBlock label="Input" value={result.input} emptyText="(empty)" />
          <OutputBlock label="Your output" value={result.actualOutput} />
          {result.stderr && <OutputBlock label="stderr" value={result.stderr} tone="danger" className="md:col-span-2" />}
        </div>
      )}
    </div>
  );
};

const VerdictHeader: React.FC<{
  status: SubmissionCandidateView['status'];
  title: string;
  children?: React.ReactNode;
}> = ({ status, title, children }) => {
  const v = verdictOf(status);
  const color =
    v.tone === 'success' ? 'text-success-text' : v.tone === 'danger' ? 'text-danger-text' : v.tone === 'warning' ? 'text-warning-text' : 'text-editor-fg';
  return (
    <div className="flex flex-wrap items-end justify-between gap-x-4 gap-y-2">
      <div className="min-w-0">
        <div className="font-mono text-[11px] font-medium uppercase tracking-[0.08em] text-editor-muted">{title}</div>
        <div className={cn('mt-0.5 font-display text-[19px] font-semibold tracking-[-0.02em]', color)} aria-live="polite">
          {v.label}
        </div>
        {v.hint && <p className="mt-0.5 text-[12.5px] text-editor-muted">{v.hint}</p>}
      </div>
      {children && <div className="flex items-center gap-4">{children}</div>}
    </div>
  );
};

const Stat: React.FC<{ label: string; value: React.ReactNode }> = ({ label, value }) => (
  <div className="text-right">
    <div className="text-[11px] text-editor-muted">{label}</div>
    <div className="tabular text-[15px] font-semibold text-editor-fg">{value}</div>
  </div>
);

const InlineError: React.FC<{ error: unknown }> = ({ error }) => (
  <div role="alert" className="rounded-xl border border-danger/30 bg-danger-soft px-3.5 py-3 text-[13px] leading-5 text-danger-text">
    {getErrorMessage(error)}
  </div>
);

const Waiting: React.FC<{ label: string; sub?: string }> = ({ label, sub }) => (
  <div className="flex items-center gap-3 rounded-xl border border-editor-line bg-white/[0.02] px-4 py-4 text-editor-fg">
    <Spinner size={16} />
    <div>
      <div className="text-[13px] font-medium">{label}</div>
      {sub && <div className="text-[12px] text-editor-muted">{sub}</div>}
    </div>
  </div>
);

/** Full candidate view of a run or submission: verdict, compile output, samples, hidden summary. */
const SubmissionBody: React.FC<{ detail: SubmissionCandidateView; points: number; sampleCount?: number }> = ({ detail, points, sampleCount }) => {
  const samples = detail.sampleResults ?? [];
  const firstFailing = samples.findIndex((s) => s.status !== 'PASSED');
  const samplesPassed = samples.filter((s) => s.status === 'PASSED').length;
  const isRun = detail.type === 'RUN';

  // When the backend returns no per-test details (sampleResults empty) but status is ACCEPTED
  // and we know the question's sample count, we can confidently display N / N.
  const knownTotal = samples.length > 0 ? samples.length : (sampleCount ?? null);
  const knownPassed = samples.length > 0 ? samplesPassed : (detail.status === 'ACCEPTED' && knownTotal != null ? knownTotal : null);
  const sampleLabel = knownTotal != null
    ? `${knownPassed ?? 0} / ${knownTotal}`
    : `${samplesPassed} / ${samples.length}`;

  return (
    <div className="space-y-4">
      <VerdictHeader status={detail.status} title={isRun ? 'Run · sample tests' : 'Submission · all tests'}>
        {isRun ? (
          <Stat label="Samples passed" value={sampleLabel} />
        ) : (
          <>
            <Stat label="Tests passed" value={`${detail.passedCount ?? 0} / ${detail.totalCount ?? 0}`} />
            <Stat label="Score" value={fmtScore(detail.score, points)} />
          </>
        )}
      </VerdictHeader>

      {detail.compileOutput && detail.status === 'COMPILATION_ERROR' && (
        <OutputBlock label="Compiler output" value={detail.compileOutput} tone="danger" />
      )}

      {samples.length > 0 && (
        <div className="space-y-2">
          {samples.map((s, i) => (
            <SampleCard
              key={s.testCaseId}
              result={s}
              index={i}
              // Open the first failing sample (or the first one if all passed)
              defaultOpen={i === (firstFailing === -1 ? 0 : firstFailing)}
            />
          ))}
        </div>
      )}

      {!isRun && detail.hiddenSummary && detail.hiddenSummary.total > 0 && (
        <div className="flex items-center gap-3 rounded-xl border border-editor-line bg-white/[0.02] px-4 py-3">
          <EyeOff className="size-4 shrink-0 text-editor-muted" aria-hidden />
          <span className="text-[13px] text-editor-fg">Hidden tests</span>
          <span className="tabular ml-auto text-[13px] font-medium text-editor-fg">
            {detail.hiddenSummary.passed} / {detail.hiddenSummary.total} passed
          </span>
        </div>
      )}
    </div>
  );
};

const PolledSubmission: React.FC<{ submissionId: string; questionId: string; points: number }> = ({
  submissionId,
  questionId,
  points,
}) => {
  const { data, isError, error, timedOut, retryPolling } = useSubmissionDetail(submissionId, questionId);
  if (isError) return <InlineError error={error} />;
  if (!data || data.status === 'PENDING') {
    if (timedOut) {
      return (
        <div className="flex flex-wrap items-center gap-3 rounded-xl border border-warning/30 bg-warning-soft px-4 py-3">
          <span className="text-[13px] text-warning-text">Still judging… this is taking longer than usual.</span>
          <Button size="sm" variant="secondary" className="ml-auto" leadingIcon={<RotateCw className="size-3.5" />} onClick={retryPolling}>
            Check again
          </Button>
        </div>
      );
    }
    return <Waiting label="Judging your submission…" sub="Running every test case. This usually takes a few seconds." />;
  }
  return <SubmissionBody detail={data} points={points} />;
};

const HistoryRow: React.FC<{
  item: SubmissionSummary;
  points: number;
  questionId: string;
  expanded: boolean;
  onToggle: () => void;
  onLoadCode: (code: string, language: string) => void;
}> = ({ item, points, questionId, expanded, onToggle, onLoadCode }) => {
  const { data } = useSubmissionDetail(expanded ? item.id : null, questionId);
  return (
    <li className="rounded-xl border border-editor-line bg-white/[0.02]">
      <button
        type="button"
        onClick={onToggle}
        aria-expanded={expanded}
        className="grid h-11 w-full grid-cols-[auto_1fr_auto] items-center gap-3 rounded-xl px-3 text-left hover-fine:bg-white/[0.03]"
      >
        <VerdictBadge status={item.status} short />
        <span className="flex min-w-0 items-center gap-2 text-[13px]">
          <span className="font-medium text-editor-fg">{item.type === 'SUBMIT' ? 'Submit' : 'Run'}</span>
          <span className="truncate text-editor-muted">{languageLabel(item.language)}</span>
          {item.counted && (
            <span className="inline-flex items-center gap-1 rounded-full bg-primary/15 px-2 text-[11px] font-medium leading-5 text-primary-text">
              <Star className="size-3" aria-hidden /> Best
            </span>
          )}
        </span>
        <span className="flex items-center gap-3">
          {item.type === 'SUBMIT' && <span className="tabular text-[12px] text-editor-fg">{fmtScore(item.score, points)}</span>}
          <span className="tabular hidden text-[12px] text-editor-muted sm:inline">{timeAgo(item.submittedAt)}</span>
        </span>
      </button>
      {expanded && (
        <div className="space-y-3 border-t border-editor-line p-3">
          {data ? (
            <>
              <SubmissionBody detail={data} points={points} />
              <div className="flex justify-end">
                <Button
                  size="sm"
                  variant="secondary"
                  leadingIcon={<FileCode2 className="size-3.5" />}
                  onClick={() => onLoadCode(data.sourceCode, data.language)}
                >
                  Load this code into the editor
                </Button>
              </div>
            </>
          ) : (
            <Waiting label="Loading submission…" />
          )}
        </div>
      )}
    </li>
  );
};

/* ─────────────────── Panel ─────────────────── */

const tabClass =
  'relative inline-flex h-10 items-center gap-2 px-3 text-[13px] font-medium text-editor-muted outline-none transition-colors duration-150 ' +
  'hover-fine:text-editor-fg data-[state=active]:text-editor-fg ' +
  'after:absolute after:inset-x-2 after:bottom-0 after:h-[2px] after:rounded-full after:bg-transparent data-[state=active]:after:bg-primary ' +
  'focus-visible:rounded-lg focus-visible:outline-2 focus-visible:outline-ring';

export const ResultsPanel: React.FC<ResultsPanelProps> = ({
  open,
  onOpenChange,
  tab,
  onTabChange,
  lastAction,
  questionId,
  points,
  sampleCount,
  history,
  historyLoading,
  onLoadCode,
}) => {
  const [expandedId, setExpandedId] = useState<string | null>(null);
  const submits = history?.filter((h) => h.type === 'SUBMIT').length ?? 0;

  let results: React.ReactNode;
  if (!lastAction) {
    results = (
      <div className="flex flex-col items-center justify-center gap-1 py-8 text-center">
        <ListChecks className="mb-2 size-5 text-editor-muted" aria-hidden />
        <p className="text-[13px] text-editor-fg">Run your code to check it against the sample tests.</p>
        <p className="text-[12px] text-editor-muted">Submit when you’re ready to be judged on every test case.</p>
      </div>
    );
  } else if (lastAction.error) {
    results = <InlineError error={lastAction.error} />;
  } else if (lastAction.kind === 'run') {
    results = lastAction.pending || !lastAction.detail ? (
      <Waiting label="Running sample tests…" />
    ) : (
      <SubmissionBody detail={lastAction.detail} points={points} sampleCount={sampleCount} />
    );
  } else {
    results =
      lastAction.pending || !lastAction.submissionId ? (
        <Waiting label="Submitting…" />
      ) : (
        <PolledSubmission submissionId={lastAction.submissionId} questionId={questionId} points={points} />
      );
  }

  return (
    <RT.Root
      value={tab}
      onValueChange={(v) => {
        onTabChange(v as ResultsTab);
        onOpenChange(true);
      }}
      className={cn('flex min-h-0 flex-col border-t border-editor-line bg-editor-panel', open ? 'h-[45%] min-h-56' : 'h-10')}
    >
      <div className="flex shrink-0 items-center border-b border-editor-line pl-2 pr-1">
        <RT.List aria-label="Results" className="flex items-center">
          <RT.Trigger value="results" className={tabClass}>
            <ListChecks className="size-4" aria-hidden />
            Test results
          </RT.Trigger>
          <RT.Trigger value="history" className={tabClass}>
            <History className="size-4" aria-hidden />
            Submissions
            {submits > 0 && (
              <span className="tabular rounded-full bg-white/10 px-1.5 text-[11px] leading-[18px] text-editor-fg">{submits}</span>
            )}
          </RT.Trigger>
        </RT.List>
        <button
          type="button"
          onClick={() => onOpenChange(!open)}
          aria-label={open ? 'Collapse results panel' : 'Expand results panel'}
          aria-expanded={open}
          className="press-sm ml-auto flex size-8 items-center justify-center rounded-lg text-editor-muted hover-fine:bg-white/5 hover-fine:text-editor-fg"
        >
          <ChevronDown className={cn('size-4 transition-transform duration-200 ease-out', !open && 'rotate-180')} />
        </button>
      </div>
      {open && (
        <>
          <RT.Content value="results" className="scroll-thin min-h-0 flex-1 overflow-y-auto p-4 outline-none">
            {results}
          </RT.Content>
          <RT.Content value="history" className="scroll-thin min-h-0 flex-1 overflow-y-auto p-4 outline-none">
            {historyLoading ? (
              <Waiting label="Loading your submissions…" />
            ) : !history || history.length === 0 ? (
              <p className="py-8 text-center text-[13px] text-editor-muted">
                No runs or submissions yet for this question.
              </p>
            ) : (
              <ul className="space-y-2">
                {history.map((item) => (
                  <HistoryRow
                    key={item.id}
                    item={item}
                    points={points}
                    questionId={questionId}
                    expanded={expandedId === item.id}
                    onToggle={() => setExpandedId((id) => (id === item.id ? null : item.id))}
                    onLoadCode={onLoadCode}
                  />
                ))}
              </ul>
            )}
          </RT.Content>
        </>
      )}
    </RT.Root>
  );
};
