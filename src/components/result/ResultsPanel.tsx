import React, { useMemo } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { Search, Trophy } from 'lucide-react';
import { Card, Input, Segmented, Skeleton } from '../ui';
import { EmptyState } from '../states/EmptyState';
import { ErrorState } from '../states/ErrorState';
import { LeaderboardTable } from './LeaderboardTable';
import { ResultsStatusCard } from './ResultsStatusCard';
import { useResults } from '../../hooks/useResults';
import { useAuth } from '../../context/AuthContext';
import { getErrorMessage } from '../../lib/apiError';
import type { ContestDetailRecord } from '../../api/contestApi';
import { RESULT_FILTERS as FILTERS, filterEntries, type ResultFilter } from '../../lib/results';

/** Staff Results tab: publish state and actions on top, the leaderboard below. */
export const ResultsPanel: React.FC<{ contest: ContestDetailRecord }> = ({ contest }) => {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [params, setParams] = useSearchParams();
  const { data, isLoading, isError, error, refetch, isRefetchError } = useResults(contest.id);

  // Search and filter live in the URL, next to ?tab=results
  const query = params.get('rq') ?? '';
  const rawFilter = params.get('rf') as ResultFilter | null;
  const filter: ResultFilter = rawFilter && FILTERS.some((f) => f.value === rawFilter) ? rawFilter : 'all';
  const setParam = (key: string, value: string, empty: string) => {
    const next = new URLSearchParams(params);
    if (value && value !== empty) next.set(key, value);
    else next.delete(key);
    setParams(next, { replace: true });
  };

  const rows = useMemo(() => (data ? filterEntries(data.entries, query, filter) : []), [data, query, filter]);

  if (isLoading) {
    return (
      <div className="space-y-4">
        <Skeleton className="h-36 w-full rounded-2xl" />
        <Skeleton className="h-64 w-full rounded-2xl" />
      </div>
    );
  }

  if (isError && !data) {
    return (
      <Card>
        <ErrorState message={getErrorMessage(error, 'Couldn’t load results.')} onRetry={() => refetch()} />
      </Card>
    );
  }

  if (!data) return null;

  return (
    <div className="space-y-4">
      <ResultsStatusCard leaderboard={data} isAdmin={user?.role === 'ADMIN'} />

      {isRefetchError && <p className="text-[12px] text-fg-subtle">Couldn’t refresh. Showing the last results loaded.</p>}

      {data.entries.length === 0 ? (
        <Card>
          <EmptyState icon={<Trophy className="size-5" />} title="No results yet" message="Results appear here as candidates finish." />
        </Card>
      ) : (
        <>
          <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
            <div className="relative sm:w-72">
              <Search className="pointer-events-none absolute left-3 top-1/2 size-4 -translate-y-1/2 text-fg-subtle" aria-hidden />
              <Input
                aria-label="Search candidates"
                placeholder="Search name, roll number or email"
                value={query}
                onChange={(e) => setParam('rq', e.target.value, '')}
                className="pl-9"
              />
            </div>
            <Segmented
              aria-label="Filter results"
              value={filter}
              onChange={(v) => setParam('rf', v, 'all')}
              options={FILTERS}
              className="overflow-x-auto"
            />
          </div>
          <LeaderboardTable
            questions={data.questions}
            entries={rows}
            onOpen={(candidateId) => navigate(`/dashboard/contests/${contest.id}/results/${candidateId}`)}
          />
        </>
      )}
    </div>
  );
};
