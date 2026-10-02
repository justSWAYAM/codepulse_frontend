import React, { useState } from 'react';
import {
  useReactTable,
  getCoreRowModel,
  getSortedRowModel,
  getPaginationRowModel,
  flexRender,
  type ColumnDef,
  type SortingState,
} from '@tanstack/react-table';
import { ArrowUpDown, ArrowUp, ArrowDown, ChevronLeft, ChevronRight } from 'lucide-react';
import { EmptyState } from './states/EmptyState';
import { Card, IconButton, Skeleton } from './ui';
import { cn } from '../lib/cn';

interface DataTableProps<TData> {
  columns: ColumnDef<TData, unknown>[];
  data: TData[];
  isLoading?: boolean;
  emptyMessage?: string;
  pageSize?: number;
  /** Makes rows clickable and keyboard-activatable (Enter). */
  onRowClick?: (row: TData) => void;
  /** Accessible name for a clickable row. */
  rowLabel?: (row: TData) => string;
}

/** Optional per-column class (e.g. 'hidden md:table-cell'), set via columnDef.meta.className. */
const metaClass = (meta: unknown) => (meta as { className?: string } | undefined)?.className;

const headCell = 'h-10 px-4 text-left align-middle text-[12px] font-medium whitespace-nowrap text-fg-subtle';
const bodyCell = 'h-14 px-4 align-middle text-[13px] text-fg-muted';

export function DataTable<TData>({
  columns,
  data,
  isLoading = false,
  emptyMessage = 'No data found.',
  pageSize = 10,
  onRowClick,
  rowLabel,
}: DataTableProps<TData>) {
  const [sorting, setSorting] = useState<SortingState>([]);

  const table = useReactTable({
    data,
    columns,
    state: { sorting },
    onSortingChange: setSorting,
    getCoreRowModel: getCoreRowModel(),
    getSortedRowModel: getSortedRowModel(),
    getPaginationRowModel: getPaginationRowModel(),
    initialState: {
      pagination: { pageSize },
    },
  });

  const { pageIndex, pageSize: currentPageSize } = table.getState().pagination;
  const total = data.length;
  const from = total === 0 ? 0 : pageIndex * currentPageSize + 1;
  const to = Math.min(total, (pageIndex + 1) * currentPageSize);
  const skeletonRows = Math.min(pageSize, 6);

  if (!isLoading && !total) {
    return (
      <Card>
        <EmptyState title="Nothing to show" message={emptyMessage} />
      </Card>
    );
  }

  return (
    <Card className="overflow-hidden">
      <div className="overflow-x-auto">
        <table className="w-full border-collapse text-sm" aria-busy={isLoading || undefined}>
          <thead>
            {table.getHeaderGroups().map((headerGroup) => (
              <tr key={headerGroup.id} className="border-b border-line bg-surface-2/60">
                {headerGroup.headers.map((header) => {
                  const sorted = header.column.getIsSorted();
                  const label = flexRender(header.column.columnDef.header, header.getContext());
                  return (
                    <th
                      key={header.id}
                      scope="col"
                      className={cn(headCell, metaClass(header.column.columnDef.meta))}
                      aria-sort={sorted === 'asc' ? 'ascending' : sorted === 'desc' ? 'descending' : undefined}
                    >
                      {header.isPlaceholder ? null : header.column.getCanSort() ? (
                        <button
                          type="button"
                          onClick={header.column.getToggleSortingHandler()}
                          className={cn(
                            '-mx-1.5 inline-flex h-7 cursor-pointer select-none items-center gap-1.5 rounded-md px-1.5',
                            'transition-colors duration-150 hover-fine:text-fg',
                            'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring/50',
                            sorted && 'text-fg',
                          )}
                        >
                          {label}
                          {sorted === 'asc' ? (
                            <ArrowUp className="size-3.5" aria-hidden />
                          ) : sorted === 'desc' ? (
                            <ArrowDown className="size-3.5" aria-hidden />
                          ) : (
                            <ArrowUpDown className="size-3.5 opacity-50" aria-hidden />
                          )}
                        </button>
                      ) : (
                        label
                      )}
                    </th>
                  );
                })}
              </tr>
            ))}
          </thead>
          <tbody>
            {isLoading
              ? Array.from({ length: skeletonRows }, (_, ri) => (
                  <tr key={ri} className="border-b border-line last:border-b-0">
                    {table.getVisibleLeafColumns().map((col, ci) => (
                      <td key={col.id} className={cn(bodyCell, metaClass(col.columnDef.meta))}>
                        <Skeleton className={cn('h-3.5', ci === 0 ? 'w-36' : ci % 2 ? 'w-24' : 'w-16')} />
                      </td>
                    ))}
                  </tr>
                ))
              : table.getRowModel().rows.map((row) => (
                  <tr
                    key={row.id}
                    className={cn(
                      'border-b border-line transition-colors duration-150 last:border-b-0 hover-fine:bg-surface-2/60',
                      onRowClick && 'cursor-pointer focus-visible:bg-surface-2/60 focus-visible:outline-none',
                    )}
                    {...(onRowClick && {
                      tabIndex: 0,
                      'aria-label': rowLabel?.(row.original),
                      onClick: () => onRowClick(row.original),
                      onKeyDown: (e: React.KeyboardEvent) => {
                        if (e.key === 'Enter') onRowClick(row.original);
                      },
                    })}
                  >
                    {row.getVisibleCells().map((cell) => (
                      <td key={cell.id} className={cn(bodyCell, metaClass(cell.column.columnDef.meta))}>
                        {flexRender(cell.column.columnDef.cell, cell.getContext())}
                      </td>
                    ))}
                  </tr>
                ))}
          </tbody>
        </table>
      </div>

      {!isLoading && table.getPageCount() > 1 && (
        <div className="flex items-center justify-between gap-3 border-t border-line px-4 py-2.5">
          <p className="tabular text-[12px] text-fg-subtle">
            <span className="text-fg-muted">
              {from}–{to}
            </span>{' '}
            of {total}
          </p>
          <div className="flex items-center gap-1">
            <span className="tabular mr-2 hidden text-[12px] text-fg-subtle sm:inline">
              Page {pageIndex + 1} of {table.getPageCount()}
            </span>
            <IconButton
              aria-label="Previous page"
              size="sm"
              variant="secondary"
              onClick={() => table.previousPage()}
              disabled={!table.getCanPreviousPage()}
            >
              <ChevronLeft className="size-4" />
            </IconButton>
            <IconButton
              aria-label="Next page"
              size="sm"
              variant="secondary"
              onClick={() => table.nextPage()}
              disabled={!table.getCanNextPage()}
            >
              <ChevronRight className="size-4" />
            </IconButton>
          </div>
        </div>
      )}
    </Card>
  );
}
