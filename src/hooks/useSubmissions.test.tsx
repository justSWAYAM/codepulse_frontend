import React from 'react';
import { act, renderHook, waitFor } from '@testing-library/react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

const { getForCandidate } = vi.hoisted(() => ({ getForCandidate: vi.fn() }));
vi.mock('../api/submissionApi', () => ({
  submissionApi: { getForCandidate, myHistory: vi.fn().mockResolvedValue({ content: [] }) },
}));

import { POLL_INTERVAL_MS, POLL_TIMEOUT_MS, useQuestionProgress, useSubmissionDetail } from './useSubmissions';
import { submissionApi } from '../api/submissionApi';

const wrapper = () => {
  const qc = new QueryClient({ defaultOptions: { queries: { retry: false } } });
  return ({ children }: { children: React.ReactNode }) => <QueryClientProvider client={qc}>{children}</QueryClientProvider>;
};

const detail = (status: string) => ({ id: 's1', questionId: 'q1', type: 'SUBMIT', status, sampleResults: [], hiddenSummary: null });

describe('useSubmissionDetail polling', () => {
  beforeEach(() => {
    vi.useFakeTimers({ shouldAdvanceTime: true });
    getForCandidate.mockReset();
  });
  afterEach(() => vi.useRealTimers());

  it('polls while PENDING and stops once a verdict arrives', async () => {
    getForCandidate
      .mockResolvedValueOnce(detail('PENDING'))
      .mockResolvedValueOnce(detail('PENDING'))
      .mockResolvedValue(detail('ACCEPTED'));

    const { result } = renderHook(() => useSubmissionDetail('s1', 'q1'), { wrapper: wrapper() });

    await waitFor(() => expect(result.current.data?.status).toBe('PENDING'));
    await act(async () => {
      await vi.advanceTimersByTimeAsync(POLL_INTERVAL_MS * 2 + 50);
    });
    await waitFor(() => expect(result.current.data?.status).toBe('ACCEPTED'));

    const calls = getForCandidate.mock.calls.length;
    await act(async () => {
      await vi.advanceTimersByTimeAsync(POLL_INTERVAL_MS * 4);
    });
    expect(getForCandidate.mock.calls.length).toBe(calls);
  });

  it('gives up after the timeout and reports timedOut', async () => {
    getForCandidate.mockResolvedValue(detail('PENDING'));
    const { result } = renderHook(() => useSubmissionDetail('s1', 'q1'), { wrapper: wrapper() });

    await waitFor(() => expect(result.current.data?.status).toBe('PENDING'));
    await act(async () => {
      await vi.advanceTimersByTimeAsync(POLL_TIMEOUT_MS + POLL_INTERVAL_MS * 2);
    });
    await waitFor(() => expect(result.current.timedOut).toBe(true));

    const calls = getForCandidate.mock.calls.length;
    await act(async () => {
      await vi.advanceTimersByTimeAsync(POLL_INTERVAL_MS * 4);
    });
    expect(getForCandidate.mock.calls.length).toBe(calls);
  });
});

describe('useQuestionProgress', () => {
  it('derives accepted / attempted / pending from SUBMIT history only', async () => {
    vi.mocked(submissionApi.myHistory).mockImplementation(async (qid: string) => {
      const map: Record<string, { type: string; status: string }[]> = {
        a: [{ type: 'SUBMIT', status: 'WRONG_ANSWER' }, { type: 'SUBMIT', status: 'ACCEPTED' }],
        b: [{ type: 'SUBMIT', status: 'WRONG_ANSWER' }],
        c: [{ type: 'RUN', status: 'ACCEPTED' }],
        d: [{ type: 'SUBMIT', status: 'PENDING' }],
      };
      return { content: map[qid] ?? [], page: 0, size: 50, totalElements: 0, totalPages: 0 } as never;
    });
    const { result } = renderHook(() => useQuestionProgress(['a', 'b', 'c', 'd']), { wrapper: wrapper() });
    await waitFor(() => expect(result.current.a).toBe('accepted'));
    expect(result.current.b).toBe('attempted');
    expect(result.current.c).toBeUndefined();
    expect(result.current.d).toBe('pending');
  });
});
