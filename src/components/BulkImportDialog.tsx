import React, { useState, useCallback } from 'react';
import { useDropzone } from 'react-dropzone';
import Papa from 'papaparse';
import {
  X,
  Upload,
  FileSpreadsheet,
  CheckCircle2,
  XCircle,
  AlertTriangle,
  Loader2,
  Trash2,
} from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { useBulkImportUsers } from '../hooks/useUsers';
import type { BulkImportResponse } from '../api/userApi';

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

  return (
    <AnimatePresence>
      {open && (
        <>
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-fg/20 backdrop-blur-sm z-50"
            onClick={handleClose}
          />

          <div className="fixed inset-0 flex items-center justify-center z-50 p-4">
            <motion.div
              initial={{ opacity: 0, scale: 0.95, y: 8 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95, y: 8 }}
              transition={{ duration: 0.2, ease: 'easeOut' }}
              className="bg-surface rounded-2xl border border-line shadow-lg w-full max-w-lg max-h-[85vh] overflow-hidden flex flex-col"
              onClick={(e) => e.stopPropagation()}
            >
              {/* Header */}
              <div className="flex items-center justify-between p-6 border-b border-line shrink-0">
                <div className="flex items-center gap-3">
                  <div className="w-9 h-9 rounded-xl bg-warning-soft flex items-center justify-center">
                    <FileSpreadsheet className="w-4 h-4 text-warning-text" />
                  </div>
                  <div>
                    <h2 className="font-display text-lg font-semibold text-fg">
                      Bulk Import Users
                    </h2>
                    <p className="text-xs text-fg-subtle">Upload a CSV file to import users</p>
                  </div>
                </div>
                <button
                  onClick={handleClose}
                  className="p-1.5 rounded-lg text-fg-subtle hover:text-fg hover:bg-fg/5 transition-colors cursor-pointer"
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
                        className={`relative border-2 border-dashed rounded-2xl p-10 text-center cursor-pointer transition ${
                          isDragActive
                            ? 'border-primary bg-primary/5'
                            : 'border-line hover:border-line-strong hover:bg-primary/[0.02]'
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
                          <div className="w-14 h-14 rounded-2xl bg-warning-soft flex items-center justify-center mx-auto mb-4">
                            <Upload
                              className={`w-6 h-6 transition-colors ${
                                isDragActive ? 'text-primary-text' : 'text-warning-text'
                              }`}
                            />
                          </div>
                          <p className="text-sm font-medium text-fg mb-1">
                            {isDragActive
                              ? 'Drop your CSV here'
                              : 'Drag & drop your CSV file here'}
                          </p>
                          <p className="text-xs text-fg-subtle">
                            or click to browse · CSV format only
                          </p>
                        </motion.div>
                      </div>

                      <div className="mt-4 p-3 rounded-lg bg-primary/[0.03] border border-line">
                        <p className="text-xs text-fg-muted font-medium mb-1">Expected CSV format:</p>
                        <code className="text-[11px] font-mono text-fg-subtle block">
                          email, name, role, password, rollNumber, year, branch, division, batch
                          <br />
                          john@example.com, John Doe, CANDIDATE, password123, 12345, 1, CSE, A, B
                          <br />
                          jane@example.com, Jane Smith, EVALUATOR, , , , , , 
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
                      <div className="flex items-center justify-between p-3 rounded-xl bg-primary/5 border border-primary/10">
                        <div className="flex items-center gap-3">
                          <FileSpreadsheet className="w-5 h-5 text-primary-text" />
                          <div>
                            <p className="text-sm font-medium text-fg">{file?.name}</p>
                            <p className="text-xs text-fg-subtle">
                              {preview.totalRows} row{preview.totalRows !== 1 ? 's' : ''} detected
                            </p>
                          </div>
                        </div>
                        <button
                          onClick={resetState}
                          className="p-1.5 rounded-lg text-fg-subtle hover:text-danger-text hover:bg-danger-soft transition-colors cursor-pointer"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </div>

                      {/* Errors */}
                      {preview.errors.length > 0 && (
                        <div className="p-3 rounded-xl bg-danger-soft border border-danger/30 space-y-1">
                          <div className="flex items-center gap-2 mb-1">
                            <AlertTriangle className="w-4 h-4 text-danger-text" />
                            <span className="text-xs font-semibold text-danger-text">
                              Issues found
                            </span>
                          </div>
                          {preview.errors.map((err, i) => (
                            <p key={i} className="text-xs text-danger-text pl-6">
                              • {err}
                            </p>
                          ))}
                        </div>
                      )}

                      {/* Preview table */}
                      {preview.rows.length > 0 && (
                        <div className="rounded-xl border border-line overflow-hidden">
                          <div className="overflow-x-auto">
                            <table className="w-full text-xs">
                              <thead>
                                <tr className="bg-canvas/60 border-b border-line">
                                  {preview.headers.map((h, i) => (
                                    <th
                                      key={i}
                                      className="px-3 py-2 text-left font-semibold text-fg-muted uppercase tracking-wider"
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
                                    className="border-b border-line last:border-b-0"
                                  >
                                    {row.map((cell, ci) => (
                                      <td key={ci} className="px-3 py-2 text-fg-muted">
                                        {cell}
                                      </td>
                                    ))}
                                  </tr>
                                ))}
                              </tbody>
                            </table>
                          </div>
                          {preview.totalRows > 5 && (
                            <div className="px-3 py-2 bg-primary/[0.02] border-t border-line text-center">
                              <span className="text-[11px] text-fg-subtle">
                                …and {preview.totalRows - 5} more rows
                              </span>
                            </div>
                          )}
                        </div>
                      )}
                    </motion.div>
                  )}

                  {/* ─── Importing Stage ─── */}
                  {stage === 'importing' && (
                    <motion.div
                      key="importing"
                      initial={{ opacity: 0 }}
                      animate={{ opacity: 1 }}
                      exit={{ opacity: 0 }}
                      className="py-12 text-center"
                    >
                      <Loader2 className="w-10 h-10 animate-spin text-primary-text mx-auto mb-4" />
                      <p className="text-sm font-medium text-fg">Importing users...</p>
                      <p className="text-xs text-fg-subtle mt-1">
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
                      className="space-y-4"
                    >
                      {/* Summary */}
                      <div className="grid grid-cols-3 gap-3">
                        <div className="p-3 rounded-xl bg-primary/[0.03] text-center">
                          <p className="text-lg font-bold font-display text-fg">
                            {results.totalProcessed}
                          </p>
                          <p className="text-[11px] text-fg-subtle">Total</p>
                        </div>
                        <div className="p-3 rounded-xl bg-primary/5 text-center">
                          <p className="text-lg font-bold font-display text-primary-text">
                            {results.successCount}
                          </p>
                          <p className="text-[11px] text-primary-text">Succeeded</p>
                        </div>
                        <div className="p-3 rounded-xl bg-danger-soft text-center">
                          <p className="text-lg font-bold font-display text-danger-text">
                            {results.failureCount}
                          </p>
                          <p className="text-[11px] text-danger-text">Failed</p>
                        </div>
                      </div>

                      {/* Per-row results */}
                      <div className="rounded-xl border border-line overflow-hidden max-h-60 overflow-y-auto">
                        {results.results.map((row, i) => (
                          <div
                            key={i}
                            className={`flex items-center gap-3 px-4 py-2.5 text-xs border-b border-line last:border-b-0 ${
                              row.success ? '' : 'bg-danger/[0.03]'
                            }`}
                          >
                            {row.success ? (
                              <CheckCircle2 className="w-4 h-4 text-primary-text shrink-0" />
                            ) : (
                              <XCircle className="w-4 h-4 text-danger-text shrink-0" />
                            )}
                            <span className="font-mono text-fg-muted w-8 shrink-0">
                              #{row.row}
                            </span>
                            <span className="text-fg-muted truncate flex-1">{row.email}</span>
                            {row.error && (
                              <span className="text-danger-text text-[11px] truncate max-w-40">
                                {row.error}
                              </span>
                            )}
                          </div>
                        ))}
                      </div>
                    </motion.div>
                  )}
                </AnimatePresence>
              </div>

              {/* Footer */}
              <div className="p-6 border-t border-line shrink-0">
                {stage === 'preview' && (
                  <div className="flex items-center justify-end gap-2">
                    <button
                      onClick={resetState}
                      className="px-4 py-2 rounded-lg text-sm font-medium text-fg-muted border border-line hover:border-line-strong hover:text-fg transition-colors cursor-pointer"
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
                      className="px-4 py-2 rounded-lg bg-primary text-white text-sm font-medium hover:bg-primary-hover transition-colors disabled:opacity-40 disabled:cursor-not-allowed cursor-pointer flex items-center gap-2"
                    >
                      <Upload className="w-3.5 h-3.5" />
                      Import {preview?.totalRows} Users
                    </motion.button>
                  </div>
                )}
                {stage === 'results' && (
                  <div className="flex items-center justify-end">
                    <motion.button
                      onClick={handleClose}
                      whileHover={{ scale: 1.01 }}
                      whileTap={{ scale: 0.97 }}
                      className="px-4 py-2 rounded-lg bg-primary text-white text-sm font-medium hover:bg-primary-hover transition-colors cursor-pointer"
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
