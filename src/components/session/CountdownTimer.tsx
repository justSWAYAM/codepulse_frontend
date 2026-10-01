import React from 'react';
import { Timer } from 'lucide-react';
import { cn } from '../../lib/cn';

/**
 * Presentational only: renders HH:MM:SS from `remainingSeconds`.
 * Calm above 10 min, warning at ≤10 min, danger at ≤2 min. Tabular digits, no animation.
 */
export const CountdownTimer: React.FC<{ remainingSeconds: number }> = ({ remainingSeconds }) => {
  const pad = (n: number) => String(n).padStart(2, '0');
  const h = Math.floor(remainingSeconds / 3600);
  const m = Math.floor((remainingSeconds % 3600) / 60);
  const s = remainingSeconds % 60;
  const done = remainingSeconds <= 0;
  const display = done ? 'Time’s up' : h > 0 ? `${pad(h)}:${pad(m)}:${pad(s)}` : `${pad(m)}:${pad(s)}`;

  const tone = done || remainingSeconds <= 120 ? 'danger' : remainingSeconds <= 600 ? 'warning' : 'calm';

  return (
    <div
      role="timer"
      aria-label={done ? 'Time is up' : `Time remaining ${display}`}
      className={cn(
        'flex h-8 items-center gap-2 rounded-lg border px-2.5',
        tone === 'calm' && 'border-line bg-surface text-fg',
        tone === 'warning' && 'border-warning/30 bg-warning-soft text-warning-text',
        tone === 'danger' && 'border-danger/30 bg-danger-soft text-danger-text',
      )}
    >
      <Timer className={cn('size-4', tone === 'calm' && 'text-fg-subtle')} aria-hidden />
      <span className="tabular font-mono text-[13px] font-medium">{display}</span>
    </div>
  );
};
