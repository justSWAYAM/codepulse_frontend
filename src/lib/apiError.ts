/*
 * Backend errors arrive as { message: "<CATEGORY>: <CODE or text>" } — e.g.
 * "INVALID_STATE: SUBMISSION_LIMIT_REACHED". Most business errors are 422, so the
 * code after the prefix is what tells them apart.
 */

interface AxiosLikeError {
  response?: { status?: number; data?: { message?: string } };
  message?: string;
}

const CATEGORY_PREFIX = /^(INVALID_STATE|NOT_FOUND|VALIDATION_FAILED|ACCESS_DENIED|SUBMISSION_QUEUE_UNAVAILABLE|CONFLICT|BAD_REQUEST|UNAUTHORIZED)\s*:\s*/;

/** Every error says how to fix it. */
const FRIENDLY: Record<string, string> = {
  NO_ACTIVE_SESSION: 'Your exam session isn’t active. Return to the contest page and start or resume it.',
  SESSION_DEADLINE_PASSED: 'Time is up for this exam — new runs and submissions aren’t accepted.',
  SESSION_NOT_IN_PROGRESS: 'Your exam session has ended.',
  LANGUAGE_NOT_ALLOWED: 'That language isn’t allowed in this contest. Pick one from the language menu.',
  SUBMISSION_LIMIT_REACHED: 'You’ve reached the limit for this question in this session.',
  SUBMISSION_IN_PROGRESS: 'Your previous submission is still being judged. Wait for its verdict, then submit again.',
  EXECUTION_BUSY: 'The judge is busy right now. Wait a few seconds and run again.',
  NO_SAMPLE_TEST_CASES: 'This question has no sample tests to run against. Submit to be judged on all tests.',
  QUESTION_HAS_NO_TEST_CASES: 'This question has no test cases yet, so it can’t be judged. Tell your invigilator.',
  SUBMISSION_NOT_REJUDGEABLE: 'Only finished SUBMIT submissions can be rejudged.',
  SUBMISSION_NOT_FOUND: 'That submission no longer exists or isn’t yours.',
  SUBMISSION_ACCESS_DENIED: 'You don’t have access to that submission.',
  RATE_LIMITED: 'You’re going a bit fast. Wait a few seconds, then try again.',
  ACCOUNT_DISABLED: 'Your account has been deactivated. Contact an administrator.',
  // Module 9. RESULTS_NOT_READY is left out on purpose: the server's message carries the counts.
  RESULTS_NEED_REVIEW: 'Some results are flagged for review. Tick the acknowledgement to publish anyway, or resolve them first.',
  RESULTS_ALREADY_PUBLISHED: 'These results are already published.',
  RESULTS_NOT_PUBLISHED: 'These results aren’t published.',
  RESULTS_PUBLISHED_LOCKED: 'Results are published, so scores are locked. Unpublish them to make changes.',
  SUBMISSION_NOT_EVALUABLE: 'This submission can’t be scored by hand. Only finished SUBMITs from an ended exam can.',
  SUBMISSION_NOT_COUNTED: 'This isn’t the submission that counts for this question. Refresh and evaluate the counted one.',
  ADJUSTED_SCORE_OUT_OF_RANGE: 'The score must be between 0 and the question’s points, with at most 2 decimals.',
  RESULT_NOT_FOUND: 'No result yet. This candidate may still be taking the exam or being judged.',
};

export function getErrorCode(error: unknown): string | null {
  const raw = (error as AxiosLikeError)?.response?.data?.message;
  if (!raw) return null;
  const rest = raw.replace(CATEGORY_PREFIX, '');
  const code = rest.split(':')[0].trim();
  return /^[A-Z][A-Z0-9_]+$/.test(code) ? code : null;
}

export function getErrorMessage(error: unknown, fallback = 'Something went wrong. Please try again.'): string {
  const e = error as AxiosLikeError;
  const status = e?.response?.status;
  const code = getErrorCode(error);
  if (code && FRIENDLY[code]) return FRIENDLY[code];

  const raw = e?.response?.data?.message;
  if (status === 503) return 'The submission queue is unavailable. Try again in a moment.';
  if (raw) {
    const cleaned = raw.replace(CATEGORY_PREFIX, '').trim();
    // A bare CODE with no friendly copy reads badly — humanise it
    if (/^[A-Z][A-Z0-9_]+$/.test(cleaned)) {
      return cleaned.charAt(0) + cleaned.slice(1).toLowerCase().replace(/_/g, ' ') + '.';
    }
    // "CODE: readable text" with no friendly copy → show just the text
    const text = cleaned.replace(/^[A-Z][A-Z0-9_]+\s*:\s*/, '');
    return text || cleaned;
  }
  if (!e?.response && e?.message === 'Network Error') return 'Can’t reach the server. Check your connection and try again.';
  return fallback;
}
