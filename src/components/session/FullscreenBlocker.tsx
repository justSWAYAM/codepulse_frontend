import React from 'react';
import { Maximize2, ShieldAlert } from 'lucide-react';
import { Button } from '../ui';
import { enterFullscreen } from '../../hooks/useExamLock';

interface FullscreenBlockerProps {
  /** Number of violations recorded so far (shown to candidate). */
  strikeCount: number;
  onReturnToFullscreen: () => void;
}

/**
 * FullscreenBlocker — modal overlay shown when the candidate exits fullscreen.
 * Hides all exam content and prompts them to return.  The button re-enters
 * fullscreen via the user-gesture path.
 */
export const FullscreenBlocker: React.FC<FullscreenBlockerProps> = ({
  strikeCount,
  onReturnToFullscreen,
}) => {
  const handleReturn = async () => {
    await enterFullscreen();
    onReturnToFullscreen();
  };

  return (
    <div
      role="alertdialog"
      aria-modal="true"
      aria-label="Exam paused — return to fullscreen"
      style={{
        position: 'fixed',
        inset: 0,
        zIndex: 10000,
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        background: 'rgba(0,0,0,0.92)',
        backdropFilter: 'blur(12px)',
      }}
    >
      <div
        style={{
          maxWidth: 420,
          width: '90%',
          background: 'var(--surface)',
          border: '1px solid var(--danger)',
          borderRadius: '1.25rem',
          padding: '2.25rem 2rem',
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          gap: '1.25rem',
          boxShadow: '0 32px 64px rgba(0,0,0,0.6)',
          animation: 'examBlockerIn 0.25s cubic-bezier(0.34,1.56,0.64,1) both',
        }}
      >
        {/* Icon */}
        <div
          style={{
            width: 64,
            height: 64,
            borderRadius: '50%',
            background: 'var(--danger-soft)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
          }}
        >
          <ShieldAlert
            style={{ width: 30, height: 30, color: 'var(--danger)' }}
            strokeWidth={1.75}
          />
        </div>

        {/* Heading */}
        <div style={{ textAlign: 'center' }}>
          <h2
            style={{
              margin: 0,
              fontFamily: 'var(--font-display, system-ui)',
              fontSize: '1.125rem',
              fontWeight: 700,
              letterSpacing: '-0.015em',
              color: 'var(--fg)',
            }}
          >
            Exam paused
          </h2>
          <p
            style={{
              marginTop: '0.5rem',
              fontSize: '0.875rem',
              lineHeight: 1.6,
              color: 'var(--fg-muted)',
            }}
          >
            You exited fullscreen. The exam is hidden until you return.
          </p>
        </div>

        {/* Strike counter */}
        {strikeCount > 0 && (
          <div
            style={{
              width: '100%',
              background: 'var(--warning-soft)',
              border: '1px solid color-mix(in oklab,var(--warning) 30%,transparent)',
              borderRadius: '0.75rem',
              padding: '0.75rem 1rem',
              fontSize: '0.8125rem',
              color: 'var(--warning-text)',
              textAlign: 'center',
              lineHeight: 1.5,
            }}
          >
            ⚠ Violation recorded &mdash; you have{' '}
            <strong>{strikeCount}</strong> flag{strikeCount !== 1 ? 's' : ''} so far.
            Repeated violations are reported to the invigilator.
          </div>
        )}

        {/* CTA */}
        <Button
          id="return-to-fullscreen-btn"
          onClick={handleReturn}
          leadingIcon={<Maximize2 style={{ width: 16, height: 16 }} />}
          style={{ width: '100%', justifyContent: 'center' }}
        >
          Return to fullscreen
        </Button>

        <p style={{ margin: 0, fontSize: '0.75rem', color: 'var(--fg-subtle)', textAlign: 'center' }}>
          Press the button above or use your browser's fullscreen shortcut.
        </p>
      </div>

      {/* Keyframe animation injected inline */}
      <style>{`
        @keyframes examBlockerIn {
          from { opacity: 0; transform: scale(0.88); }
          to   { opacity: 1; transform: scale(1); }
        }
      `}</style>
    </div>
  );
};
