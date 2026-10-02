import React, { useMemo } from 'react';
import { type ColumnDef } from '@tanstack/react-table';
import { DataTable } from '../DataTable';
import { DifficultyCheck } from './DifficultyCheck';
import { formatDuration, formatScore } from '../../lib/format';
import { formatPercent } from '../../lib/analytics';
import type { QuestionStats } from '../../api/analyticsApi';

const share = (part: number, whole: number) => (whole > 0 ? part / whole : null);

/** Per-question numbers; a row opens the drill-down sheet. */
export const QuestionStatsTable: React.FC<{ questions: QuestionStats[]; onOpen: (questionId: string) => void }> = ({
  questions,
  onOpen,
}) => {
  const columns = useMemo<ColumnDef<QuestionStats, unknown>[]>(
    () => [
      {
        id: 'question',
        header: 'Question',
        accessorFn: (q) => q.orderIndex,
        cell: ({ row }) => (
          <div className="min-w-0">
            <p className="truncate font-medium text-fg">
              <span className="tabular text-fg-subtle">Q{row.index + 1}</span> {row.original.title}
            </p>
            <p className="tabular text-[12px] text-fg-subtle">{row.original.points} pts</p>
          </div>
        ),
      },
      {
        id: 'difficulty',
        header: 'Difficulty',
        enableSorting: false,
        cell: ({ row }) => <DifficultyCheck question={row.original} />,
      },
      {
        id: 'average',
        header: 'Avg score',
        accessorFn: (q) => q.averageRatio ?? -1,
        cell: ({ row }) => (
          <span className="tabular whitespace-nowrap font-mono text-[12.5px]">
            {formatScore(row.original.averageScore)}
            <span className="text-fg-subtle">/{row.original.points}</span>
          </span>
        ),
      },
      {
        id: 'full',
        header: 'Full marks',
        accessorFn: (q) => share(q.fullMarks, q.participants) ?? -1,
        cell: ({ row }) => <span className="tabular">{formatPercent(share(row.original.fullMarks, row.original.participants))}</span>,
      },
      {
        id: 'attempted',
        header: 'Attempted',
        accessorFn: (q) => share(q.attempted, q.participants) ?? -1,
        meta: { className: 'hidden md:table-cell' },
        cell: ({ row }) => <span className="tabular">{formatPercent(share(row.original.attempted, row.original.participants))}</span>,
      },
      {
        id: 'attempts',
        header: 'Attempts / candidate',
        accessorFn: (q) => q.attemptsPerCandidate ?? -1,
        meta: { className: 'hidden md:table-cell' },
        cell: ({ row }) => <span className="tabular">{row.original.attemptsPerCandidate != null ? formatScore(row.original.attemptsPerCandidate) : '—'}</span>,
      },
      {
        id: 'time',
        header: 'Median time to AC',
        accessorFn: (q) => q.medianSecondsToAccepted ?? Number.MAX_SAFE_INTEGER,
        meta: { className: 'hidden lg:table-cell' },
        cell: ({ row }) => (
          <span className="tabular">
            {row.original.medianSecondsToAccepted != null ? formatDuration(row.original.medianSecondsToAccepted) : '—'}
          </span>
        ),
      },
      {
        id: 'adjusted',
        header: 'Adjusted',
        accessorFn: (q) => q.adjusted,
        meta: { className: 'hidden md:table-cell' },
        cell: ({ row }) => <span className="tabular">{row.original.adjusted}</span>,
      },
    ],
    [],
  );

  return (
    <DataTable
      columns={columns}
      data={questions}
      pageSize={50}
      emptyMessage="This contest has no questions."
      onRowClick={(q) => onOpen(q.questionId)}
      rowLabel={(q) => `Open analytics for ${q.title}`}
    />
  );
};
