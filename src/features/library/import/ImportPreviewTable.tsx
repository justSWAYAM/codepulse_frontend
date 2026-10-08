import { useMemo } from 'react';
import type { ColumnDef } from '@tanstack/react-table';
import { Badge } from '../../../components/ui';
import { DifficultyBadge, type Difficulty } from '../../../components/DifficultyBadge';
import { DataTable } from '../../../components/DataTable';
import type { ImportRowPreview } from './types';

export function ImportPreviewTable({ rows }: { rows: ImportRowPreview[] }) {
  const columns = useMemo<ColumnDef<ImportRowPreview, unknown>[]>(
    () => [
      {
        accessorKey: 'rowNumber',
        header: '#',
        meta: { className: 'w-12 text-center' },
      },
      {
        id: 'status',
        header: 'Status',
        cell: ({ row }) =>
          row.original.valid ? (
            <Badge tone="success" size="sm">
              OK
            </Badge>
          ) : (
            <Badge tone="danger" size="sm">
              Error
            </Badge>
          ),
        meta: { className: 'w-20' },
      },
      {
        accessorKey: 'title',
        header: 'Title',
        cell: ({ row }) => <span className="font-medium text-fg">{row.original.title ?? '—'}</span>,
      },
      {
        accessorKey: 'difficulty',
        header: 'Difficulty',
        cell: ({ row }) =>
          row.original.difficulty ? (
            <DifficultyBadge difficulty={row.original.difficulty as Difficulty} />
          ) : (
            '—'
          ),
        meta: { className: 'w-24' },
      },
      {
        accessorKey: 'points',
        header: 'Points',
        cell: ({ row }) =>
          row.original.points !== null && row.original.points !== undefined
            ? `${row.original.points}`
            : '—',
        meta: { className: 'w-20' },
      },
      {
        accessorKey: 'detail',
        header: 'Details',
        cell: ({ row }) => <span className="text-xs text-fg-muted">{row.original.detail || '—'}</span>,
      },
      {
        id: 'errors',
        header: 'Problems',
        cell: ({ row }) =>
          row.original.errors.length === 0 ? null : (
            <ul className="list-disc pl-4 text-xs text-danger-text space-y-0.5">
              {row.original.errors.map((e, i) => (
                <li key={i}>{e}</li>
              ))}
            </ul>
          ),
      },
    ],
    [],
  );

  return <DataTable columns={columns} data={rows} pageSize={10} />;
}
