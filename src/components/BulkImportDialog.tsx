import React, { useState, useCallback } from 'react';
import { useDropzone } from 'react-dropzone';
import Papa from 'papaparse';
import { Upload, FileSpreadsheet, CheckCircle2, XCircle, AlertTriangle, Trash2 } from 'lucide-react';
import { useBulkImportUsers } from '../hooks/useUsers';
import type { BulkImportResponse } from '../api/userApi';
import { Button, Dialog, IconButton, Spinner } from './ui';
import { cn } from '../lib/cn';

interface ParsedPreview {
  headers: string[];
  rows: string[][];
  totalRows: number;
  errors: string[];
}

interface BulkImportDialogProps {
  open: boolean;
  onClose: () => void;
}

type Stage = 'upload' | 'preview' | 'importing' | 'results';

const plural = (n: number, word: string) => `${n} ${word}${n === 1 ? '' : 's'}`;

export const BulkImportDialog: React.FC<BulkImportDialogProps> = ({ open, onClose }) => {
  const [stage, setStage] = useState<Stage>('upload');
  const [file, setFile] = useState<File | null>(null);
  const [preview, setPreview] = useState<ParsedPreview | null>(null);
  const [results, setResults] = useState<BulkImportResponse | null>(null);

  const importMutation = useBulkImportUsers();

  const resetState = () => {
    setStage('upload');
    setFile(null);
    setPreview(null);
    setResults(null);
  };

  const handleClose = () => {
    resetState();
    onClose();
  };

  const parseFile = useCallback((accepted: File) => {
    setFile(accepted);

    Papa.parse(accepted, {
      header: false,
      skipEmptyLines: true,
      complete: (result) => {
        const allRows = result.data as string[][];
        const headers = allRows[0] || [];
        const dataRows = allRows.slice(1);
        const errors: string[] = [];

        // Check for expected columns
        const expectedHeaders = ['email', 'name', 'role'];
        const lowerHeaders = headers.map((h) => h.toLowerCase().trim());
        const missing = expectedHeaders.filter((h) => !lowerHeaders.includes(h));
        if (missing.length > 0) {
          errors.push(`Missing expected columns: ${missing.join(', ')}`);
        }

        // Check for empty rows
        dataRows.forEach((row, i) => {
          if (row.every((cell) => !cell.trim())) {
            errors.push(`Row ${i + 2} is empty`);
          }
        });

        if (result.errors.length > 0) {
          result.errors.forEach((e) => {
            errors.push(`Parse error at row ${e.row}: ${e.message}`);
          });
        }

        setPreview({
          headers,
          rows: dataRows.slice(0, 5), // preview first 5
          totalRows: dataRows.length,
          errors,
        });
        setStage('preview');
      },
      error: (err) => {
        setPreview({
          headers: [],
          rows: [],
          totalRows: 0,
          errors: [`Failed to parse CSV: ${err.message}`],
        });
        setStage('preview');
      },
    });
  }, []);

  const { getRootProps, getInputProps, isDragActive } = useDropzone({
    accept: { 'text/csv': ['.csv'] },
    maxFiles: 1,
    onDrop: (acceptedFiles) => {
      if (acceptedFiles[0]) {
        parseFile(acceptedFiles[0]);
      }
    },
  });

  const handleUpload = () => {
    if (!file) return;
    setStage('importing');
    importMutation.mutate(file, {
      onSuccess: (data) => {
        setResults(data);
        setStage('results');
      },
      onError: () => {
        setStage('preview');
      },
    });
  };

  const totalRows = preview?.totalRows ?? 0;
  const canImport = !!file && totalRows > 0 && (preview?.errors?.length ?? 0) === 0;
  const isPending = importMutation.isPending || stage === 'importing';

  const footer =
    stage === 'preview' || stage === 'importing' ? (
      <>
        <Button variant="secondary" onClick={resetState} disabled={isPending}>
          Choose different file
        </Button>
        <Button
          onClick={handleUpload}
          disabled={!canImport}
          loading={isPending}
          leadingIcon={<Upload className="size-4" />}
        >
          Import {plural(totalRows, 'user')}
        </Button>
      </>
    ) : stage === 'results' ? (
      <Button onClick={handleClose}>Done</Button>
    ) : (
      <Button variant="secondary" onClick={handleClose}>
        Cancel
      </Button>
    );

  return (
    <Dialog
      open={open}
      onOpenChange={(o) => !o && handleClose()}
      title="Bulk import users"
      description="Upload a CSV file to create many accounts at once."
      icon={<FileSpreadsheet className="size-[18px]" />}
      size="lg"
      dismissible={!isPending}
      footer={footer}
    >
      {/* ─── Upload Stage ─── */}
      {stage === 'upload' && (
        <div className="space-y-4">
          <div
            {...getRootProps()}
            className={cn(
              'relative cursor-pointer rounded-2xl border-2 border-dashed px-6 py-10 text-center',
              'transition-[border-color,background-color] duration-150',
              'focus-visible:outline-none focus-visible:ring-3 focus-visible:ring-ring/40',
              'bg-[radial-gradient(circle,var(--line-strong)_1px,transparent_1px)] bg-[length:16px_16px]',
              isDragActive
                ? 'border-primary bg-primary-soft'
                : 'border-line-strong hover-fine:border-primary/60 hover-fine:bg-primary-soft/50',
            )}
          >
            <input {...getInputProps()} />
            <div
              className={cn(
                'mx-auto mb-4 flex size-12 items-center justify-center rounded-xl border transition-colors duration-150',
                isDragActive
                  ? 'border-primary/30 bg-primary text-primary-fg'
                  : 'border-line bg-surface text-primary-text',
              )}
            >
              <Upload className="size-5" />
            </div>
            <p className="text-sm font-medium text-fg">
              {isDragActive ? 'Drop your CSV here' : 'Drag & drop your CSV file here'}
            </p>
            <p className="mt-1 text-[13px] text-fg-muted">
              or <span className="font-medium text-primary-text">click to browse</span> · CSV format only
            </p>
          </div>

          <div className="rounded-xl border border-line bg-surface-2/60 p-3">
            <p className="mb-1.5 text-[12px] font-medium text-fg-muted">Expected CSV format</p>
            <p className="mb-1.5 text-[12px] text-fg-subtle">
              Columns are read in this order. Year, branch, division, batch and roll number are for candidates only.
            </p>
            <pre className="overflow-x-auto font-mono text-[12px] leading-5 text-fg-subtle">
              {`Email,Name,Role,Password,Year,Branch,Division,Batch,RollNumber
student1@example.com,Alice Smith,CANDIDATE,SecurePass123!,1,CSE,A,A,10001
student4@example.com,Diana Prince,CANDIDATE,SecurePass123!,4,MECH,,D,10004
eval1@example.com,Evan Lee,EVALUATOR,SecurePass123!,,,,,`}
            </pre>
          </div>
        </div>
      )}

      {/* ─── Preview / Importing Stage ─── */}
      {(stage === 'preview' || stage === 'importing') && preview && (
        <div className="space-y-4">
          {/* File info */}
          <div className="flex items-center gap-3 rounded-xl border border-line bg-surface-2/60 p-3">
            <div className="flex size-9 shrink-0 items-center justify-center rounded-lg bg-primary-soft text-primary-text">
              <FileSpreadsheet className="size-4" />
            </div>
            <div className="min-w-0 flex-1">
              <p className="truncate text-sm font-medium text-fg">{file?.name}</p>
              <p className="tabular text-[12px] text-fg-subtle">
                {stage === 'importing' ? (
                  <span className="inline-flex items-center gap-1.5">
                    <Spinner size={12} /> Importing {plural(totalRows, 'row')}…
                  </span>
                ) : (
                  `${plural(totalRows, 'row')} detected`
                )}
              </p>
            </div>
            <IconButton aria-label="Remove file" size="sm" onClick={resetState} disabled={isPending}>
              <Trash2 className="size-4" />
            </IconButton>
          </div>

          {/* Errors */}
          {preview.errors.length > 0 && (
            <div role="alert" className="rounded-xl border border-danger/30 bg-danger-soft p-3">
              <div className="mb-1.5 flex items-center gap-2">
                <AlertTriangle className="size-4 text-danger-text" aria-hidden />
                <span className="text-[13px] font-medium text-danger-text">
                  {plural(preview.errors.length, 'issue')} found — fix the CSV and upload it again
                </span>
              </div>
              <ul className="list-disc space-y-0.5 pl-10 text-[12px] text-danger-text">
                {preview.errors.map((err, i) => (
                  <li key={i}>{err}</li>
                ))}
              </ul>
            </div>
          )}

          {/* Preview table */}
          {preview.rows.length > 0 && (
            <div className="overflow-hidden rounded-xl border border-line">
              <div className="overflow-x-auto">
                <table className="w-full text-[12px]">
                  <thead>
                    <tr className="border-b border-line bg-surface-2/60">
                      {preview.headers.map((h, i) => (
                        <th key={i} scope="col" className="h-9 px-3 text-left font-medium whitespace-nowrap text-fg-subtle">
                          {h}
                        </th>
                      ))}
                    </tr>
                  </thead>
                  <tbody>
                    {preview.rows.map((row, ri) => (
                      <tr key={ri} className="border-b border-line last:border-b-0">
                        {row.map((cell, ci) => (
                          <td key={ci} className="h-9 px-3 whitespace-nowrap text-fg-muted">
                            {cell}
                          </td>
                        ))}
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
              {preview.totalRows > 5 && (
                <div className="tabular border-t border-line bg-surface-2/60 px-3 py-2 text-center text-[12px] text-fg-subtle">
                  …and {plural(preview.totalRows - 5, 'more row')}
                </div>
              )}
            </div>
          )}
        </div>
      )}

      {/* ─── Results Stage ─── */}
      {stage === 'results' && results && (
        <div className="space-y-4">
          <div className="grid grid-cols-3 gap-3">
            <div className="rounded-xl border border-line bg-surface-2/60 p-3">
              <p className="tabular font-display text-[20px] font-semibold text-fg">{results.totalProcessed}</p>
              <p className="text-[12px] text-fg-subtle">Processed</p>
            </div>
            <div className="rounded-xl border border-success/20 bg-success-soft p-3">
              <p className="tabular font-display text-[20px] font-semibold text-success-text">{results.successCount}</p>
              <p className="flex items-center gap-1 text-[12px] text-success-text">
                <CheckCircle2 className="size-3.5" aria-hidden /> Succeeded
              </p>
            </div>
            <div
              className={cn(
                'rounded-xl border p-3',
                results.failureCount > 0 ? 'border-danger/20 bg-danger-soft' : 'border-line bg-surface-2/60',
              )}
            >
              <p
                className={cn(
                  'tabular font-display text-[20px] font-semibold',
                  results.failureCount > 0 ? 'text-danger-text' : 'text-fg-muted',
                )}
              >
                {results.failureCount}
              </p>
              <p
                className={cn(
                  'flex items-center gap-1 text-[12px]',
                  results.failureCount > 0 ? 'text-danger-text' : 'text-fg-subtle',
                )}
              >
                <XCircle className="size-3.5" aria-hidden /> Failed
              </p>
            </div>
          </div>

          <ul className="max-h-60 overflow-y-auto rounded-xl border border-line">
            {results.results.map((row, i) => (
              <li
                key={i}
                className={cn(
                  'flex items-center gap-3 border-b border-line px-4 py-2.5 text-[12px] last:border-b-0',
                  !row.success && 'bg-danger-soft/50',
                )}
              >
                {row.success ? (
                  <CheckCircle2 className="size-4 shrink-0 text-success-text" aria-hidden />
                ) : (
                  <XCircle className="size-4 shrink-0 text-danger-text" aria-hidden />
                )}
                <span className="tabular w-10 shrink-0 font-mono text-fg-subtle">#{row.row}</span>
                <span className="min-w-0 flex-1 truncate text-fg-muted">{row.email}</span>
                {row.success ? (
                  <span className="shrink-0 text-success-text">Created</span>
                ) : (
                  <span className="max-w-48 shrink-0 truncate text-danger-text" title={row.error ?? undefined}>
                    {row.error || 'Failed'}
                  </span>
                )}
              </li>
            ))}
          </ul>
        </div>
      )}
    </Dialog>
  );
};
