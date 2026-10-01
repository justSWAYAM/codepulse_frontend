import React from 'react';
import { useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { CheckCircle2, AlertTriangle, ArrowLeft } from 'lucide-react';
import type { SessionStatus } from '../../api/sessionApi';

interface SessionEndedScreenProps {
  status: SessionStatus;
  contestId: string;
  contestTitle?: string;
}

/**
 * SessionEndedScreen — terminal state shown after SUBMITTED or AUTO_SUBMITTED.
 * Distinguishes: "You submitted your exam" vs. "Time ran out — your exam was submitted automatically."
 * No score mentioned — results are published by an Admin later (Module 9).
 */
export const SessionEndedScreen: React.FC<SessionEndedScreenProps> = ({
  status,
  contestId,
  contestTitle,
}) => {
  const navigate = useNavigate();
  const isAutoSubmitted = status === 'AUTO_SUBMITTED';

  return (
    <div className="min-h-screen bg-canvas flex items-center justify-center p-4">
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ type: 'spring', damping: 25, stiffness: 200 }}
        className="bg-surface border border-line rounded-2xl p-8 max-w-md w-full text-center shadow-lg"
      >
        {/* Icon */}
        <div
          className={`w-16 h-16 rounded-2xl flex items-center justify-center mx-auto mb-6 ${
            isAutoSubmitted ? 'bg-warning-soft' : 'bg-primary/10'
          }`}
        >
          {isAutoSubmitted ? (
            <AlertTriangle className="w-8 h-8 text-warning-text" />
          ) : (
            <CheckCircle2 className="w-8 h-8 text-primary-text" />
          )}
        </div>

        {/* Title */}
        <h1 className="font-display text-xl font-bold text-fg mb-2">
          {isAutoSubmitted ? "Time\u2019s Up" : 'Exam Submitted'}
        </h1>

        {/* Message */}
        <p className="text-sm text-fg-muted mb-2 leading-relaxed">
          {isAutoSubmitted
            ? 'Time ran out — your exam was submitted automatically.'
            : 'You submitted your exam.'}
        </p>

        {contestTitle && (
          <p className="text-xs text-fg-subtle mb-6 font-mono">{contestTitle}</p>
        )}

        {!contestTitle && <div className="mb-6" />}

        <p className="text-xs text-fg-subtle mb-6">
          Results will be available once published by the administrator.
        </p>

        {/* Action */}
        <button
          onClick={() => navigate(`/dashboard/contests/${contestId}`)}
          className="inline-flex items-center gap-2 px-5 py-2.5 bg-primary text-white rounded-xl text-sm font-semibold hover:bg-primary-hover transition-colors cursor-pointer"
        >
          <ArrowLeft className="w-4 h-4" />
          Back to Contest
        </button>
      </motion.div>
    </div>
  );
};
