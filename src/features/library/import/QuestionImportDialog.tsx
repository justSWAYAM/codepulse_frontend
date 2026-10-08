import React, { useState, useMemo } from 'react';
import {
  AlertTriangle,
  CheckCircle2,
  XCircle,
  Sparkles,
} from 'lucide-react';
import { cn } from '../../../lib/cn';
import { Button, Dialog, Badge, Textarea } from '../../../components/ui';
import { LoadingState } from '../../../components/states/LoadingState';
import { ErrorState } from '../../../components/states/ErrorState';
import { useImportTemplate } from './useImportTemplate';
import { useImportQuestions } from './useImportQuestions';
import { CopyPromptButton } from './CopyPromptButton';
import { ImportPreviewTable } from './ImportPreviewTable';
import {
  IMPORT_TYPES,
  type QuestionType,
  type QuestionImportResponse,
  type BulkImportResult,
} from './types';
import { importErrorMessage } from './importApi';

export interface QuestionImportDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  subjectId: string;
  subjectName: string;
}

export const QuestionImportDialog: React.FC<QuestionImportDialogProps> = ({
  open,
  onOpenChange,
  subjectId,
  subjectName,
}) => {
  const [prevOpen, setPrevOpen] = useState(open);
  const [step, setStep] = useState<1 | 2 | 3>(1);
  const [type, setType] = useState<QuestionType | null>(null);
  const [payload, setPayload] = useState('');
  const [previewedPayload, setPreviewedPayload] = useState<string | null>(null);

  if (prevOpen !== open) {
    setPrevOpen(open);
    if (!open) {
      setStep(1);
      setType(null);
      setPayload('');
      setPreviewedPayload(null);
    }
  }

  const { preview, confirm } = useImportQuestions();
  const template = useImportTemplate(type, open && step >= 2);

  const bytes = useMemo(() => new TextEncoder().encode(payload).length, [payload]);
  const maxBytes = template.data?.maxPayloadBytes ?? 1_048_576;
  const tooLarge = bytes > maxBytes;

  const previewData: QuestionImportResponse | undefined = preview.data;
  const previewIsCurrent = previewData !== undefined && previewedPayload === payload;
  const validCount = previewData?.rows.filter((r) => r.valid).length ?? 0;
  const invalidCount = (previewData?.rows.length ?? 0) - validCount;
  const imported = confirm.isSuccess;
  const confirmResult: QuestionImportResponse | undefined = confirm.data;

  const resetAll = () => {
    setStep(1);
    setType(null);
    setPayload('');
    setPreviewedPayload(null);
    preview.reset();
    confirm.reset();
  };

  const handleOpenChange = (nextOpen: boolean) => {
    if (confirm.isPending) return;
    if (!nextOpen) {
      resetAll();
    }
    onOpenChange(nextOpen);
  };

  const handleTypeChange = (nextType: QuestionType) => {
    if (type !== nextType) {
      setType(nextType);
      setPayload('');
      setPreviewedPayload(null);
      preview.reset();
      confirm.reset();
    }
  };

  const handlePreview = () => {
    if (!type || !payload.trim() || tooLarge || preview.isPending) return;
    preview.mutate(
      { subjectId, type, payload },
      {
        onSuccess: () => {
          setPreviewedPayload(payload);
        },
      },
    );
  };

  const handleConfirm = () => {
    if (!type || !payload.trim() || !previewIsCurrent || validCount === 0 || confirm.isPending || imported) {
      return;
    }
    confirm.mutate({ subjectId, type, payload });
  };

  const currentError = preview.error ?? confirm.error;

  const footer = (
    <div className="flex w-full flex-col-reverse items-center justify-between gap-3 sm:flex-row">
      <div>
        {step > 1 && !imported && (
          <Button
            type="button"
            variant="secondary"
            onClick={() => setStep((s) => (s === 3 ? 2 : 1))}
            disabled={confirm.isPending}
          >
            Back
          </Button>
        )}
      </div>

      <div className="flex items-center gap-2">
        {imported ? (
          <Button type="button" onClick={() => handleOpenChange(false)}>
            Done
          </Button>
        ) : step === 1 ? (
          <>
            <Button type="button" variant="secondary" onClick={() => handleOpenChange(false)}>
              Cancel
            </Button>
            <Button
              type="button"
              disabled={type === null}
              onClick={() => setStep(2)}
            >
              Next
            </Button>
          </>
        ) : step === 2 ? (
          <Button
            type="button"
            disabled={template.isLoading || !template.data}
            onClick={() => setStep(3)}
          >
            Next
          </Button>
        ) : (
          <>
            <Button
              type="button"
              variant="secondary"
              onClick={handlePreview}
              disabled={!payload.trim() || tooLarge || preview.isPending || confirm.isPending}
              loading={preview.isPending}
            >
              Preview
            </Button>
            <Button
              type="button"
              onClick={handleConfirm}
              disabled={!previewIsCurrent || validCount === 0 || confirm.isPending}
              loading={confirm.isPending}
            >
              {confirm.isPending
                ? 'Importing…'
                : `Import ${validCount} question${validCount === 1 ? '' : 's'}`}
            </Button>
          </>
        )}
      </div>
    </div>
  );

  return (
    <Dialog
      open={open}
      onOpenChange={handleOpenChange}
      title={`Import questions into “${subjectName}”`}
      description={imported ? 'Import complete' : `Step ${step} of 3`}
      icon={<Sparkles className="size-5" />}
      size="xl"
      dismissible={!confirm.isPending}
      footer={footer}
    >
      <div className="space-y-4 py-2">
        {/* Step 1: Type Selection */}
        {step === 1 && (
          <div className="space-y-3">
            <p className="text-sm text-fg-muted">
              Choose the question format you want to import. The AI prompt will be tailored to this type.
            </p>
            <div className="grid gap-3 sm:grid-cols-2">
              {IMPORT_TYPES.map((t) => {
                const isSelected = type === t.value;
                return (
                  <button
                    key={t.value}
                    type="button"
                    onClick={() => handleTypeChange(t.value)}
                    className={cn(
                      'flex flex-col items-start gap-1 rounded-2xl border p-4 text-left transition-all duration-150',
                      'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring/50',
                      isSelected
                        ? 'border-primary bg-primary-soft shadow-sm ring-1 ring-primary'
                        : 'border-line bg-surface hover-fine:border-line-strong hover-fine:bg-surface-2/60',
                    )}
                  >
                    <div className="flex w-full items-center justify-between">
                      <span className="font-display text-[15px] font-semibold text-fg">{t.label}</span>
                      <span
                        className={cn(
                          'size-4 rounded-full border flex items-center justify-center',
                          isSelected ? 'border-primary bg-primary' : 'border-line',
                        )}
                      >
                        {isSelected && <span className="size-1.5 rounded-full bg-primary-fg" />}
                      </span>
                    </div>
                    <p className="text-[13px] text-fg-muted">{t.hint}</p>
                  </button>
                );
              })}
            </div>
          </div>
        )}

        {/* Step 2: Copy Prompt */}
        {step === 2 && (
          <div className="space-y-4">
            {template.isLoading ? (
              <LoadingState message="Fetching import prompt…" />
            ) : template.isError ? (
              <ErrorState
                message="Failed to load import prompt from server."
                onRetry={() => template.refetch()}
              />
            ) : (
              <>
                <div className="rounded-xl border border-line bg-surface-2/60 p-3.5 space-y-1.5">
                  <p className="text-xs font-semibold uppercase tracking-wider text-fg-subtle">
                    How it works
                  </p>
                  <ol className="list-decimal pl-4 text-[13px] text-fg-muted space-y-1">
                    <li>Copy the prompt below.</li>
                    <li>Paste it into your AI assistant along with your question list or source document.</li>
                    <li>Copy the AI’s JSON output and proceed to the next step to preview it.</li>
                  </ol>
                </div>

                <div className="space-y-2">
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-medium text-fg-subtle">AI Prompt Template</span>
                    <CopyPromptButton
                      getText={() => template.data?.prompt ?? ''}
                      disabled={!template.data}
                    />
                  </div>
                  <Textarea
                    readOnly
                    value={template.data?.prompt ?? ''}
                    className="h-64 font-mono text-xs leading-relaxed"
                    onFocus={(e) => e.currentTarget.select()}
                  />
                </div>
              </>
            )}
          </div>
        )}

        {/* Step 3: Paste & Preview / Confirm */}
        {step === 3 && (
          <div className="space-y-4">
            {!imported && (
              <div className="space-y-2">
                <div className="flex items-center justify-between text-xs">
                  <label htmlFor="import-payload-input" className="font-medium text-fg-subtle">
                    Paste AI JSON Output
                  </label>
                  <span
                    className={cn(
                      'tabular font-mono',
                      tooLarge ? 'font-semibold text-danger-text' : 'text-fg-subtle',
                    )}
                  >
                    {(bytes / 1024).toFixed(1)} KB / {(maxBytes / 1024).toFixed(0)} KB
                  </span>
                </div>

                <Textarea
                  id="import-payload-input"
                  value={payload}
                  onChange={(e) => setPayload(e.target.value)}
                  placeholder="Paste the exact JSON response here..."
                  className={cn(
                    'h-48 font-mono text-xs leading-relaxed',
                    tooLarge && 'border-danger focus-visible:ring-danger',
                  )}
                  disabled={confirm.isPending}
                />

                {tooLarge && (
                  <p className="text-xs font-medium text-danger-text">
                    Payload exceeds the maximum allowed size ({Math.round(maxBytes / 1024)} KB). Split
                    into smaller batches.
                  </p>
                )}

                {previewData && !previewIsCurrent && (
                  <p className="text-xs font-medium text-warning-text">
                    Text changed — preview again to update.
                  </p>
                )}
              </div>
            )}

            {/* Inline Error Alert */}
            {currentError && !preview.isPending && !confirm.isPending && (
              <div
                role="alert"
                className="flex items-start gap-2.5 rounded-xl border border-danger/30 bg-danger-soft p-3 text-[13px] text-danger-text"
              >
                <AlertTriangle className="size-4 shrink-0 mt-0.5" aria-hidden />
                <span>{importErrorMessage(currentError)}</span>
              </div>
            )}

            {/* Preview Section */}
            {!imported && previewIsCurrent && previewData && (
              <div className="space-y-3 pt-2">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <span className="text-sm font-medium text-fg">Preview</span>
                    <Badge tone="success" size="sm">
                      {validCount} valid
                    </Badge>
                    <Badge tone={invalidCount > 0 ? 'danger' : 'neutral'} size="sm">
                      {invalidCount} with errors
                    </Badge>
                  </div>
                </div>

                {validCount === 0 && (
                  <div
                    role="alert"
                    className="flex items-start gap-2 rounded-xl border border-warning/30 bg-warning-soft p-3 text-[13px] text-warning-text"
                  >
                    <AlertTriangle className="size-4 shrink-0 mt-0.5" aria-hidden />
                    <span>
                      Nothing can be imported — fix the AI output or ask it to correct these rows.
                    </span>
                  </div>
                )}

                <ImportPreviewTable rows={previewData.rows} />
              </div>
            )}

            {/* Post-Import Results Stage */}
            {imported && confirmResult && (
              <ImportResultReport
                result={confirmResult.result}
                subjectName={subjectName}
              />
            )}
          </div>
        )}
      </div>
    </Dialog>
  );
};

interface ImportResultReportProps {
  result: BulkImportResult;
  subjectName: string;
}

const ImportResultReport: React.FC<ImportResultReportProps> = ({ result, subjectName }) => (
  <div className="space-y-4">
    <div className="grid grid-cols-3 gap-3">
      <div className="rounded-xl border border-line bg-surface-2/60 p-3 text-center">
        <p className="tabular font-display text-[20px] font-semibold text-fg">{result.totalRows}</p>
        <p className="text-[12px] text-fg-subtle">Total</p>
      </div>
      <div className="rounded-xl border border-success/20 bg-success-soft p-3 text-center">
        <p className="tabular font-display text-[20px] font-semibold text-success-text">
          {result.succeededCount}
        </p>
        <p className="flex items-center justify-center gap-1 text-[12px] text-success-text">
          <CheckCircle2 className="size-3.5" aria-hidden /> Succeeded
        </p>
      </div>
      <div
        className={cn(
          'rounded-xl border p-3 text-center',
          result.failedCount > 0 ? 'border-danger/20 bg-danger-soft' : 'border-line bg-surface-2/60',
        )}
      >
        <p
          className={cn(
            'tabular font-display text-[20px] font-semibold',
            result.failedCount > 0 ? 'text-danger-text' : 'text-fg-muted',
          )}
        >
          {result.failedCount}
        </p>
        <p
          className={cn(
            'flex items-center justify-center gap-1 text-[12px]',
            result.failedCount > 0 ? 'text-danger-text' : 'text-fg-subtle',
          )}
        >
          <XCircle className="size-3.5" aria-hidden /> Failed
        </p>
      </div>
    </div>

    {result.errors.length > 0 && (
      <div className="space-y-2">
        <p className="text-xs font-medium text-danger-text">Failed Rows:</p>
        <ul className="max-h-60 overflow-y-auto rounded-xl border border-line">
          {result.errors.map((err, i) => (
            <li
              key={i}
              className="flex items-center gap-3 border-b border-line bg-danger-soft/50 px-4 py-2.5 text-[12px] last:border-b-0"
            >
              <XCircle className="size-4 shrink-0 text-danger-text" aria-hidden />
              <span className="tabular w-12 shrink-0 font-mono text-fg-subtle">#{err.rowNumber}</span>
              <span className="min-w-0 flex-1 truncate text-danger-text" title={err.reason}>
                {err.reason}
              </span>
            </li>
          ))}
        </ul>
      </div>
    )}

    {result.failedCount === 0 && result.succeededCount > 0 && (
      <div className="flex items-center gap-3 rounded-xl border border-success/20 bg-success-soft p-4">
        <CheckCircle2 className="size-5 shrink-0 text-success-text" aria-hidden />
        <div>
          <p className="text-sm font-medium text-fg">Questions imported successfully</p>
          <p className="tabular mt-0.5 text-[13px] text-fg-muted">
            {result.succeededCount} question{result.succeededCount !== 1 ? 's' : ''} added to “{subjectName}”
          </p>
        </div>
      </div>
    )}
  </div>
);
