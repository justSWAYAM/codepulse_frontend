import type { Tone } from '../components/ui';
import type { SubmissionStatus, TestCaseResultStatus } from '../api/submissionApi';

export type VerdictKey = SubmissionStatus | TestCaseResultStatus;

export interface VerdictMeta {
  label: string;
  /** Short judge code shown in dense tables. */
  code: string;
  tone: Tone;
  /** One line telling the candidate what it means / what to try. */
  hint: string;
}

export const VERDICTS: Record<VerdictKey, VerdictMeta> = {
  PENDING: { label: 'Judging', code: '…', tone: 'info', hint: 'Queued or running on the judge.' },
  ACCEPTED: { label: 'Accepted', code: 'AC', tone: 'success', hint: 'All test cases passed.' },
  PASSED: { label: 'Passed', code: 'AC', tone: 'success', hint: 'Output matched.' },
  WRONG_ANSWER: { label: 'Wrong answer', code: 'WA', tone: 'danger', hint: 'Output didn’t match the expected answer.' },
  TIME_LIMIT_EXCEEDED: { label: 'Time limit exceeded', code: 'TLE', tone: 'warning', hint: 'Too slow — look for a faster algorithm.' },
  MEMORY_LIMIT_EXCEEDED: { label: 'Memory limit exceeded', code: 'MLE', tone: 'warning', hint: 'Used too much memory.' },
  RUNTIME_ERROR: { label: 'Runtime error', code: 'RE', tone: 'danger', hint: 'The program crashed — check stderr.' },
  COMPILATION_ERROR: { label: 'Compilation error', code: 'CE', tone: 'danger', hint: 'Fix the compiler errors and try again.' },
  SYSTEM_ERROR: { label: 'System error', code: 'SE', tone: 'neutral', hint: 'The judge failed, not your code. It won’t count against you.' },
};

export function verdictOf(status: VerdictKey | null | undefined): VerdictMeta {
  return (status && VERDICTS[status]) || { label: 'Unknown', code: '?', tone: 'neutral', hint: '' };
}

export const isFinal = (status: SubmissionStatus | null | undefined) => !!status && status !== 'PENDING';
