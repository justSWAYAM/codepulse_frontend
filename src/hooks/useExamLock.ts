import { useEffect, useRef } from 'react';

// ── Types ──────────────────────────────────────────────────────────────────────

export type ViolationType =
  | 'FULLSCREEN_EXIT'
  | 'TAB_HIDDEN'
  | 'WINDOW_BLUR'
  | 'MOUSE_LEFT'
  | 'PASTE_ATTEMPT'
  | 'COPY_ATTEMPT'
  | 'DEVTOOLS_SUSPECTED';

// ── Helpers ────────────────────────────────────────────────────────────────────

/**
 * Request fullscreen and (Chromium-only) lock Escape so a single press
 * doesn't silently exit.  Wraps in a try/catch because:
 *   - Firefox/Safari reject the keyboard lock promise
 *   - some browsers reject fullscreen if the document is already fullscreen
 */
export async function enterFullscreen(): Promise<void> {
  try {
    if (!document.fullscreenElement) {
      await document.documentElement.requestFullscreen({ navigationUI: 'hide' });
    }
    // Chromium 97+: suppress Escape so a long-press still exits but a quick
    // tap gives a "Esc to exit" prompt.  Non-Chromium safely ignores the call.
    await (navigator as unknown as { keyboard?: { lock(keys: string[]): Promise<void> } })
      .keyboard
      ?.lock(['Escape'])
      .catch(() => {});
  } catch {
    // Fullscreen or keyboard-lock was rejected (e.g. already fullscreen, or
    // user/browser denied it).  Caller decides how to handle via onViolation.
  }
}

export function exitFullscreen(): void {
  if (document.fullscreenElement) document.exitFullscreen().catch(() => {});
}

// ── Hook ───────────────────────────────────────────────────────────────────────

/**
 * useExamLock — attaches all lockdown listeners while `active === true`.
 *
 * Detects and calls `onViolation` for:
 *  - Fullscreen exits
 *  - Tab visibility changes (minimise / tab-switch)
 *  - Window blur (alt-tab, OS pop-ups, etc.)
 *  - Mouse leaving the viewport
 *  - Copy / cut / paste (page level; Monaco overrides are separate)
 *  - Keyboard shortcuts that open DevTools or copy/paste
 *  - Heuristic DevTools detection (window size delta)
 *
 * All violations call `onViolation` with the type. Logging, strike-counting,
 * and UI side-effects live in the parent; this hook only detects.
 *
 * @param active   - true once the exam is running (gates every listener)
 * @param onViolation - stable callback (use useCallback or store in a ref)
 */
export function useExamLock(active: boolean, onViolation: (type: ViolationType) => void): void {
  // Keep a ref so we never need the callback in the dependency array
  const cbRef = useRef(onViolation);
  useEffect(() => {
    cbRef.current = onViolation;
  });

  useEffect(() => {
    if (!active) return;

    const fire = (type: ViolationType) => cbRef.current(type);

    // ── Copy / Cut / Paste ──
    const onCopy  = (e: Event) => { e.preventDefault(); fire('COPY_ATTEMPT'); };
    const onCut   = (e: Event) => { e.preventDefault(); fire('COPY_ATTEMPT'); };
    const onPaste = (e: Event) => { e.preventDefault(); fire('PASTE_ATTEMPT'); };
    const onCtx   = (e: Event) => e.preventDefault();

    // ── Fullscreen ──
    const onFs = () => {
      if (!document.fullscreenElement) fire('FULLSCREEN_EXIT');
    };

    // ── Tab visibility ──
    const onVis = () => {
      if (document.hidden) fire('TAB_HIDDEN');
    };

    // ── Window / app focus ──
    const onBlur = () => fire('WINDOW_BLUR');

    // ── Cursor leaving viewport ──
    const onLeave = () => fire('MOUSE_LEFT');

    // ── Keyboard shortcuts ──
    const onKey = (e: KeyboardEvent) => {
      const k   = e.key?.toLowerCase();
      const mod = e.ctrlKey || e.metaKey;

      const isCopyShortcut     = mod && ['c', 'x', 'a'].includes(k);
      const isPasteShortcut    = mod && k === 'v';
      const isDevToolsShortcut =
        e.key === 'F12' ||
        (mod && e.shiftKey && ['i', 'j', 'c'].includes(k)) ||
        (mod && k === 'u');
      const isSaveOrPrint = mod && ['s', 'p'].includes(k);

      if (isCopyShortcut || isPasteShortcut || isDevToolsShortcut || isSaveOrPrint) {
        e.preventDefault();
        e.stopPropagation();
        if (isPasteShortcut) fire('PASTE_ATTEMPT');
        else fire('COPY_ATTEMPT');
      }
    };

    // ── DevTools heuristic ──
    let devtoolsOpen = false;
    const devtoolsTimer = window.setInterval(() => {
      const wide = window.outerWidth  - window.innerWidth  > 160;
      const tall = window.outerHeight - window.innerHeight > 160;
      const nowOpen = wide || tall;
      if (nowOpen && !devtoolsOpen) fire('DEVTOOLS_SUSPECTED');
      devtoolsOpen = nowOpen;
    }, 2000);

    document.addEventListener('copy',             onCopy);
    document.addEventListener('cut',              onCut);
    document.addEventListener('paste',            onPaste, true);
    document.addEventListener('contextmenu',      onCtx);
    document.addEventListener('fullscreenchange', onFs);
    document.addEventListener('visibilitychange', onVis);
    window.addEventListener('blur',               onBlur);
    document.documentElement.addEventListener('mouseleave', onLeave);
    window.addEventListener('keydown',            onKey, true);

    return () => {
      document.removeEventListener('copy',             onCopy);
      document.removeEventListener('cut',              onCut);
      document.removeEventListener('paste',            onPaste, true);
      document.removeEventListener('contextmenu',      onCtx);
      document.removeEventListener('fullscreenchange', onFs);
      document.removeEventListener('visibilitychange', onVis);
      window.removeEventListener('blur',               onBlur);
      document.documentElement.removeEventListener('mouseleave', onLeave);
      window.removeEventListener('keydown',            onKey, true);
      window.clearInterval(devtoolsTimer);
    };
  }, [active]);
}
