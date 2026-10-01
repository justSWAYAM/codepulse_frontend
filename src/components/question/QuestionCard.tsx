import React from 'react';
import { GripVertical, Pencil, Trash2 } from 'lucide-react';
import { DifficultyBadge } from '../DifficultyBadge';
import type { QuestionRecord } from '../../api/questionApi';
import type { UserRole } from '../../api/userApi';

interface QuestionCardProps {
  question: QuestionRecord;
  role: UserRole;
  index: number;
  onEdit?: (id: string) => void;
  onDelete?: (id: string, title: string) => void;
  onClick?: (id: string) => void;
}

export const QuestionCard: React.FC<QuestionCardProps> = ({
  question,
  role,
  index,
  onEdit,
  onDelete,
  onClick,
}) => {
  const isAdmin = role === 'ADMIN';

  return (
    <div
      onClick={() => onClick?.(question.id)}
      className={`bg-surface border border-line rounded-lg p-4 flex items-center gap-4 transition-colors ${
        onClick ? 'cursor-pointer hover:bg-surface-2' : ''
      }`}
    >
      {isAdmin && (
        <div className="text-fg-subtle cursor-grab active:cursor-grabbing hover:text-fg-muted transition-colors px-1 -ml-2">
          <GripVertical size={20} />
        </div>
      )}
      
      <div className="w-8 h-8 rounded-full bg-canvas text-fg flex items-center justify-center font-bold text-sm shrink-0">
        {index + 1}
      </div>

      <div className="flex-1 min-w-0">
        <h3 className="font-medium text-fg truncate">{question.title}</h3>
        <div className="flex items-center gap-4 mt-1 text-sm text-fg-muted font-mono">
          <span>{question.points} pts</span>
          <span>{question.timeLimitMs} ms</span>
          <span>{Math.round(question.memoryLimitKb / 1024)} MB</span>
        </div>
      </div>

      <DifficultyBadge difficulty={question.difficulty} />

      {isAdmin && (
        <div className="flex items-center gap-2 ml-4">
          <button
            onClick={(e) => {
              e.stopPropagation();
              onEdit?.(question.id);
            }}
            className="p-2 text-fg-subtle hover:text-warning-text hover:bg-warning-soft rounded-md transition-colors"
            title="Edit Question"
          >
            <Pencil size={16} />
          </button>
          <button
            onClick={(e) => {
              e.stopPropagation();
              onDelete?.(question.id, question.title);
            }}
            className="p-2 text-fg-subtle hover:text-danger-text hover:bg-danger-soft rounded-md transition-colors"
            title="Delete Question"
          >
            <Trash2 size={16} />
          </button>
        </div>
      )}
    </div>
  );
};
