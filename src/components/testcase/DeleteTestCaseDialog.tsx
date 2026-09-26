import React from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { AlertTriangle } from 'lucide-react';

interface DeleteTestCaseDialogProps {
  isOpen: boolean;
  onClose: () => void;
  onConfirm: () => void;
  isDeleting: boolean;
}

export const DeleteTestCaseDialog: React.FC<DeleteTestCaseDialogProps> = ({
  isOpen,
  onClose,
  onConfirm,
  isDeleting,
}) => {
  return (
    <AnimatePresence>
      {isOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={onClose}
            className="absolute inset-0 bg-ink/20 backdrop-blur-sm"
          />
          <motion.div
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 0.95 }}
            className="relative bg-surface rounded-2xl border border-hairline shadow-xl w-full max-w-md overflow-hidden"
          >
            <div className="p-6">
              <div className="w-12 h-12 rounded-full bg-accent-error/10 flex items-center justify-center mb-4">
                <AlertTriangle className="text-accent-error" size={24} />
              </div>
              <h2 className="text-xl font-display font-bold text-ink mb-2">
                Delete Test Case?
              </h2>
              <p className="text-sm text-ink/60 mb-2">
                Are you sure you want to delete this test case? This action cannot be undone.
              </p>
              <p className="text-xs text-ink/40 italic mb-6">
                Test cases can't be edited — if you delete this, you'll need to re-create it from scratch.
              </p>

              <div className="flex items-center justify-end gap-3">
                <button
                  onClick={onClose}
                  disabled={isDeleting}
                  className="px-4 py-2 text-sm font-medium text-ink/60 border border-hairline hover:border-ink/20 hover:text-ink rounded-lg transition-colors disabled:opacity-50 cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  onClick={onConfirm}
                  disabled={isDeleting}
                  className="px-4 py-2 text-sm font-medium text-white bg-accent-error hover:bg-red-600 rounded-lg transition-colors disabled:opacity-50 flex items-center gap-2 cursor-pointer"
                >
                  {isDeleting ? 'Deleting...' : 'Delete Test Case'}
                </button>
              </div>
            </div>
          </motion.div>
        </div>
      )}
    </AnimatePresence>
  );
};
