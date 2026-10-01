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
        <div className="p-3 rounded-xl bg-primary/[0.03] text-center">
          <p className="text-lg font-bold font-display text-fg">{result.totalRows}</p>
          <p className="text-[11px] text-fg-subtle">Total</p>
        </div>
        <div className="p-3 rounded-xl bg-primary/5 text-center">
          <p className="text-lg font-bold font-display text-primary-text">
            {result.succeededCount}
          </p>
          <p className="text-[11px] text-primary-text">Succeeded</p>
        </div>
        <div className="p-3 rounded-xl bg-danger-soft text-center">
          <p className="text-lg font-bold font-display text-danger-text">
            {result.failedCount}
          </p>
          <p className="text-[11px] text-danger-text">Failed</p>
        </div>
      </div>

      {/* Per-row error report (only shown if there are errors) */}
      {result.errors.length > 0 && (
        <div className="rounded-xl border border-line overflow-hidden max-h-60 overflow-y-auto">
          {result.errors.map((err, i) => (
            <div
              key={i}
              className="flex items-center gap-3 px-4 py-2.5 text-xs border-b border-line last:border-b-0 bg-danger/[0.03]"
            >
              <XCircle className="w-4 h-4 text-danger-text shrink-0" />
              <span className="font-mono text-fg-muted w-10 shrink-0">
                Row {err.rowNumber}
              </span>
              <span className="text-danger-text text-[11px] truncate flex-1" title={err.reason}>
                {err.reason}
              </span>
            </div>
          ))}
        </div>
      )}

      {/* All succeeded message */}
      {result.errors.length === 0 && result.succeededCount > 0 && (
        <div className="flex items-center gap-3 p-4 rounded-xl bg-primary/5 border border-primary/10">
          <CheckCircle2 className="w-5 h-5 text-primary-text shrink-0" />
          <div>
            <p className="text-sm font-medium text-fg">All test cases imported successfully</p>
            <p className="text-xs text-fg-subtle mt-0.5">
              {result.succeededCount} test case{result.succeededCount !== 1 ? 's' : ''} added
            </p>
          </div>
        </div>
      )}
    </div>
  );
};
