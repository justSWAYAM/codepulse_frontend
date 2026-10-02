import React from 'react';
import { Link } from 'react-router-dom';
import { AlertTriangle } from 'lucide-react';
import { Badge } from '../ui';
import { cn } from '../../lib/cn';
import { failureMixText, formatPercent } from '../../lib/analytics';
import type { TestCaseStats } from '../../api/analyticsApi';

interface TestCasePassRateListProps {
  testCases: TestCaseStats[];
  /** Admin only: the question edit page (Test cases tab) is an admin route. */
  editLink?: string;
}

/** Pass rate per test case over each candidate's counted submission; suspicious cases flagged by the server. */
export const TestCasePassRateList: React.FC<TestCasePassRateListProps> = ({ testCases, editLink }) => {
  if (testCases.length === 0 || testCases.every((t) => t.evaluated === 0)) {
    return <p className="text-[13px] text-fg-muted">No scored submissions yet.</p>;
  }
  return (
    <ul className="space-y-2">
      {testCases.map((t, i) => (
        <li
          key={t.testCaseId}
          className={cn(
            'rounded-xl border px-3.5 py-2.5',
            t.suspicious ? 'border-warning/30 bg-warning-soft' : 'border-line bg-surface',
          )}
        >
          <div className="flex flex-wrap items-center gap-x-3 gap-y-1.5 text-[13px]">
            <span className="tabular font-medium text-fg">Test {i + 1}</span>
            <Badge size="sm" tone={t.sample ? 'primary' : 'neutral'}>
              {t.sample ? 'Sample' : 'Hidden'}
            </Badge>
            <span className="tabular text-[12px] text-fg-subtle">weight {t.weight}</span>
            <span className="ml-auto tabular font-semibold text-fg">{formatPercent(t.passRate)}</span>
            <span className="tabular text-[12px] text-fg-subtle">
              {t.passed}/{t.evaluated}
            </span>
          </div>
          <div className="mt-2 h-1.5 overflow-hidden rounded-full bg-surface-2" aria-hidden>
            <div className="h-full bg-success" style={{ width: `${t.passRate * 100}%` }} />
          </div>
          {failureMixText(t) && <p className="tabular mt-1.5 text-[12px] text-fg-muted">{failureMixText(t)}</p>}
          {t.suspicious && (
            <p className="mt-2 flex items-start gap-2 text-[12.5px] leading-5 text-warning-text">
              <AlertTriangle className="mt-0.5 size-4 shrink-0" aria-hidden />
              <span>
                Nobody passed this test while most passed others. Check its expected output, then rejudge.
                {editLink && (
                  <>
                    {' '}
                    <Link to={editLink} className="font-medium underline underline-offset-2">
                      Open test cases
                    </Link>
                  </>
                )}
              </span>
            </p>
          )}
        </li>
      ))}
    </ul>
  );
};
