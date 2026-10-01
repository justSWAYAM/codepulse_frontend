import React from 'react';
import { motion } from 'framer-motion';
import { DifficultyBadge } from '../DifficultyBadge';
import type { QuestionCandidateRecord } from '../../api/questionApi';

interface QuestionNavigatorProps {
  questions: QuestionCandidateRecord[];
  activeId: string;
  visitedIds: Set<string>;
  onSelect: (id: string) => void;
}

/**
 * QuestionNavigator — sidebar list of the contest's questions in orderIndex order.
 * Row shows: number, title, DifficultyBadge, points.
 * Status: "current" and "visited" only (client-side). A status slot is left
 * for Module 8 to add the real "attempted/unattempted" indicator.
 */
export const QuestionNavigator: React.FC<QuestionNavigatorProps> = ({
  questions,
  activeId,
  visitedIds,
  onSelect,
}) => {
  const sorted = [...questions].sort((a, b) => a.orderIndex - b.orderIndex);

  return (
    <nav className="flex flex-col gap-1 py-2" aria-label="Question navigator">
      {sorted.map((q, index) => {
        const isCurrent = q.id === activeId;
        const isVisited = visitedIds.has(q.id);

        return (
          <motion.button
            key={q.id}
            onClick={() => onSelect(q.id)}
            initial={false}
            animate={{
              backgroundColor: isCurrent
                ? 'rgba(47, 158, 110, 0.08)'
                : 'transparent',
            }}
            className={`relative flex items-start gap-3 px-3 py-3 rounded-xl text-left transition-colors cursor-pointer group ${
              isCurrent
                ? 'ring-1 ring-ring'
                : 'hover:bg-fg/3'
            }`}
          >
            {/* Active indicator */}
            {isCurrent && (
              <motion.div
                layoutId="question-active"
                className="absolute left-0 top-1/2 -translate-y-1/2 w-[3px] h-6 rounded-r-full bg-primary"
                transition={{ type: 'spring', stiffness: 300, damping: 30 }}
              />
            )}

            {/* Number circle */}
            <div
              className={`w-6 h-6 rounded-full flex items-center justify-center text-[11px] font-bold shrink-0 mt-0.5 ${
                isCurrent
                  ? 'bg-primary text-white'
                  : isVisited
                  ? 'bg-primary/15 text-primary-text'
                  : 'bg-fg/8 text-fg-subtle'
              }`}
            >
              {index + 1}
            </div>

            {/* Content */}
            <div className="flex-1 min-w-0">
              <p
                className={`text-sm font-medium truncate ${
                  isCurrent ? 'text-fg' : 'text-fg-muted group-hover:text-fg'
                }`}
              >
                {q.title}
              </p>
              <div className="flex items-center gap-2 mt-1">
                <DifficultyBadge difficulty={q.difficulty} className="!text-[9px] !px-1.5 !py-0" />
                <span className="text-[11px] font-mono text-fg-subtle">{q.points} pts</span>
              </div>
            </div>

            {/* Status slot — Module 8 will replace this with attempted/unattempted indicator */}
            {isVisited && !isCurrent && (
              <span className="w-1.5 h-1.5 rounded-full bg-primary/40 mt-2 shrink-0" />
            )}
          </motion.button>
        );
      })}
    </nav>
  );
};
