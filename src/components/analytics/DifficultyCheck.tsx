import React from 'react';
import { ArrowRight } from 'lucide-react';
import { DifficultyBadge } from '../DifficultyBadge';
import { Tooltip } from '../ui';
import { formatPercent } from '../../lib/analytics';
import type { QuestionStats } from '../../api/analyticsApi';

const LABEL = { EASY: 'easy', MEDIUM: 'medium', HARD: 'hard' } as const;

/** Labelled difficulty vs how the question actually played (plan 5.5: "not enough data" is its own state). */
export const DifficultyCheck: React.FC<{ question: QuestionStats }> = ({ question }) => {
  const observed = question.observedDifficulty ?? null;

  if (!observed) {
    return (
      <span className="inline-flex items-center gap-1.5">
        <DifficultyBadge difficulty={question.difficulty} />
        <span className="text-[12px] text-fg-subtle">Not enough data</span>
      </span>
    );
  }

  if (question.difficultyMatches) {
    return (
      <span className="inline-flex items-center gap-1.5">
        <DifficultyBadge difficulty={question.difficulty} />
        <span className="text-[12px] text-fg-subtle">as expected</span>
      </span>
    );
  }

  return (
    <Tooltip content={`Average score ${formatPercent(question.averageRatio)} — labelled ${LABEL[question.difficulty]}.`}>
      <span className="inline-flex items-center gap-1.5" tabIndex={0}>
        <DifficultyBadge difficulty={question.difficulty} />
        <ArrowRight className="size-3 text-fg-subtle" aria-hidden />
        <DifficultyBadge difficulty={observed} />
        <span className="text-[12px] text-fg-muted">Played as {LABEL[observed]}</span>
      </span>
    </Tooltip>
  );
};
