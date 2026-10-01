import React from 'react';
import { QuestionDetailCard } from '../question/QuestionDetailCard';
import type { QuestionCandidateRecord } from '../../api/questionApi';

/** Centre region of the AssessmentPage: the active question's statement and samples. */
export const QuestionPanel: React.FC<{ question: QuestionCandidateRecord }> = ({ question }) => (
  <div className="h-full overflow-y-auto">
    <QuestionDetailCard question={question} />
  </div>
);
