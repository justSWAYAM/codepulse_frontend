import React, { useMemo, useState } from 'react';
import type { ColumnDef } from '@tanstack/react-table';
import { ChevronLeft, ChevronRight, Search } from 'lucide-react';
import { useLibraryQuestions } from '../../hooks/useLibrary';
import type { LibraryQuestionRecord, LibraryQuestionType } from '../../api/libraryApi';
import type { Difficulty } from '../DifficultyBadge';
import { DataTable } from '../DataTable';
import { DifficultyBadge } from '../DifficultyBadge';
import { IconButton, Input, Select } from '../ui';

interface LibraryQuestionTableProps {
  selectedSubjectId?: string;
  selectable?: boolean;
  selectedIds?: string[];
  onSelectionChange?: (ids: string[]) => void;
}

const PAGE_SIZE = 10;

export const LibraryQuestionTable: React.FC<LibraryQuestionTableProps> = ({
  selectedSubjectId,
  selectable = false,
  selectedIds = [],
  onSelectionChange,
}) => {
  const [page, setPage] = useState(0);
  const [type, setType] = useState<LibraryQuestionType | ''>('');
  const [difficulty, setDifficulty] = useState<Difficulty | ''>('');
  const [search, setSearch] = useState('');
  const params = {
    subjectId: selectedSubjectId,
    type: type || undefined,
    difficulty: difficulty || undefined,
    q: search.trim() || undefined,
    page,
    size: PAGE_SIZE,
  };
  const { data, isLoading, isError } = useLibraryQuestions(params);

  const resetPage = () => setPage(0);

  const columns = useMemo<ColumnDef<LibraryQuestionRecord, unknown>[]>(
    () => [
      ...(selectable
        ? [
            {
              id: 'select',
              header: () => <span className="sr-only">Select</span>,
              cell: ({ row }: { row: { original: LibraryQuestionRecord } }) => (
                <input
                  type="checkbox"
                  aria-label={`Select ${row.original.title}`}
                  checked={selectedIds.includes(row.original.id)}
                  onChange={(event) => {
                    const next = event.target.checked
                      ? [...selectedIds, row.original.id]
                      : selectedIds.filter((selectedId) => selectedId !== row.original.id);
                    onSelectionChange?.(Array.from(new Set(next)));
                  }}
                  className="size-4 accent-primary"
                />
              ),
              enableSorting: false,
              meta: { className: 'w-12' },
            } satisfies ColumnDef<LibraryQuestionRecord, unknown>,
          ]
        : []),
      {
        accessorKey: 'title',
        header: 'Question',
        cell: ({ row }) => <span className="font-medium text-fg">{row.original.title}</span>,
      },
      {
        accessorKey: 'questionType',
        header: 'Type',
        cell: ({ row }) => <span className="text-xs text-fg-muted">{row.original.questionType}</span>,
      },
      {
        accessorKey: 'difficulty',
        header: 'Difficulty',
        cell: ({ row }) => <DifficultyBadge difficulty={row.original.difficulty} />,
      },
      {
        accessorKey: 'subjectName',
        header: 'Subject',
        cell: ({ row }) => <span>{row.original.subjectName || 'Unfiled'}</span>,
        meta: { className: 'hidden lg:table-cell' },
      },
      {
        accessorKey: 'authorName',
        header: 'Author',
        meta: { className: 'hidden md:table-cell' },
      },
    ],
    [onSelectionChange, selectable, selectedIds],
  );

  const totalPages = data?.totalPages ?? 0;
  const hasPrevious = page > 0;
  const hasNext = page + 1 < totalPages;

  return (
    <div className="space-y-4">
      <div className="grid gap-3 sm:grid-cols-[minmax(0,1fr)_150px_150px]">
        <label className="relative block">
          <span className="sr-only">Search library questions</span>
          <Search className="pointer-events-none absolute left-3 top-1/2 size-4 -translate-y-1/2 text-fg-subtle" aria-hidden />
          <Input
            value={search}
            onChange={(event) => {
              setSearch(event.target.value);
              resetPage();
            }}
            placeholder="Search questions"
            className="pl-9"
          />
        </label>
        <Select
          aria-label="Filter by type"
          value={type}
          onChange={(event) => {
            setType(event.target.value as LibraryQuestionType | '');
            resetPage();
          }}
        >
          <option value="">All types</option>
          <option value="DSA">DSA</option>
          <option value="SQL">SQL</option>
          <option value="MCQ">MCQ</option>
          <option value="THEORY">Theory</option>
        </Select>
        <Select
          aria-label="Filter by difficulty"
          value={difficulty}
          onChange={(event) => {
            setDifficulty(event.target.value as Difficulty | '');
            resetPage();
          }}
        >
          <option value="">All difficulty</option>
          <option value="EASY">Easy</option>
          <option value="MEDIUM">Medium</option>
          <option value="HARD">Hard</option>
        </Select>
      </div>

      {isError ? (
        <div className="rounded-2xl border border-danger/25 bg-danger-soft px-4 py-3 text-sm text-danger-text">
          The question library could not be loaded. Try again in a moment.
        </div>
      ) : (
        <DataTable columns={columns} data={data?.content ?? []} isLoading={isLoading} emptyMessage="No library questions match these filters." />
      )}

      {!isLoading && totalPages > 1 && (
        <div className="flex items-center justify-between gap-3">
          <p className="tabular text-xs text-fg-subtle">
            Page <span className="text-fg-muted">{page + 1}</span> of <span className="text-fg-muted">{totalPages}</span>
          </p>
          <div className="flex items-center gap-1">
            <IconButton aria-label="Previous library page" size="sm" variant="secondary" disabled={!hasPrevious} onClick={() => setPage((value) => value - 1)}>
              <ChevronLeft className="size-4" />
            </IconButton>
            <IconButton aria-label="Next library page" size="sm" variant="secondary" disabled={!hasNext} onClick={() => setPage((value) => value + 1)}>
              <ChevronRight className="size-4" />
            </IconButton>
          </div>
        </div>
      )}

      {selectable && selectedIds.length > 0 && <p className="text-xs text-fg-subtle">{selectedIds.length} question{selectedIds.length === 1 ? '' : 's'} selected</p>}
    </div>
  );
};