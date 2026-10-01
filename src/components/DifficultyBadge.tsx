import React from 'react';

export type Difficulty = 'EASY' | 'MEDIUM' | 'HARD';

interface DifficultyBadgeProps {
  difficulty: Difficulty;
  className?: string;
}

export const DifficultyBadge: React.FC<DifficultyBadgeProps> = ({ difficulty, className = '' }) => {
  const getColors = () => {
    switch (difficulty) {
      case 'EASY':
        return 'bg-primary-soft text-primary-text border-primary/30';
      case 'MEDIUM':
        return 'bg-warning-soft text-warning-text border-warning/30';
      case 'HARD':
        return 'bg-danger-soft text-danger-text border-danger/30';
      default:
        return 'bg-surface-2 text-fg border-line';
    }
  };

  return (
    <span
      className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium border ${getColors()} ${className}`}
    >
      {difficulty}
    </span>
  );
};
