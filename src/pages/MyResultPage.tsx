import React from 'react';
import { useParams } from 'react-router-dom';
import { ArrowLeft, Clock, Trophy } from 'lucide-react';
import { ButtonLink, Card, Skeleton } from '../components/ui';
import { EmptyState } from '../components/states/EmptyState';
import { ErrorState } from '../components/states/ErrorState';
import { MyQuestionScoreList } from '../components/result/MyQuestionScoreList';
import { useMyResult } from '../hooks/useResults';
import { getErrorMessage } from '../lib/apiError';
import { formatScore } from '../lib/format';

const dateTime = new Intl.DateTimeFormat(undefined, { dateStyle: 'medium', timeStyle: 'short' });

/** Candidate's own result. "Not published yet" is a calm state, never an error. */
const MyResultPage: React.FC = () => {
  const { contestId = '' } = useParams<{ contestId: string }>();
  const { data, isLoading, isError, error, refetch } = useMyResult(contestId);

  const back = (
    <ButtonLink to={`/dashboard/contests/${contestId}`} variant="ghost" size="sm" leadingIcon={<ArrowLeft className="size-4" />}>
      Back to contest
    </ButtonLink>
  );

  if (isLoading) {
    return (
      <div className="mx-auto max-w-3xl space-y-4">
        <Skeleton className="h-32 w-full rounded-2xl" />
        <Skeleton className="h-48 w-full rounded-2xl" />
      </div>
    );
  }

  if (isError || !data) {
    const notFound = (error as { response?: { status?: number } })?.response?.status === 404;
    return (
      <div className="mx-auto max-w-3xl space-y-4">
        {back}
        <Card>
          {notFound ? (
            <EmptyState title="No access" message="You don’t have access to this contest." />
          ) : (
            <ErrorState message={getErrorMessage(error, 'Couldn’t load your result.')} onRetry={() => refetch()} />
          )}
        </Card>
      </div>
    );
  }

  if (!data.published) {
    return (
      <div className="mx-auto max-w-3xl space-y-4">
        {back}
        <Card>
          <EmptyState
            icon={<Clock className="size-5" />}
            title={data.contestTitle}
            message="Results for this contest haven’t been published yet."
          />
        </Card>
      </div>
    );
  }

  return (
    <div className="mx-auto max-w-3xl space-y-5">
      {back}
      <Card className="p-5 sm:p-6">
        <p className="font-mono text-[11px] font-medium uppercase tracking-[0.08em] text-fg-subtle">{data.contestTitle}</p>
        {data.status === 'ABSENT' ? (
          <p className="mt-3 text-sm text-fg-muted">You didn’t take this exam, so there is no score.</p>
        ) : (
          <div className="mt-3 flex items-start gap-4">
            <div className="flex size-11 shrink-0 items-center justify-center rounded-xl bg-success-soft text-success-text">
              <Trophy className="size-5" />
            </div>
            <div>
              <p className="tabular font-display text-[30px] font-semibold leading-9 text-fg">
                {formatScore(data.totalScore)}
                <span className="text-[16px] font-normal text-fg-subtle"> / {formatScore(data.maxScore)}</span>
              </p>
              {data.rank != null && (
                <p className="tabular text-sm text-fg-muted">
                  Rank {data.rank} of {data.rankedCount}
                </p>
              )}
              {data.publishedAt && (
                <p className="mt-1 text-[12px] text-fg-subtle">Published {dateTime.format(new Date(data.publishedAt))}</p>
              )}
              {data.adjusted && <p className="mt-1 text-[12px] text-fg-subtle">Some scores were adjusted by an evaluator.</p>}
            </div>
          </div>
        )}
      </Card>
      {data.status !== 'ABSENT' && <MyQuestionScoreList questions={data.questions ?? []} />}
    </div>
  );
};

export default MyResultPage;
