import React, { useMemo } from 'react';
import { type ColumnDef } from '@tanstack/react-table';
import { DataTable } from '../DataTable';
import { Tooltip } from '../ui';
import { ResultStatusBadge } from './ResultStatusBadge';
import { formatDuration, formatScore } from '../../lib/format';
import type { LeaderboardEntry, QuestionColumn } from '../../api/resultApi';

interface LeaderboardTableProps {
  questions: QuestionColumn[];
  entries: LeaderboardEntry[];
  onOpen: (candidateId: string) => void;
  emptyMessage?: string;
}

/** The primary dot marks an adjusted score; the text alternative keeps it from being colour-only. */
const AdjustedDot: React.FC = () => (
  <>
    <span aria-hidden className="ml-1 inline-block size-1.5 rounded-full bg-primary align-middle" />
    <span className="sr-only"> (adjusted)</span>
  </>
);

/**
 * Ranked results. Rank is the server's (competition ranking, ties share a rank); sorting
 * another column reorders rows but never renumbers them.
 */
export const LeaderboardTable: React.FC<LeaderboardTableProps> = ({ questions, entries, onOpen, emptyMessage }) => {
  const columns = useMemo<ColumnDef<LeaderboardEntry, unknown>[]>(
    () => [
      {
        id: 'rank',
        header: 'Rank',
        accessorFn: (e) => e.rank ?? Number.MAX_SAFE_INTEGER,
        cell: ({ row }) => (
          <span className="tabular font-semibold text-fg">{row.original.rank != null ? row.original.rank : '–'}</span>
        ),
      },
      {
        id: 'candidate',
        header: 'Candidate',
        accessorFn: (e) => e.candidateName,
        cell: ({ row }) => {
          const e = row.original;
          return (
            <div className="min-w-0">
              <p className={e.status === 'ABSENT' ? 'truncate font-medium text-fg-subtle' : 'truncate font-medium text-fg'}>
                {e.candidateName || '—'}
              </p>
              <p className="truncate text-[12px] text-fg-subtle">{e.candidateRollNumber || e.candidateEmail}</p>
            </div>
          );
        },
      },
      ...questions.map<ColumnDef<LeaderboardEntry, unknown>>((q, i) => ({
        id: `q-${q.questionId}`,
        header: () => (
          <Tooltip content={`${q.title} · ${q.points} pts`}>
            <span tabIndex={0}>Q{i + 1}</span>
          </Tooltip>
        ),
        accessorFn: (e) => e.questionScores.find((c) => c.questionId === q.questionId)?.finalScore ?? 0,
        meta: { className: 'hidden md:table-cell' },
        cell: ({ row }) => {
          const cell = row.original.questionScores.find((c) => c.questionId === q.questionId);
          if (!cell || (!cell.attempted && !cell.adjusted)) return <span className="text-fg-subtle">—</span>;
          return (
            <span className="tabular whitespace-nowrap font-mono text-[12.5px] text-fg-muted">
              {formatScore(cell.finalScore)}
              <span className="text-fg-subtle">/{cell.maxPoints}</span>
              {cell.adjusted && <AdjustedDot />}
            </span>
          );
        },
      })),
      {
        id: 'total',
        header: 'Total',
        accessorFn: (e) => e.totalScore,
        cell: ({ row }) => (
          <span className="tabular whitespace-nowrap font-mono text-[13px] font-semibold text-fg">
            {formatScore(row.original.totalScore)}
            <span className="font-normal text-fg-subtle"> / {formatScore(row.original.maxScore)}</span>
            {row.original.adjusted && <AdjustedDot />}
          </span>
        ),
      },
      {
        id: 'time',
        header: 'Time',
        accessorFn: (e) => e.timeTakenSeconds ?? Number.MAX_SAFE_INTEGER,
        cell: ({ row }) => <span className="tabular">{formatDuration(row.original.timeTakenSeconds)}</span>,
      },
      {
        id: 'status',
        header: 'Status',
        enableSorting: false,
        cell: ({ row }) => <ResultStatusBadge status={row.original.status} reviewReasons={row.original.reviewReasons} />,
      },
    ],
    [questions],
  );

  return (
    <DataTable
      columns={columns}
      data={entries}
      pageSize={25}
      emptyMessage={emptyMessage ?? 'No results match.'}
      onRowClick={(e) => onOpen(e.candidateId)}
      rowLabel={(e) => `Open ${e.candidateName}'s result`}
    />
  );
};
