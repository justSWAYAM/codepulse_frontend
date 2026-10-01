import { describe, expect, it } from 'vitest';
import { getErrorCode, getErrorMessage } from './apiError';
import { VERDICTS, isFinal, verdictOf } from './verdicts';
import { toLanguage } from './languages';
import { formatKb, formatMs } from './format';

const err = (message: string, status = 422) => ({ response: { status, data: { message } } });

describe('apiError', () => {
  it('extracts the code after the category prefix', () => {
    expect(getErrorCode(err('INVALID_STATE: SUBMISSION_LIMIT_REACHED'))).toBe('SUBMISSION_LIMIT_REACHED');
    expect(getErrorCode(err('INVALID_STATE: EXECUTION_BUSY: try later'))).toBe('EXECUTION_BUSY');
    expect(getErrorCode(err('Question not found', 404))).toBeNull();
  });

  it('maps known codes to fix-it copy', () => {
    expect(getErrorMessage(err('INVALID_STATE: SUBMISSION_IN_PROGRESS'))).toMatch(/still being judged/i);
    expect(getErrorMessage(err('INVALID_STATE: LANGUAGE_NOT_ALLOWED'))).toMatch(/language/i);
    expect(getErrorMessage(err('INVALID_STATE: SESSION_DEADLINE_PASSED'))).toMatch(/time is up/i);
  });

  it('handles the 503 queue outage, plain messages, unknown codes and network errors', () => {
    expect(getErrorMessage(err('SUBMISSION_QUEUE_UNAVAILABLE: Submission queue is unavailable', 503))).toMatch(/queue is unavailable/i);
    expect(getErrorMessage(err('NOT_FOUND: Question not found', 404))).toBe('Question not found');
    expect(getErrorMessage(err('INVALID_STATE: SOME_NEW_CODE'))).toBe('Some new code.');
    expect(getErrorMessage({ message: 'Network Error' })).toMatch(/can’t reach the server/i);
    expect(getErrorMessage(undefined, 'fallback')).toBe('fallback');
  });
});

describe('verdicts', () => {
  it('covers every submission and test-case status with a label and code', () => {
    for (const v of Object.values(VERDICTS)) {
      expect(v.label).toBeTruthy();
      expect(v.code).toBeTruthy();
    }
    expect(verdictOf('TIME_LIMIT_EXCEEDED').code).toBe('TLE');
    expect(verdictOf('ACCEPTED').tone).toBe('success');
    expect(verdictOf(null).label).toBe('Unknown');
  });

  it('treats only PENDING as non-final', () => {
    expect(isFinal('PENDING')).toBe(false);
    expect(isFinal('WRONG_ANSWER')).toBe(true);
    expect(isFinal(null)).toBe(false);
  });
});

describe('languages', () => {
  it('accepts enum and display names', () => {
    expect(toLanguage('PYTHON')?.monaco).toBe('python');
    expect(toLanguage('C++')?.name).toBe('CPP');
    expect(toLanguage('javascript')?.name).toBe('JAVASCRIPT');
    expect(toLanguage('COBOL')).toBeNull();
  });

  it('Java template declares class Main (Judge0 compiles Main.java)', () => {
    expect(toLanguage('JAVA')?.template).toContain('public class Main');
  });
});

describe('format', () => {
  it('formats time and memory', () => {
    expect(formatMs(12.4)).toBe('12 ms');
    expect(formatMs(1500)).toBe('1.50 s');
    expect(formatKb(512)).toBe('512 KB');
    expect(formatKb(2048)).toBe('2.0 MB');
    expect(formatMs(null)).toBe('—');
  });
});
