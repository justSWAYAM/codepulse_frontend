import React from 'react';
import { useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { AlertTriangle, ArrowLeft, CheckCircle2 } from 'lucide-react';
import type { SessionStatus } from '../../api/sessionApi';
import { BrandMark, Button, Card } from '../ui';

interface SessionEndedScreenProps {
  status: SessionStatus;
  contestId: string;
  contestTitle?: string;
}

/**
 * Terminal state after SUBMITTED or AUTO_SUBMITTED.
 * No score is shown — results are published by an admin later (Module 9).
 */
export const SessionEndedScreen: React.FC<SessionEndedScreenProps> = ({ status, contestId, contestTitle }) => {
  const navigate = useNavigate();
  const isAuto = status === 'AUTO_SUBMITTED';

  return (
    <div className="flex min-h-dvh flex-col items-center justify-center bg-canvas p-4">
      <div className="mb-8">
        <BrandMark size={32} />
      </div>
      <motion.div
        initial={{ opacity: 0, y: 8 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.25, ease: [0.23, 1, 0.32, 1] }}
        className="w-full max-w-md"
      >
        <Card className="p-8 text-center">
          <div
            className={`mx-auto mb-5 flex size-14 items-center justify-center rounded-2xl ${
              isAuto ? 'bg-warning-soft text-warning-text' : 'bg-success-soft text-success-text'
            }`}
          >
            {isAuto ? <AlertTriangle className="size-7" /> : <CheckCircle2 className="size-7" />}
          </div>
          <h1 className="font-display text-[22px] font-semibold tracking-[-0.025em] text-fg">
            {isAuto ? 'Time’s up' : 'Exam submitted'}
          </h1>
          <p className="mt-2 text-sm leading-6 text-fg-muted">
            {isAuto ? 'Time ran out — your exam was submitted automatically.' : 'You submitted your exam.'}
          </p>
          {contestTitle && <p className="mt-1 font-mono text-[12px] text-fg-subtle">{contestTitle}</p>}
          <p className="mt-5 rounded-xl bg-surface-2 px-4 py-3 text-[13px] leading-5 text-fg-muted">
            Your best submission for each question counts. Results appear once the administrator publishes them.
          </p>
          <Button
            className="mt-6"
            onClick={() => navigate(`/dashboard/contests/${contestId}`)}
            leadingIcon={<ArrowLeft className="size-4" />}
          >
            Back to contest
          </Button>
        </Card>
      </motion.div>
    </div>
  );
};
