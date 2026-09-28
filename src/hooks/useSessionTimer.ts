import { useState, useEffect, useRef, useCallback } from 'react';
import { useQueryClient } from '@tanstack/react-query';
import type { SessionStatusResponse } from '../api/sessionApi';
import { sessionKeys } from './useAssessmentSession';

interface SessionTimerResult {
  remainingSeconds: number;
  isExpired: boolean;
}

/**
 * useSessionTimer — the timing heart of the assessment experience.
 *
 * Design (from plan Section 8):
 * 1. On every new `session` object, recompute the server-clock offset.
 * 2. Tick once per second; `remaining = max(0, ceil((endsAt − (Date.now() + offset)) / 1000))`.
 * 3. Clear interval on unmount and when session is not IN_PROGRESS.
 * 4. When remaining reaches 0, fire ONE refetch (the server lazily auto-submits on GET).
 * 5. The timer NEVER calls submit. Auto-submit is the server's job.
 */
export function useSessionTimer(session: SessionStatusResponse | undefined): SessionTimerResult {
  const queryClient = useQueryClient();
  const [remainingSeconds, setRemainingSeconds] = useState(0);
  const [isExpired, setIsExpired] = useState(false);

  // Track offset and endsAt as refs so interval closure stays fresh
  const offsetMsRef = useRef(0);
  const endsAtMsRef = useRef(0);
  const hasTriggeredExpiryRef = useRef(false);
  const intervalRef = useRef<ReturnType<typeof setInterval> | null>(null);

  // Screen-reader threshold announcements (Section 3.2)
  const announcedThresholdsRef = useRef<Set<number>>(new Set());
  const announceRef = useRef<HTMLDivElement | null>(null);

  // Create / update the hidden live region for a11y announcements
  useEffect(() => {
    let el = document.getElementById('session-timer-announce') as HTMLDivElement | null;
    if (!el) {
      el = document.createElement('div');
      el.id = 'session-timer-announce';
      el.setAttribute('role', 'status');
      el.setAttribute('aria-live', 'assertive');
      el.setAttribute('aria-atomic', 'true');
      el.style.cssText = 'position:absolute;width:1px;height:1px;overflow:hidden;clip:rect(0,0,0,0);white-space:nowrap;';
      document.body.appendChild(el);
    }
    announceRef.current = el;
    return () => {
      el?.remove();
    };
  }, []);

  const announce = useCallback((text: string) => {
    if (announceRef.current) {
      announceRef.current.textContent = '';
      // Force a reflow so screen readers re-announce
      requestAnimationFrame(() => {
        if (announceRef.current) {
          announceRef.current.textContent = text;
        }
      });
    }
  }, []);

  // Recompute offset on every new session object (every fetch / re-sync)
  useEffect(() => {
    if (!session || session.status !== 'IN_PROGRESS') {
      // Clear interval when session is not active
      if (intervalRef.current) {
        clearInterval(intervalRef.current);
        intervalRef.current = null;
      }
      if (session && session.status !== 'IN_PROGRESS') {
        setRemainingSeconds(0);
        setIsExpired(true);
      }
      return;
    }

    // Step 1: recompute offset on every response
    const serverNowMs = Date.parse(session.serverTime);
    const clientNowMs = Date.now();
    offsetMsRef.current = serverNowMs - clientNowMs;
    endsAtMsRef.current = Date.parse(session.endsAt);
    hasTriggeredExpiryRef.current = false;

    // Compute immediate value
    const computeRemaining = () => {
      const now = Date.now() + offsetMsRef.current;
      return Math.max(0, Math.ceil((endsAtMsRef.current - now) / 1000));
    };

    setRemainingSeconds(computeRemaining());
    setIsExpired(false);

    // Step 2: tick once per second
    if (intervalRef.current) {
      clearInterval(intervalRef.current);
    }

    intervalRef.current = setInterval(() => {
      const remaining = computeRemaining();
      setRemainingSeconds(remaining);

      // Threshold announcements (Section 3.2): 10min, 2min, 30sec, 0
      const thresholds = [
        { seconds: 600, text: '10 minutes remaining' },
        { seconds: 120, text: '2 minutes remaining' },
        { seconds: 30, text: '30 seconds remaining' },
        { seconds: 0, text: 'Time is up' },
      ];

      for (const t of thresholds) {
        if (remaining <= t.seconds && !announcedThresholdsRef.current.has(t.seconds)) {
          announcedThresholdsRef.current.add(t.seconds);
          announce(t.text);
        }
      }

      // Step 4: when remaining reaches 0, fire ONE refetch
      if (remaining === 0 && !hasTriggeredExpiryRef.current) {
        hasTriggeredExpiryRef.current = true;
        setIsExpired(true);
        // Clear the interval — no more ticking needed
        if (intervalRef.current) {
          clearInterval(intervalRef.current);
          intervalRef.current = null;
        }
        // Refetch session; the server lazily auto-submits on this GET
        queryClient.invalidateQueries({
          queryKey: sessionKeys.detail(session.contestId),
        });
      }
    }, 1000);

    // Step 3: cleanup on unmount or when session changes
    return () => {
      if (intervalRef.current) {
        clearInterval(intervalRef.current);
        intervalRef.current = null;
      }
    };
  }, [session, queryClient, announce]);

  return { remainingSeconds, isExpired };
}
