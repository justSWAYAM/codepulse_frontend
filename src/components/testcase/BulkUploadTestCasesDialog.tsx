import React, { useState, useCallback } from 'react';
import { useDropzone } from 'react-dropzone';
import Papa from 'papaparse';
import { Upload, FileSpreadsheet, Trash2, AlertTriangle, Download } from 'lucide-react';
import { cn } from '../../lib/cn';
import { Button, Dialog, IconButton, Spinner } from '../ui';
import { useBulkUploadTestCases } from '../../hooks/useTestCases';
import type { TestCaseBulkUploadResult } from '../../api/testCaseApi';
import { TestCaseBulkUploadResultReport } from './TestCaseBulkUploadResultReport';

interface ParsedPreview {
  headers: string[];
  rows: string[][];
  totalRows: number;
  errors: string[];
}

interface BulkUploadTestCasesDialogProps {
  isOpen: boolean;
  onClose: () => void;
  questionId: string;
  contestId: string;
}

type Stage = 'upload' | 'preview' | 'uploading' | 'results';

/** Generate and download a CSV template */
function downloadTemplate() {
  const csv = `input,expected_output,is_sample,weight\n"1 2","3",true,10\n"5 3","8",false,20\n`;
  const blob = new Blob([csv], { type: 'text/csv' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = 'test_cases_template.csv';
  a.click();
  URL.revokeObjectURL(url);
}

export const BulkUploadTestCasesDialog: React.FC<BulkUploadTestCasesDialogProps> = ({
  isOpen,
  onClose,
  questionId,
  contestId,
}) => {
  const [stage, setStage] = useState<Stage>('upload');
  const [file, setFile] = useState<File | null>(null);
  const [preview, setPreview] = useState<ParsedPreview | null>(null);
  const [results, setResults] = useState<TestCaseBulkUploadResult | null>(null);

  const uploadMutation = useBulkUploadTestCases(contestId, questionId);

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

        // Validate expected headers
        const expectedHeaders = ['input', 'expected_output', 'is_sample', 'weight'];
        const lowerHeaders = headers.map((h) => h.toLowerCase().trim());
        const missing = expectedHeaders.filter((h) => !lowerHeaders.includes(h));
        if (missing.length > 0) {
          errors.push(`Missing expected columns: ${missing.join(', ')}`);
        }

        // Validate per-row data
        const isSampleIdx = lowerHeaders.indexOf('is_sample');
        const weightIdx = lowerHeaders.indexOf('weight');

        dataRows.forEach((row, i) => {
          // Check for totally empty rows
          if (row.every((cell) => !cell.trim())) {
            errors.push(`Row ${i + 2} is empty`);
            return;
          }

          // Validate is_sample — backend accepts only true/false
          if (isSampleIdx >= 0 && row[isSampleIdx] !== undefined) {
            const val = row[isSampleIdx].trim().toLowerCase();
            if (!['true', 'false'].includes(val)) {
              errors.push(`Row ${i + 2}: is_sample "${row[isSampleIdx]}" must be true or false`);
            }
          }

          // Validate weight — backend parses it with Integer.parseInt and rejects negatives
          if (weightIdx >= 0 && row[weightIdx] !== undefined) {
            const val = row[weightIdx].trim();
            if (!/^\d+$/.test(val)) {
              errors.push(`Row ${i + 2}: weight "${row[weightIdx]}" must be a non-negative whole number`);
            }
          }
        });

        if (result.errors.length > 0) {
          result.errors.forEach((e) => {
            errors.push(`Parse error at row ${e.row}: ${e.message}`);
          });
        }

        setPreview({
          headers,
          rows: dataRows.slice(0, 5),
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
    setStage('uploading');
    uploadMutation.mutate(file, {
      onSuccess: (data) => {
        setResults(data);
        setStage('results');
      },
      onError: () => {
        setStage('preview');
      },
    });
  };

  const canUpload = !!file && (preview?.totalRows ?? 0) > 0 && (preview?.errors.length ?? 0) === 0;

  const footer =
    stage === 'preview' ? (
      <>
        <Button variant="secondary" onClick={resetState}>
          Choose different file
        </Button>
        <Button onClick={handleUpload} disabled={!canUpload} leadingIcon={<Upload className="size-4" />}>
          Upload {preview?.totalRows} test case{preview?.totalRows !== 1 ? 's' : ''}
        </Button>
      </>
    ) : stage === 'results' ? (
      <Button onClick={handleClose}>Done</Button>
    ) : undefined;

  return (
    <Dialog
      open={isOpen}
      onOpenChange={(open) => !open && handleClose()}
      title="Bulk upload test cases"
      description="Import many test cases at once from a CSV file."
      icon={<FileSpreadsheet className="size-5" />}
      size="lg"
      dismissible={stage !== 'uploading'}
      footer={footer}
    >
      {stage === 'upload' && (
        <div className="space-y-4">
          <div
            {...getRootProps()}
            className={cn(
              'flex cursor-pointer flex-col items-center rounded-2xl border-2 border-dashed px-6 py-10 text-center',
              'transition-[background-color,border-color] duration-150 focus-visible:outline-2 focus-visible:outline-ring',
              isDragActive
                ? 'border-primary bg-primary-soft'
                : 'border-line-strong bg-surface-2/40 hover-fine:border-primary/50 hover-fine:bg-surface-2',
            )}
          >
            <input {...getInputProps()} />
            <div
              className={cn(
                'mb-4 flex size-12 items-center justify-center rounded-2xl transition-colors duration-150',
                isDragActive ? 'bg-primary text-primary-fg' : 'bg-primary-soft text-primary-text',
              )}
            >
              <Upload className="size-5" aria-hidden />
            </div>
            <p className="text-sm font-medium text-fg">
              {isDragActive ? 'Drop your CSV to preview it' : 'Drag a CSV file here, or click to browse'}
            </p>
            <p className="mt-1 text-[13px] text-fg-subtle">One file, .csv only</p>
          </div>

          <div className="rounded-xl border border-line bg-surface-2/60 p-4">
            <div className="mb-2 flex items-center justify-between gap-3">
              <p className="text-[13px] font-medium text-fg">Expected columns</p>
              <Button
                variant="ghost"
                size="sm"
                className="-mr-2 text-primary-text"
                leadingIcon={<Download className="size-3.5" />}
                onClick={(e) => {
                  e.stopPropagation();
                  downloadTemplate();
                }}
              >
                Download template
              </Button>
            </div>
            <pre className="scroll-thin overflow-x-auto font-mono text-[12px] leading-5 text-fg-muted">
              {'input,expected_output,is_sample,weight\n"1 2","3",true,10\n"5 3","8",false,20'}
            </pre>
          </div>
        </div>
      )}

      {stage === 'preview' && preview && (
        <div className="space-y-4">
          <div className="flex items-center gap-3 rounded-xl border border-line bg-surface-2/60 p-3">
            <div className="flex size-9 shrink-0 items-center justify-center rounded-lg bg-primary-soft text-primary-text">
              <FileSpreadsheet className="size-4" aria-hidden />
            </div>
            <div className="min-w-0 flex-1">
              <p className="truncate text-sm font-medium text-fg">{file?.name}</p>
              <p className="tabular text-[12px] text-fg-subtle">
                {preview.totalRows} row{preview.totalRows !== 1 ? 's' : ''} detected
              </p>
            </div>
            <IconButton aria-label="Remove file" size="sm" onClick={resetState} className="hover-fine:text-danger-text">
              <Trash2 className="size-4" />
            </IconButton>
          </div>

          {preview.errors.length > 0 && (
            <div role="alert" className="rounded-xl border border-danger/30 bg-danger-soft p-3">
              <div className="mb-1.5 flex items-center gap-2">
                <AlertTriangle className="size-4 text-danger-text" aria-hidden />
                <span className="text-[13px] font-medium text-danger-text">Fix these issues and re-upload the file</span>
              </div>
              <ul className="list-disc space-y-0.5 pl-10 text-[12px] leading-5 text-danger-text">
                {preview.errors.map((err, i) => (
                  <li key={i}>{err}</li>
                ))}
              </ul>
            </div>
          )}

          {preview.rows.length > 0 && (
            <div className="overflow-hidden rounded-xl border border-line">
              <div className="scroll-thin overflow-x-auto">
                <table className="w-full text-[12px]">
                  <thead>
                    <tr className="border-b border-line bg-surface-2/60">
                      {preview.headers.map((h, i) => (
                        <th key={i} className="px-3 py-2 text-left font-mono font-medium text-fg-subtle">
                          {h}
                        </th>
                      ))}
                    </tr>
                  </thead>
                  <tbody>
                    {preview.rows.map((row, ri) => (
                      <tr key={ri} className="border-b border-line last:border-b-0">
                        {row.map((cell, ci) => (
                          <td key={ci} className="tabular max-w-[180px] truncate px-3 py-2 font-mono text-fg-muted">
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
                  …and {preview.totalRows - 5} more rows
                </div>
              )}
            </div>
          )}
        </div>
      )}

      {stage === 'uploading' && (
        <div className="flex flex-col items-center py-12 text-center text-fg-subtle" aria-live="polite">
          <Spinner size={24} />
          <p className="mt-4 text-sm font-medium text-fg">Uploading test cases…</p>
          <p className="tabular mt-1 text-[13px] text-fg-subtle">Processing {preview?.totalRows} rows</p>
        </div>
      )}

      {stage === 'results' && results && <TestCaseBulkUploadResultReport result={results} />}
    </Dialog>
  );
};
