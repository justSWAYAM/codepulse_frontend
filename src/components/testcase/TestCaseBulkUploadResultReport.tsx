import React from 'react';
import { CheckCircle2, XCircle } from 'lucide-react';
import type { TestCaseBulkUploadResult } from '../../api/testCaseApi';

interface TestCaseBulkUploadResultReportProps {
  result: TestCaseBulkUploadResult;
}

export const TestCaseBulkUploadResultReport: React.FC<TestCaseBulkUploadResultReportProps> = ({
  result,
}) => {
  return (
    <div className="space-y-4">
      {/* Summary cards */}
      <div className="grid grid-cols-3 gap-3">
        <div className="p-3 rounded-xl bg-ink/[0.03] text-center">
          <p className="text-lg font-bold font-display text-ink">{result.totalRows}</p>
          <p className="text-[11px] text-ink/40">Total</p>
        </div>
        <div className="p-3 rounded-xl bg-accent-compile/5 text-center">
          <p className="text-lg font-bold font-display text-accent-compile">
            {result.succeededCount}
          </p>
          <p className="text-[11px] text-accent-compile/60">Succeeded</p>
        </div>
        <div className="p-3 rounded-xl bg-accent-error/5 text-center">
          <p className="text-lg font-bold font-display text-accent-error">
            {result.failedCount}
          </p>
          <p className="text-[11px] text-accent-error/60">Failed</p>
        </div>
      </div>

      {/* Per-row error report (only shown if there are errors) */}
      {result.errors.length > 0 && (
        <div className="rounded-xl border border-hairline overflow-hidden max-h-60 overflow-y-auto">
          {result.errors.map((err, i) => (
            <div
              key={i}
              className="flex items-center gap-3 px-4 py-2.5 text-xs border-b border-hairline/60 last:border-b-0 bg-accent-error/[0.03]"
            >
              <XCircle className="w-4 h-4 text-accent-error shrink-0" />
              <span className="font-mono text-ink/60 w-10 shrink-0">
                Row {err.rowNumber}
              </span>
              <span className="text-accent-error/70 text-[11px] truncate flex-1" title={err.reason}>
                {err.reason}
              </span>
            </div>
          ))}
        </div>
      )}

      {/* All succeeded message */}
      {result.errors.length === 0 && result.succeededCount > 0 && (
        <div className="flex items-center gap-3 p-4 rounded-xl bg-accent-compile/5 border border-accent-compile/10">
          <CheckCircle2 className="w-5 h-5 text-accent-compile shrink-0" />
          <div>
            <p className="text-sm font-medium text-ink">All test cases imported successfully</p>
            <p className="text-xs text-ink/40 mt-0.5">
              {result.succeededCount} test case{result.succeededCount !== 1 ? 's' : ''} added
            </p>
          </div>
        </div>
      )}
    </div>
  );
};
