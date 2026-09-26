import React, { useState } from 'react';
import { Trash2 } from 'lucide-react';
import type { TestCaseAdminRecord } from '../../api/testCaseApi';
import { TestCasePreviewDialog } from './TestCasePreviewDialog';
import { DeleteTestCaseDialog } from './DeleteTestCaseDialog';

interface TestCaseTableProps {
  testCases: TestCaseAdminRecord[];
  onDelete: (testCaseId: string) => void;
  isDeleting: boolean;
}

/** Truncate text to maxLen chars with an ellipsis */
function truncate(text: string, maxLen: number = 80): string {
  if (text.length <= maxLen) return text;
  return text.slice(0, maxLen) + '…';
}

export const TestCaseTable: React.FC<TestCaseTableProps> = ({
  testCases,
  onDelete,
  isDeleting,
}) => {
  const [previewTarget, setPreviewTarget] = useState<TestCaseAdminRecord | null>(null);
  const [deleteTarget, setDeleteTarget] = useState<string | null>(null);

  const sorted = [...testCases].sort((a, b) => a.orderIndex - b.orderIndex);
  const totalWeight = testCases.reduce((sum, tc) => sum + tc.weight, 0);

  return (
    <>
      <div className="rounded-2xl border border-hairline overflow-hidden bg-surface">
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="bg-background/60 border-b border-hairline">
                <th className="px-4 py-3 text-left text-xs font-semibold text-ink/50 uppercase tracking-wider w-12">
                  #
                </th>
                <th className="px-4 py-3 text-left text-xs font-semibold text-ink/50 uppercase tracking-wider w-24">
                  Type
                </th>
                <th className="px-4 py-3 text-left text-xs font-semibold text-ink/50 uppercase tracking-wider">
                  Input
                </th>
                <th className="px-4 py-3 text-left text-xs font-semibold text-ink/50 uppercase tracking-wider">
                  Expected Output
                </th>
                <th className="px-4 py-3 text-right text-xs font-semibold text-ink/50 uppercase tracking-wider w-20">
                  Weight
                </th>
                <th className="px-4 py-3 text-right text-xs font-semibold text-ink/50 uppercase tracking-wider w-16">
                  
                </th>
              </tr>
            </thead>
            <tbody>
              {sorted.map((tc, index) => (
                <tr
                  key={tc.id}
                  className="border-b border-hairline/60 last:border-b-0 hover:bg-ink/[0.02] transition-colors cursor-pointer group"
                  onClick={() => setPreviewTarget(tc)}
                >
                  <td className="px-4 py-3 font-mono text-xs text-ink/40">
                    {index + 1}
                  </td>
                  <td className="px-4 py-3">
                    <span
                      className={`inline-flex px-2.5 py-0.5 rounded-full text-[11px] font-semibold ${
                        tc.isSample
                          ? 'bg-accent-compile/10 text-accent-compile'
                          : 'bg-ink/[0.03] text-ink/40 border border-hairline'
                      }`}
                    >
                      {tc.isSample ? 'Sample' : 'Hidden'}
                    </span>
                  </td>
                  <td className="px-4 py-3">
                    <code className="font-mono text-xs text-ink/70 bg-background border border-hairline rounded-md px-2 py-1 inline-block max-w-[200px] truncate">
                      {truncate(tc.input)}
                    </code>
                  </td>
                  <td className="px-4 py-3">
                    <code className="font-mono text-xs text-ink/70 bg-background border border-hairline rounded-md px-2 py-1 inline-block max-w-[200px] truncate">
                      {truncate(tc.expectedOutput)}
                    </code>
                  </td>
                  <td className="px-4 py-3 text-right font-mono text-xs text-ink/60">
                    {tc.weight}
                  </td>
                  <td className="px-4 py-3 text-right">
                    <button
                      onClick={(e) => {
                        e.stopPropagation(); // Don't open preview
                        setDeleteTarget(tc.id);
                      }}
                      className="p-1.5 rounded-lg text-ink/20 hover:text-accent-error hover:bg-accent-error/5 transition-colors opacity-0 group-hover:opacity-100 cursor-pointer"
                      title="Delete test case"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        {/* Footer — informational weight total (Section 4.3) */}
        <div className="px-4 py-2.5 bg-background/40 border-t border-hairline flex items-center justify-between">
          <span className="text-xs text-ink/40">
            {testCases.length} test case{testCases.length !== 1 ? 's' : ''}
          </span>
          <span className="text-xs text-ink/40 font-mono">
            Total weight: {totalWeight}
          </span>
        </div>
      </div>

      {/* Preview Dialog */}
      <TestCasePreviewDialog
        isOpen={!!previewTarget}
        onClose={() => setPreviewTarget(null)}
        testCase={previewTarget}
      />

      {/* Delete Dialog */}
      <DeleteTestCaseDialog
        isOpen={!!deleteTarget}
        onClose={() => setDeleteTarget(null)}
        onConfirm={() => {
          if (deleteTarget) {
            onDelete(deleteTarget);
            setDeleteTarget(null);
          }
        }}
        isDeleting={isDeleting}
      />
    </>
  );
};
