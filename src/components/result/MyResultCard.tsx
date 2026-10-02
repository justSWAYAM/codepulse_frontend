import React from 'react';
import { ArrowRight, Trophy } from 'lucide-react';
import { ButtonLink, Spinner } from '../ui';
import { useMyResult } from '../../hooks/useResults';
import { formatScore } from '../../lib/format';

/**
 * Candidate's score summary on the contest page. Only mounted once the contest says
 * results are published, so it never asks early.
 */
export const MyResultCard: React.FC<{ contestId: string }> = ({ contestId }) => {
  const { data, isLoading } = useMyResult(contestId);

  if (isLoading) {
    return (
      <section className="rounded-2xl border border-line bg-surface p-5 shadow-card">
        <p className="flex items-center gap-2 text-sm text-fg-muted">
          <Spinner size={14} /> Loading your result…
        </p>
      </section>
    );
  }

  if (!data?.published) {
    return (
      <section className="rounded-2xl border border-line bg-surface p-5 shadow-card">
        <p className="text-sm text-fg-muted">Results appear here once the administrator publishes them.</p>
      </section>
    );
  }

  if (data.status === 'ABSENT') {
    return (
      <section className="rounded-2xl border border-line bg-surface p-5 shadow-card">
        <p className="text-sm text-fg-muted">You didn’t take this exam, so there is no score.</p>
      </section>
    );
  }

  return (
    <section className="rounded-2xl border border-success/25 bg-surface p-5 shadow-card sm:p-6" aria-label="Your result">
      <div className="flex items-start gap-4">
        <div className="flex size-10 shrink-0 items-center justify-center rounded-xl bg-success-soft text-success-text">
          <Trophy className="size-5" />
        </div>
        <div className="min-w-0 flex-1">
          <h3 className="font-display text-[15px] font-semibold tracking-[-0.015em] text-fg">Your result</h3>
          <p className="tabular mt-1 font-display text-[26px] font-semibold leading-8 text-fg">
            {formatScore(data.totalScore)}
            <span className="text-[15px] font-normal text-fg-subtle"> / {formatScore(data.maxScore)}</span>
          </p>
          {data.rank != null && (
            <p className="tabular text-[13px] text-fg-muted">
              Rank {data.rank} of {data.rankedCount}
            </p>
          )}
          {data.adjusted && <p className="mt-1 text-[12px] text-fg-subtle">Some scores were adjusted by an evaluator.</p>}
          <ButtonLink
            to={`/dashboard/contests/${contestId}/result`}
            size="sm"
            variant="secondary"
            className="mt-4"
            trailingIcon={<ArrowRight className="size-3.5" />}
          >
            View breakdown
          </ButtonLink>
        </div>
      </div>
    </section>
  );
};
