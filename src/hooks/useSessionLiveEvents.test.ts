import { describe, it, expect, vi, beforeEach } from 'vitest';
import { renderHook, act } from '@testing-library/react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import React from 'react';
import { useSessionLiveEvents } from './useSessionLiveEvents';
import * as apiClientModule from '../lib/apiClient';

describe('useSessionLiveEvents Hook', () => {
  let mockEventSourceInstances: any[] = [];
  const queryClient = new QueryClient();

  class MockEventSource {
    url: string;
    listeners: Record<string, ((event: any) => void)[]> = {};
    close = vi.fn();

    constructor(url: string) {
      this.url = url;
      mockEventSourceInstances.push(this);
    }

    addEventListener(event: string, callback: (event: any) => void) {
      if (!this.listeners[event]) this.listeners[event] = [];
      this.listeners[event].push(callback);
    }

    emit(event: string, data: any) {
      (this.listeners[event] || []).forEach((cb) => cb({ data: JSON.stringify(data) }));
    }
  }

  beforeEach(() => {
    mockEventSourceInstances = [];
    vi.stubGlobal('EventSource', MockEventSource);
    vi.spyOn(apiClientModule, 'getAccessToken').mockReturnValue('mock-jwt-token');
  });

  const wrapper = ({ children }: { children: React.ReactNode }) =>
    React.createElement(QueryClientProvider, { client: queryClient }, children);

  it('subscribes to SSE stream and handles QUESTION_CHANGED event', () => {
    const onQuestionChanged = vi.fn();
    const invalidateSpy = vi.spyOn(queryClient, 'invalidateQueries');

    renderHook(
      () =>
        useSessionLiveEvents({
          contestId: 'contest-1',
          sessionId: 'session-1',
          enabled: true,
          onQuestionChanged,
        }),
      { wrapper },
    );

    expect(mockEventSourceInstances).toHaveLength(1);
    expect(mockEventSourceInstances[0].url).toContain(
      '/api/contests/contest-1/session/session-1/live?token=mock-jwt-token',
    );

    act(() => {
      mockEventSourceInstances[0].emit('QUESTION_CHANGED', {
        type: 'QUESTION_CHANGED',
        sessionId: 'session-1',
        oldQuestionId: 'q-old',
        newQuestionId: 'q-new',
        timestamp: '2026-10-30T00:00:00Z',
      });
    });

    expect(invalidateSpy).toHaveBeenCalledWith({ queryKey: ['questions', 'contest-1'] });
    expect(onQuestionChanged).toHaveBeenCalledWith(
      expect.objectContaining({
        oldQuestionId: 'q-old',
        newQuestionId: 'q-new',
      }),
    );
  });

  it('closes SSE stream on unmount', () => {
    const { unmount } = renderHook(
      () =>
        useSessionLiveEvents({
          contestId: 'contest-1',
          sessionId: 'session-1',
          enabled: true,
        }),
      { wrapper },
    );

    expect(mockEventSourceInstances[0].close).not.toHaveBeenCalled();
    unmount();
    expect(mockEventSourceInstances[0].close).toHaveBeenCalled();
  });
});

