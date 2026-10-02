import React, { useEffect } from 'react';
import { toast } from 'sonner';
import { Sheet, Skeleton } from '../ui';
import { ErrorState } from '../states/ErrorState';
import { DifficultyCheck } from './DifficultyCheck';
import { VerdictMixBar } from './VerdictMixBar';
import { TestCasePassRateList } from './TestCasePassRateList';
import { useTestCaseAnalytics } from '../../hooks/useAnalytics';
import { getErrorMessage } from '../../lib/apiError';
import { formatDuration, formatScore } from '../../lib/format';
import { languageLabel } from '../../lib/languages';
import type { QuestionStats } from '../../api/analyticsApi';

interface QuestionAnalyticsSheetProps {
  contestId: string;
  question: QuestionStats | null;
  index: number;
  isAdmin: boolean;
  onClose: () => void;
}

const Stat: React.FC<{ label: string; value: React.ReactNode }> = ({ label, value }) => (
  <div>
    <dt className="text-[12px] text-fg-subtle">{label}</dt>
    <dd className="tabular text-[15px] font-semibold text-fg">{value}</dd>
  </div>
);

const Section: React.FC<{ title: string; children: React.ReactNode }> = ({ title, children }) => (
  <section>
    <h3 className="mb-2 font-display text-[14px] font-semibold tracking-[-0.015em] text-fg">{title}</h3>
    {children}
  </section>
);

/** Drill-down for one question, open while ?aq=<questionId> is set. */
export const QuestionAnalyticsSheet: React.FC<QuestionAnalyticsSheetProps> = ({ contestId, question, index, isAdmin, onClose }) => {
  const { data, isLoading, isError, error, refetch } = useTestCaseAnalytics(contestId, question?.questionId ?? null);
  const notFound = isError && (error as { response?: { status?: number } })?.response?.status === 404;

  useEffect(() => {
    if (notFound) {
      toast.error('That question isn’t in this contest.');
      onClose();
    }
  }, [notFound, onClose]);

  return (
    <Sheet
      open={!!question}
      onOpenChange={(o) => !o && onClose()}
      width="max-w-2xl"
      title={question ? `Q${index + 1} · ${question.title}` : 'Question'}
      description={question ? `${question.points} points` : undefined}
    >
      {question && (
        <div className="space-y-6 p-5">
          <DifficultyCheck question={question} />

          <dl className="grid grid-cols-2 gap-x-6 gap-y-3 sm:grid-cols-3">
            <Stat label="Attempted" value={`${question.attempted} / ${question.participants}`} />
            <Stat label="Full marks" value={question.fullMarks} />
            <Stat
              label="Average score"
              value={
                <>
                  {formatScore(question.averageScore)}
                  <span className="text-[13px] font-normal text-fg-subtle"> / {question.points}</span>
                </>
              }
            />
            <Stat label="Submits" value={question.submitCount} />
            <Stat label="Runs" value={question.runCount} />
            <Stat
              label="Median time to Accepted"
              value={question.medianSecondsToAccepted != null ? formatDuration(question.medianSecondsToAccepted) : '—'}
            />
          </dl>

          <Section title="Verdicts (all SUBMITs)">
            <VerdictMixBar verdicts={question.verdicts} />
          </Section>

          <Section title="Languages">
            {question.languages.length === 0 ? (
              <p className="text-[13px] text-fg-muted">No submissions yet.</p>
            ) : (
              <ul className="flex flex-wrap gap-2">
                {question.languages.map((l) => (
                  <li key={l.language} className="rounded-lg border border-line bg-surface-2 px-2.5 py-1 font-mono text-[12px] text-fg-muted">
                    {languageLabel(l.language)} <span className="tabular text-fg">{l.count}</span>
                  </li>
                ))}
              </ul>
            )}
          </Section>

          <Section title="Test cases (each candidate’s counted submission)">
            {isLoading ? (
              <div className="space-y-2">
                <Skeleton className="h-14 w-full rounded-xl" />
                <Skeleton className="h-14 w-full rounded-xl" />
              </div>
            ) : isError && !notFound ? (
              <ErrorState message={getErrorMessage(error, 'Couldn’t load test-case analytics.')} onRetry={() => refetch()} />
            ) : data ? (
              <TestCasePassRateList
                testCases={data.testCases}
                editLink={isAdmin ? `/dashboard/contests/${contestId}/questions/${question.questionId}/edit?tab=testcases` : undefined}
              />
            ) : null}
          </Section>
        </div>
      )}
    </Sheet>
  );
};
