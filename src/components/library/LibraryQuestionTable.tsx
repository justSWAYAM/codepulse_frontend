import React, { useMemo, useState } from 'react';
import type { ColumnDef } from '@tanstack/react-table';
import { ChevronLeft, ChevronRight, Eye, Pencil, Search, Trash2 } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import {
  useAddQuestionsToSubject,
  useDeleteLibraryQuestion,
  useLibraryQuestions,
  useSubjects,
} from '../../hooks/useLibrary';
import { useAuth } from '../../context/AuthContext';
import type { LibraryQuestionRecord, LibraryQuestionType } from '../../api/libraryApi';
import type { Difficulty } from '../DifficultyBadge';
import { DataTable } from '../DataTable';
import { DifficultyBadge } from '../DifficultyBadge';
import { Button, IconButton, Input, Select } from '../ui';
import { DeleteQuestionDialog } from '../question/DeleteQuestionDialog';
import { LibraryQuestionDetailModal } from './LibraryQuestionDetailModal';

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
  const navigate = useNavigate();
  let user: any = null;
  try {
    user = useAuth().user;
  } catch {
    user = null;
  }
  const deleteMutation = useDeleteLibraryQuestion();
  const { data: subjects = [] } = useSubjects();

  const [page, setPage] = useState(0);
  const [type, setType] = useState<LibraryQuestionType | ''>('');
  const [difficulty, setDifficulty] = useState<Difficulty | ''>('');
  const [search, setSearch] = useState('');

  const [detailQuestionId, setDetailQuestionId] = useState<string | null>(null);
  const [questionToDelete, setQuestionToDelete] = useState<{ id: string; title: string } | null>(null);

  // Bulk move state for non-selectable (standard library view)
  const [internalSelectedIds, setInternalSelectedIds] = useState<string[]>([]);
  const [targetFolderId, setTargetFolderId] = useState<string>('');

  const activeSelectedIds = selectable ? selectedIds : internalSelectedIds;
  const setActiveSelectedIds = selectable
    ? (ids: string[]) => onSelectionChange?.(ids)
    : (ids: string[]) => setInternalSelectedIds(ids);

  const addQuestionsMutation = useAddQuestionsToSubject(targetFolderId);

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

  const canManageRow = (row: LibraryQuestionRecord) => {
    if (!user) return false;
    if (user.role === 'ADMIN') return true;
    return user.fullName === row.authorName;
  };

  const pageQuestions = data?.content ?? [];

  const handleBulkMove = () => {
    if (!targetFolderId || internalSelectedIds.length === 0) return;
    addQuestionsMutation.mutate(internalSelectedIds, {
      onSuccess: () => {
        setInternalSelectedIds([]);
        setTargetFolderId('');
      },
    });
  };

  const columns = useMemo<ColumnDef<LibraryQuestionRecord, unknown>[]>(
    () => [
      {
        id: 'select',
        header: () => (
          <input
            type="checkbox"
            aria-label="Select all on this page"
            checked={
              pageQuestions.length > 0 &&
              pageQuestions.every((q) => activeSelectedIds.includes(q.id))
            }
            onChange={(e) => {
              if (e.target.checked) {
                const combined = Array.from(
                  new Set([...activeSelectedIds, ...pageQuestions.map((q) => q.id)]),
                );
                setActiveSelectedIds(combined);
              } else {
                const filtered = activeSelectedIds.filter(
                  (id) => !pageQuestions.some((q) => q.id === id),
                );
                setActiveSelectedIds(filtered);
              }
            }}
            className="size-4 accent-primary"
          />
        ),
        cell: ({ row }: { row: { original: LibraryQuestionRecord } }) => (
          <input
            type="checkbox"
            aria-label={`Select ${row.original.title}`}
            checked={activeSelectedIds.includes(row.original.id)}
            onChange={(event) => {
              const next = event.target.checked
                ? [...activeSelectedIds, row.original.id]
                : activeSelectedIds.filter((id) => id !== row.original.id);
              setActiveSelectedIds(Array.from(new Set(next)));
            }}
            className="size-4 accent-primary"
          />
        ),
        enableSorting: false,
        meta: { className: 'w-12' },
      },
      {
        accessorKey: 'title',
        header: 'Question',
        cell: ({ row }) => (
          <button
            type="button"
            onClick={() => setDetailQuestionId(row.original.id)}
            className="text-left font-medium text-fg transition-colors hover:text-primary focus-visible:outline-none focus-visible:underline"
          >
            {row.original.title}
          </button>
        ),
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
      ...(!selectable
        ? [
            {
              id: 'actions',
              header: () => <span className="sr-only">Actions</span>,
              cell: ({ row }: { row: { original: LibraryQuestionRecord } }) => {
                const canManage = canManageRow(row.original);
                return (
                  <div className="flex items-center justify-end gap-1">
                    <IconButton
                      aria-label={`View ${row.original.title}`}
                      size="sm"
                      variant="ghost"
                      onClick={() => setDetailQuestionId(row.original.id)}
                      title="View question details"
                    >
                      <Eye className="size-4" />
                    </IconButton>
                    {canManage && (
                      <>
                        <IconButton
                          aria-label={`Edit ${row.original.title}`}
                          size="sm"
                          variant="ghost"
                          onClick={() => navigate(`/dashboard/library/${row.original.id}/edit`)}
                          title="Edit question"
                        >
                          <Pencil className="size-4" />
                        </IconButton>
                        <IconButton
                          aria-label={`Delete ${row.original.title}`}
                          size="sm"
                          variant="ghost"
                          onClick={() => setQuestionToDelete({ id: row.original.id, title: row.original.title })}
                          className="text-danger hover-fine:bg-danger-soft hover-fine:text-danger-text"
                          title="Delete question"
                        >
                          <Trash2 className="size-4" />
                        </IconButton>
                      </>
                    )}
                  </div>
                );
              },
              enableSorting: false,
              meta: { className: 'w-28 text-right' },
            } satisfies ColumnDef<LibraryQuestionRecord, unknown>,
          ]
        : []),
    ],
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [activeSelectedIds, navigate, pageQuestions, selectable, user],
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

      {!selectable && internalSelectedIds.length > 0 && (
        <div className="flex flex-wrap items-center justify-between gap-3 rounded-xl border border-primary/25 bg-primary-soft p-3 text-sm">
          <div className="flex items-center gap-2">
            <span className="font-medium text-primary-text">
              {internalSelectedIds.length} question{internalSelectedIds.length === 1 ? '' : 's'} selected
            </span>
            <button
              type="button"
              onClick={() => setInternalSelectedIds([])}
              className="text-xs text-fg-subtle underline hover:text-fg"
            >
              Clear selection
            </button>
          </div>
          <div className="flex items-center gap-2">
            <Select
              aria-label="Select destination folder"
              value={targetFolderId}
              onChange={(e) => setTargetFolderId(e.target.value)}
              className="h-8 py-1 text-xs"
            >
              <option value="">Move to folder…</option>
              {subjects.map((s) => (
                <option key={s.id} value={s.id}>
                  {s.name}
                </option>
              ))}
            </Select>
            <Button
              size="sm"
              disabled={!targetFolderId}
              loading={addQuestionsMutation.isPending}
              onClick={handleBulkMove}
            >
              Move
            </Button>
          </div>
        </div>
      )}

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

      {selectable && selectedIds.length > 0 && (
        <p className="text-xs text-fg-subtle">
          {selectedIds.length} question{selectedIds.length === 1 ? '' : 's'} selected
        </p>
      )}

      <LibraryQuestionDetailModal
        questionId={detailQuestionId}
        isOpen={Boolean(detailQuestionId)}
        onClose={() => setDetailQuestionId(null)}
        onEdit={(id) => navigate(`/dashboard/library/${id}/edit`)}
        onDelete={(q) => setQuestionToDelete(q)}
      />

      <DeleteQuestionDialog
        isOpen={Boolean(questionToDelete)}
        onClose={() => setQuestionToDelete(null)}
        onConfirm={() => {
          if (!questionToDelete) return;
          deleteMutation.mutate(questionToDelete.id, {
            onSuccess: () => setQuestionToDelete(null),
          });
        }}
        title={questionToDelete?.title ?? ''}
        description={
          questionToDelete ? (
            <>
              <span className="font-medium text-fg">{questionToDelete.title}</span> will be removed from the question library. Contests that previously imported this question will keep their copies intact.
            </>
          ) : undefined
        }
        isDeleting={deleteMutation.isPending}
      />
    </div>
  );
};
