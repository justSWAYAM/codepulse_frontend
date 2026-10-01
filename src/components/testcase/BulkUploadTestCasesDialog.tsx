import React, { useState, useCallback } from 'react';
import { useDropzone } from 'react-dropzone';
import Papa from 'papaparse';
import {
  X,
  Upload,
  FileSpreadsheet,
  Loader2,
  Trash2,
  AlertTriangle,
  Download,
} from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
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

  return (
    <AnimatePresence>
      {isOpen && (
        <>
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-ink/20 backdrop-blur-sm z-50"
            onClick={handleClose}
          />

          <div className="fixed inset-0 flex items-center justify-center z-50 p-4">
            <motion.div
              initial={{ opacity: 0, scale: 0.95, y: 8 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95, y: 8 }}
              transition={{ duration: 0.2, ease: 'easeOut' }}
              className="bg-surface rounded-2xl border border-hairline shadow-lg w-full max-w-lg max-h-[85vh] overflow-hidden flex flex-col"
              onClick={(e) => e.stopPropagation()}
            >
              {/* Header */}
              <div className="flex items-center justify-between p-6 border-b border-hairline shrink-0">
                <div className="flex items-center gap-3">
                  <div className="w-9 h-9 rounded-xl bg-accent-syntax/10 flex items-center justify-center">
                    <FileSpreadsheet className="w-4 h-4 text-accent-syntax" />
                  </div>
                  <div>
                    <h2 className="font-display text-lg font-semibold text-ink">
                      Bulk Upload Test Cases
                    </h2>
                    <p className="text-xs text-ink/40">Upload a CSV file with test case data</p>
                  </div>
                </div>
                <button
                  onClick={handleClose}
                  className="p-1.5 rounded-lg text-ink/30 hover:text-ink hover:bg-ink/5 transition-colors cursor-pointer"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>

              {/* Body */}
              <div className="flex-1 overflow-y-auto p-6">
                <AnimatePresence mode="wait">
                  {/* ─── Upload Stage ─── */}
                  {stage === 'upload' && (
                    <motion.div
                      key="upload"
                      initial={{ opacity: 0, y: 8 }}
                      animate={{ opacity: 1, y: 0 }}
                      exit={{ opacity: 0, y: -8 }}
                    >
                      <div
                        {...getRootProps()}
                        className={`relative border-2 border-dashed rounded-2xl p-10 text-center cursor-pointer transition-all ${
                          isDragActive
                            ? 'border-accent-compile bg-accent-compile/5'
                            : 'border-hairline hover:border-ink/20 hover:bg-ink/[0.02]'
                        }`}
                      >
                        {/* Dotted grid background */}
                        <div
                          className="absolute inset-0 opacity-[0.04] rounded-2xl"
                          style={{
                            backgroundImage:
                              'radial-gradient(circle, #1B1E3A 1px, transparent 1px)',
                            backgroundSize: '16px 16px',
                          }}
                        />
                        <input {...getInputProps()} />
                        <motion.div
                          animate={isDragActive ? { scale: 1.05 } : { scale: 1 }}
                          transition={{ type: 'spring', stiffness: 300 }}
                          className="relative z-10"
                        >
                          <div className="w-14 h-14 rounded-2xl bg-accent-syntax/10 flex items-center justify-center mx-auto mb-4">
                            <Upload
                              className={`w-6 h-6 transition-colors ${
                                isDragActive ? 'text-accent-compile' : 'text-accent-syntax'
                              }`}
                            />
                          </div>
                          <p className="text-sm font-medium text-ink mb-1">
                            {isDragActive
                              ? 'Drop your CSV here'
                              : 'Drag & drop your CSV file here'}
                          </p>
                          <p className="text-xs text-ink/40">
                            or click to browse · CSV format only
                          </p>
                        </motion.div>
                      </div>

                      <div className="mt-4 p-3 rounded-lg bg-ink/[0.03] border border-hairline">
                        <div className="flex items-center justify-between mb-1">
                          <p className="text-xs text-ink/50 font-medium">Expected CSV format:</p>
                          <button
                            onClick={(e) => {
                              e.stopPropagation();
                              downloadTemplate();
                            }}
                            className="flex items-center gap-1 text-[11px] text-accent-compile hover:underline cursor-pointer"
                          >
                            <Download className="w-3 h-3" />
                            Download template
                          </button>
                        </div>
                        <code className="text-[11px] font-mono text-ink/40 block">
                          input, expected_output, is_sample, weight
                          <br />
                          &quot;1 2&quot;, &quot;3&quot;, true, 10
                          <br />
                          &quot;5 3&quot;, &quot;8&quot;, false, 20
                        </code>
                      </div>
                    </motion.div>
                  )}

                  {/* ─── Preview Stage ─── */}
                  {stage === 'preview' && preview && (
                    <motion.div
                      key="preview"
                      initial={{ opacity: 0, y: 8 }}
                      animate={{ opacity: 1, y: 0 }}
                      exit={{ opacity: 0, y: -8 }}
                      className="space-y-4"
                    >
                      {/* File info */}
                      <div className="flex items-center justify-between p-3 rounded-xl bg-accent-compile/5 border border-accent-compile/10">
                        <div className="flex items-center gap-3">
                          <FileSpreadsheet className="w-5 h-5 text-accent-compile" />
                          <div>
                            <p className="text-sm font-medium text-ink">{file?.name}</p>
                            <p className="text-xs text-ink/40">
                              {preview.totalRows} row{preview.totalRows !== 1 ? 's' : ''} detected
                            </p>
                          </div>
                        </div>
                        <button
                          onClick={resetState}
                          className="p-1.5 rounded-lg text-ink/30 hover:text-accent-error hover:bg-accent-error/5 transition-colors cursor-pointer"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </div>

                      {/* Errors */}
                      {preview.errors.length > 0 && (
                        <div className="p-3 rounded-xl bg-accent-error/5 border border-accent-error/10 space-y-1">
                          <div className="flex items-center gap-2 mb-1">
                            <AlertTriangle className="w-4 h-4 text-accent-error" />
                            <span className="text-xs font-semibold text-accent-error">
                              Issues found
                            </span>
                          </div>
                          {preview.errors.map((err, i) => (
                            <p key={i} className="text-xs text-accent-error/80 pl-6">
                              • {err}
                            </p>
                          ))}
                        </div>
                      )}

                      {/* Preview table */}
                      {preview.rows.length > 0 && (
                        <div className="rounded-xl border border-hairline overflow-hidden">
                          <div className="overflow-x-auto">
                            <table className="w-full text-xs">
                              <thead>
                                <tr className="bg-background/60 border-b border-hairline">
                                  {preview.headers.map((h, i) => (
                                    <th
                                      key={i}
                                      className="px-3 py-2 text-left font-semibold text-ink/50 uppercase tracking-wider"
                                    >
                                      {h}
                                    </th>
                                  ))}
                                </tr>
                              </thead>
                              <tbody>
                                {preview.rows.map((row, ri) => (
                                  <tr
                                    key={ri}
                                    className="border-b border-hairline/60 last:border-b-0"
                                  >
                                    {row.map((cell, ci) => (
                                      <td key={ci} className="px-3 py-2 text-ink/70 font-mono">
                                        {cell}
                                      </td>
                                    ))}
                                  </tr>
                                ))}
                              </tbody>
                            </table>
                          </div>
                          {preview.totalRows > 5 && (
                            <div className="px-3 py-2 bg-ink/[0.02] border-t border-hairline text-center">
                              <span className="text-[11px] text-ink/40">
                                …and {preview.totalRows - 5} more rows
                              </span>
                            </div>
                          )}
                        </div>
                      )}
                    </motion.div>
                  )}

                  {/* ─── Uploading Stage ─── */}
                  {stage === 'uploading' && (
                    <motion.div
                      key="uploading"
                      initial={{ opacity: 0 }}
                      animate={{ opacity: 1 }}
                      exit={{ opacity: 0 }}
                      className="py-12 text-center"
                    >
                      <Loader2 className="w-10 h-10 animate-spin text-accent-compile mx-auto mb-4" />
                      <p className="text-sm font-medium text-ink">Uploading test cases...</p>
                      <p className="text-xs text-ink/40 mt-1">
                        Processing {preview?.totalRows} rows
                      </p>
                    </motion.div>
                  )}

                  {/* ─── Results Stage ─── */}
                  {stage === 'results' && results && (
                    <motion.div
                      key="results"
                      initial={{ opacity: 0, y: 8 }}
                      animate={{ opacity: 1, y: 0 }}
                      exit={{ opacity: 0, y: -8 }}
                    >
                      <TestCaseBulkUploadResultReport result={results} />
                    </motion.div>
                  )}
                </AnimatePresence>
              </div>

              {/* Footer */}
              <div className="p-6 border-t border-hairline shrink-0">
                {stage === 'preview' && (
                  <div className="flex items-center justify-end gap-2">
                    <button
                      onClick={resetState}
                      className="px-4 py-2 rounded-lg text-sm font-medium text-ink/60 border border-hairline hover:border-ink/20 hover:text-ink transition-colors cursor-pointer"
                    >
                      Choose different file
                    </button>
                    <motion.button
                      onClick={handleUpload}
                      disabled={
                        !file ||
                        preview?.totalRows === 0 ||
                        (preview?.errors?.length ?? 0) > 0
                      }
                      whileHover={{ scale: 1.01 }}
                      whileTap={{ scale: 0.97 }}
                      className="px-4 py-2 rounded-lg bg-accent-compile text-white text-sm font-medium hover:bg-accent-compile-hover transition-colors disabled:opacity-40 disabled:cursor-not-allowed cursor-pointer flex items-center gap-2"
                    >
                      <Upload className="w-3.5 h-3.5" />
                      Upload {preview?.totalRows} Test Cases
                    </motion.button>
                  </div>
                )}
                {stage === 'results' && (
                  <div className="flex items-center justify-end">
                    <motion.button
                      onClick={handleClose}
                      whileHover={{ scale: 1.01 }}
                      whileTap={{ scale: 0.97 }}
                      className="px-4 py-2 rounded-lg bg-accent-compile text-white text-sm font-medium hover:bg-accent-compile-hover transition-colors cursor-pointer"
                    >
                      Done
                    </motion.button>
                  </div>
                )}
              </div>
            </motion.div>
          </div>
        </>
      )}
    </AnimatePresence>
  );
};
