import React from 'react';
import { Link } from 'react-router-dom';
import { ArrowUpRight, Calendar, Clock, Users } from 'lucide-react';
import { ContestStatusBadge } from './ContestStatusBadge';
import type { ContestRecord } from '../../api/contestApi';
import { languageLabel } from '../../lib/languages';

interface ContestCardProps {
  contest: ContestRecord;
  showCandidateCount?: boolean;
}

function formatDate(isoString: string): string {
  return new Date(isoString).toLocaleString(undefined, {
    day: '2-digit',
    month: 'short',
    hour: '2-digit',
    minute: '2-digit',
  });
}

export const ContestCard: React.FC<ContestCardProps> = ({ contest, showCandidateCount = false }) => (
  <Link
    to={`/dashboard/contests/${contest.id}`}
    className="press group flex h-full flex-col rounded-2xl border border-line bg-surface p-5 shadow-card active:scale-[0.98] hover-fine:border-line-strong"
  >
    <div className="flex items-start justify-between gap-3">
      <ContestStatusBadge status={contest.status} />
      <ArrowUpRight
        aria-hidden
        className="size-4 text-fg-subtle opacity-0 transition-opacity duration-150 group-focus-visible:opacity-100 [@media(hover:hover)]:group-hover:opacity-100"
      />
    </div>

    <h3 className="mt-3 line-clamp-2 font-display text-[16px] font-semibold leading-6 tracking-[-0.015em] text-fg">
      {contest.title}
    </h3>
    {contest.description && (
      <p className="mt-1 line-clamp-2 text-[13px] leading-5 text-fg-muted">{contest.description}</p>
    )}

    <div className="mt-auto pt-5">
      <dl className="flex flex-wrap gap-x-4 gap-y-1.5 text-[12.5px] text-fg-muted">
        <div className="flex items-center gap-1.5">
          <dt className="sr-only">Starts</dt>
          <Calendar className="size-3.5 text-fg-subtle" aria-hidden />
          <dd className="tabular">{formatDate(contest.startTime)}</dd>
        </div>
        <div className="flex items-center gap-1.5">
          <dt className="sr-only">Duration</dt>
          <Clock className="size-3.5 text-fg-subtle" aria-hidden />
          <dd className="tabular">{contest.durationMinutes} min</dd>
        </div>
        {showCandidateCount && (
          <div className="flex items-center gap-1.5">
            <dt className="sr-only">Candidates</dt>
            <Users className="size-3.5 text-fg-subtle" aria-hidden />
            <dd className="tabular">
              {contest.candidateCount} candidate{contest.candidateCount !== 1 ? 's' : ''}
            </dd>
          </div>
        )}
      </dl>

      {contest.allowedLanguages.length > 0 && (
        <div className="mt-3 flex flex-wrap gap-1.5 border-t border-line pt-3">
          {contest.allowedLanguages.map((lang) => (
            <span key={lang} className="rounded-md bg-surface-2 px-1.5 py-0.5 font-mono text-[11px] text-fg-muted">
              {languageLabel(lang)}
            </span>
          ))}
        </div>
      )}
    </div>
  </Link>
);
