import React, { useState } from 'react';
import { Eye, EyeOff, Trash2 } from 'lucide-react';
import { Badge, IconButton } from '../ui';
import type { TestCaseAdminRecord } from '../../api/testCaseApi';
import { TestCasePreviewDialog } from './TestCasePreviewDialog';
import { DeleteTestCaseDialog } from './DeleteTestCaseDialog';

interface TestCaseTableProps {
  testCases: TestCaseAdminRecord[];
  /** Omit to render the table read-only (no delete column) */
  onDelete?: (testCaseId: string) => void;
  isDeleting: boolean;
}

/** Truncate text to maxLen chars with an ellipsis */
function truncate(text: string, maxLen: number = 80): string {
  if (text.length <= maxLen) return text;
  return text.slice(0, maxLen) + '…';
}

const th = 'px-4 py-2.5 text-left text-[12px] font-medium text-fg-subtle';
const code =
  'inline-block max-w-[220px] truncate rounded-md border border-line bg-surface-2 px-2 py-0.5 align-middle font-mono text-[12px] text-fg-muted';

export const TestCaseTable: React.FC<TestCaseTableProps> = ({ testCases, onDelete, isDeleting }) => {
  const [previewTarget, setPreviewTarget] = useState<TestCaseAdminRecord | null>(null);
  const [deleteTarget, setDeleteTarget] = useState<string | null>(null);

  const sorted = [...testCases].sort((a, b) => a.orderIndex - b.orderIndex);
  const totalWeight = testCases.reduce((sum, tc) => sum + tc.weight, 0);

  return (
    <>
      <div className="overflow-hidden rounded-2xl border border-line bg-surface">
        <div className="scroll-thin overflow-x-auto">
          <table className="w-full min-w-[560px] text-[13px]">
            <thead>
              <tr className="border-b border-line bg-surface-2/60">
                <th className={`${th} w-12`}>#</th>
                <th className={`${th} w-28`}>Type</th>
                <th className={th}>Input</th>
                <th className={th}>Expected output</th>
                <th className={`${th} w-20 text-right`}>Weight</th>
                {onDelete && (
                  <th className={`${th} w-14`}>
                    <span className="sr-only">Actions</span>
                  </th>
                )}
              </tr>
            </thead>
            <tbody>
              {sorted.map((tc, index) => (
                <tr
                  key={tc.id}
                  className="group cursor-pointer border-b border-line transition-colors duration-150 last:border-b-0 hover-fine:bg-surface-2/60"
                  onClick={() => setPreviewTarget(tc)}
                >
                  <td className="tabular px-4 py-2.5 font-mono text-[12px] text-fg-subtle">{index + 1}</td>
                  <td className="px-4 py-2.5">
                    {tc.isSample ? (
                      <Badge tone="primary" size="sm" icon={<Eye className="size-3" aria-hidden />}>
                        Sample
                      </Badge>
                    ) : (
                      <Badge tone="neutral" size="sm" icon={<EyeOff className="size-3" aria-hidden />}>
                        Hidden
                      </Badge>
                    )}
                  </td>
                  <td className="px-4 py-2.5">
                    <code className={code}>{truncate(tc.input)}</code>
                  </td>
                  <td className="px-4 py-2.5">
                    <code className={code}>{truncate(tc.expectedOutput)}</code>
                  </td>
                  <td className="tabular px-4 py-2.5 text-right font-mono text-[12px] text-fg">{tc.weight}</td>
                  {onDelete && (
                    <td className="px-4 py-1.5 text-right">
                      <IconButton
                        aria-label={`Delete test case ${index + 1}`}
                        size="sm"
                        onClick={(e) => {
                          e.stopPropagation(); // Don't open preview
                          setDeleteTarget(tc.id);
                        }}
                        className="hover-fine:bg-danger-soft hover-fine:text-danger-text"
                      >
                        <Trash2 className="size-4" />
                      </IconButton>
                    </td>
                  )}
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        <div className="flex items-center justify-between border-t border-line bg-surface-2/60 px-4 py-2.5 text-[12px] text-fg-subtle">
          <span className="tabular">
            {testCases.length} test case{testCases.length !== 1 ? 's' : ''}
          </span>
          <span className="tabular">
            Total weight <span className="font-mono text-fg">{totalWeight}</span>
          </span>
        </div>
      </div>

      <TestCasePreviewDialog isOpen={!!previewTarget} onClose={() => setPreviewTarget(null)} testCase={previewTarget} />

      <DeleteTestCaseDialog
        isOpen={!!deleteTarget}
        onClose={() => setDeleteTarget(null)}
        onConfirm={() => {
          if (deleteTarget) {
            onDelete?.(deleteTarget);
            setDeleteTarget(null);
          }
        }}
        isDeleting={isDeleting}
      />
    </>
  );
};
