import React, { Suspense, lazy } from 'react';
import { Link } from 'react-router-dom';
import { AlertTriangle, ListChecks } from 'lucide-react';
import { Card, Skeleton } from '../ui';
import { EmptyState } from '../states/EmptyState';
import { ErrorState } from '../states/ErrorState';
import { OutputBlock, VerdictBadge } from '../editor/VerdictBadge';
import { EvaluatorTestResults } from '../submission/EvaluatorTestResults';
import { ScoreOverrideForm } from './ScoreOverrideForm';
import { EvaluationHistoryList } from './EvaluationHistoryList';
import { useEvaluatorSubmission } from '../../hooks/useSubmissions';
import { getErrorMessage } from '../../lib/apiError';
import { languageLabel, toLanguage } from '../../lib/languages';
import type { QuestionResultView } from '../../api/resultApi';

const MonacoEditor = lazy(() => import('../editor/MonacoEditor'));

const dateTime = new Intl.DateTimeFormat(undefined, { dateStyle: 'medium', timeStyle: 'short' });

interface EvaluationPanelProps {
  contestId: string;
  candidateId: string;
  question: QuestionResultView;
  published: boolean;
  isAdmin: boolean;
}

/** One question: the counted code and its test results beside the score override form. */
export const EvaluationPanel: React.FC<EvaluationPanelProps> = ({ contestId, candidateId, question, published, isAdmin }) => {
  const counted = question.countedSubmission ?? null;
  const { data, isLoading, isError, error, refetch } = useEvaluatorSubmission(counted?.id ?? null);
  const attemptsLink = `/dashboard/contests/${contestId}?tab=submissions&sc=${candidateId}&sq=${question.questionId}`;

  const judgeErrors = question.systemErrorCount > 0 && (
    <p className="flex items-start gap-2 rounded-xl border border-warning/30 bg-warning-soft px-3.5 py-2.5 text-[13px] leading-5 text-warning-text">
      <AlertTriangle className="mt-0.5 size-4 shrink-0" aria-hidden />
      <span>
        {question.systemErrorCount} submission(s) hit a judge error.{' '}
        <Link to={attemptsLink} className="font-medium underline underline-offset-2">
          Rejudge them from the Submissions tab
        </Link>
        .
      </span>
    </p>
  );

  if (!counted) {
    return (
      <div className="space-y-3">
        {judgeErrors}
        <Card>
          <EmptyState title="No scored submission" message="No scored submission — this question scores 0." />
        </Card>
      </div>
    );
  }

  const disabledReason = published
    ? isAdmin
      ? 'Results are published. Unpublish them to change scores.'
      : 'Results are published. Ask an administrator to unpublish them to change scores.'
    : undefined;

  return (
    <div className="grid gap-4 xl:grid-cols-2">
      {/* Code */}
      <section aria-label="Counted submission" className="min-w-0 space-y-3">
        <div className="flex flex-wrap items-center gap-x-3 gap-y-1.5 text-[13px] text-fg-muted">
          <VerdictBadge status={counted.status} size="md" />
          <span>{languageLabel(counted.language)}</span>
          <span className="tabular text-fg-subtle">submitted {dateTime.format(new Date(counted.submittedAt))}</span>
          <Link to={attemptsLink} className="ml-auto inline-flex items-center gap-1.5 font-medium text-primary-text underline-offset-2 hover-fine:underline">
            <ListChecks className="size-4" aria-hidden />
            All attempts ({question.submitAttempts})
          </Link>
        </div>
        {judgeErrors}
        {isLoading ? (
          <Skeleton className="h-80 w-full rounded-2xl" />
        ) : isError ? (
          <Card>
            <ErrorState message={getErrorMessage(error, 'Couldn’t load the code.')} onRetry={() => refetch()} />
          </Card>
        ) : data ? (
          <>
            <div data-theme="dark" className="h-80 overflow-hidden rounded-2xl border border-line bg-editor-bg xl:h-[28rem]">
              <Suspense fallback={<Skeleton className="h-full w-full" />}>
                <MonacoEditor
                  value={data.sourceCode}
                  language={toLanguage(data.language)?.monaco ?? 'plaintext'}
                  onChange={() => undefined}
                  readOnly
                  ariaLabel="Submitted code (read-only)"
                />
              </Suspense>
            </div>
            {data.compileOutput && <OutputBlock label="Compiler output" value={data.compileOutput} tone="danger" />}
          </>
        ) : null}
      </section>

      {/* Scoring */}
      <div className="min-w-0 space-y-4">
        <ScoreOverrideForm
          contestId={contestId}
          candidateId={candidateId}
          question={question}
          disabled={published}
          disabledReason={disabledReason}
        />
        <EvaluationHistoryList history={question.history} />
        {data && (
          <section aria-labelledby="tests-heading">
            <h3 id="tests-heading" className="mb-2 font-display text-[14px] font-semibold tracking-[-0.015em] text-fg">
              Test results <span className="tabular font-sans font-normal text-fg-subtle">({data.testCaseResults.length})</span>
            </h3>
            <EvaluatorTestResults results={data.testCaseResults} />
          </section>
        )}
      </div>
    </div>
  );
};
