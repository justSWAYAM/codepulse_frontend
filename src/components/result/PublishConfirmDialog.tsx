import React, { useEffect, useState } from 'react';
import { AlertTriangle, Send } from 'lucide-react';
import { Button, Dialog } from '../ui';
import { usePublishResults } from '../../hooks/useResults';
import { getErrorMessage } from '../../lib/apiError';
import type { LeaderboardResponse } from '../../api/resultApi';
import { toast } from 'sonner';

interface PublishConfirmDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  leaderboard: LeaderboardResponse;
}

/** Publishing with flagged results needs an explicit acknowledgement, sent as acknowledgeFlagged. */
export const PublishConfirmDialog: React.FC<PublishConfirmDialogProps> = ({ open, onOpenChange, leaderboard }) => {
  const publish = usePublishResults(leaderboard.contestId);
  const [acknowledged, setAcknowledged] = useState(false);
  const { scored, needsReview } = leaderboard.readiness;

  useEffect(() => {
    if (open) {
      setAcknowledged(false);
      publish.reset();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [open]);

  const confirm = () =>
    publish.mutate(acknowledged, {
      onSuccess: () => {
        toast.success('Results published');
        onOpenChange(false);
      },
    });

  return (
    <Dialog
      open={open}
      onOpenChange={onOpenChange}
      dismissible={!publish.isPending}
      icon={<Send className="size-5" />}
      size="sm"
      title="Publish results?"
      description={`${scored + needsReview} candidate(s) will immediately see their score and rank for ${leaderboard.contestTitle}. Absent candidates see that they didn’t take part. While results are published, scores can’t be adjusted and submissions can’t be rejudged.`}
      footer={
        <>
          <Button variant="secondary" onClick={() => onOpenChange(false)} disabled={publish.isPending}>
            Cancel
          </Button>
          <Button
            onClick={confirm}
            loading={publish.isPending}
            disabled={needsReview > 0 && !acknowledged}
            leadingIcon={<Send className="size-4" />}
          >
            Publish results
          </Button>
        </>
      }
    >
      <div className="space-y-3">
        {needsReview > 0 && (
          <div className="rounded-xl border border-warning/30 bg-warning-soft px-4 py-3 text-[13px] leading-5 text-warning-text">
            <p className="flex items-center gap-2 font-medium">
              <AlertTriangle className="size-4 shrink-0" aria-hidden />
              {needsReview} result(s) need review
            </p>
            <label className="mt-2.5 flex cursor-pointer items-start gap-2.5">
              <input
                type="checkbox"
                checked={acknowledged}
                onChange={(e) => setAcknowledged(e.target.checked)}
                className="mt-0.5 size-4 accent-[var(--primary)]"
              />
              <span>I’ve reviewed the {needsReview} flagged result(s) and want to publish anyway</span>
            </label>
          </div>
        )}
        {publish.isError && (
          <p role="alert" className="rounded-xl bg-danger-soft px-4 py-3 text-[13px] leading-5 text-danger-text">
            {getErrorMessage(publish.error, 'Couldn’t publish results.')}
          </p>
        )}
      </div>
    </Dialog>
  );
};
