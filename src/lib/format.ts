export const formatMs = (ms: number | null | undefined) =>
  ms == null ? '—' : ms < 1000 ? `${Math.round(ms)} ms` : `${(ms / 1000).toFixed(2)} s`;

/** Scores with up to 2 decimals and no trailing zeros: 42.5, not 42.50. */
export const formatScore = (score: number | null | undefined) =>
  score == null ? '—' : String(Number(Number(score).toFixed(2)));

/** Whole seconds as "1h 02m", "41m" or "35s". */
export const formatDuration = (seconds: number | null | undefined) => {
  if (seconds == null) return '–';
  const s = Math.max(0, Math.floor(seconds));
  const h = Math.floor(s / 3600);
  const m = Math.floor((s % 3600) / 60);
  if (h > 0) return `${h}h ${String(m).padStart(2, '0')}m`;
  if (m > 0) return `${m}m`;
  return `${s}s`;
};

export const formatKb = (kb: number | null | undefined) =>
  kb == null ? '—' : kb < 1024 ? `${kb} KB` : `${(kb / 1024).toFixed(1)} MB`;
