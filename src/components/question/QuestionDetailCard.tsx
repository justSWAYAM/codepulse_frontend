import React, { useEffect, useRef, useState } from 'react';
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';
import { Check, Clock, Copy, FlaskConical, MemoryStick, Trophy } from 'lucide-react';
import { DifficultyBadge } from '../DifficultyBadge';
import { Eyebrow, IconButton } from '../ui';
import type { QuestionRecord, QuestionAdminRecord, QuestionCandidateRecord } from '../../api/questionApi';

interface QuestionDetailCardProps {
  question: QuestionRecord;
}

/** Type guard: admin records have `testCases` array */
function isAdminRecord(q: QuestionRecord): q is QuestionAdminRecord {
  return 'testCases' in q;
}

/** Type guard: candidate records have `sampleTestCases` array */
function isCandidateRecord(q: QuestionRecord): q is QuestionCandidateRecord {
  return 'sampleTestCases' in q;
}

const Meta: React.FC<{ icon: React.ReactNode; children: React.ReactNode }> = ({ icon, children }) => (
  <span className="inline-flex items-center gap-1.5">
    <span className="text-fg-subtle [&>svg]:size-3.5" aria-hidden>
      {icon}
    </span>
    <span className="tabular">{children}</span>
  </span>
);

/** Editor-style sample input with a copy button (inline check for 2s). */
const SampleBlock: React.FC<{ index: number; input: string }> = ({ index, input }) => {
  const [copied, setCopied] = useState(false);
  const timer = useRef<number | undefined>(undefined);

  useEffect(() => () => window.clearTimeout(timer.current), []);

  const copy = async () => {
    try {
      await navigator.clipboard.writeText(input);
      setCopied(true);
      window.clearTimeout(timer.current);
      timer.current = window.setTimeout(() => setCopied(false), 2000);
    } catch {
      /* clipboard unavailable — nothing to do */
    }
  };

  return (
    <div className="overflow-hidden rounded-xl border border-editor-line bg-editor-bg">
      <div className="flex items-center justify-between gap-2 border-b border-editor-line bg-editor-panel py-1 pr-1 pl-3">
        <span className="tabular font-mono text-[11px] font-medium uppercase tracking-[0.08em] text-editor-muted">
          Input {index + 1}
        </span>
        <IconButton
          aria-label="Copy input"
          size="sm"
          onClick={copy}
          className="text-editor-muted hover-fine:bg-editor-line hover-fine:text-editor-fg"
        >
          {copied ? <Check className="size-3.5 text-success" /> : <Copy className="size-3.5" />}
        </IconButton>
      </div>
      <pre className="scroll-thin m-0 overflow-x-auto px-3 py-2.5 font-mono text-[13px] leading-6 whitespace-pre-wrap break-words text-editor-fg">
        {input}
      </pre>
      <span className="sr-only" aria-live="polite">
        {copied ? 'Input copied' : ''}
      </span>
    </div>
  );
};

export const QuestionDetailCard: React.FC<QuestionDetailCardProps> = ({ question }) => {
  const samples = isCandidateRecord(question)
    ? [...(question.sampleTestCases ?? [])].sort((a, b) => a.orderIndex - b.orderIndex)
    : [];
  const adminCases = isAdminRecord(question) ? question.testCases ?? [] : [];
  const sampleCount = adminCases.filter((tc) => tc.isSample).length;

  return (
    <article className="flex min-h-full flex-col bg-surface">
      <header className="border-b border-line px-5 py-5 sm:px-6">
        <div className="flex flex-wrap items-start justify-between gap-3">
          <h2 className="min-w-0 font-display text-[20px] font-semibold leading-7 tracking-[-0.02em] text-fg">
            {question.title}
          </h2>
          <DifficultyBadge difficulty={question.difficulty} className="mt-1" />
        </div>
        <div className="mt-3 flex flex-wrap items-center gap-x-5 gap-y-2 text-[13px] text-fg-muted">
          <Meta icon={<Trophy />}>{question.points} pts</Meta>
          <Meta icon={<Clock />}>{question.timeLimitMs} ms</Meta>
          <Meta icon={<MemoryStick />}>{Math.round(question.memoryLimitKb / 1024)} MB</Meta>
        </div>
      </header>

      {adminCases.length > 0 && (
        <div className="flex items-center gap-2 border-b border-line bg-surface-2/60 px-5 py-2.5 text-[13px] text-fg-muted sm:px-6">
          <FlaskConical className="size-4 text-fg-subtle" aria-hidden />
          <span className="tabular">
            {adminCases.length} test case{adminCases.length !== 1 ? 's' : ''}{' '}
            <span className="text-fg-subtle">
              ({sampleCount} sample, {adminCases.length - sampleCount} hidden)
            </span>
          </span>
        </div>
      )}

      <div className="prose-cp max-w-[72ch] px-5 py-5 sm:px-6">
        <ReactMarkdown remarkPlugins={[remarkGfm]}>{question.description}</ReactMarkdown>
      </div>

      {samples.length > 0 && (
        <section className="space-y-3 border-t border-line px-5 py-5 sm:px-6" aria-labelledby="sample-tests-heading">
          <Eyebrow>
            <span id="sample-tests-heading">Sample test cases</span>
          </Eyebrow>
          {samples.map((tc, index) => (
            <SampleBlock key={tc.id} index={index} input={tc.input} />
          ))}
        </section>
      )}
    </article>
  );
};
