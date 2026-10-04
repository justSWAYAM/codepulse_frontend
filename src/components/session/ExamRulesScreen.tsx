import React, { useState } from 'react';
import {
  AlertTriangle,
  CheckCircle2,
  ChevronRight,
  Clock,
  Copy,
  EyeOff,
  Fullscreen,
  Monitor,
  ShieldCheck,
} from 'lucide-react';
import { BrandMark, Button } from '../ui';
import { enterFullscreen } from '../../hooks/useExamLock';

interface ExamRulesScreenProps {
  contestTitle: string;
  durationMinutes: number;
  /** Called once the candidate has acknowledged rules and entered fullscreen. */
  onReady: () => void;
}

interface Rule {
  icon: React.ReactNode;
  title: string;
  body: string;
  tone: 'info' | 'warning' | 'danger';
}

const RULES: Rule[] = [
  {
    icon: <Fullscreen />,
    title: 'Fullscreen required',
    body: 'The exam runs in fullscreen mode. Exiting fullscreen pauses your view and is recorded as a violation.',
    tone: 'danger',
  },
  {
    icon: <Monitor />,
    title: 'Stay in this window',
    body: 'Switching tabs, minimising the browser, or moving focus to another application is detected and flagged.',
    tone: 'danger',
  },
  {
    icon: <Copy />,
    title: 'No copy/paste from outside',
    body: 'Pasting code from external sources is blocked. You may copy and paste within your own editor.',
    tone: 'warning',
  },
  {
    icon: <EyeOff />,
    title: 'DevTools are monitored',
    body: 'Opening browser DevTools is detected. The exam content is watermarked with your identity.',
    tone: 'warning',
  },
  {
    icon: <Clock />,
    title: 'Timer runs continuously',
    body: 'The countdown timer cannot be paused. You have one attempt — once started it runs to completion.',
    tone: 'info',
  },
  {
    icon: <ShieldCheck />,
    title: 'Violations are recorded',
    body: 'Every integrity event is logged server-side with a timestamp and reported to the invigilator.',
    tone: 'info',
  },
];

const toneStyles: Record<Rule['tone'], { bg: string; icon: string; border: string }> = {
  danger:  { bg: 'var(--danger-soft)',  icon: 'var(--danger)',       border: 'color-mix(in oklab,var(--danger) 25%,transparent)'  },
  warning: { bg: 'var(--warning-soft)', icon: 'var(--warning)',      border: 'color-mix(in oklab,var(--warning) 25%,transparent)' },
  info:    { bg: 'var(--info-soft)',    icon: 'var(--info)',         border: 'color-mix(in oklab,var(--info) 25%,transparent)'    },
};

/**
 * ExamRulesScreen — shown before the exam layout is revealed.
 *
 * The candidate must:
 *  1. Read the integrity rules.
 *  2. Tick the acknowledgement checkbox.
 *  3. Click "I understand — Start exam" (this is the user-gesture that
 *     allows requestFullscreen() to succeed).
 *
 * Only then does the parent show the real exam layout.
 */
export const ExamRulesScreen: React.FC<ExamRulesScreenProps> = ({
  contestTitle,
  durationMinutes,
  onReady,
}) => {
  const [agreed, setAgreed]     = useState(false);
  const [loading, setLoading]   = useState(false);
  const [fsError, setFsError]   = useState(false);

  const handleStart = async () => {
    if (!agreed) return;
    setLoading(true);
    setFsError(false);
    try {
      await enterFullscreen();
    } catch {
      // Fullscreen denied — we'll still let them in but show a note
      setFsError(true);
    }
    // Slight delay so the fullscreen transition settles before content renders
    setTimeout(() => {
      setLoading(false);
      onReady();
    }, 200);
  };

  return (
    <div
      style={{
        minHeight: '100dvh',
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        justifyContent: 'center',
        padding: '2rem 1rem',
        background: 'var(--canvas)',
        overflowY: 'auto',
      }}
    >
      {/* Card */}
      <div
        style={{
          width: '100%',
          maxWidth: 640,
          background: 'var(--surface)',
          border: '1px solid var(--line)',
          borderRadius: '1.5rem',
          boxShadow: 'var(--shadow-pop)',
          overflow: 'hidden',
        }}
      >
        {/* Header */}
        <div
          style={{
            padding: '1.75rem 2rem 1.5rem',
            borderBottom: '1px solid var(--line)',
            background: 'linear-gradient(135deg, var(--primary-soft) 0%, transparent 60%)',
          }}
        >
          <BrandMark size={28} withWordmark />

          <div style={{ marginTop: '1.25rem' }}>
            <h1
              style={{
                margin: 0,
                fontFamily: 'var(--font-display, system-ui)',
                fontSize: '1.375rem',
                fontWeight: 700,
                letterSpacing: '-0.02em',
                color: 'var(--fg)',
                lineHeight: 1.25,
              }}
            >
              {contestTitle}
            </h1>
            <div
              style={{
                marginTop: '0.5rem',
                display: 'inline-flex',
                alignItems: 'center',
                gap: '0.375rem',
                fontSize: '0.8125rem',
                color: 'var(--fg-muted)',
                background: 'var(--surface-2)',
                padding: '0.25rem 0.75rem',
                borderRadius: '999px',
                border: '1px solid var(--line)',
              }}
            >
              <Clock style={{ width: 13, height: 13 }} />
              {durationMinutes} minute exam
            </div>
          </div>
        </div>

        {/* Rules grid */}
        <div style={{ padding: '1.5rem 2rem' }}>
          <p
            style={{
              margin: '0 0 1.25rem',
              fontSize: '0.875rem',
              color: 'var(--fg-muted)',
              lineHeight: 1.6,
            }}
          >
            Before you begin, read the integrity rules below. Violations are
            logged and reviewed by the invigilator.
          </p>

          <div
            style={{
              display: 'grid',
              gridTemplateColumns: 'repeat(auto-fill, minmax(260px, 1fr))',
              gap: '0.75rem',
            }}
          >
            {RULES.map((rule) => {
              const ts = toneStyles[rule.tone];
              return (
                <div
                  key={rule.title}
                  style={{
                    display: 'flex',
                    gap: '0.75rem',
                    padding: '0.875rem 1rem',
                    background: ts.bg,
                    border: `1px solid ${ts.border}`,
                    borderRadius: '0.875rem',
                  }}
                >
                  <span
                    style={{
                      flexShrink: 0,
                      marginTop: 2,
                      color: ts.icon,
                      display: 'flex',
                    }}
                  >
                    {React.cloneElement(rule.icon as React.ReactElement, {
                      style: { width: 16, height: 16 },
                    })}
                  </span>
                  <div>
                    <p
                      style={{
                        margin: 0,
                        fontSize: '0.8125rem',
                        fontWeight: 600,
                        color: 'var(--fg)',
                        lineHeight: 1.3,
                      }}
                    >
                      {rule.title}
                    </p>
                    <p
                      style={{
                        margin: '0.25rem 0 0',
                        fontSize: '0.75rem',
                        color: 'var(--fg-muted)',
                        lineHeight: 1.55,
                      }}
                    >
                      {rule.body}
                    </p>
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* Footer / CTA */}
        <div
          style={{
            padding: '1.25rem 2rem 1.75rem',
            borderTop: '1px solid var(--line)',
            display: 'flex',
            flexDirection: 'column',
            gap: '1rem',
          }}
        >
          {/* Acknowledgement checkbox */}
          <label
            htmlFor="exam-rules-agree"
            style={{
              display: 'flex',
              alignItems: 'flex-start',
              gap: '0.75rem',
              cursor: 'pointer',
              fontSize: '0.875rem',
              color: 'var(--fg-muted)',
              lineHeight: 1.55,
            }}
          >
            <input
              id="exam-rules-agree"
              type="checkbox"
              checked={agreed}
              onChange={(e) => setAgreed(e.target.checked)}
              style={{
                marginTop: '0.125rem',
                width: 16,
                height: 16,
                accentColor: 'var(--primary)',
                cursor: 'pointer',
                flexShrink: 0,
              }}
            />
            I have read and understood the integrity rules. I accept that
            violations are logged and may result in my exam being flagged for
            review. My name and contact details will appear as a watermark
            during the exam.
          </label>

          {/* Fullscreen error note */}
          {fsError && (
            <div
              style={{
                display: 'flex',
                alignItems: 'flex-start',
                gap: '0.5rem',
                padding: '0.75rem 1rem',
                background: 'var(--warning-soft)',
                border: '1px solid color-mix(in oklab,var(--warning) 30%,transparent)',
                borderRadius: '0.75rem',
                fontSize: '0.8125rem',
                color: 'var(--warning-text)',
                lineHeight: 1.5,
              }}
            >
              <AlertTriangle style={{ width: 15, height: 15, flexShrink: 0, marginTop: 1 }} />
              Your browser did not enter fullscreen. Please enable fullscreen
              permissions or use F11. The exam will still run, but fullscreen
              exits will be flagged.
            </div>
          )}

          {/* Start button */}
          <Button
            id="exam-start-fullscreen-btn"
            onClick={handleStart}
            disabled={!agreed}
            loading={loading}
            leadingIcon={
              agreed
                ? <CheckCircle2 style={{ width: 16, height: 16 }} />
                : <ChevronRight style={{ width: 16, height: 16 }} />
            }
            style={{ alignSelf: 'flex-start' }}
          >
            I understand — Start exam
          </Button>

          <p
            style={{
              margin: 0,
              fontSize: '0.75rem',
              color: 'var(--fg-subtle)',
            }}
          >
            Clicking this button requests fullscreen and starts the exam environment.
          </p>
        </div>
      </div>
    </div>
  );
};
