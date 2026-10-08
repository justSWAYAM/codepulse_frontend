import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { copyText } from './copyText';

describe('copyText', () => {
  const originalClipboard = navigator.clipboard;
  const originalIsSecureContext = window.isSecureContext;

  beforeEach(() => {
    vi.restoreAllMocks();
  });

  afterEach(() => {
    Object.defineProperty(navigator, 'clipboard', {
      value: originalClipboard,
      writable: true,
      configurable: true,
    });
    Object.defineProperty(window, 'isSecureContext', {
      value: originalIsSecureContext,
      writable: true,
      configurable: true,
    });
  });

  it('copies using navigator.clipboard when available in secure context', async () => {
    const writeTextMock = vi.fn().mockResolvedValue(undefined);
    Object.defineProperty(navigator, 'clipboard', {
      value: { writeText: writeTextMock },
      writable: true,
      configurable: true,
    });
    Object.defineProperty(window, 'isSecureContext', {
      value: true,
      writable: true,
      configurable: true,
    });

    const result = await copyText('Hello World');
    expect(result).toBe(true);
    expect(writeTextMock).toHaveBeenCalledWith('Hello World');
  });

  it('falls back to document.execCommand when navigator.clipboard is not available', async () => {
    Object.defineProperty(navigator, 'clipboard', {
      value: undefined,
      writable: true,
      configurable: true,
    });

    const execCommandMock = vi.fn().mockReturnValue(true);
    document.execCommand = execCommandMock;

    const result = await copyText('Fallback text');
    expect(result).toBe(true);
    expect(execCommandMock).toHaveBeenCalledWith('copy');
  });

  it('returns false when both clipboard and execCommand fail', async () => {
    Object.defineProperty(navigator, 'clipboard', {
      value: undefined,
      writable: true,
      configurable: true,
    });

    document.execCommand = vi.fn().mockImplementation(() => {
      throw new Error('Not supported');
    });

    const result = await copyText('Fail text');
    expect(result).toBe(false);
  });
});
