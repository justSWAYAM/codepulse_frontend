import React, { useState } from 'react';
import { ChevronDown } from 'lucide-react';
import { Badge, Card, Skeleton } from '../ui';
import { OutputBlock, VerdictBadge } from '../editor/VerdictBadge';
import { useSubmissionDetail } from '../../hooks/useSubmissions';
import { formatScore } from '../../lib/format';
import { cn } from '../../lib/cn';
import type { MyQuestionResult } from '../../api/resultApi';

/** Own counted code, via the Module 8 candidate view (hidden tests stay a summary). */
const MyCode: React.FC<{ submissionId: string }> = ({ submissionId }) => {
  const { data, isLoading } = useSubmissionDetail(submissionId);
  if (isLoading) return <Skeleton className="h-40 w-full rounded-xl" />;
  if (!data) return null;
  return (
    <div className="space-y-3">
      <OutputBlock label="Your code" value={data.sourceCode} className="[&_pre]:max-h-80" />
      {data.hiddenSummary && (
        <p className="tabular text-[13px] text-fg-muted">
          Hidden tests passed: {data.hiddenSummary.passed} / {data.hiddenSummary.total}
        </p>
      )}
    </div>
  );
};

const Row: React.FC<{ q: MyQuestionResult; index: number }> = ({ q, index }) => {
  const [open, setOpen] = useState(false);
  const canExpand = !!q.countedSubmissionId;
  return (
    <li className="rounded-2xl border border-line bg-surface">
      <div className="flex flex-wrap items-center gap-x-3 gap-y-1.5 px-4 py-3">
        <span className="tabular text-[13px] font-medium text-fg-subtle">Q{index + 1}</span>
        <span className="min-w-0 flex-1 truncate text-sm font-medium text-fg">{q.title}</span>
        {q.verdict ? (
          <VerdictBadge status={q.verdict} />
        ) : (
          <Badge size="sm" tone="neutral">
            Not attempted
          </Badge>
        )}
        {q.totalCount != null && (
          <span className="tabular text-[12px] text-fg-subtle">
            {q.passedCount ?? 0}/{q.totalCount} tests
          </span>
        )}
        {q.adjusted && (
          <Badge size="sm" tone="primary">
            Adjusted
          </Badge>
        )}
        <span className="tabular font-mono text-[13px] font-semibold text-fg">
          {formatScore(q.finalScore)}
          <span className="font-normal text-fg-subtle"> / {q.maxPoints}</span>
        </span>
        {canExpand && (
          <button
            type="button"
            onClick={() => setOpen((o) => !o)}
            aria-expanded={open}
            className="inline-flex items-center gap-1 rounded-md text-[13px] font-medium text-primary-text"
          >
            View my code
            <ChevronDown className={cn('size-4 transition-transform duration-200', open && 'rotate-180')} aria-hidden />
          </button>
        )}
      </div>
      {open && q.countedSubmissionId && (
        <div className="border-t border-line p-4">
          <MyCode submissionId={q.countedSubmissionId} />
        </div>
      )}
    </li>
  );
};

export const MyQuestionScoreList: React.FC<{ questions: MyQuestionResult[] }> = ({ questions }) =>
  questions.length === 0 ? (
    <Card className="p-5 text-sm text-fg-muted">This contest had no questions.</Card>
  ) : (
    <ol className="space-y-2" aria-label="Score per question">
      {questions.map((q, i) => (
        <Row key={q.questionId} q={q} index={i} />
      ))}
    </ol>
  );
