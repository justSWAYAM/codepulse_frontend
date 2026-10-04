import React, { Suspense, lazy, useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { Play, RotateCcw, Send } from 'lucide-react';
import { Button, Dialog, IconButton, Kbd, MOD_KEY, Skeleton, Tooltip } from '../ui';
import type { QuestionCandidateRecord } from '../../api/questionApi';
import { LANGUAGES, toLanguage, type LanguageMeta } from '../../lib/languages';
import { clearDraft, loadDraft, loadLanguage, saveDraft, saveLanguage } from '../../lib/drafts';
import { useMySubmissions, useRunCode, useSubmissionCounts, useSubmitCode } from '../../hooks/useSubmissions';
import { ResultsPanel, type LastAction, type ResultsTab } from './ResultsPanel';

const MonacoEditor = lazy(() => import('./MonacoEditor'));

/** Per-session limits enforced by the backend (SubmissionProperties). */
const RUN_LIMIT = 100;
const SUBMIT_LIMIT = 30;
const WARN_WHEN_LEFT = 5;

interface CodeEditorPanelProps {
  contestId: string;
  question: QuestionCandidateRecord;
  allowedLanguages: string[];
  /** True once time is up — editing and judging stop. */
  disabled?: boolean;
}

const EditorSkeleton: React.FC = () => (
  <div className="h-full space-y-2.5 bg-editor-bg p-5" aria-label="Loading editor">
    {[72, 48, 64, 30, 56, 40, 68].map((w, i) => (
      <Skeleton key={i} className="h-3.5 bg-white/[0.06]" style={{ width: `${w}%` }} />
    ))}
  </div>
);

/**
 * CodeEditorPanel — Module 7/8 editor region of the assessment page.
 * Monaco editor + language picker + Run (samples) + Submit (all tests) + results/history.
 * Always rendered dark (data-theme="dark") so every token inside resolves to editor-legible values.
 */
export const CodeEditorPanel: React.FC<CodeEditorPanelProps> = ({ contestId, question, allowedLanguages, disabled }) => {
  const questionId = question.id;

  const languages = useMemo<LanguageMeta[]>(() => {
    const list = allowedLanguages.map(toLanguage).filter((l): l is LanguageMeta => !!l);
    return list.length > 0 ? list : Object.values(LANGUAGES);
  }, [allowedLanguages]);

  const pickInitialLanguage = useCallback(() => {
    const saved = loadLanguage(contestId, questionId);
    return languages.find((l) => l.name === saved) ?? languages[0];
  }, [contestId, questionId, languages]);

  const [language, setLanguage] = useState<LanguageMeta>(pickInitialLanguage);
  const [code, setCode] = useState(() => loadDraft(contestId, questionId, language.name) ?? language.template);
  const [resultsOpen, setResultsOpen] = useState(false);
  const [tab, setTab] = useState<ResultsTab>('results');
  const [lastAction, setLastAction] = useState<LastAction>(null);
  const [confirmReset, setConfirmReset] = useState(false);

  // Switching question: restore that question's language + draft, clear results
  const prevQuestion = useRef(questionId);
  useEffect(() => {
    if (prevQuestion.current === questionId) return;
    prevQuestion.current = questionId;
    const lang = pickInitialLanguage();
    setLanguage(lang);
    setCode(loadDraft(contestId, questionId, lang.name) ?? lang.template);
    setLastAction(null);
    setTab('results');
  }, [questionId, contestId, pickInitialLanguage]);

  // The contest's allowed languages can arrive after the first render; never keep a
  // language the server will reject with LANGUAGE_NOT_ALLOWED
  useEffect(() => {
    if (languages.some((l) => l.name === language.name)) return;
    const lang = pickInitialLanguage();
    setLanguage(lang);
    setCode(loadDraft(contestId, questionId, lang.name) ?? lang.template);
  }, [languages, language.name, pickInitialLanguage, contestId, questionId]);

  // Debounced draft autosave
  useEffect(() => {
    const t = setTimeout(() => {
      if (code === language.template) clearDraft(contestId, questionId, language.name);
      else saveDraft(contestId, questionId, language.name, code);
    }, 400);
    return () => clearTimeout(t);
  }, [code, contestId, questionId, language]);

  const changeLanguage = (name: string) => {
    const next = languages.find((l) => l.name === name);
    if (!next) return;
    // Current draft is already saved per language — switching never loses work
    saveDraft(contestId, questionId, language.name, code);
    setLanguage(next);
    saveLanguage(contestId, questionId, next.name);
    setCode(loadDraft(contestId, questionId, next.name) ?? next.template);
  };

  const loadCode = (source: string, lang: string) => {
    const meta = toLanguage(lang);
    if (meta && languages.some((l) => l.name === meta.name)) {
      setLanguage(meta);
      saveLanguage(contestId, questionId, meta.name);
    }
    setCode(source);
  };

  // ── Judging ──
  const runMutation = useRunCode(questionId);
  const submitMutation = useSubmitCode(questionId);
  const { data: historyPage, isLoading: historyLoading } = useMySubmissions(questionId);
  const history = historyPage?.content;

  const { runsUsed, submitsUsed } = useSubmissionCounts(questionId);
  const submitPending = history?.some((h) => h.type === 'SUBMIT' && h.status === 'PENDING') ?? false;
  const busy = runMutation.isPending || submitMutation.isPending;
  const blocked = disabled || busy;

  const payload = () => ({ questionId, language: language.name, sourceCode: code });

  const runsLeft = RUN_LIMIT - runsUsed;
  const submitsLeft = SUBMIT_LIMIT - submitsUsed;

  // Same guards as the buttons: the Ctrl/Cmd+Enter shortcuts call these directly
  const run = () => {
    if (blocked || !code.trim() || runsLeft <= 0) return;
    setResultsOpen(true);
    setTab('results');
    setLastAction({ kind: 'run', pending: true, error: null, detail: null });
    runMutation.mutate(payload(), {
      onSuccess: ({ detail }) => setLastAction({ kind: 'run', pending: false, error: null, detail }),
      onError: (error) => setLastAction({ kind: 'run', pending: false, error, detail: null }),
    });
  };

  const submit = () => {
    if (blocked || !code.trim() || submitPending || submitsLeft <= 0) return;
    setResultsOpen(true);
    setTab('results');
    setLastAction({ kind: 'submit', pending: true, error: null, submissionId: null });
    submitMutation.mutate(payload(), {
      onSuccess: (summary) => setLastAction({ kind: 'submit', pending: false, error: null, submissionId: summary.id }),
      onError: (error) => setLastAction({ kind: 'submit', pending: false, error, submissionId: null }),
    });
  };

  return (
    <section data-theme="dark" aria-label="Code editor" className="flex h-full min-h-0 w-full flex-col overflow-hidden bg-editor-bg text-editor-fg">
      {/* ── Toolbar ── */}
      <div className="flex h-12 shrink-0 items-center gap-2 border-b border-editor-line bg-editor-panel px-3">
        <label htmlFor="language-selector" className="sr-only">
          Language
        </label>
        <select
          id="language-selector"
          value={language.name}
          onChange={(e) => changeLanguage(e.target.value)}
          disabled={disabled}
          className="h-8 rounded-lg border border-editor-line bg-editor-bg px-2.5 pr-7 text-[13px] font-medium text-editor-fg outline-none transition-[border-color] duration-150 hover-fine:border-line-strong focus-visible:border-primary disabled:opacity-50"
        >
          {languages.map((l) => (
            <option key={l.name} value={l.name}>
              {l.label}
            </option>
          ))}
        </select>

        <Tooltip content="Reset to starter code">
          <IconButton aria-label="Reset to starter code" size="sm" disabled={disabled} onClick={() => setConfirmReset(true)}>
            <RotateCcw className="size-4" />
          </IconButton>
        </Tooltip>

        <div className="flex-1" />

        {(runsLeft <= WARN_WHEN_LEFT || submitsLeft <= WARN_WHEN_LEFT) && (
          <span className="tabular hidden text-[12px] text-warning-text md:inline" aria-live="polite">
            {submitsLeft <= WARN_WHEN_LEFT
              ? `${Math.max(submitsLeft, 0)} submit${submitsLeft === 1 ? '' : 's'} left`
              : `${Math.max(runsLeft, 0)} runs left`}
          </span>
        )}

        <Tooltip content={<span className="flex items-center gap-1.5">Run sample tests <Kbd className="border-white/15 bg-white/10 text-canvas/70">{MOD_KEY} ↵</Kbd></span>}>
          <Button
            id="run-code-button"
            size="sm"
            variant="secondary"
            onClick={run}
            disabled={disabled || submitMutation.isPending || runsLeft <= 0}
            loading={runMutation.isPending}
            leadingIcon={<Play className="size-3.5" />}
            className="border-editor-line bg-white/[0.04] text-editor-fg hover-fine:bg-white/[0.08]"
          >
            Run
          </Button>
        </Tooltip>
        <Tooltip
          content={
            submitPending ? (
              'Wait for your previous submission’s verdict'
            ) : (
              <span className="flex items-center gap-1.5">
                Submit for judging <Kbd className="border-white/15 bg-white/10 text-canvas/70">{MOD_KEY} ⇧ ↵</Kbd>
              </span>
            )
          }
        >
          <Button
            size="sm"
            variant="success"
            onClick={submit}
            disabled={disabled || runMutation.isPending || submitPending || submitsLeft <= 0}
            loading={submitMutation.isPending}
            leadingIcon={<Send className="size-3.5" />}
          >
            Submit
          </Button>
        </Tooltip>
      </div>

      {/* ── Editor ── */}
      <div className="relative min-h-0 flex-1">
        <Suspense fallback={<EditorSkeleton />}>
          <MonacoEditor
            value={code}
            language={language.monaco}
            onChange={setCode}
            readOnly={disabled}
            blockPaste
            onRun={run}
            onSubmit={submit}
            ariaLabel={`Code editor, ${language.label}`}
          />
        </Suspense>
        {disabled && (
          <div className="pointer-events-none absolute inset-x-0 top-0 bg-danger-soft px-4 py-1.5 text-center text-[12px] font-medium text-danger-text">
            Time is up — your code is read-only.
          </div>
        )}
      </div>

      {/* ── Results / history ── */}
      <ResultsPanel
        open={resultsOpen}
        onOpenChange={setResultsOpen}
        tab={tab}
        onTabChange={setTab}
        lastAction={lastAction}
        questionId={questionId}
        points={question.points}
        sampleCount={question.sampleTestCases?.length ?? 0}
        history={history}
        historyLoading={historyLoading}
        onLoadCode={loadCode}
      />

      <Dialog
        open={confirmReset}
        onOpenChange={setConfirmReset}
        title="Reset to starter code?"
        description={`Your ${language.label} code for this question will be replaced with the starter template. This can’t be undone.`}
        icon={<RotateCcw className="size-5" />}
        tone="warning"
        size="sm"
        footer={
          <>
            <Button variant="secondary" onClick={() => setConfirmReset(false)}>
              Keep my code
            </Button>
            <Button
              variant="danger"
              onClick={() => {
                setCode(language.template);
                clearDraft(contestId, questionId, language.name);
                setConfirmReset(false);
              }}
            >
              Reset code
            </Button>
          </>
        }
      />
    </section>
  );
};
