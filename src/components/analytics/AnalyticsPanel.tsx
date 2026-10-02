import React, { useCallback } from 'react';
import { useSearchParams } from 'react-router-dom';
import { BarChart3, Info } from 'lucide-react';
import { Card } from '../ui';
import { EmptyState } from '../states/EmptyState';
import { ErrorState } from '../states/ErrorState';
import { AnalyticsSkeleton } from './AnalyticsSkeleton';
import { AnalyticsSummaryCards } from './AnalyticsSummaryCards';
import { ScoreDistributionChart, TimeAnalysisChart } from './DistributionCharts';
import { QuestionOutcomeChart } from './QuestionOutcomeChart';
import { AttentionSummaryCard } from './AttentionSummaryCard';
import { QuestionStatsTable } from './QuestionStatsTable';
import { QuestionAnalyticsSheet } from './QuestionAnalyticsSheet';
import { useContestAnalytics, useQuestionAnalytics } from '../../hooks/useAnalytics';
import { useAuth } from '../../context/AuthContext';
import { getErrorMessage } from '../../lib/apiError';
import type { AnalyticsCoverage } from '../../api/analyticsApi';
import type { ContestDetailRecord } from '../../api/contestApi';

const ProvisionalBanner: React.FC<{ coverage: AnalyticsCoverage }> = ({ coverage }) => (
  <p className="flex items-start gap-2 rounded-xl bg-info-soft px-4 py-3 text-[13px] leading-5 text-info-text" role="status">
    <Info className="mt-0.5 size-4 shrink-0" aria-hidden />
    <span>
      <span className="font-medium">Provisional</span> — {coverage.withResult} of {coverage.totalCandidates} candidates have a
      result. {coverage.inProgress} still writing, {coverage.judging} being judged. Updates every 15 s.
    </span>
  </p>
);

/** The roadmap's AnalyticsDashboardPage, as the contest's Analytics tab. Lazy-loaded with Recharts. */
const AnalyticsPanel: React.FC<{ contest: ContestDetailRecord }> = ({ contest }) => {
  const { user } = useAuth();
  const [params, setParams] = useSearchParams();
  const overview = useContestAnalytics(contest.id);
  const questions = useQuestionAnalytics(contest.id);

  const openQuestion = (questionId: string) => {
    const next = new URLSearchParams(params);
    next.set('aq', questionId);
    setParams(next, { replace: true });
  };
  const closeQuestion = useCallback(() => {
    setParams(
      (prev) => {
        const next = new URLSearchParams(prev);
        next.delete('aq');
        return next;
      },
      { replace: true },
    );
  }, [setParams]);

  if (overview.isLoading || questions.isLoading) return <AnalyticsSkeleton />;

  const failed = (overview.isError && !overview.data) || (questions.isError && !questions.data);
  if (failed) {
    const err = overview.error ?? questions.error;
    return (
      <Card>
        <ErrorState
          message={getErrorMessage(err, 'Couldn’t load analytics.')}
          onRetry={() => {
            overview.refetch();
            questions.refetch();
          }}
        />
      </Card>
    );
  }

  const data = overview.data;
  const qs = questions.data?.questions ?? [];
  if (!data) return null;

  const selectedId = params.get('aq');
  const selectedIndex = qs.findIndex((q) => q.questionId === selectedId);

  return (
    <div className="space-y-4">
      {data.coverage.provisional && <ProvisionalBanner coverage={data.coverage} />}
      {(overview.isRefetchError || questions.isRefetchError) && (
        <p className="text-[12px] text-fg-subtle">Couldn’t refresh. Showing the last numbers loaded.</p>
      )}

      {data.coverage.withResult === 0 ? (
        <Card>
          <EmptyState icon={<BarChart3 className="size-5" />} title="No data yet" message="Analytics appear here as candidates finish." />
        </Card>
      ) : (
        <>
          <AnalyticsSummaryCards analytics={data} />
          <div className="grid gap-4 lg:grid-cols-2">
            <ScoreDistributionChart buckets={data.scoreDistribution} maxScore={data.scores.maxScore} />
            <AttentionSummaryCard contestId={contest.id} attention={data.attention} />
            <QuestionOutcomeChart questions={qs} onOpen={openQuestion} />
            <TimeAnalysisChart buckets={data.timeDistribution} durationMinutes={data.durationMinutes} noTimeCount={data.noTimeCount} />
          </div>
          <QuestionStatsTable questions={qs} onOpen={openQuestion} />
        </>
      )}

      <QuestionAnalyticsSheet
        contestId={contest.id}
        question={selectedIndex >= 0 ? qs[selectedIndex] : null}
        index={Math.max(0, selectedIndex)}
        isAdmin={user?.role === 'ADMIN'}
        onClose={closeQuestion}
      />
    </div>
  );
};

export default AnalyticsPanel;
