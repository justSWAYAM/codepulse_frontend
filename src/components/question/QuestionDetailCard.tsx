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

/** Copy-to-clipboard button */
const CopyButton: React.FC<{ text: string; label: string }> = ({ text, label }) => {
  const [copied, setCopied] = useState(false);
  const timer = useRef<number | undefined>(undefined);
  useEffect(() => () => window.clearTimeout(timer.current), []);

  const copy = async () => {
    try {
      await navigator.clipboard.writeText(text);
      setCopied(true);
      window.clearTimeout(timer.current);
      timer.current = window.setTimeout(() => setCopied(false), 2000);
    } catch {
      /* clipboard unavailable */
    }
  };

  return (
    <>
      <IconButton
        aria-label={label}
        size="sm"
        onClick={copy}
        className="text-editor-muted hover-fine:bg-editor-line hover-fine:text-editor-fg"
      >
        {copied ? <Check className="size-3.5 text-success" /> : <Copy className="size-3.5" />}
      </IconButton>
      <span className="sr-only" aria-live="polite">{copied ? `${label} copied` : ''}</span>
    </>
  );
};

/** One panel (Input or Output) inside a sample card */
const SamplePane: React.FC<{
  label: string;
  value: string | null | undefined;
  placeholder?: string;
  copyable?: boolean;
}> = ({ label, value, placeholder, copyable = false }) => (
  <div className="overflow-hidden rounded-lg border border-editor-line bg-editor-bg">
    <div className="flex items-center justify-between gap-2 border-b border-editor-line bg-editor-panel py-1 pr-1 pl-3">
      <span className="tabular font-mono text-[11px] font-medium uppercase tracking-[0.08em] text-editor-muted">
        {label}
      </span>
      {copyable && value ? <CopyButton text={value} label={`Copy ${label}`} /> : <span className="h-7" />}
    </div>
    {value ? (
      <pre className="scroll-thin m-0 min-h-[36px] overflow-x-auto px-3 py-2.5 font-mono text-[13px] leading-6 whitespace-pre-wrap break-words text-editor-fg">
        {value}
      </pre>
    ) : (
      <p className="px-3 py-2.5 text-[12px] italic text-editor-muted">{placeholder ?? '—'}</p>
    )}
  </div>
);

/** One sample test case shown as Input + Output side by side */
const SampleCard: React.FC<{
  index: number;
  input: string;
  expectedOutput?: string | null;
}> = ({ index, input, expectedOutput }) => (
  <div
    className="overflow-hidden rounded-xl border border-editor-line bg-editor-bg/40"
    data-theme="dark"
  >
    {/* Card header */}
    <div className="flex items-center border-b border-editor-line bg-editor-panel px-3 py-1.5">
      <span className="font-mono text-[11px] font-medium uppercase tracking-[0.08em] text-editor-muted">
        Sample {index + 1}
      </span>
    </div>
    <div className="grid gap-2 p-2 sm:grid-cols-2">
      <SamplePane label="Input" value={input} copyable />
      <SamplePane
        label="Expected output"
        value={expectedOutput ?? null}
        placeholder="Run your code to see output"
        copyable={!!expectedOutput}
      />
    </div>
  </div>
);

export const QuestionDetailCard: React.FC<QuestionDetailCardProps> = ({ question }) => {
  const candidateSamples = isCandidateRecord(question)
    ? [...(question.sampleTestCases ?? [])].sort((a, b) => a.orderIndex - b.orderIndex)
    : [];

  const adminCases = isAdminRecord(question) ? question.testCases ?? [] : [];
  const adminSamples = adminCases.filter((tc) => tc.isSample).sort((a, b) => a.orderIndex - b.orderIndex);
  const sampleCount = adminSamples.length;

  // Admin view has full test case data; candidate view has sample cases with expected output
  const samples = adminSamples.length > 0
    ? adminSamples.map((tc) => ({ id: tc.id, input: tc.input, expectedOutput: tc.expectedOutput }))
    : candidateSamples.map((tc) => ({ id: tc.id, input: tc.input, expectedOutput: tc.expectedOutput }));

  return (
    <article className="flex flex-col bg-surface">
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
            <SampleCard
              key={tc.id}
              index={index}
              input={tc.input}
              expectedOutput={tc.expectedOutput}
            />
          ))}
        </section>
      )}
    </article>
  );
};
