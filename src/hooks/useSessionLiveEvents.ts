import { useEffect, useRef } from 'react';
import { useQueryClient } from '@tanstack/react-query';
import { toast } from 'sonner';
import { questionKeys } from './useQuestions';
import { getAccessToken } from '../lib/apiClient';

export interface QuestionChangedLivePayload {
  type: string;
  sessionId: string;
  oldQuestionId: string;
  newQuestionId: string;
  timestamp: string;
}

interface UseSessionLiveEventsOptions {
  contestId: string;
  sessionId: string | undefined;
  enabled: boolean;
  onQuestionChanged?: (data: QuestionChangedLivePayload) => void;
}

export function useSessionLiveEvents({
  contestId,
  sessionId,
  enabled,
  onQuestionChanged,
}: UseSessionLiveEventsOptions) {
  const queryClient = useQueryClient();
  const onQuestionChangedRef = useRef(onQuestionChanged);
  onQuestionChangedRef.current = onQuestionChanged;

  useEffect(() => {
    if (!enabled || !contestId || !sessionId) return;

    const token = getAccessToken();
    if (!token) return;

    const url = `/api/contests/${contestId}/session/${sessionId}/live?token=${encodeURIComponent(token)}`;
    const eventSource = new EventSource(url);

    eventSource.addEventListener('QUESTION_CHANGED', (event: MessageEvent) => {
      try {
        const data: QuestionChangedLivePayload = JSON.parse(event.data);
        // Invalidate questions query so the list refreshes automatically
        queryClient.invalidateQueries({ queryKey: questionKeys.all(contestId) });
        toast.info('An evaluator has updated your assigned question.', {
          duration: 6000,
        });
        onQuestionChangedRef.current?.(data);
      } catch (err) {
        console.error('Failed to parse QUESTION_CHANGED event payload', err);
      }
    });

    eventSource.onerror = (err) => {
      // EventSource automatically retries connection in the background
      console.warn('Session SSE stream connection error/reconnecting', err);
    };

    return () => {
      eventSource.close();
    };
  }, [contestId, sessionId, enabled, queryClient]);
}

