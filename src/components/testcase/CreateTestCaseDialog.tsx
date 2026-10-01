import React from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X, FlaskConical } from 'lucide-react';
import { TestCaseForm } from './TestCaseForm';
import type { TestCaseFormData } from './TestCaseForm';

interface CreateTestCaseDialogProps {
  isOpen: boolean;
  onClose: () => void;
  onSubmit: (data: TestCaseFormData) => void;
  isPending: boolean;
}

export const CreateTestCaseDialog: React.FC<CreateTestCaseDialogProps> = ({
  isOpen,
  onClose,
  onSubmit,
  isPending,
}) => {
  return (
    <AnimatePresence>
      {isOpen && (
        <>
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-fg/20 backdrop-blur-sm z-50"
            onClick={onClose}
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
                  <div className="w-9 h-9 rounded-xl bg-primary/10 flex items-center justify-center">
                    <FlaskConical className="w-4 h-4 text-primary-text" />
                  </div>
                  <div>
                    <h2 className="font-display text-lg font-semibold text-fg">
                      Add Test Case
                    </h2>
                    <p className="text-xs text-fg-subtle">Define input and expected output</p>
                  </div>
                </div>
                <button
                  onClick={onClose}
                  className="p-1.5 rounded-lg text-fg-subtle hover:text-fg hover:bg-fg/5 transition-colors cursor-pointer"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>

              {/* Body */}
              <div className="flex-1 overflow-y-auto p-6">
                <TestCaseForm onSubmit={onSubmit} isPending={isPending} />
              </div>
            </motion.div>
          </div>
        </>
      )}
    </AnimatePresence>
  );
};
