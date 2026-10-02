import React from 'react';
import { AlertTriangle } from 'lucide-react';
import type { ResultStatus, ReviewReason } from '../../api/resultApi';
import { Badge, Tooltip } from '../ui';
import { REVIEW_REASON_TEXT } from '../../lib/results';

/**
 * SCORED is the normal case and shows nothing unless `showScored`; NEEDS_REVIEW is amber
 * (caution, as everywhere else) with the reasons in a tooltip; ABSENT is neutral.
 */
export const ResultStatusBadge: React.FC<{
  status: ResultStatus;
  reviewReasons?: ReviewReason[];
  showScored?: boolean;
}> = ({ status, reviewReasons = [], showScored = false }) => {
  if (status === 'NEEDS_REVIEW') {
    const reasons = reviewReasons.map((r) => REVIEW_REASON_TEXT[r]).join(' ');
    const badge = (
      <Badge size="sm" tone="warning" icon={<AlertTriangle className="size-3" />} tabIndex={0}>
        Needs review
      </Badge>
    );
    return reasons ? <Tooltip content={reasons}>{badge}</Tooltip> : badge;
  }
  if (status === 'ABSENT') {
    return (
      <Badge size="sm" tone="neutral">
        Absent
      </Badge>
    );
  }
  return showScored ? (
    <Badge size="sm" tone="neutral">
      Scored
    </Badge>
  ) : null;
};
