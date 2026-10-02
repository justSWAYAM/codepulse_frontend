import React, { useMemo } from 'react';
import { useSearchParams } from 'react-router-dom';
import { ChevronLeft, ChevronRight, FileCode2, RefreshCw } from 'lucide-react';
import { Card, IconButton, Select, Skeleton } from '../ui';
import { EmptyState } from '../states/EmptyState';
import { ErrorState } from '../states/ErrorState';
import { VerdictBadge } from '../editor/VerdictBadge';
import { SubmissionDetailSheet } from './SubmissionDetailSheet';
import { useContestSubmissions } from '../../hooks/useSubmissions';
import { useQuestions } from '../../hooks/useQuestions';
import { languageLabel } from '../../lib/languages';
import { VERDICTS } from '../../lib/verdicts';
import { getErrorMessage } from '../../lib/apiError';
import { cn } from '../../lib/cn';
import type { ContestCandidate } from '../../api/contestApi';
import type { SubmissionStatus, SubmissionType } from '../../api/submissionApi';

const PAGE_SIZE = 20;
const STATUSES = Object.keys(VERDICTS).filter((k) => k !== 'PASSED') as SubmissionStatus[];

const rtf = new Intl.DateTimeFormat(undefined, { day: '2-digit', month: 'short', hour: '2-digit', minute: '2-digit' });

interface ContestSubmissionsPanelProps {
  contestId: string;
  candidates: ContestCandidate[];
  canRejudge: boolean;
  /** Set while results are published: rejudge is refused until they're unpublished. */
  rejudgeLockedReason?: string;
}

/**
 * Evaluator/admin view of every submission in a contest.
 * Filters, page and the open submission live in the URL (survive refresh, shareable).
 */
export const ContestSubmissionsPanel: React.FC<ContestSubmissionsPanelProps> = ({ contestId, candidates, canRejudge, rejudgeLockedReason }) => {
  const [params, setParams] = useSearchParams();
  const questionId = params.get('sq') || undefined;
  const candidateId = params.get('sc') || undefined;
  const type = (params.get('st') as SubmissionType | null) || undefined;
  const status = (params.get('ss') as SubmissionStatus | null) || undefined;
  const page = Math.max(0, Number(params.get('sp') ?? 0) || 0);
  const openId = params.get('submission');

  const update = (patch: Record<string, string | undefined>, resetPage = true) => {
    const next = new URLSearchParams(params);
    Object.entries(patch).forEach(([k, val]) => (val ? next.set(k, val) : next.delete(k)));
    if (resetPage) next.delete('sp');
    setParams(next, { replace: true });
  };

  const filters = useMemo(
    () => ({ questionId, candidateId, type, status, page, size: PAGE_SIZE }),
    [questionId, candidateId, type, status, page],
  );
  const { data, isLoading, isError, error, refetch, isFetching } = useContestSubmissions(contestId, filters);
  const { data: questionsRaw } = useQuestions(contestId);
  const questions = useMemo(() => [...(questionsRaw ?? [])].sort((a, b) => a.orderIndex - b.orderIndex), [questionsRaw]);

  const questionById = useMemo(() => new Map(questions.map((q) => [q.id, q])), [questions]);
  const rows = data?.content ?? [];
  const total = data?.totalElements ?? 0;
  const from = total === 0 ? 0 : page * PAGE_SIZE + 1;
  const to = Math.min(total, (page + 1) * PAGE_SIZE);
  const openRow = rows.find((r) => r.id === openId);
  const anyFilter = !!(questionId || candidateId || type || status);

  return (
    <div className="space-y-4">
      {/* Filters */}
      <Card className="grid grid-cols-1 gap-3 p-4 sm:grid-cols-2 lg:grid-cols-4">
        <Select aria-label="Filter by question" value={questionId ?? ''} onChange={(e) => update({ sq: e.target.value })}>
          <option value="">All questions</option>
          {questions.map((q, i) => (
            <option key={q.id} value={q.id}>
              Q{i + 1}. {q.title}
            </option>
          ))}
        </Select>
        <Select aria-label="Filter by candidate" value={candidateId ?? ''} onChange={(e) => update({ sc: e.target.value })}>
          <option value="">All candidates</option>
          {candidates.map((c) => (
            <option key={c.id} value={c.id}>
              {c.fullName}
            </option>
          ))}
        </Select>
        <Select aria-label="Filter by type" value={type ?? ''} onChange={(e) => update({ st: e.target.value })}>
          <option value="">Runs and submits</option>
          <option value="SUBMIT">Submits only</option>
          <option value="RUN">Runs only</option>
        </Select>
        <Select aria-label="Filter by verdict" value={status ?? ''} onChange={(e) => update({ ss: e.target.value })}>
          <option value="">Any verdict</option>
          {STATUSES.map((s) => (
            <option key={s} value={s}>
              {VERDICTS[s].label}
            </option>
          ))}
        </Select>
      </Card>

      {/* Table */}
      <Card className="overflow-hidden">
        <div className="flex h-12 items-center justify-between border-b border-line px-4">
          <p className="tabular text-[13px] text-fg-muted" aria-live="polite">
            {isLoading ? 'Loading…' : total === 0 ? 'No submissions' : `${from}–${to} of ${total}`}
          </p>
          <div className="flex items-center gap-1">
            <IconButton aria-label="Refresh" size="sm" onClick={() => refetch()} disabled={isFetching}>
              <RefreshCw className={cn('size-4', isFetching && 'motion-safe:animate-spin')} />
            </IconButton>
            <IconButton aria-label="Previous page" size="sm" disabled={page === 0} onClick={() => update({ sp: String(page - 1) }, false)}>
              <ChevronLeft className="size-4" />
            </IconButton>
            <IconButton
              aria-label="Next page"
              size="sm"
              disabled={!data || page >= data.totalPages - 1}
              onClick={() => update({ sp: String(page + 1) }, false)}
            >
              <ChevronRight className="size-4" />
            </IconButton>
          </div>
        </div>

        {isError ? (
          <ErrorState message={getErrorMessage(error, 'Couldn’t load submissions.')} onRetry={() => refetch()} />
        ) : !isLoading && rows.length === 0 ? (
          <EmptyState
            icon={<FileCode2 className="size-5" />}
            title={anyFilter ? 'No submissions match these filters' : 'No submissions yet'}
            message={anyFilter ? 'Clear a filter to see more.' : 'Runs and submissions appear here as candidates work.'}
          />
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full min-w-[760px] text-left text-[13px]">
              <thead>
                <tr className="border-b border-line bg-surface-2/60 text-[12px] font-medium text-fg-subtle">
                  <th scope="col" className="px-4 py-2.5 font-medium">Candidate</th>
                  <th scope="col" className="px-4 py-2.5 font-medium">Question</th>
                  <th scope="col" className="px-4 py-2.5 font-medium">Verdict</th>
                  <th scope="col" className="px-4 py-2.5 text-right font-medium">Passed</th>
                  <th scope="col" className="px-4 py-2.5 text-right font-medium">Score</th>
                  <th scope="col" className="px-4 py-2.5 font-medium">Language</th>
                  <th scope="col" className="px-4 py-2.5 font-medium">Submitted</th>
                </tr>
              </thead>
              <tbody>
                {isLoading
                  ? Array.from({ length: 6 }, (_, i) => (
                      <tr key={i} className="border-b border-line last:border-0">
                        {Array.from({ length: 7 }, (__, j) => (
                          <td key={j} className="h-14 px-4">
                            <Skeleton className="h-4 w-4/5" />
                          </td>
                        ))}
                      </tr>
                    ))
                  : rows.map((r) => {
                      const q = questionById.get(r.questionId);
                      const qIndex = questions.findIndex((x) => x.id === r.questionId);
                      return (
                        <tr
                          key={r.id}
                          tabIndex={0}
                          onClick={() => update({ submission: r.id }, false)}
                          onKeyDown={(e) => {
                            if (e.key === 'Enter' || e.key === ' ') {
                              e.preventDefault();
                              update({ submission: r.id }, false);
                            }
                          }}
                          aria-label={`Open submission by ${r.candidateName ?? 'candidate'}`}
                          className="h-14 cursor-pointer border-b border-line outline-none last:border-0 hover-fine:bg-surface-2/60 focus-visible:bg-primary-soft"
                        >
                          <td className="max-w-52 px-4">
                            <div className="truncate font-medium text-fg">{r.candidateName ?? 'Unknown'}</div>
                            <div className="truncate text-[12px] text-fg-subtle">{r.candidateRollNumber ?? r.candidateEmail}</div>
                          </td>
                          <td className="max-w-56 px-4">
                            <div className="truncate text-fg">{q ? `Q${qIndex + 1}. ${q.title}` : '—'}</div>
                            <div className="text-[12px] text-fg-subtle">{r.type === 'SUBMIT' ? 'Submit' : 'Run'}</div>
                          </td>
                          <td className="px-4">
                            <VerdictBadge status={r.status} />
                          </td>
                          <td className="tabular px-4 text-right text-fg-muted">
                            {r.passedCount ?? 0}/{r.totalCount ?? 0}
                          </td>
                          <td className="tabular px-4 text-right text-fg">
                            {r.score ?? '—'}
                            {q && r.score != null && <span className="text-fg-subtle">/{q.points}</span>}
                          </td>
                          <td className="px-4 text-fg-muted">{languageLabel(r.language)}</td>
                          <td className="tabular px-4 whitespace-nowrap text-fg-muted">{rtf.format(new Date(r.submittedAt))}</td>
                        </tr>
                      );
                    })}
              </tbody>
            </table>
          </div>
        )}
      </Card>

      <SubmissionDetailSheet
        contestId={contestId}
        submissionId={openId}
        row={openRow}
        questionTitle={openRow ? questionById.get(openRow.questionId)?.title : undefined}
        points={openRow ? questionById.get(openRow.questionId)?.points : undefined}
        canRejudge={canRejudge}
        rejudgeLockedReason={rejudgeLockedReason}
        onClose={() => update({ submission: undefined }, false)}
      />
    </div>
  );
};
