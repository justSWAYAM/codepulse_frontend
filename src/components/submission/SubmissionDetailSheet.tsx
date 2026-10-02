import React, { useState } from 'react';
import { RotateCw } from 'lucide-react';
import { Button, Dialog, Sheet, Skeleton, Tooltip } from '../ui';
import { ErrorState } from '../states/ErrorState';
import { OutputBlock, VerdictBadge } from '../editor/VerdictBadge';
import { useEvaluatorSubmission, useRejudge } from '../../hooks/useSubmissions';
import { languageLabel } from '../../lib/languages';
import { verdictOf } from '../../lib/verdicts';
import { getErrorMessage } from '../../lib/apiError';
import type { ContestSubmissionRow } from '../../api/submissionApi';
import { EvaluatorTestResults } from './EvaluatorTestResults';

interface SubmissionDetailSheetProps {
  contestId: string;
  submissionId: string | null;
  /** The table row, so the header renders before the detail arrives. */
  row?: ContestSubmissionRow;
  questionTitle?: string;
  points?: number;
  canRejudge: boolean;
  /** Module 9: shown on a disabled Rejudge button while results are published. */
  rejudgeLockedReason?: string;
  onClose: () => void;
}

const dateTime = new Intl.DateTimeFormat(undefined, { dateStyle: 'medium', timeStyle: 'medium' });

export const SubmissionDetailSheet: React.FC<SubmissionDetailSheetProps> = ({
  contestId,
  submissionId,
  row,
  questionTitle,
  points,
  canRejudge,
  rejudgeLockedReason,
  onClose,
}) => {
  const { data, isLoading, isError, error, refetch } = useEvaluatorSubmission(submissionId);
  const rejudge = useRejudge(contestId);
  const [confirm, setConfirm] = useState(false);

  const status = data?.status ?? row?.status;
  const v = verdictOf(status);
  const type = data?.type ?? row?.type;
  const rejudgeable = canRejudge && type === 'SUBMIT' && status !== 'PENDING';
  const locked = rejudgeable && !!rejudgeLockedReason;

  return (
    <Sheet
      open={!!submissionId}
      onOpenChange={(o) => !o && onClose()}
      width="max-w-3xl"
      title={row?.candidateName ?? 'Submission'}
      description={[questionTitle, row?.candidateRollNumber ?? row?.candidateEmail].filter(Boolean).join(' · ') || undefined}
      headerActions={
        locked ? (
          <Tooltip content={rejudgeLockedReason}>
            {/* span: a disabled button fires no pointer events, so the tooltip needs a wrapper */}
            <span tabIndex={0}>
              <Button size="sm" variant="secondary" leadingIcon={<RotateCw className="size-3.5" />} disabled>
                Rejudge
              </Button>
            </span>
          </Tooltip>
        ) : rejudgeable ? (
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
                <EvaluatorTestResults results={data.testCaseResults} />
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
