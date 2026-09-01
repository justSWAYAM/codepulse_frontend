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
        return 'bg-[#2F9E6E]/10 text-[#2F9E6E] border-[#2F9E6E]/20';
      case 'MEDIUM':
        return 'bg-[#E8A33D]/10 text-[#E8A33D] border-[#E8A33D]/20';
      case 'HARD':
        return 'bg-[#E85D4E]/10 text-[#E85D4E] border-[#E85D4E]/20';
      default:
        return 'bg-gray-100 text-gray-700 border-gray-200';
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
