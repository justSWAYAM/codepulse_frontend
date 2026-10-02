import React from 'react';
import { useParams, useSearchParams } from 'react-router-dom';
import { AlertTriangle, ArrowLeft } from 'lucide-react';
import { ButtonLink, Card, Segmented, Skeleton } from '../components/ui';
import { EmptyState } from '../components/states/EmptyState';
import { ErrorState } from '../components/states/ErrorState';
import { EvaluationPanel } from '../components/result/EvaluationPanel';
import { ResultStatusBadge } from '../components/result/ResultStatusBadge';
import { useCandidateResult } from '../hooks/useResults';
import { useContest } from '../hooks/useContests';
import { useAuth } from '../context/AuthContext';
import { getErrorMessage } from '../lib/apiError';
import { formatDuration, formatScore } from '../lib/format';
import type { QuestionResultView } from '../api/resultApi';

const dateTime = new Intl.DateTimeFormat(undefined, { dateStyle: 'medium', timeStyle: 'short' });

/** Outdated override first, then judge errors, then the first question. */
const firstNeedingAttention = (questions: QuestionResultView[]) =>
  questions.find((q) => q.overrideOutdated) ?? questions.find((q) => q.systemErrorCount > 0) ?? questions[0];

/** Staff grading screen for one candidate: per-question code, tests and score override. */
const EvaluationPage: React.FC = () => {
  const { contestId = '', candidateId = '' } = useParams<{ contestId: string; candidateId: string }>();
  const [params, setParams] = useSearchParams();
  const { user } = useAuth();
  const { data: contest } = useContest(contestId);
  const { data: result, isLoading, isError, error, refetch } = useCandidateResult(contestId, candidateId);

  const backLink = (
    <ButtonLink to={`/dashboard/contests/${contestId}?tab=results`} variant="ghost" size="sm" leadingIcon={<ArrowLeft className="size-4" />}>
      Results
    </ButtonLink>
  );

  if (isLoading) {
    return (
      <div className="mx-auto max-w-7xl space-y-4">
        <Skeleton className="h-24 w-full rounded-2xl" />
        <Skeleton className="h-96 w-full rounded-2xl" />
      </div>
    );
  }

  if (isError || !result) {
    const notFound = (error as { response?: { status?: number } })?.response?.status === 404;
    return (
      <div className="mx-auto max-w-3xl space-y-4">
        {backLink}
        <Card>
          {notFound ? (
            <EmptyState
              icon={<AlertTriangle className="size-5" />}
              title="No result yet"
              message="No result yet. This candidate may still be taking the exam or being judged."
            />
          ) : (
            <ErrorState message={getErrorMessage(error, 'Couldn’t load this result.')} onRetry={() => refetch()} />
          )}
        </Card>
      </div>
    );
  }

  const published = result.published || !!contest?.resultsPublished;
  const requested = params.get('q');
  const question = result.questions.find((q) => q.questionId === requested) ?? firstNeedingAttention(result.questions);
  const selectQuestion = (id: string) => {
    const next = new URLSearchParams(params);
    next.set('q', id);
    setParams(next, { replace: true });
  };

  return (
    <div className="mx-auto max-w-7xl space-y-5">
      <div>
        {backLink}
        <div className="mt-2 flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
          <div className="min-w-0">
            <div className="flex flex-wrap items-center gap-2">
              <h1 className="font-display text-2xl font-semibold tracking-[-0.03em] text-fg">{result.candidateName}</h1>
              <ResultStatusBadge status={result.status} reviewReasons={result.reviewReasons} showScored />
            </div>
            <p className="mt-1 text-[13px] text-fg-subtle">
              {[result.candidateRollNumber, result.candidateEmail, contest?.title].filter(Boolean).join(' · ')}
            </p>
          </div>
          <div className="text-left sm:text-right">
            <p className="tabular font-display text-[22px] font-semibold text-fg">
              {formatScore(result.totalScore)}
              <span className="text-[15px] font-normal text-fg-subtle"> / {formatScore(result.maxScore)}</span>
            </p>
            <p className="tabular text-[13px] text-fg-muted">
              {result.status === 'ABSENT' ? 'Absent' : result.rank != null ? `Rank ${result.rank} of ${result.rankedCount}` : 'Unranked'}
            </p>
          </div>
        </div>

        {result.sessionId && (
          <dl className="mt-4 grid grid-cols-2 gap-x-6 gap-y-2 rounded-2xl border border-line bg-surface px-4 py-3 text-[13px] sm:grid-cols-4">
            <div>
              <dt className="text-fg-subtle">Started</dt>
              <dd className="tabular text-fg">{result.startedAt ? dateTime.format(new Date(result.startedAt)) : '—'}</dd>
            </div>
            <div>
              <dt className="text-fg-subtle">Submitted</dt>
              <dd className="tabular text-fg">
                {result.submittedAt ? dateTime.format(new Date(result.submittedAt)) : '—'}
                {result.sessionStatus === 'AUTO_SUBMITTED' && <span className="text-fg-subtle"> (time ran out)</span>}
              </dd>
            </div>
            <div>
              <dt className="text-fg-subtle">Time taken</dt>
              <dd className="tabular text-fg">{formatDuration(result.timeTakenSeconds)}</dd>
            </div>
            <div>
              <dt className="text-fg-subtle">Automatic score</dt>
              <dd className="tabular text-fg">{formatScore(result.autoScore)}</dd>
            </div>
          </dl>
        )}
      </div>

      {result.status === 'ABSENT' || !question ? (
        <Card>
          <EmptyState title="Didn’t take part" message="This candidate didn’t take the exam." />
        </Card>
      ) : (
        <>
          <Segmented
            aria-label="Question"
            value={question.questionId}
            onChange={selectQuestion}
            className="max-w-full overflow-x-auto"
            options={result.questions.map((q, i) => ({
              value: q.questionId,
              label: (
                <span className="tabular inline-flex items-center gap-1.5 whitespace-nowrap">
                  Q{i + 1}
                  <span className="font-normal text-fg-subtle">
                    {formatScore(q.finalScore)}/{q.maxPoints}
                  </span>
                  {(q.activeOverride || q.overrideOutdated) && (
                    <>
                      <span aria-hidden className={q.overrideOutdated ? 'size-1.5 rounded-full bg-warning' : 'size-1.5 rounded-full bg-primary'} />
                      <span className="sr-only">{q.overrideOutdated ? ' (review adjustment)' : ' (adjusted)'}</span>
                    </>
                  )}
                </span>
              ),
            }))}
          />
          <h2 className="font-display text-[17px] font-semibold tracking-[-0.015em] text-fg">{question.title}</h2>
          <EvaluationPanel
            key={question.questionId}
            contestId={contestId}
            candidateId={candidateId}
            question={question}
            published={published}
            isAdmin={user?.role === 'ADMIN'}
          />
        </>
      )}
    </div>
  );
};

export default EvaluationPage;
