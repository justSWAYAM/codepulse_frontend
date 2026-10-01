import React, { useState } from 'react';
import { ChevronDown, Clock, Cpu, RotateCw, Weight } from 'lucide-react';
import { Badge, Button, Dialog, Sheet, Skeleton } from '../ui';
import { ErrorState } from '../states/ErrorState';
import { OutputBlock, VerdictBadge } from '../editor/VerdictBadge';
import { formatKb, formatMs } from '../../lib/format';
import { useEvaluatorSubmission, useRejudge } from '../../hooks/useSubmissions';
import { languageLabel } from '../../lib/languages';
import { verdictOf } from '../../lib/verdicts';
import { getErrorMessage } from '../../lib/apiError';
import { cn } from '../../lib/cn';
import type { ContestSubmissionRow, EvaluatorTestCaseResult } from '../../api/submissionApi';

interface SubmissionDetailSheetProps {
  contestId: string;
  submissionId: string | null;
  /** The table row, so the header renders before the detail arrives. */
  row?: ContestSubmissionRow;
  questionTitle?: string;
  points?: number;
  canRejudge: boolean;
  onClose: () => void;
}

const dateTime = new Intl.DateTimeFormat(undefined, { dateStyle: 'medium', timeStyle: 'medium' });

const TestRow: React.FC<{ result: EvaluatorTestCaseResult; index: number }> = ({ result, index }) => {
  const [open, setOpen] = useState(result.status !== 'PASSED' && index < 3);
  return (
    <li className="rounded-xl border border-line bg-surface">
      <button
        type="button"
        onClick={() => setOpen((o) => !o)}
        aria-expanded={open}
        className="flex min-h-11 w-full flex-wrap items-center gap-x-3 gap-y-1 rounded-xl px-3 py-2 text-left hover-fine:bg-surface-2/60"
      >
        <ChevronDown className={cn('size-4 shrink-0 text-fg-subtle transition-transform duration-200 ease-out', !open && '-rotate-90')} aria-hidden />
        <span className="tabular text-[13px] font-medium text-fg">Test {index + 1}</span>
        <Badge size="sm" tone={result.sample ? 'primary' : 'neutral'}>
          {result.sample ? 'Sample' : 'Hidden'}
        </Badge>
        <VerdictBadge status={result.status} />
        <span className="ml-auto flex items-center gap-3 text-[12px] text-fg-subtle">
          <span className="tabular inline-flex items-center gap-1" title="Weight">
            <Weight className="size-3.5" aria-hidden />
            <span className="sr-only">Weight </span>
            {result.weight}
          </span>
          <span className="tabular inline-flex items-center gap-1" title="Time">
            <Clock className="size-3.5" aria-hidden />
            {formatMs(result.timeMs)}
          </span>
          <span className="tabular inline-flex items-center gap-1" title="Memory">
            <Cpu className="size-3.5" aria-hidden />
            {formatKb(result.memoryKb)}
          </span>
        </span>
      </button>
      {open && (
        <div className="grid gap-3 border-t border-line p-3 md:grid-cols-3">
          <OutputBlock label="Input" value={result.input} emptyText="(empty)" />
          <OutputBlock label="Expected" value={result.expectedOutput} />
          <OutputBlock label="Actual" value={result.actualOutput} />
          {result.stderr && <OutputBlock label="stderr" value={result.stderr} tone="danger" className="md:col-span-3" />}
        </div>
      )}
    </li>
  );
};

export const SubmissionDetailSheet: React.FC<SubmissionDetailSheetProps> = ({
  contestId,
  submissionId,
  row,
  questionTitle,
  points,
  canRejudge,
  onClose,
}) => {
  const { data, isLoading, isError, error, refetch } = useEvaluatorSubmission(submissionId);
  const rejudge = useRejudge(contestId);
  const [confirm, setConfirm] = useState(false);

  const status = data?.status ?? row?.status;
  const v = verdictOf(status);
  const type = data?.type ?? row?.type;
  const rejudgeable = canRejudge && type === 'SUBMIT' && status !== 'PENDING';

  return (
    <Sheet
      open={!!submissionId}
      onOpenChange={(o) => !o && onClose()}
      width="max-w-3xl"
      title={row?.candidateName ?? 'Submission'}
      description={[questionTitle, row?.candidateRollNumber ?? row?.candidateEmail].filter(Boolean).join(' · ') || undefined}
      headerActions={
        rejudgeable ? (
          <Button size="sm" variant="secondary" leadingIcon={<RotateCw className="size-3.5" />} onClick={() => setConfirm(true)}>
            Rejudge
          </Button>
        ) : undefined
      }
    >
      <div className="space-y-6 p-5">
        {/* Summary */}
        <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
          <div className="col-span-2 rounded-xl border border-line bg-surface-2/50 p-3.5">
            <div className="text-[12px] text-fg-subtle">Verdict</div>
            <div className="mt-1 flex items-center gap-2">
              <VerdictBadge status={status} size="md" />
            </div>
            {v.hint && <p className="mt-1.5 text-[12px] text-fg-muted">{v.hint}</p>}
          </div>
          <div className="rounded-xl border border-line bg-surface-2/50 p-3.5">
            <div className="text-[12px] text-fg-subtle">Score</div>
            <div className="tabular mt-1 text-[17px] font-semibold text-fg">
              {data?.score ?? row?.score ?? '—'}
              {points != null && <span className="text-[13px] font-normal text-fg-subtle"> / {points}</span>}
            </div>
          </div>
          <div className="rounded-xl border border-line bg-surface-2/50 p-3.5">
            <div className="text-[12px] text-fg-subtle">Tests passed</div>
            <div className="tabular mt-1 text-[17px] font-semibold text-fg">
              {data?.passedCount ?? row?.passedCount ?? 0}
              <span className="text-[13px] font-normal text-fg-subtle"> / {data?.totalCount ?? row?.totalCount ?? 0}</span>
            </div>
          </div>
        </div>

        <dl className="grid grid-cols-2 gap-x-6 gap-y-2 text-[13px] sm:grid-cols-4">
          <div>
            <dt className="text-fg-subtle">Type</dt>
            <dd className="text-fg">{type === 'SUBMIT' ? 'Submit' : 'Run'}</dd>
          </div>
          <div>
            <dt className="text-fg-subtle">Language</dt>
            <dd className="text-fg">{languageLabel(data?.language ?? row?.language ?? '')}</dd>
          </div>
          <div>
            <dt className="text-fg-subtle">Submitted</dt>
            <dd className="tabular text-fg">{row?.submittedAt || data?.submittedAt ? dateTime.format(new Date((data?.submittedAt ?? row?.submittedAt)!)) : '—'}</dd>
          </div>
          <div>
            <dt className="text-fg-subtle">Evaluated</dt>
            <dd className="tabular text-fg">{data?.evaluatedAt ? dateTime.format(new Date(data.evaluatedAt)) : '—'}</dd>
          </div>
        </dl>

        {isLoading ? (
          <div className="space-y-2">
            <Skeleton className="h-48 w-full rounded-xl" />
            <Skeleton className="h-11 w-full rounded-xl" />
            <Skeleton className="h-11 w-full rounded-xl" />
          </div>
        ) : isError ? (
          <ErrorState message={getErrorMessage(error, 'Couldn’t load this submission.')} onRetry={() => refetch()} />
        ) : data ? (
          <>
            <OutputBlock label="Source code" value={data.sourceCode} className="[&_pre]:max-h-80" />
            {data.compileOutput && <OutputBlock label="Compiler output" value={data.compileOutput} tone="danger" />}
            <section>
              <h3 className="mb-2 font-display text-[14px] font-semibold tracking-[-0.015em] text-fg">
                Test cases <span className="tabular font-sans font-normal text-fg-subtle">({data.testCaseResults.length})</span>
              </h3>
              {data.status === 'PENDING' ? (
                <p className="rounded-xl border border-line bg-surface-2/50 px-4 py-3 text-[13px] text-fg-muted">
                  Judging… results appear here automatically.
                </p>
              ) : data.testCaseResults.length === 0 ? (
                <p className="text-[13px] text-fg-muted">No test results were recorded.</p>
              ) : (
                <ul className="space-y-2">
                  {data.testCaseResults.map((r, i) => (
                    <TestRow key={r.testCaseId} result={r} index={i} />
                  ))}
                </ul>
              )}
            </section>
          </>
        ) : null}
      </div>

      <Dialog
        open={confirm}
        onOpenChange={setConfirm}
        dismissible={!rejudge.isPending}
        tone="warning"
        icon={<RotateCw className="size-5" />}
        size="sm"
        title="Rejudge this submission?"
        description="It runs again on every test case and its verdict and score are replaced. Use this after fixing test cases or a judge outage."
        footer={
          <>
            <Button variant="secondary" onClick={() => setConfirm(false)} disabled={rejudge.isPending}>
              Cancel
            </Button>
            <Button
              loading={rejudge.isPending}
              leadingIcon={<RotateCw className="size-4" />}
              onClick={() =>
                submissionId &&
                rejudge.mutate(submissionId, {
                  onSuccess: () => setConfirm(false),
                })
              }
            >
              Rejudge submission
            </Button>
          </>
        }
      />
    </Sheet>
  );
};
