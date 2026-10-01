export const formatMs = (ms: number | null | undefined) =>
  ms == null ? '—' : ms < 1000 ? `${Math.round(ms)} ms` : `${(ms / 1000).toFixed(2)} s`;

export const formatKb = (kb: number | null | undefined) =>
  kb == null ? '—' : kb < 1024 ? `${kb} KB` : `${(kb / 1024).toFixed(1)} MB`;
