import React, { useEffect, useRef, useState } from 'react';
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';
import {
  BookOpen,
  Check,
  Clock,
  Copy,
  Database,
  Edit,
  Eye,
  HardDrive,
  Trash2,
  Trophy,
  User,
} from 'lucide-react';
import { Badge, Button, Dialog, IconButton } from '../ui';
import { DifficultyBadge } from '../DifficultyBadge';
import { useLibraryQuestion } from '../../hooks/useLibrary';
import { useAuth } from '../../context/AuthContext';

interface LibraryQuestionDetailModalProps {
  questionId: string | null;
  isOpen: boolean;
  onClose: () => void;
  onEdit?: (questionId: string) => void;
  onDelete?: (question: { id: string; title: string }) => void;
}

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
    <span className="relative inline-flex items-center">
      <IconButton
        aria-label={label}
        size="sm"
        onClick={copy}
        className="text-fg-subtle hover-fine:bg-surface-2 hover-fine:text-fg"
      >
        {copied ? <Check className="size-3.5 text-success" /> : <Copy className="size-3.5" />}
      </IconButton>
      <span className="sr-only" aria-live="polite">{copied ? `${label} copied` : ''}</span>
    </span>
  );
};

/** One panel (Input or Output) inside a sample test case card */
const SamplePane: React.FC<{
  label: string;
  value: string | null | undefined;
  placeholder?: string;
  copyable?: boolean;
}> = ({ label, value, placeholder, copyable = false }) => (
  <div className="overflow-hidden rounded-lg border border-line bg-surface">
    <div className="flex items-center justify-between gap-2 border-b border-line bg-surface-2 py-1 pr-1 pl-3">
      <span className="tabular font-mono text-[11px] font-medium uppercase tracking-[0.08em] text-fg-subtle">
        {label}
      </span>
      {copyable && value ? <CopyButton text={value} label={`Copy ${label}`} /> : <span className="h-7" />}
    </div>
    {value ? (
      <pre className="scroll-thin m-0 min-h-[36px] overflow-x-auto px-3 py-2.5 font-mono text-[13px] leading-6 whitespace-pre-wrap break-words text-fg">
        {value}
      </pre>
    ) : (
      <p className="px-3 py-2.5 text-[12px] italic text-fg-subtle">{placeholder ?? '—'}</p>
    )}
  </div>
);

export const LibraryQuestionDetailModal: React.FC<LibraryQuestionDetailModalProps> = ({
  questionId,
  isOpen,
  onClose,
  onEdit,
  onDelete,
}) => {
  let user: any = null;
  try {
    user = useAuth().user;
  } catch {
    user = null;
  }
  const { data: question, isLoading, isError } = useLibraryQuestion(questionId ?? undefined);

  const canManage = Boolean(
    user &&
      question &&
      (user.role === 'ADMIN' || user.id === question.createdBy || user.fullName === question.authorName),
  );

  const sampleTestCases = question?.testCases?.filter((tc) => tc.isSample) ?? [];
  const hiddenTestCasesCount = (question?.testCases?.length ?? 0) - sampleTestCases.length;

  return (
    <Dialog
      open={isOpen && Boolean(questionId)}
      onOpenChange={(open) => !open && onClose()}
      title={question?.title || 'Question details'}
      size="lg"
      icon={<BookOpen className="size-5" />}
      description={
        question ? (
          <span className="mt-1 flex flex-wrap items-center gap-2">
            <DifficultyBadge difficulty={question.difficulty} />
            <Badge tone="primary" size="sm">
              {question.questionType}
            </Badge>
            <Badge tone="neutral" size="sm">
              {question.subjectName || 'Unfiled'}
            </Badge>
            <span className="text-xs text-fg-subtle">
              Created {new Date(question.createdAt).toLocaleDateString()}
            </span>
          </span>
        ) : undefined
      }
      footer={
        <div className="flex w-full items-center justify-between gap-2">
          <div>
            {canManage && question && (
              <Button
                variant="danger"
                size="sm"
                onClick={() => {
                  onClose();
                  onDelete?.({ id: question.id, title: question.title });
                }}
                leadingIcon={<Trash2 className="size-3.5" />}
              >
                Delete
              </Button>
            )}
          </div>
          <div className="flex items-center gap-2">
            <Button variant="secondary" size="sm" onClick={onClose}>
              Close
            </Button>
            {canManage && question && (
              <Button
                variant="primary"
                size="sm"
                onClick={() => {
                  onClose();
                  onEdit?.(question.id);
                }}
                leadingIcon={<Edit className="size-3.5" />}
              >
                Edit question
              </Button>
            )}
          </div>
        </div>
      }
    >
      {isLoading && (
        <div className="py-12 text-center text-sm text-fg-subtle">
          Loading question details…
        </div>
      )}

      {isError && (
        <div className="rounded-xl border border-danger/25 bg-danger-soft p-4 text-sm text-danger-text">
          Failed to load question details. Please try again.
        </div>
      )}

      {question && (
        <div className="space-y-6 pt-2">
          {/* Metadata chips */}
          <div className="flex flex-wrap items-center gap-4 border-y border-line py-2.5 text-xs text-fg-subtle">
            <span className="inline-flex items-center gap-1.5 font-medium text-fg">
              <Trophy className="size-3.5 text-primary" />
              <span>{question.points} pts</span>
            </span>
            <span className="inline-flex items-center gap-1.5">
              <Clock className="size-3.5" />
              <span>{question.timeLimitMs} ms</span>
            </span>
            <span className="inline-flex items-center gap-1.5">
              <HardDrive className="size-3.5" />
              <span>{Math.round(question.memoryLimitKb / 1024)} MB</span>
            </span>
            <span className="inline-flex items-center gap-1.5">
              <User className="size-3.5" />
              <span>Author: {question.authorName}</span>
            </span>
          </div>

          {/* Description Preview */}
          <div className="space-y-2">
            <div className="flex items-center gap-1.5 text-xs font-semibold uppercase tracking-wider text-fg-subtle">
              <Eye className="size-3.5 text-fg-subtle" aria-hidden />
              <span>Description</span>
            </div>
            <div className="rounded-xl border border-line bg-surface-2/30 px-5 py-5 sm:px-6">
              <div className="prose-cp max-w-[72ch]">
                <ReactMarkdown
                  remarkPlugins={[remarkGfm]}
                  components={{
                    p: ({ children }) => (
                      <p style={{ whiteSpace: 'pre-wrap' }}>{children}</p>
                    ),
                  }}
                >
                  {question.description}
                </ReactMarkdown>
              </div>
            </div>
          </div>

          {/* SQL Schema */}
          {question.questionType === 'SQL' && question.schemaSql && (
            <div className="space-y-2">
              <div className="flex items-center gap-1.5 text-xs font-semibold uppercase tracking-wider text-fg-subtle">
                <Database className="size-3.5" />
                <span>Initial Database Schema (DDL)</span>
              </div>
              <pre className="overflow-x-auto rounded-xl border border-line bg-surface-2 p-3 font-mono text-xs text-fg">
                <code>{question.schemaSql}</code>
              </pre>
            </div>
          )}

          {/* MCQ Options */}
          {question.questionType === 'MCQ' && question.options && question.options.length > 0 && (
            <div className="space-y-2">
              <h4 className="text-xs font-semibold uppercase tracking-wider text-fg-subtle">Options</h4>
              <div className="space-y-2">
                {question.options.map((option, idx) => (
                  <div
                    key={option.id}
                    className={`flex items-center justify-between rounded-xl border px-3.5 py-2.5 text-sm transition-colors ${
                      option.isCorrect
                        ? 'border-success/30 bg-success-soft text-fg'
                        : 'border-line bg-surface-2/60 text-fg-muted'
                    }`}
                  >
                    <div className="flex items-center gap-2.5">
                      <span className="font-mono text-xs font-semibold text-fg-subtle">
                        {String.fromCharCode(65 + idx)}.
                      </span>
                      <span>{option.optionText}</span>
                    </div>
                    {option.isCorrect && (
                      <span className="flex items-center gap-1 text-xs font-medium text-success-text">
                        <Check className="size-3.5 text-success" /> Correct
                      </span>
                    )}
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Test cases preview for DSA / SQL */}
          {(question.questionType === 'DSA' || question.questionType === 'SQL') && (
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <h4 className="text-xs font-semibold uppercase tracking-wider text-fg-subtle">
                  Test Cases ({question.testCases?.length ?? 0})
                </h4>
                <span className="text-xs text-fg-subtle">
                  {sampleTestCases.length} sample, {hiddenTestCasesCount} hidden
                </span>
              </div>

              {sampleTestCases.length === 0 ? (
                <p className="text-xs text-fg-subtle">No sample test cases configured.</p>
              ) : (
                <div className="space-y-3">
                  {sampleTestCases.map((tc, idx) => (
                    <div
                      key={tc.id}
                      className="overflow-hidden rounded-xl border border-line bg-surface-2/40"
                    >
                      <div className="flex items-center justify-between border-b border-line bg-surface-2 px-3 py-1.5">
                        <span className="font-mono text-[11px] font-medium uppercase tracking-[0.08em] text-fg-subtle">
                          Sample #{idx + 1}
                        </span>
                        <span className="font-mono text-[11px] text-fg-subtle tabular">
                          {tc.weight} {tc.weight === 1 ? 'pt' : 'pts'}
                        </span>
                      </div>
                      <div className="grid gap-2 p-2 sm:grid-cols-2">
                        <SamplePane label="Input" value={tc.input} copyable />
                        <SamplePane
                          label="Expected Output"
                          value={tc.expectedOutput}
                          placeholder="No output specified"
                          copyable={Boolean(tc.expectedOutput)}
                        />
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}
        </div>
      )}
    </Dialog>
  );
};
