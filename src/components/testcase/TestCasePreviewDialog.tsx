import React from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X, Eye } from 'lucide-react';
import type { TestCaseAdminRecord } from '../../api/testCaseApi';

interface TestCasePreviewDialogProps {
  isOpen: boolean;
  onClose: () => void;
  testCase: TestCaseAdminRecord | null;
}

export const TestCasePreviewDialog: React.FC<TestCasePreviewDialogProps> = ({
  isOpen,
  onClose,
  testCase,
}) => {
  if (!testCase) return null;

  return (
    <AnimatePresence>
      {isOpen && (
        <>
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-ink/20 backdrop-blur-sm z-50"
            onClick={onClose}
          />

          <div className="fixed inset-0 flex items-center justify-center z-50 p-4">
            <motion.div
              initial={{ opacity: 0, scale: 0.95, y: 8 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95, y: 8 }}
              transition={{ duration: 0.2, ease: 'easeOut' }}
              className="bg-surface rounded-2xl border border-hairline shadow-lg w-full max-w-xl max-h-[85vh] overflow-hidden flex flex-col"
              onClick={(e) => e.stopPropagation()}
            >
              {/* Header */}
              <div className="flex items-center justify-between p-6 border-b border-hairline shrink-0">
                <div className="flex items-center gap-3">
                  <div className="w-9 h-9 rounded-xl bg-accent-syntax/10 flex items-center justify-center">
                    <Eye className="w-4 h-4 text-accent-syntax" />
                  </div>
                  <div>
                    <h2 className="font-display text-lg font-semibold text-ink">
                      Test Case Preview
                    </h2>
                    <div className="flex items-center gap-2 mt-0.5">
                      <span className="text-xs text-ink/40 font-mono">
                        #{testCase.orderIndex + 1}
                      </span>
                      <span
                        className={`px-2 py-0.5 rounded-full text-[10px] font-semibold ${
                          testCase.isSample
                            ? 'bg-accent-compile/10 text-accent-compile'
                            : 'bg-ink/5 text-ink/40 border border-hairline'
                        }`}
                      >
                        {testCase.isSample ? 'Sample' : 'Hidden'}
                      </span>
                      <span className="text-xs text-ink/30 font-mono">
                        Weight: {testCase.weight}
                      </span>
                    </div>
                  </div>
                </div>
                <button
                  onClick={onClose}
                  className="p-1.5 rounded-lg text-ink/30 hover:text-ink hover:bg-ink/5 transition-colors cursor-pointer"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>

              {/* Body */}
              <div className="flex-1 overflow-y-auto p-6 space-y-5">
                {/* Input */}
                <div>
                  <label className="block text-xs font-semibold text-ink/50 uppercase tracking-wider mb-2">
                    Input
                  </label>
                  <div className="bg-background border border-hairline rounded-xl p-4 overflow-x-auto">
                    <pre className="font-mono text-sm text-ink whitespace-pre-wrap break-words">
                      {testCase.input}
                    </pre>
                  </div>
                </div>

                {/* Expected Output */}
                <div>
                  <label className="block text-xs font-semibold text-ink/50 uppercase tracking-wider mb-2">
                    Expected Output
                  </label>
                  <div className="bg-background border border-hairline rounded-xl p-4 overflow-x-auto">
                    <pre className="font-mono text-sm text-ink whitespace-pre-wrap break-words">
                      {testCase.expectedOutput}
                    </pre>
                  </div>
                </div>
              </div>
            </motion.div>
          </div>
        </>
      )}
    </AnimatePresence>
  );
};
