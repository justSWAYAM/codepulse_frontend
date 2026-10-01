import React, { useState } from 'react';
import { AlertTriangle, Check, CircleSlash, Clock, Copy, Cpu, X } from 'lucide-react';
import { Badge, IconButton, Spinner } from '../ui';
import { cn } from '../../lib/cn';
import { verdictOf, type VerdictKey } from '../../lib/verdicts';

const ICONS: Partial<Record<VerdictKey, React.ReactNode>> = {
  ACCEPTED: <Check className="size-3" strokeWidth={2.5} />,
  PASSED: <Check className="size-3" strokeWidth={2.5} />,
  WRONG_ANSWER: <X className="size-3" strokeWidth={2.5} />,
  TIME_LIMIT_EXCEEDED: <Clock className="size-3" />,
  MEMORY_LIMIT_EXCEEDED: <Cpu className="size-3" />,
  RUNTIME_ERROR: <AlertTriangle className="size-3" />,
  COMPILATION_ERROR: <CircleSlash className="size-3" />,
  SYSTEM_ERROR: <AlertTriangle className="size-3" />,
};

/** Verdict with icon + word, so colour is never the only signal. */
export const VerdictBadge: React.FC<{ status: VerdictKey | null | undefined; short?: boolean; size?: 'sm' | 'md'; className?: string }> = ({
  status,
  short,
  size = 'sm',
  className,
}) => {
  const v = verdictOf(status);
  return (
    <Badge
      tone={v.tone}
      size={size}
      className={className}
      icon={status === 'PENDING' ? <Spinner size={11} label="Judging" /> : status ? ICONS[status] : undefined}
      title={short ? v.label : undefined}
    >
      {short ? v.code : v.label}
    </Badge>
  );
};

/** Monospace output block with a copy button. Empty output is shown explicitly. */
export const OutputBlock: React.FC<{
  label: string;
  value: string | null | undefined;
  tone?: 'default' | 'danger';
  emptyText?: string;
  className?: string;
}> = ({ label, value, tone = 'default', emptyText = '(no output)', className }) => {
  const [copied, setCopied] = useState(false);
  const has = value != null && value !== '';
  const copy = async () => {
    try {
      await navigator.clipboard.writeText(value ?? '');
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch {
      // clipboard blocked — nothing to do
    }
  };
  return (
    <div className={cn('min-w-0', className)}>
      <div className="mb-1.5 flex h-6 items-center justify-between">
        <span className="font-mono text-[11px] font-medium uppercase tracking-[0.08em] text-editor-muted">{label}</span>
        {has && (
          <IconButton
            aria-label={copied ? `${label} copied` : `Copy ${label.toLowerCase()}`}
            size="sm"
            onClick={copy}
            className="size-6 text-editor-muted hover-fine:bg-white/5 hover-fine:text-editor-fg"
          >
            {copied ? <Check className="size-3.5 text-success-text" /> : <Copy className="size-3.5" />}
          </IconButton>
        )}
      </div>
      <pre
        className={cn(
          'scroll-thin max-h-48 overflow-auto rounded-xl border border-editor-line bg-editor-bg px-3 py-2.5 font-mono text-[12.5px] leading-5 whitespace-pre-wrap break-words',
          tone === 'danger' ? 'text-danger-text' : 'text-editor-fg',
          !has && 'italic text-editor-muted',
        )}
      >
        {has ? value : emptyText}
      </pre>
      <span className="sr-only" aria-live="polite">
        {copied ? 'Copied to the clipboard' : ''}
      </span>
    </div>
  );
};

export const formatMs = (ms: number | null | undefined) =>
  ms == null ? '—' : ms < 1000 ? `${Math.round(ms)} ms` : `${(ms / 1000).toFixed(2)} s`;

export const formatKb = (kb: number | null | undefined) =>
  kb == null ? '—' : kb < 1024 ? `${kb} KB` : `${(kb / 1024).toFixed(1)} MB`;
