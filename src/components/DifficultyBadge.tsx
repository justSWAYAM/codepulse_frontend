import React from 'react';
import { Badge, type Tone } from './ui';

export type Difficulty = 'EASY' | 'MEDIUM' | 'HARD';

const CONFIG: Record<Difficulty, { label: string; tone: Tone }> = {
  EASY: { label: 'Easy', tone: 'success' },
  MEDIUM: { label: 'Medium', tone: 'warning' },
  HARD: { label: 'Hard', tone: 'danger' },
};

export const DifficultyBadge: React.FC<{ difficulty: Difficulty; className?: string }> = ({ difficulty, className }) => {
  const c = CONFIG[difficulty] ?? { label: difficulty, tone: 'neutral' as Tone };
  return (
    <Badge tone={c.tone} size="sm" className={className}>
      {c.label}
    </Badge>
  );
};
