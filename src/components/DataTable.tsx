import { useState } from 'react';
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
import { LoadingState } from './states/LoadingState';
import { EmptyState } from './states/EmptyState';

interface DataTableProps<TData> {
  columns: ColumnDef<TData, unknown>[];
  data: TData[];
  isLoading?: boolean;
  emptyMessage?: string;
  pageSize?: number;
}

export function DataTable<TData>({
  columns,
  data,
  isLoading = false,
  emptyMessage = 'No data found.',
  pageSize = 10,
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

  if (isLoading) {
    return <LoadingState message="Loading data..." />;
  }

  if (!data.length) {
    return <EmptyState message={emptyMessage} />;
  }

  return (
    <div className="w-full">
      {/* Table */}
      <div className="rounded-xl border border-line bg-surface">
        <div className="w-full">
          <table className="w-full text-sm">
            <thead>
              {table.getHeaderGroups().map((headerGroup) => (
                <tr key={headerGroup.id} className="border-b border-line bg-canvas/60">
                  {headerGroup.headers.map((header) => {
                    const sorted = header.column.getIsSorted();
                    return (
                      <th
                        key={header.id}
                        className="px-4 py-3 text-left text-xs font-semibold text-fg-muted uppercase tracking-wider"
                      >
                        {header.isPlaceholder ? null : header.column.getCanSort() ? (
                          <button
                            onClick={header.column.getToggleSortingHandler()}
                            className="inline-flex items-center gap-1.5 hover:text-fg transition-colors cursor-pointer select-none"
                          >
                            {flexRender(header.column.columnDef.header, header.getContext())}
                            {sorted === 'asc' ? (
                              <ArrowUp className="w-3.5 h-3.5" />
                            ) : sorted === 'desc' ? (
                              <ArrowDown className="w-3.5 h-3.5" />
                            ) : (
                              <ArrowUpDown className="w-3.5 h-3.5 opacity-40" />
                            )}
                          </button>
                        ) : (
                          flexRender(header.column.columnDef.header, header.getContext())
                        )}
                      </th>
                    );
                  })}
                </tr>
              ))}
            </thead>
            <tbody>
              {table.getRowModel().rows.map((row) => (
                <tr
                  key={row.id}
                  className="border-b border-line last:border-b-0 hover:bg-primary/[0.03] transition-colors"
                >
                  {row.getVisibleCells().map((cell) => (
                    <td key={cell.id} className="px-4 py-3.5 text-fg-muted">
                      {flexRender(cell.column.columnDef.cell, cell.getContext())}
                    </td>
                  ))}
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Pagination */}
      {table.getPageCount() > 1 && (
        <div className="flex items-center justify-between mt-4 px-1">
          <p className="text-xs text-fg-subtle">
            Page {table.getState().pagination.pageIndex + 1} of {table.getPageCount()} ·{' '}
            {data.length} total
          </p>
          <div className="flex items-center gap-1">
            <button
              onClick={() => table.previousPage()}
              disabled={!table.getCanPreviousPage()}
              className="p-1.5 rounded-lg text-fg-subtle hover:text-fg hover:bg-fg/5 disabled:opacity-30 disabled:cursor-not-allowed transition-colors cursor-pointer"
            >
              <ChevronLeft className="w-4 h-4" />
            </button>
            {Array.from({ length: table.getPageCount() }, (_, i) => (
              <button
                key={i}
                onClick={() => table.setPageIndex(i)}
                className={`min-w-[32px] h-8 rounded-lg text-xs font-medium transition-colors cursor-pointer ${
                  table.getState().pagination.pageIndex === i
                    ? 'bg-primary text-white'
                    : 'text-fg-muted hover:text-fg hover:bg-fg/5'
                }`}
              >
                {i + 1}
              </button>
            ))}
            <button
              onClick={() => table.nextPage()}
              disabled={!table.getCanNextPage()}
              className="p-1.5 rounded-lg text-fg-subtle hover:text-fg hover:bg-fg/5 disabled:opacity-30 disabled:cursor-not-allowed transition-colors cursor-pointer"
            >
              <ChevronRight className="w-4 h-4" />
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
