import React, { useState } from 'react';
import { AlertTriangle, Check, Circle, EyeOff, RefreshCw, Send } from 'lucide-react';
import { Badge, Button, Card, Tooltip } from '../ui';
import { PublishConfirmDialog } from './PublishConfirmDialog';
import { UnpublishDialog } from './UnpublishDialog';
import { useRecomputeResults } from '../../hooks/useResults';
import { formatScore } from '../../lib/format';
import { cn } from '../../lib/cn';
import type { LeaderboardResponse } from '../../api/resultApi';
import { publishBlocker, readinessRows } from '../../lib/results';

const dateTime = new Intl.DateTimeFormat(undefined, { dateStyle: 'medium', timeStyle: 'short' });

/** Publish state, readiness checklist and (for admins) the Recompute / Publish / Unpublish actions. */
export const ResultsStatusCard: React.FC<{ leaderboard: LeaderboardResponse; isAdmin: boolean }> = ({ leaderboard, isAdmin }) => {
  const recompute = useRecomputeResults(leaderboard.contestId);
  const [publishOpen, setPublishOpen] = useState(false);
  const [unpublishOpen, setUnpublishOpen] = useState(false);
  const { readiness, published } = leaderboard;
  const blocker = publishBlocker(readiness);

  const publishButton = (
    <Button size="sm" onClick={() => setPublishOpen(true)} disabled={!!blocker} leadingIcon={<Send className="size-3.5" />}>
      Publish results
    </Button>
  );

  return (
    <Card className="p-5 sm:p-6">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
        <div className="min-w-0">
          <div className="flex flex-wrap items-center gap-2">
            <h3 className="font-display text-[15px] font-semibold tracking-[-0.015em] text-fg">Results</h3>
            {published ? (
              <Badge size="sm" tone="success" icon={<Check className="size-3" />}>
                Published
              </Badge>
            ) : (
              <Badge size="sm" tone="neutral">
                Not published
              </Badge>
            )}
          </div>
          <p className="mt-1 text-[13px] text-fg-muted">
            {published && leaderboard.publishedAt
              ? `Published ${dateTime.format(new Date(leaderboard.publishedAt))}${leaderboard.publishedByName ? ` by ${leaderboard.publishedByName}` : ''}.`
              : isAdmin
                ? 'Candidates see nothing until you publish.'
                : 'An administrator publishes results.'}
          </p>
          <p className="tabular mt-2 text-[12px] text-fg-subtle">
            Max score {formatScore(leaderboard.maxScore)} · {readiness.scored} scored · {readiness.needsReview} need review ·{' '}
            {readiness.absent} absent
          </p>
        </div>

        {isAdmin && (
          <div className="flex shrink-0 flex-wrap items-center gap-2">
            {!published && (
              <Button
                size="sm"
                variant="secondary"
                onClick={() => recompute.mutate()}
                loading={recompute.isPending}
                leadingIcon={<RefreshCw className="size-3.5" />}
              >
                Recompute
              </Button>
            )}
            {published ? (
              <Button size="sm" variant="secondary" onClick={() => setUnpublishOpen(true)} leadingIcon={<EyeOff className="size-3.5" />}>
                Unpublish
              </Button>
            ) : blocker ? (
              <Tooltip content={blocker}>
                <span tabIndex={0}>{publishButton}</span>
              </Tooltip>
            ) : (
              publishButton
            )}
          </div>
        )}
      </div>

      {!published && (
        <ul className="mt-4 grid gap-2 border-t border-line pt-4 sm:grid-cols-2" aria-label="Publish checklist">
          {readinessRows(readiness).map((row) => (
            <li key={row.label} className="flex items-start gap-2 text-[13px]">
              {row.done ? (
                <Check className="mt-0.5 size-4 shrink-0 text-success-text" aria-hidden />
              ) : row.advisory ? (
                <AlertTriangle className="mt-0.5 size-4 shrink-0 text-warning-text" aria-hidden />
              ) : (
                <Circle className="mt-0.5 size-4 shrink-0 text-fg-subtle" aria-hidden />
              )}
              <span className={cn(row.done ? 'text-fg-muted' : row.advisory ? 'text-warning-text' : 'text-fg')}>
                <span className="sr-only">{row.done ? 'Done: ' : 'Not done: '}</span>
                {row.done ? row.label : row.pending}
              </span>
            </li>
          ))}
        </ul>
      )}

      {isAdmin && (
        <>
          <PublishConfirmDialog open={publishOpen} onOpenChange={setPublishOpen} leaderboard={leaderboard} />
          <UnpublishDialog open={unpublishOpen} onOpenChange={setUnpublishOpen} contestId={leaderboard.contestId} />
        </>
      )}
    </Card>
  );
};
