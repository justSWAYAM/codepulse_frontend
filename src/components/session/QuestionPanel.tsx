import React from 'react';
import { QuestionDetailCard } from '../question/QuestionDetailCard';
import type { QuestionCandidateRecord } from '../../api/questionApi';

interface QuestionPanelProps {
  question: QuestionCandidateRecord;
}

/**
 * QuestionPanel — center region of the AssessmentPage.
 * Thin wrapper around Module 4's QuestionDetailCard for the active question.
 * Because QuestionDetailCard already renders the sample test cases (Module 5),
 * nothing is duplicated here.
 */
export const QuestionPanel: React.FC<QuestionPanelProps> = ({ question }) => {
  return (
    <div className="h-full overflow-y-auto" data-lenis-prevent>
      <QuestionDetailCard question={question} />
    </div>
  );
};
