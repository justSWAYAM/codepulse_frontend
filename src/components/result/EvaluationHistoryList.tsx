import React, { useState } from 'react';
import { formatScore } from '../../lib/format';
import type { ManualEvaluationResponse } from '../../api/resultApi';

const dateTime = new Intl.DateTimeFormat(undefined, { dateStyle: 'medium', timeStyle: 'short' });

/** Append-only override history for one question, newest first (as the server sends it). */
export const EvaluationHistoryList: React.FC<{ history: ManualEvaluationResponse[] }> = ({ history }) => {
  const [showAll, setShowAll] = useState(false);
  if (history.length === 0) return null;
  const shown = showAll ? history : history.slice(0, 3);

  return (
    <section aria-labelledby="history-heading">
      <h3 id="history-heading" className="mb-2 font-display text-[14px] font-semibold tracking-[-0.015em] text-fg">
        History <span className="tabular font-sans font-normal text-fg-subtle">({history.length})</span>
      </h3>
      <ol className="space-y-2">
        {shown.map((e) => (
          <li key={e.id} className="rounded-xl border border-line bg-surface px-3.5 py-2.5 text-[13px] leading-5">
            <p className="text-fg">
              <span className="font-medium">{e.evaluatorName ?? 'An evaluator'}</span>{' '}
              {e.adjustedScore != null ? (
                <>
                  set the score to <span className="tabular font-medium">{formatScore(e.adjustedScore)}</span>
                </>
              ) : (
                'reverted to the automatic score'
              )}
              <span className="tabular text-fg-subtle"> · {dateTime.format(new Date(e.evaluatedAt))}</span>
            </p>
            <p className="mt-0.5 whitespace-pre-wrap text-fg-muted">{e.comments}</p>
          </li>
        ))}
      </ol>
      {history.length > 3 && (
        <button
          type="button"
          onClick={() => setShowAll((s) => !s)}
          className="mt-2 rounded-md text-[13px] font-medium text-primary-text underline-offset-2 hover-fine:underline"
        >
          {showAll ? 'Show fewer' : `Show all (${history.length})`}
        </button>
      )}
    </section>
  );
};
