import React from 'react';
import { Check, Loader2 } from 'lucide-react';
import { DifficultyBadge } from '../DifficultyBadge';
import type { QuestionCandidateRecord } from '../../api/questionApi';
import type { QuestionProgress } from '../../hooks/useSubmissions';
import { cn } from '../../lib/cn';

interface QuestionNavigatorProps {
  questions: QuestionCandidateRecord[];
  activeId: string;
  visitedIds: Set<string>;
  onSelect: (id: string) => void;
  /** Per-question submission progress (Module 8). */
  progress?: Record<string, QuestionProgress | undefined>;
}

const PROGRESS_LABEL: Record<QuestionProgress, string> = {
  accepted: 'Accepted',
  attempted: 'Attempted',
  pending: 'Judging',
};

/**
 * Sidebar list of the contest's questions. Selection is instant — it's switched
 * constantly during an exam, so it costs no animation frames.
 */
export const QuestionNavigator: React.FC<QuestionNavigatorProps> = ({ questions, activeId, visitedIds, onSelect, progress = {} }) => {
  const sorted = [...questions].sort((a, b) => a.orderIndex - b.orderIndex);

  return (
    <nav className="flex flex-col gap-1 py-2" aria-label="Question navigator">
      {sorted.map((q, index) => {
        const isCurrent = q.id === activeId;
        const isVisited = visitedIds.has(q.id);
        const state = progress[q.id];

        return (
          <button
            key={q.id}
            type="button"
            onClick={() => onSelect(q.id)}
            aria-current={isCurrent ? 'true' : undefined}
            className={cn(
              'press relative flex items-start gap-3 rounded-xl px-3 py-2.5 text-left',
              isCurrent ? 'bg-primary-soft' : 'hover-fine:bg-surface-2',
            )}
          >
            <span
              aria-hidden
              className={cn(
                'tabular mt-0.5 flex size-6 shrink-0 items-center justify-center rounded-lg text-[12px] font-semibold',
                state === 'accepted'
                  ? 'bg-success text-white'
                  : isCurrent
                  ? 'bg-primary text-primary-fg'
                  : isVisited
                  ? 'bg-surface-3 text-fg-muted'
                  : 'bg-surface-2 text-fg-subtle',
              )}
            >
              {state === 'accepted' ? <Check className="size-3.5" strokeWidth={3} /> : index + 1}
            </span>

            <span className="min-w-0 flex-1">
              <span className={cn('block truncate text-[13.5px] font-medium', isCurrent ? 'text-fg' : 'text-fg-muted')}>
                {q.title}
              </span>
              <span className="mt-1 flex items-center gap-2">
                <DifficultyBadge difficulty={q.difficulty} />
                <span className="tabular text-[12px] text-fg-subtle">{q.points} pts</span>
              </span>
            </span>

            {state && (
              <span
                className={cn(
                  'mt-1 flex shrink-0 items-center gap-1 text-[11px] font-medium',
                  state === 'accepted' && 'sr-only',
                  state === 'attempted' && 'text-warning-text',
                  state === 'pending' && 'text-info-text',
                )}
              >
                {state === 'pending' && <Loader2 className="size-3 motion-safe:animate-spin" aria-hidden />}
                {PROGRESS_LABEL[state]}
              </span>
            )}
          </button>
        );
      })}
    </nav>
  );
};
