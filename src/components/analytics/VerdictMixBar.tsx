import React from 'react';
import { VerdictBadge } from '../editor/VerdictBadge';
import { verdictOf } from '../../lib/verdicts';
import { verdictSegments } from '../../lib/analytics';
import type { Tone } from '../ui';
import type { SubmissionStatus } from '../../api/submissionApi';

const FILL: Record<Tone, string> = {
  success: 'bg-success',
  danger: 'bg-danger',
  warning: 'bg-warning',
  info: 'bg-info',
  primary: 'bg-primary',
  neutral: 'bg-surface-3',
};

/** SUBMIT verdicts as one stacked bar (plain divs), with a text legend so colour is never the only signal. */
export const VerdictMixBar: React.FC<{ verdicts: { status: SubmissionStatus; count: number }[] }> = ({ verdicts }) => {
  const segments = verdictSegments(verdicts);
  if (segments.length === 0) return <p className="text-[13px] text-fg-muted">No submissions yet.</p>;
  return (
    <div>
      <div className="flex h-2.5 overflow-hidden rounded-full bg-surface-2" aria-hidden>
        {segments.map((s) => (
          <div key={s.status} className={FILL[verdictOf(s.status).tone]} style={{ width: `${s.share * 100}%` }} />
        ))}
      </div>
      <ul className="mt-2.5 flex flex-wrap gap-x-3 gap-y-1.5">
        {segments.map((s) => (
          <li key={s.status} className="inline-flex items-center gap-1.5">
            <VerdictBadge status={s.status} short />
            <span className="tabular text-[12px] text-fg-muted">{s.count}</span>
          </li>
        ))}
      </ul>
    </div>
  );
};
