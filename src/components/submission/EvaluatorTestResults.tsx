import React, { useState } from 'react';
import { ChevronDown, Clock, Cpu, Weight } from 'lucide-react';
import { Badge } from '../ui';
import { OutputBlock, VerdictBadge } from '../editor/VerdictBadge';
import { formatKb, formatMs } from '../../lib/format';
import { cn } from '../../lib/cn';
import type { EvaluatorTestCaseResult } from '../../api/submissionApi';

/** One test case in the evaluator view: Sample/Hidden, weight, verdict, and input/expected/actual. */
export const EvaluatorTestRow: React.FC<{ result: EvaluatorTestCaseResult; index: number }> = ({ result, index }) => {
  const [open, setOpen] = useState(result.status !== 'PASSED' && index < 3);
  return (
    <li className="rounded-xl border border-line bg-surface">
      <button
        type="button"
        onClick={() => setOpen((o) => !o)}
        aria-expanded={open}
        className="flex min-h-11 w-full flex-wrap items-center gap-x-3 gap-y-1 rounded-xl px-3 py-2 text-left hover-fine:bg-surface-2/60"
      >
        <ChevronDown className={cn('size-4 shrink-0 text-fg-subtle transition-transform duration-200 ease-out', !open && '-rotate-90')} aria-hidden />
        <span className="tabular text-[13px] font-medium text-fg">Test {index + 1}</span>
        <Badge size="sm" tone={result.sample ? 'primary' : 'neutral'}>
          {result.sample ? 'Sample' : 'Hidden'}
        </Badge>
        <VerdictBadge status={result.status} />
        <span className="ml-auto flex items-center gap-3 text-[12px] text-fg-subtle">
          <span className="tabular inline-flex items-center gap-1" title="Weight">
            <Weight className="size-3.5" aria-hidden />
            <span className="sr-only">Weight </span>
            {result.weight}
          </span>
          <span className="tabular inline-flex items-center gap-1" title="Time">
            <Clock className="size-3.5" aria-hidden />
            {formatMs(result.timeMs)}
          </span>
          <span className="tabular inline-flex items-center gap-1" title="Memory">
            <Cpu className="size-3.5" aria-hidden />
            {formatKb(result.memoryKb)}
          </span>
        </span>
      </button>
      {open && (
        <div className="grid gap-3 border-t border-line p-3 md:grid-cols-3">
          <OutputBlock label="Input" value={result.input} emptyText="(empty)" />
          <OutputBlock label="Expected" value={result.expectedOutput} />
          <OutputBlock label="Actual" value={result.actualOutput} />
          {result.stderr && <OutputBlock label="stderr" value={result.stderr} tone="danger" className="md:col-span-3" />}
        </div>
      )}
    </li>
  );
};

/** Every test case of a submission, as evaluators see them. Used by the submission sheet and grading page. */
export const EvaluatorTestResults: React.FC<{ results: EvaluatorTestCaseResult[] }> = ({ results }) => (
  <ul className="space-y-2">
    {results.map((r, i) => (
      <EvaluatorTestRow key={r.testCaseId} result={r} index={i} />
    ))}
  </ul>
);
