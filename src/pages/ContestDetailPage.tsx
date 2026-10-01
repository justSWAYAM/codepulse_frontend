import React, { useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { ArrowLeft, Loader2, Users, BookOpen, Send, AlertTriangle, FileCode2 } from 'lucide-react';
import { useContest, usePublishContest, useAssignCandidates } from '../hooks/useContests';
import { useUsers } from '../hooks/useUsers';
import { useAuth } from '../context/AuthContext';
import { ContestStatusBadge } from '../components/contest/ContestStatusBadge';
import { QuestionListPanel } from '../components/question/QuestionListPanel';
import { ExamEntryCard } from '../components/session/ExamEntryCard';
import { toast } from 'sonner';

const CONTEST_STATUSES = ['DRAFT', 'PUBLISHED', 'ONGOING', 'COMPLETED'] as const;

function formatDate(isoString: string): string {
  return new Date(isoString).toLocaleString(undefined, {
    day: '2-digit',
    month: 'short',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  });
}

const ContestDetailPage: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { user } = useAuth();
  const [activeTab, setActiveTab] = useState<'overview' | 'candidates' | 'questions'>('overview');
  const [selectedCandidateIds, setSelectedCandidateIds] = useState<string[]>([]);
  const [showPublishConfirm, setShowPublishConfirm] = useState(false);
  
  // Filter states
  const [filterBranch, setFilterBranch] = useState<string>('');
  const [filterDivision, setFilterDivision] = useState<string>('');
  const [filterBatch, setFilterBatch] = useState<string>('');

  const isAdmin = user?.role === 'ADMIN';
  const isEvaluator = user?.role === 'EVALUATOR';
  const isCandidate = user?.role === 'CANDIDATE';

  const { data: contest, isLoading, isError, error } = useContest(id!);
  const publishMutation = usePublishContest(id!);
  const assignMutation = useAssignCandidates(id!);

  // Candidate picker — fetch all candidates for admin assignment.
  // GET /users is admin-only, so don't fire it for other roles.
  // Page size is large because the picker filters client-side (Spring caps size at 2000).
  const { data: candidatesData } = useUsers(
    { role: 'CANDIDATE', pageSize: 2000 },
    isAdmin
  );
  const allCandidates = (candidatesData as unknown as { users?: { id: string; fullName: string; email: string; rollNumber?: string; branch?: string; division?: string; batch?: string }[] })?.users ?? [];

  const filteredCandidates = allCandidates.filter((c) => {
    if (filterBranch && c.branch !== filterBranch) return false;
    if (filterDivision && c.division !== filterDivision) return false;
    if (filterBatch && c.batch !== filterBatch) return false;
    return true;
  });

  const handleSelectAllFiltered = () => {
    const unassignedFiltered = filteredCandidates.filter((c) => !contest?.candidates?.some((cc) => cc.id === c.id));
    const newIds = unassignedFiltered.map((c) => c.id);
    setSelectedCandidateIds((prev) => Array.from(new Set([...prev, ...newIds])));
  };

  const handleDeselectAllFiltered = () => {
    const filteredIds = new Set(filteredCandidates.map(c => c.id));
    setSelectedCandidateIds((prev) => prev.filter(id => !filteredIds.has(id)));
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-24">
        <Loader2 className="w-6 h-6 animate-spin text-ink/40" />
      </div>
    );
  }

  if (isError) {
    const status = (error as { response?: { status?: number } })?.response?.status;
    return (
      <div className="bg-accent-error/5 border border-accent-error/20 rounded-2xl p-8 text-center max-w-md mx-auto mt-8">
        <AlertTriangle className="w-8 h-8 text-accent-error mx-auto mb-3" />
        <p className="font-display text-lg font-bold text-ink mb-1">
          {status === 403 ? "Access Denied" : "Contest Not Found"}
        </p>
        <p className="text-sm text-ink/50 mb-4">
          {status === 403
            ? "You don't have access to this contest."
            : "This contest doesn't exist or has been removed."}
        </p>
        <button
          onClick={() => navigate('/dashboard/contests')}
          className="text-sm font-medium text-accent-compile hover:underline cursor-pointer"
        >
          ← Back to Contests
        </button>
      </div>
    );
  }

  if (!contest) return null;

  const handlePublish = async () => {
    setShowPublishConfirm(false);
    try {
      await publishMutation.mutateAsync();
    } catch (err: unknown) {
      const msg =
        (err as { response?: { data?: { message?: string } } })?.response?.data?.message ??
        'Failed to publish contest';
      toast.error(msg);
    }
  };

  const toggleCandidate = (cid: string) => {
    setSelectedCandidateIds((prev) =>
      prev.includes(cid) ? prev.filter((id) => id !== cid) : [...prev, cid]
    );
  };

  const handleAssign = async () => {
    if (selectedCandidateIds.length === 0) {
      toast.error('Select at least one candidate');
      return;
    }
    await assignMutation.mutateAsync({ candidateIds: selectedCandidateIds });
    setSelectedCandidateIds([]);
  };

  const currentStatusIndex = CONTEST_STATUSES.indexOf(contest.status);

  return (
    <div className="max-w-4xl mx-auto">
      {/* Back + Header */}
      <div className="flex items-start gap-3 mb-6">
        <button
          onClick={() => navigate('/dashboard/contests')}
          className="p-2 rounded-xl text-ink/40 hover:text-ink hover:bg-ink/5 transition-colors mt-0.5 cursor-pointer"
        >
          <ArrowLeft className="w-5 h-5" />
        </button>
        <div className="flex-1">
          <div className="flex items-center gap-3 flex-wrap mb-1">
            <h1 className="font-display text-2xl font-bold text-ink">{contest.title}</h1>
            <ContestStatusBadge status={contest.status} />
          </div>
          <p className="font-mono text-[11px] text-ink/30">{contest.id}</p>
        </div>
      </div>

      {/* Status timeline */}
      <div className="bg-surface border border-hairline rounded-2xl p-4 mb-6">
        <div className="flex items-center gap-0">
          {CONTEST_STATUSES.map((s, i) => {
            const done = i < currentStatusIndex;
            const active = i === currentStatusIndex;
            return (
              <React.Fragment key={s}>
                <div className="flex flex-col items-center gap-1.5">
                  <div
                    className={`w-7 h-7 rounded-full flex items-center justify-center text-[10px] font-bold transition-all ${
                      active
                        ? 'bg-accent-compile text-white shadow-md shadow-accent-compile/30'
                        : done
                        ? 'bg-accent-compile/20 text-accent-compile'
                        : 'bg-ink/5 text-ink/30'
                    }`}
                  >
                    {i + 1}
                  </div>
                  <span
                    className={`text-[10px] font-medium ${
                      active ? 'text-accent-compile' : done ? 'text-ink/60' : 'text-ink/30'
                    }`}
                  >
                    {s.charAt(0) + s.slice(1).toLowerCase()}
                  </span>
                </div>
                {i < CONTEST_STATUSES.length - 1 && (
                  <div
                    className={`flex-1 h-px mx-2 mt-[-14px] ${
                      i < currentStatusIndex ? 'bg-accent-compile/40' : 'bg-hairline'
                    }`}
                  />
                )}
              </React.Fragment>
            );
          })}
        </div>
      </div>

      {/* Tabs */}
      <div className="flex gap-1 mb-6 border-b border-hairline">
        <button
          onClick={() => setActiveTab('overview')}
          className={`flex items-center gap-2 px-4 py-2.5 text-sm font-medium border-b-2 -mb-px transition-colors cursor-pointer ${
            activeTab === 'overview'
              ? 'border-ink text-ink'
              : 'border-transparent text-ink/50 hover:text-ink'
          }`}
        >
          <BookOpen className="w-4 h-4" />
          Overview
        </button>
        {(isAdmin || isEvaluator) && (
          <button
            onClick={() => setActiveTab('candidates')}
            className={`flex items-center gap-2 px-4 py-2.5 text-sm font-medium border-b-2 -mb-px transition-colors cursor-pointer ${
              activeTab === 'candidates'
                ? 'border-ink text-ink'
                : 'border-transparent text-ink/50 hover:text-ink'
            }`}
          >
            <Users className="w-4 h-4" />
            Candidates
            {contest.candidateCount > 0 && (
              <span className="text-[10px] bg-ink/10 text-ink/60 rounded-full px-1.5 py-0.5 font-mono">
                {contest.candidateCount}
              </span>
            )}
          </button>
        )}
        {/* Questions tab — hidden for candidates (Section 10) */}
        {!isCandidate && (
          <button
            onClick={() => setActiveTab('questions')}
            className={`flex items-center gap-2 px-4 py-2.5 text-sm font-medium border-b-2 -mb-px transition-colors cursor-pointer ${
              activeTab === 'questions'
                ? 'border-ink text-ink'
                : 'border-transparent text-ink/50 hover:text-ink'
            }`}
          >
            <FileCode2 className="w-4 h-4" />
            Questions
          </button>
        )}
      </div>

      {/* Tab: Overview */}
      {activeTab === 'overview' && (
        <motion.div
          key="overview"
          initial={{ opacity: 0, y: 6 }}
          animate={{ opacity: 1, y: 0 }}
          className="space-y-5"
        >
          {/* Candidate exam entry card — Section 6.1 */}
          {isCandidate && <ExamEntryCard contest={contest} />}
          {/* Meta card */}
          <div className="bg-surface border border-hairline rounded-2xl p-5">
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 text-sm">
              <div>
                <p className="text-ink/40 text-[11px] uppercase tracking-wider mb-1">Start</p>
                <p className="font-medium text-ink">{formatDate(contest.startTime)}</p>
              </div>
              <div>
                <p className="text-ink/40 text-[11px] uppercase tracking-wider mb-1">End</p>
                <p className="font-medium text-ink">{formatDate(contest.endTime)}</p>
              </div>
              <div>
                <p className="text-ink/40 text-[11px] uppercase tracking-wider mb-1">Duration</p>
                <p className="font-medium text-ink">{contest.durationMinutes} minutes</p>
              </div>
            </div>
          </div>

          {/* Languages */}
          <div className="bg-surface border border-hairline rounded-2xl p-5">
            <p className="text-ink/40 text-[11px] uppercase tracking-wider mb-3">Allowed Languages</p>
            <div className="flex flex-wrap gap-2">
              {contest.allowedLanguages.map((lang) => (
                <span
                  key={lang}
                  className="font-mono text-xs px-3 py-1.5 rounded-lg bg-ink/5 text-ink/70 border border-hairline"
                >
                  {lang}
                </span>
              ))}
            </div>
          </div>

          {/* Description */}
          {contest.description && (
            <div className="bg-surface border border-hairline rounded-2xl p-5">
              <p className="text-ink/40 text-[11px] uppercase tracking-wider mb-3">Description</p>
              <p className="text-sm text-ink/80 leading-relaxed whitespace-pre-wrap">
                {contest.description}
              </p>
            </div>
          )}

          {/* Admin actions */}
          {isAdmin && contest.status === 'DRAFT' && (
            <div className="bg-surface border border-hairline rounded-2xl p-5">
              {contest.candidateCount === 0 && (
                <div className="flex items-start gap-2.5 mb-4 px-3 py-2.5 rounded-xl bg-accent-syntax/10 border border-accent-syntax/20">
                  <AlertTriangle className="w-4 h-4 text-accent-syntax mt-0.5 shrink-0" />
                  <p className="text-sm text-ink/70">
                    Assign candidates before publishing. A contest with no candidates cannot be published.
                  </p>
                </div>
              )}
              {!showPublishConfirm ? (
                <button
                  onClick={() => setShowPublishConfirm(true)}
                  disabled={contest.candidateCount === 0}
                  className="flex items-center gap-2 px-4 py-2.5 bg-accent-compile text-white rounded-xl text-sm font-semibold hover:bg-accent-compile/90 disabled:opacity-40 disabled:cursor-not-allowed transition-colors cursor-pointer"
                >
                  <Send className="w-4 h-4" />
                  Publish Contest
                </button>
              ) : (
                <div className="space-y-3">
                  <p className="text-sm text-ink font-medium">
                    Publish this contest? Candidates will immediately be able to see it. This cannot be undone.
                  </p>
                  <div className="flex gap-2">
                    <button
                      onClick={handlePublish}
                      disabled={publishMutation.isPending}
                      className="flex items-center gap-2 px-4 py-2 bg-accent-compile text-white rounded-xl text-sm font-semibold hover:bg-accent-compile/90 disabled:opacity-60 transition-colors cursor-pointer"
                    >
                      {publishMutation.isPending ? (
                        <Loader2 className="w-3.5 h-3.5 animate-spin" />
                      ) : null}
                      Yes, Publish
                    </button>
                    <button
                      onClick={() => setShowPublishConfirm(false)}
                      className="px-4 py-2 rounded-xl text-sm font-medium text-ink/60 border border-hairline hover:border-ink/20 transition-colors cursor-pointer"
                    >
                      Cancel
                    </button>
                  </div>
                </div>
              )}
            </div>
          )}
        </motion.div>
      )}

      {/* Tab: Candidates */}
      {activeTab === 'candidates' && (isAdmin || isEvaluator) && (
        <motion.div
          key="candidates"
          initial={{ opacity: 0, y: 6 }}
          animate={{ opacity: 1, y: 0 }}
          className="space-y-5"
        >
          {/* Assignment panel — admin only, not for completed contests */}
          {isAdmin && contest.status !== 'COMPLETED' && (
            <div className="bg-surface border border-hairline rounded-2xl p-5">
              <div className="flex items-center justify-between mb-4">
                <h3 className="font-display text-base font-bold text-ink">Assign Candidates</h3>
                <div className="flex gap-2">
                  <button
                    onClick={handleSelectAllFiltered}
                    className="px-3 py-1.5 text-xs font-semibold bg-accent-compile/10 text-accent-compile rounded-lg hover:bg-accent-compile/20 transition-colors cursor-pointer"
                  >
                    Select All Filtered
                  </button>
                  <button
                    onClick={handleDeselectAllFiltered}
                    className="px-3 py-1.5 text-xs font-semibold bg-ink/5 text-ink/60 rounded-lg hover:bg-ink/10 transition-colors cursor-pointer"
                  >
                    Deselect All
                  </button>
                </div>
              </div>

              {/* Filters */}
              <div className="grid grid-cols-3 gap-3 mb-4">
                <select
                  value={filterBranch}
                  onChange={(e) => {
                    setFilterBranch(e.target.value);
                    if (e.target.value === 'MECH' || e.target.value === 'ECS') {
                      setFilterDivision('');
                    }
                  }}
                  className="w-full px-3 py-2 rounded-lg border border-hairline bg-background text-sm focus:outline-none focus:border-ink/30 transition-colors"
                >
                  <option value="">All Branches</option>
                  <option value="CSE">CSE</option>
                  <option value="CE">CE</option>
                  <option value="ECS">ECS</option>
                  <option value="MECH">MECH</option>
                </select>
                
                <select
                  value={filterDivision}
                  onChange={(e) => setFilterDivision(e.target.value)}
                  disabled={filterBranch === 'MECH' || filterBranch === 'ECS'}
                  className="w-full px-3 py-2 rounded-lg border border-hairline bg-background text-sm focus:outline-none focus:border-ink/30 transition-colors disabled:opacity-50"
                >
                  <option value="">All Divisions</option>
                  <option value="A">A</option>
                  <option value="B">B</option>
                  <option value="C">C</option>
                </select>

                <select
                  value={filterBatch}
                  onChange={(e) => setFilterBatch(e.target.value)}
                  className="w-full px-3 py-2 rounded-lg border border-hairline bg-background text-sm focus:outline-none focus:border-ink/30 transition-colors"
                >
                  <option value="">All Batches</option>
                  <option value="A">A</option>
                  <option value="B">B</option>
                  <option value="C">C</option>
                  <option value="D">D</option>
                </select>
              </div>

              <div data-lenis-prevent className="max-h-48 overflow-y-auto space-y-1.5 mb-4 pr-1">
                {filteredCandidates.length === 0 ? (
                  <p className="text-sm text-ink/40 text-center py-4">No candidates found for these filters</p>
                ) : (
                  filteredCandidates.map((c) => {
                    const isAssigned = contest.candidates?.some((cc) => cc.id === c.id);
                    const isSelected = selectedCandidateIds.includes(c.id);
                    return (
                      <label
                        key={c.id}
                        className={`flex items-center gap-3 px-3 py-2.5 rounded-xl cursor-pointer transition-colors ${
                          isAssigned
                            ? 'opacity-40 cursor-default'
                            : isSelected
                            ? 'bg-accent-compile/5 border border-accent-compile/20'
                            : 'hover:bg-ink/3 border border-transparent'
                        }`}
                      >
                        <input
                          type="checkbox"
                          checked={isSelected}
                          disabled={!!isAssigned}
                          onChange={() => toggleCandidate(c.id)}
                          className="accent-accent-compile"
                        />
                        <div className="flex-1 min-w-0">
                          <p className="text-sm font-medium text-ink truncate">{c.fullName}</p>
                          <p className="text-[11px] text-ink/40 truncate">{c.email}</p>
                        </div>
                        {isAssigned && (
                          <span className="text-[10px] text-accent-compile font-semibold font-mono">
                            ENROLLED
                          </span>
                        )}
                      </label>
                    );
                  })
                )}
              </div>
              <button
                onClick={handleAssign}
                disabled={assignMutation.isPending || selectedCandidateIds.length === 0}
                className="flex items-center gap-2 px-4 py-2.5 bg-ink text-white rounded-xl text-sm font-semibold hover:bg-ink/90 disabled:opacity-40 disabled:cursor-not-allowed transition-colors cursor-pointer"
              >
                {assignMutation.isPending ? (
                  <Loader2 className="w-3.5 h-3.5 animate-spin" />
                ) : (
                  <Users className="w-3.5 h-3.5" />
                )}
                Assign {selectedCandidateIds.length > 0 ? `(${selectedCandidateIds.length})` : ''}
              </button>
            </div>
          )}

          {/* Assigned candidates table */}
          <div className="bg-surface border border-hairline rounded-2xl overflow-hidden">
            <div className="px-5 py-4 border-b border-hairline">
              <h3 className="font-display text-base font-bold text-ink">
                Assigned Candidates ({contest.candidateCount})
              </h3>
            </div>
            {!contest.candidates || contest.candidates.length === 0 ? (
              <div className="p-8 text-center">
                <p className="text-sm text-ink/40">No candidates assigned yet</p>
              </div>
            ) : (
              <div className="divide-y divide-hairline">
                {contest.candidates.map((c) => (
                  <div key={c.id} className="flex items-center gap-3 px-5 py-3">
                    <div className="w-8 h-8 rounded-full bg-gradient-to-br from-accent-compile to-accent-syntax flex items-center justify-center text-white text-xs font-bold uppercase shrink-0">
                      {c.fullName.charAt(0)}
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-medium text-ink truncate">{c.fullName}</p>
                      <p className="text-[11px] text-ink/40 truncate">{c.email}</p>
                    </div>
                    <span className="text-[10px] font-semibold text-accent-compile font-mono">
                      INVITED
                    </span>
                  </div>
                ))}
              </div>
            )}
          </div>
        </motion.div>
      )}

      {/* Tab: Questions */}
      {activeTab === 'questions' && (
        <motion.div
          key="questions"
          initial={{ opacity: 0, y: 6 }}
          animate={{ opacity: 1, y: 0 }}
        >
          <QuestionListPanel
            contestId={contest.id}
            role={user?.role || 'CANDIDATE'}
            contestStatus={contest.status}
          />
        </motion.div>
      )}
    </div>
  );
};

export default ContestDetailPage;
