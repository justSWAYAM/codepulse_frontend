import React from 'react';
import { CheckCircle2, XCircle } from 'lucide-react';
import { cn } from '../../lib/cn';
import type { TestCaseBulkUploadResult } from '../../api/testCaseApi';

interface TestCaseBulkUploadResultReportProps {
  result: TestCaseBulkUploadResult;
}

const Stat: React.FC<{ label: string; value: number; className?: string }> = ({ label, value, className }) => (
  <div className={cn('rounded-xl border px-3 py-3 text-center', className)}>
    <p className="tabular font-display text-[20px] font-semibold leading-7 tracking-[-0.015em]">{value}</p>
    <p className="text-[12px]">{label}</p>
  </div>
);

export const TestCaseBulkUploadResultReport: React.FC<TestCaseBulkUploadResultReportProps> = ({ result }) => (
  <div className="space-y-4">
    <div className="grid grid-cols-3 gap-3">
      <Stat label="Total" value={result.totalRows} className="border-line bg-surface-2 text-fg [&>p:last-child]:text-fg-muted" />
      <Stat label="Succeeded" value={result.succeededCount} className="border-success/20 bg-success-soft text-success-text" />
      <Stat label="Failed" value={result.failedCount} className="border-danger/20 bg-danger-soft text-danger-text" />
    </div>

    {result.errors.length > 0 && (
      <ul className="scroll-thin max-h-60 overflow-y-auto rounded-xl border border-line">
        {result.errors.map((err, i) => (
          <li key={i} className="flex items-center gap-3 border-b border-line px-4 py-2.5 text-[13px] last:border-b-0">
            <XCircle className="size-4 shrink-0 text-danger-text" aria-hidden />
            <span className="tabular w-16 shrink-0 font-mono text-[12px] text-fg-muted">Row {err.rowNumber}</span>
            <span className="min-w-0 flex-1 truncate text-danger-text" title={err.reason}>
              {err.reason}
            </span>
          </li>
        ))}
      </ul>
    )}

    {result.errors.length === 0 && result.succeededCount > 0 && (
      <div className="flex items-center gap-3 rounded-xl border border-success/20 bg-success-soft p-4">
        <CheckCircle2 className="size-5 shrink-0 text-success-text" aria-hidden />
        <div>
          <p className="text-sm font-medium text-fg">All test cases imported</p>
          <p className="tabular mt-0.5 text-[13px] text-fg-muted">
            {result.succeededCount} test case{result.succeededCount !== 1 ? 's' : ''} added
          </p>
        </div>
      </div>
    )}
  </div>
);
