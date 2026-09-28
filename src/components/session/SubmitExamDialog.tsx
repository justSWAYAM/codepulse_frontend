import React from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { AlertTriangle, Loader2, Send } from 'lucide-react';

interface SubmitExamDialogProps {
  isOpen: boolean;
  onClose: () => void;
  onConfirm: () => void;
  isSubmitting: boolean;
}

/**
 * SubmitExamDialog — confirmation before the manual final submit.
 * Irreversible — ends the session.
 * Copy: "Submit your exam? You won't be able to make further changes.
 *        Any time remaining will be forfeited."
 */
export const SubmitExamDialog: React.FC<SubmitExamDialogProps> = ({
  isOpen,
  onClose,
  onConfirm,
  isSubmitting,
}) => {
  return (
    <AnimatePresence>
      {isOpen && (
        <>
          {/* Backdrop */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-ink/30 backdrop-blur-sm z-50"
            onClick={onClose}
          />

          {/* Dialog */}
          <motion.div
            initial={{ opacity: 0, scale: 0.95, y: 10 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.95, y: 10 }}
            transition={{ type: 'spring', damping: 25, stiffness: 300 }}
            className="fixed inset-0 z-50 flex items-center justify-center p-4"
            onClick={(e) => e.stopPropagation()}
          >
            <div
              className="bg-surface rounded-2xl border border-hairline shadow-xl max-w-md w-full p-6"
              onClick={(e) => e.stopPropagation()}
            >
              {/* Icon */}
              <div className="w-12 h-12 rounded-xl bg-accent-syntax/10 flex items-center justify-center mb-4 mx-auto">
                <AlertTriangle className="w-6 h-6 text-accent-syntax" />
              </div>

              {/* Title */}
              <h2 className="font-display text-lg font-bold text-ink text-center mb-2">
                Submit your exam?
              </h2>

              {/* Message */}
              <p className="text-sm text-ink/60 text-center mb-6 leading-relaxed">
                You won't be able to make further changes. Any time remaining will be forfeited.
              </p>

              {/* Actions */}
              <div className="flex gap-3">
                <button
                  onClick={onClose}
                  disabled={isSubmitting}
                  className="flex-1 px-4 py-2.5 rounded-xl text-sm font-semibold text-ink/60 border border-hairline hover:border-ink/20 transition-colors cursor-pointer disabled:opacity-50"
                >
                  Cancel
                </button>
                <button
                  onClick={onConfirm}
                  disabled={isSubmitting}
                  className="flex-1 flex items-center justify-center gap-2 px-4 py-2.5 bg-accent-error text-white rounded-xl text-sm font-semibold hover:bg-accent-error/90 disabled:opacity-60 transition-colors cursor-pointer"
                >
                  {isSubmitting ? (
                    <Loader2 className="w-4 h-4 animate-spin" />
                  ) : (
                    <Send className="w-4 h-4" />
                  )}
                  Submit Exam
                </button>
              </div>
            </div>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  );
};
