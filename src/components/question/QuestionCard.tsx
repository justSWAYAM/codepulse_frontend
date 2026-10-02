import React from 'react';
import { Eye, GripVertical, Pencil, Trash2 } from 'lucide-react';
import { cn } from '../../lib/cn';
import { DifficultyBadge } from '../DifficultyBadge';
import { IconButton } from '../ui';
import type { QuestionRecord } from '../../api/questionApi';
import type { UserRole } from '../../api/userApi';

interface QuestionCardProps {
  question: QuestionRecord;
  role: UserRole;
  index: number;
  onEdit?: (id: string) => void;
  onDelete?: (id: string, title: string) => void;
  onClick?: (id: string) => void;
  /** Contest is live/completed: view only, no reorder or delete */
  readOnly?: boolean;
}

export const QuestionCard: React.FC<QuestionCardProps> = ({ question, role, index, onEdit, onDelete, onClick, readOnly = false }) => {
  const isAdmin = role === 'ADMIN';

  return (
    <div
      onClick={() => onClick?.(question.id)}
      className={cn(
        'flex items-center gap-3 rounded-xl border border-line bg-surface px-3 py-3 shadow-card sm:gap-4 sm:px-4',
        onClick && 'cursor-pointer transition-colors duration-150 hover-fine:bg-surface-2/60',
      )}
    >
      {isAdmin && !readOnly && (
        <span
          className="-ml-1 cursor-grab text-fg-subtle transition-colors duration-150 active:cursor-grabbing hover-fine:text-fg-muted"
          aria-hidden
        >
          <GripVertical className="size-4" />
        </span>
      )}

      <span className="tabular flex size-8 shrink-0 items-center justify-center rounded-lg bg-surface-2 font-mono text-[12px] font-medium text-fg-muted">
        {index + 1}
      </span>

      <div className="min-w-0 flex-1">
        <h3 className="truncate text-sm font-medium text-fg">{question.title}</h3>
        <div className="tabular mt-0.5 flex flex-wrap items-center gap-x-3 font-mono text-[12px] text-fg-subtle">
          <span>{question.points} pts</span>
          <span>{question.timeLimitMs} ms</span>
          <span>{Math.round(question.memoryLimitKb / 1024)} MB</span>
        </div>
      </div>

      <DifficultyBadge difficulty={question.difficulty} />

      {isAdmin && (
        <div className="flex items-center gap-1">
          <IconButton
            aria-label={`${readOnly ? 'View' : 'Edit'} ${question.title}`}
            size="sm"
            onClick={(e) => {
              e.stopPropagation();
              onEdit?.(question.id);
            }}
          >
            {readOnly ? <Eye className="size-4" /> : <Pencil className="size-4" />}
          </IconButton>
          {!readOnly && (
          <IconButton
            aria-label={`Delete ${question.title}`}
            size="sm"
            className="hover-fine:bg-danger-soft hover-fine:text-danger-text"
            onClick={(e) => {
              e.stopPropagation();
              onDelete?.(question.id, question.title);
            }}
          >
            <Trash2 className="size-4" />
          </IconButton>
          )}
        </div>
      )}
    </div>
  );
};
