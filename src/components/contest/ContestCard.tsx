import React from 'react';
import { useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { Clock, Users, Calendar, Code2 } from 'lucide-react';
import { ContestStatusBadge } from './ContestStatusBadge';
import type { ContestRecord } from '../../api/contestApi';

interface ContestCardProps {
  contest: ContestRecord;
  showCandidateCount?: boolean;
}

function formatDate(isoString: string): string {
  return new Date(isoString).toLocaleString(undefined, {
    day: '2-digit',
    month: 'short',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  });
}

export const ContestCard: React.FC<ContestCardProps> = ({
  contest,
  showCandidateCount = false,
}) => {
  const navigate = useNavigate();

  return (
    <motion.div
      whileHover={{ y: -2, boxShadow: '0 8px 24px rgba(27,30,58,0.08)' }}
      transition={{ duration: 0.15 }}
      onClick={() => navigate(`/dashboard/contests/${contest.id}`)}
      className="bg-surface border border-hairline rounded-2xl p-5 cursor-pointer transition-shadow"
    >
      {/* Header row */}
      <div className="flex items-start justify-between gap-3 mb-3">
        <div className="flex-1 min-w-0">
          <h3 className="font-display text-[15px] font-bold text-ink truncate mb-1.5">
            {contest.title}
          </h3>
          <ContestStatusBadge status={contest.status} />
        </div>
      </div>

      {/* Description excerpt */}
      {contest.description && (
        <p className="text-sm text-ink/50 leading-relaxed line-clamp-2 mb-4">
          {contest.description}
        </p>
      )}

      {/* Meta row */}
      <div className="flex flex-wrap gap-x-4 gap-y-2 text-[12px] text-ink/50 mb-3">
        <span className="flex items-center gap-1.5">
          <Calendar className="w-3.5 h-3.5" />
          {formatDate(contest.startTime)}
        </span>
        <span className="flex items-center gap-1.5">
          <Clock className="w-3.5 h-3.5" />
          {contest.durationMinutes} min
        </span>
        {showCandidateCount && (
          <span className="flex items-center gap-1.5">
            <Users className="w-3.5 h-3.5" />
            {contest.candidateCount} candidate{contest.candidateCount !== 1 ? 's' : ''}
          </span>
        )}
      </div>

      {/* Language tags */}
      {contest.allowedLanguages.length > 0 && (
        <div className="flex items-center gap-1.5 flex-wrap">
          <Code2 className="w-3.5 h-3.5 text-ink/30" />
          {contest.allowedLanguages.map((lang) => (
            <span
              key={lang}
              className="font-mono text-[10px] px-2 py-0.5 rounded bg-ink/5 text-ink/60 tracking-tight"
            >
              {lang}
            </span>
          ))}
        </div>
      )}
    </motion.div>
  );
};
