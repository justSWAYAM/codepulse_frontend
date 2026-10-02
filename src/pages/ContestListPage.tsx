import React, { useState } from 'react';
import { useSearchParams } from 'react-router-dom';
import { Plus, Trash2, Trophy } from 'lucide-react';
import { useContests, useDeleteContest } from '../hooks/useContests';
import { useAuth } from '../context/AuthContext';
import { ContestCard } from '../components/contest/ContestCard';
import { EmptyState } from '../components/states/EmptyState';
import { ErrorState } from '../components/states/ErrorState';
import { Button, ButtonLink, Dialog, PageHeader, Segmented, Skeleton } from '../components/ui';
import type { ContestRecord, ContestStatus } from '../api/contestApi';

type Filter = 'ALL' | ContestStatus;

const FILTERS: { label: string; value: Filter }[] = [
  { label: 'All', value: 'ALL' },
  { label: 'Live', value: 'ONGOING' },
  { label: 'Scheduled', value: 'PUBLISHED' },
  { label: 'Draft', value: 'DRAFT' },
  { label: 'Completed', value: 'COMPLETED' },
];

const ContestListPage: React.FC = () => {
  const { user } = useAuth();
  const isAdmin = user?.role === 'ADMIN';
  const isCandidate = user?.role === 'CANDIDATE';

  // Filter lives in the URL so it survives refresh and Back
  const [params, setParams] = useSearchParams();
  const raw = params.get('status') as Filter | null;
  const filter: Filter = FILTERS.some((f) => f.value === raw) ? raw! : 'ALL';
  const setFilter = (f: Filter) => setParams(f === 'ALL' ? {} : { status: f }, { replace: true });

  const { data, isLoading, isError, refetch } = useContests({ status: filter === 'ALL' ? undefined : filter });
  const contests = data?.content ?? [];
  const [contestToDelete, setContestToDelete] = useState<ContestRecord | null>(null);
  const deleteMutation = useDeleteContest();

  const confirmDelete = () => {
    if (!contestToDelete) return;
    deleteMutation.mutate(contestToDelete.id, { onSuccess: () => setContestToDelete(null) });
  };
  // Candidates never see drafts
  const filters = isCandidate ? FILTERS.filter((f) => f.value !== 'DRAFT') : FILTERS;

  return (
    <div className="space-y-6">
      <PageHeader
        title={isCandidate ? 'My contests' : 'Contests'}
        description={isCandidate ? 'Contests you’re enrolled in.' : 'Create, schedule and monitor coding contests.'}
        actions={
          isAdmin && (
            <ButtonLink to="/dashboard/contests/new" leadingIcon={<Plus className="size-4" />}>
              Create contest
            </ButtonLink>
          )
        }
      />

      <div className="overflow-x-auto [scrollbar-width:none]">
        <Segmented<Filter>
          aria-label="Filter contests by status"
          value={filter}
          onChange={setFilter}
          options={filters.map((f) => ({ value: f.value, label: f.label }))}
          className="min-w-max"
        />
      </div>

      {isLoading ? (
        <div className="grid grid-cols-1 gap-4 md:grid-cols-2 xl:grid-cols-3">
          {Array.from({ length: 6 }, (_, i) => (
            <div key={i} className="h-[188px] rounded-2xl border border-line bg-surface p-5">
              <Skeleton className="h-5 w-20 rounded-full" />
              <Skeleton className="mt-4 h-5 w-3/4" />
              <Skeleton className="mt-2 h-4 w-full" />
              <Skeleton className="mt-8 h-4 w-1/2" />
            </div>
          ))}
        </div>
      ) : isError ? (
        <div className="rounded-2xl border border-line bg-surface">
          <ErrorState message="Couldn’t load contests. Check your connection and try again." onRetry={() => refetch()} />
        </div>
      ) : contests.length === 0 ? (
        <div className="rounded-2xl border border-dashed border-line-strong bg-surface">
          <EmptyState
            icon={<Trophy className="size-5" />}
            title={
              filter !== 'ALL'
                ? 'No contests match this filter'
                : isCandidate
                ? 'You haven’t been assigned any contests yet'
                : 'No contests yet'
            }
            message={
              filter !== 'ALL'
                ? 'Try another status.'
                : isAdmin
                ? 'Create your first contest to get started.'
                : 'Ask your administrator to enrol you.'
            }
            action={
              filter !== 'ALL' ? (
                <Button variant="secondary" size="sm" onClick={() => setFilter('ALL')}>
                  Show all contests
                </Button>
              ) : isAdmin ? (
                <ButtonLink to="/dashboard/contests/new" size="sm" leadingIcon={<Plus className="size-4" />}>
                  Create contest
                </ButtonLink>
              ) : undefined
            }
          />
        </div>
      ) : (
        <div className="grid grid-cols-1 gap-4 md:grid-cols-2 xl:grid-cols-3">
          {contests.map((contest) => (
            <ContestCard
              key={contest.id}
              contest={contest}
              showCandidateCount={!isCandidate}
              onDelete={isAdmin ? setContestToDelete : undefined}
            />
          ))}
        </div>
      )}

      <Dialog
        open={!!contestToDelete}
        onOpenChange={(o) => !o && setContestToDelete(null)}
        size="sm"
        tone="danger"
        icon={<Trash2 className="size-[18px]" />}
        title="Delete contest"
        description={
          contestToDelete
            ? `“${contestToDelete.title}” and its questions, test cases and candidate assignments will be permanently deleted.`
            : undefined
        }
        dismissible={!deleteMutation.isPending}
        footer={
          <>
            <Button variant="secondary" onClick={() => setContestToDelete(null)} disabled={deleteMutation.isPending}>
              Cancel
            </Button>
            <Button variant="danger" onClick={confirmDelete} loading={deleteMutation.isPending}>
              Delete
            </Button>
          </>
        }
      />
    </div>
  );
};

export default ContestListPage;
