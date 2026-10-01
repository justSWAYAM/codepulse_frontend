import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Plus, Trophy } from 'lucide-react';
import { motion } from 'framer-motion';
import { useContests } from '../hooks/useContests';
import { useAuth } from '../context/AuthContext';
import { ContestCard } from '../components/contest/ContestCard';
import type { ContestStatus } from '../api/contestApi';

const STATUS_TABS: { label: string; value: ContestStatus | undefined }[] = [
  { label: 'All', value: undefined },
  { label: 'Draft', value: 'DRAFT' },
  { label: 'Published', value: 'PUBLISHED' },
  { label: 'Live', value: 'ONGOING' },
  { label: 'Completed', value: 'COMPLETED' },
];

const ContestListPage: React.FC = () => {
  const navigate = useNavigate();
  const { user } = useAuth();
  const isAdmin = user?.role === 'ADMIN';
  const [activeStatus, setActiveStatus] = useState<ContestStatus | undefined>(undefined);

  const { data, isLoading, isError } = useContests({ status: activeStatus });
  const contests = data?.content ?? [];

  return (
    <div>
      {/* Page header */}
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="font-display text-2xl font-bold text-fg">
            {user?.role === 'CANDIDATE' ? 'My Contests' : 'Contests'}
          </h1>
          <p className="text-sm text-fg-muted mt-0.5">
            {user?.role === 'CANDIDATE'
              ? 'Contests you are enrolled in'
              : 'Manage and monitor all contests'}
          </p>
        </div>
        {isAdmin && (
          <button
            onClick={() => navigate('/dashboard/contests/new')}
            className="flex items-center gap-2 px-4 py-2 bg-primary text-white rounded-xl text-sm font-medium hover:bg-primary-hover transition-colors cursor-pointer"
          >
            <Plus className="w-4 h-4" />
            Create Contest
          </button>
        )}
      </div>

      {/* Status filter tabs */}
      <div className="flex gap-1 mb-6 bg-fg/5 p-1 rounded-xl w-fit">
        {STATUS_TABS.map((tab) => (
          <button
            key={tab.label}
            onClick={() => setActiveStatus(tab.value)}
            className={`px-3 py-1.5 rounded-lg text-sm font-medium transition cursor-pointer ${
              activeStatus === tab.value
                ? 'bg-surface text-fg shadow-sm'
                : 'text-fg-muted hover:text-fg'
            }`}
          >
            {tab.label}
            {tab.value === 'ONGOING' && (
              <span className="ml-1.5 inline-block w-1.5 h-1.5 rounded-full bg-primary animate-pulse align-middle" />
            )}
          </button>
        ))}
      </div>

      {/* Content */}
      {isLoading ? (
        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
          {[...Array(6)].map((_, i) => (
            <div key={i} className="h-44 bg-surface border border-line rounded-2xl animate-pulse" />
          ))}
        </div>
      ) : isError ? (
        <div className="bg-danger-soft border border-danger/30 rounded-2xl p-6 text-center">
          <p className="text-danger-text font-medium">Failed to load contests</p>
          <p className="text-sm text-fg-muted mt-1">Check your connection and try again</p>
        </div>
      ) : contests.length === 0 ? (
        <motion.div
          initial={{ opacity: 0, y: 8 }}
          animate={{ opacity: 1, y: 0 }}
          className="bg-surface border border-line rounded-2xl p-12 text-center"
        >
          <div className="w-12 h-12 rounded-xl bg-fg/5 flex items-center justify-center mx-auto mb-4">
            <Trophy className="w-6 h-6 text-fg-subtle" />
          </div>
          <p className="font-display text-lg font-semibold text-fg mb-1">
            {user?.role === 'CANDIDATE' ? "You haven't been assigned any contests yet" : 'No contests yet'}
          </p>
          <p className="text-sm text-fg-muted">
            {isAdmin
              ? 'Create your first contest to get started.'
              : 'Contact your admin to get enrolled.'}
          </p>
        </motion.div>
      ) : (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4"
        >
          {contests.map((contest, i) => (
            <motion.div
              key={contest.id}
              initial={{ opacity: 0, y: 12 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: i * 0.05 }}
            >
              <ContestCard
                contest={contest}
                showCandidateCount={user?.role !== 'CANDIDATE'}
              />
            </motion.div>
          ))}
        </motion.div>
      )}
    </div>
  );
};

export default ContestListPage;
