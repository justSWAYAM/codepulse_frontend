import React from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { AlertTriangle } from 'lucide-react';

interface DeleteQuestionDialogProps {
  isOpen: boolean;
  onClose: () => void;
  onConfirm: () => void;
  title: string;
  isDeleting: boolean;
}

export const DeleteQuestionDialog: React.FC<DeleteQuestionDialogProps> = ({
  isOpen,
  onClose,
  onConfirm,
  title,
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
            className="absolute inset-0 bg-scrim backdrop-blur-sm"
          />
          <motion.div
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 0.95 }}
            className="relative bg-surface rounded-xl shadow-xl w-full max-w-md overflow-hidden"
          >
            <div className="p-6">
              <div className="w-12 h-12 rounded-full bg-danger-soft flex items-center justify-center mb-4">
                <AlertTriangle className="text-danger-text" size={24} />
              </div>
              <h2 className="text-xl font-display font-bold text-fg mb-2">
                Delete Question?
              </h2>
              <p className="text-fg-muted mb-6">
                Are you sure you want to delete <span className="font-semibold text-fg">{title}</span>? This action cannot be undone and will remove the question from the contest.
              </p>
              
              <div className="flex items-center justify-end gap-3">
                <button
                  onClick={onClose}
                  disabled={isDeleting}
                  className="px-4 py-2 text-sm font-medium text-fg bg-surface-2 hover:bg-surface-3 rounded-md transition-colors disabled:opacity-50"
                >
                  Cancel
                </button>
                <button
                  onClick={onConfirm}
                  disabled={isDeleting}
                  className="px-4 py-2 text-sm font-medium text-white bg-danger hover:bg-danger rounded-md transition-colors disabled:opacity-50 flex items-center gap-2"
                >
                  {isDeleting ? 'Deleting...' : 'Delete Question'}
                </button>
              </div>
            </div>
          </motion.div>
        </div>
      )}
    </AnimatePresence>
  );
};
