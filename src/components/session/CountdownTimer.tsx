import React from 'react';
import { Timer } from 'lucide-react';

interface CountdownTimerProps {
  remainingSeconds: number;
}

/**
 * CountdownTimer — presentational only.
 * Renders HH:MM:SS from `remainingSeconds`. Contains no timing logic.
 *
 * Color states (Section 3.1):
 * - More than 10 minutes: `ink` text on `surface` (calm)
 * - 10 minutes or less:  `accent-syntax` amber (caution)
 * - 2 minutes or less:   `accent-error` red (danger)
 *
 * Typography: JetBrains Mono with tabular numerals, no bounce/pulse/scale.
 * Honors prefers-reduced-motion by not having any animation at all.
 */
export const CountdownTimer: React.FC<CountdownTimerProps> = ({ remainingSeconds }) => {
  if (remainingSeconds <= 0) {
    return (
      <div className="flex items-center gap-2">
        <Timer className="w-4 h-4 text-accent-error" />
        <span
          className="font-mono text-sm font-bold text-accent-error"
          style={{ fontVariantNumeric: 'tabular-nums' }}
        >
          Time's up
        </span>
      </div>
    );
  }

  const hours = Math.floor(remainingSeconds / 3600);
  const minutes = Math.floor((remainingSeconds % 3600) / 60);
  const seconds = remainingSeconds % 60;

  const pad = (n: number) => String(n).padStart(2, '0');
  const display = hours > 0
    ? `${pad(hours)}:${pad(minutes)}:${pad(seconds)}`
    : `${pad(minutes)}:${pad(seconds)}`;

  // Determine color state
  let colorClass: string;
  let iconColorClass: string;
  if (remainingSeconds <= 120) {
    // ≤ 2 minutes — danger red
    colorClass = 'text-accent-error';
    iconColorClass = 'text-accent-error';
  } else if (remainingSeconds <= 600) {
    // ≤ 10 minutes — caution amber
    colorClass = 'text-accent-syntax';
    iconColorClass = 'text-accent-syntax';
  } else {
    // Calm — default ink
    colorClass = 'text-ink';
    iconColorClass = 'text-ink/50';
  }

  return (
    <div className="flex items-center gap-2">
      <Timer className={`w-4 h-4 ${iconColorClass}`} />
      <span
        className={`font-mono text-sm font-bold ${colorClass}`}
        style={{ fontVariantNumeric: 'tabular-nums' }}
      >
        {display}
      </span>
    </div>
  );
};
