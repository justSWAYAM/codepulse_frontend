import React, { Suspense, lazy, useState, useMemo } from 'react';
import { Link, useNavigate, useParams, useSearchParams } from 'react-router-dom';
import { AlertTriangle, ArrowLeft, BookOpen, Calendar, Check, Clock, Copy, Lock, Trash2, X, Code2, FileCode2, Hourglass, ListChecks, BarChart3, Pencil, Send, Trophy, Users, RefreshCw, Search } from 'lucide-react';
import { useContest, usePublishContest, useAssignCandidates, useUnassignCandidates, useCandidateAssignments, useDeleteContest, useReuseContest } from '../hooks/useContests';
import { useUsers } from '../hooks/useUsers';
import { useAuth } from '../context/AuthContext';
import { ContestStatusBadge } from '../components/contest/ContestStatusBadge';
import { QuestionListPanel } from '../components/question/QuestionListPanel';
import { ExamEntryCard } from '../components/session/ExamEntryCard';
import { ContestSubmissionsPanel } from '../components/submission/ContestSubmissionsPanel';
import { ResultsPanel } from '../components/result/ResultsPanel';
import { AnalyticsSkeleton } from '../components/analytics/AnalyticsSkeleton';
import { LoadingState } from '../components/states/LoadingState';
import { EmptyState } from '../components/states/EmptyState';
import { Avatar } from '../layouts/AppShell';
import { ChangeQuestionModal } from '../components/contest/ChangeQuestionModal';
import type { CandidateSessionAssignment } from '../api/contestApi';
import {
  Badge,
  Button,
  ButtonLink,
  Card,
  CardBody,
  CardHeader,
  Dialog,
  Eyebrow,
  Input,
  Select,
  Tabs,
  TabsContent,
  TabsList,
  TabsTrigger,
} from '../components/ui';
import { languageLabel } from '../lib/languages';
import { cn } from '../lib/cn';
import { toast } from 'sonner';
import { getErrorMessage } from '../lib/apiError';

// Module 10: Recharts loads only when a staff member opens the Analytics tab
const AnalyticsPanel = lazy(() => import('../components/analytics/AnalyticsPanel'));

const CONTEST_STATUSES = ['DRAFT', 'PUBLISHED', 'ONGOING', 'COMPLETED'] as const;
const STATUS_LABELS: Record<(typeof CONTEST_STATUSES)[number], string> = {
  DRAFT: 'Draft',
  PUBLISHED: 'Scheduled',
  ONGOING: 'Live',
  COMPLETED: 'Completed',
};

type Tab = 'overview' | 'candidates' | 'questions' | 'submissions' | 'results' | 'analytics';

const dateFmt = new Intl.DateTimeFormat(undefined, { weekday: 'short', day: '2-digit', month: 'short', year: 'numeric', hour: '2-digit', minute: '2-digit' });

const ContestDetailPage: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const { user } = useAuth();
  const navigate = useNavigate();
  const [params, setParams] = useSearchParams();
  const [selectedCandidateIds, setSelectedCandidateIds] = useState<string[]>([]);
  // Enrolled candidates marked for removal (DRAFT only)
  const [markedForRemoval, setMarkedForRemoval] = useState<string[]>([]);
  const [showPublishConfirm, setShowPublishConfirm] = useState(false);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  const [selectedSwapAssignment, setSelectedSwapAssignment] = useState<CandidateSessionAssignment | null>(null);

  const deleteMutation = useDeleteContest();
  const reuseMutation = useReuseContest();

  const [filterBranch, setFilterBranch] = useState<string>('');
  const [filterDivision, setFilterDivision] = useState<string>('');
  const [filterBatch, setFilterBatch] = useState<string>('');
  const [assignSearch, setAssignSearch] = useState<string>('');

  const [assignedSearch, setAssignedSearch] = useState<string>('');
  const [assignedStatusFilter, setAssignedStatusFilter] = useState<string>('ALL');

  const isAdmin = user?.role === 'ADMIN';
  const isEvaluator = user?.role === 'EVALUATOR';
  const isCandidate = user?.role === 'CANDIDATE';
  const isStaff = isAdmin || isEvaluator;
  const { data: candidateAssignments } = useCandidateAssignments(id!, isStaff);
  const assignmentMap = useMemo(
    () => new Map((candidateAssignments ?? []).map((a) => [a.candidateId, a])),
    [candidateAssignments],
  );

  // Active tab lives in the URL so it survives refresh and Back
  const { data: contest, isLoading, isError, error } = useContest(id!);

  // Results exist once a contest has started (Module 9); before that there is nothing to show
  const hasResults = contest?.status === 'ONGOING' || contest?.status === 'COMPLETED';
  const allowedTabs: Tab[] = isStaff
    ? ['overview', 'candidates', 'questions', 'submissions', ...(hasResults ? (['results', 'analytics'] as Tab[]) : [])]
    : isCandidate
      ? ['overview']
      : ['overview', 'questions'];
  const rawTab = params.get('tab') as Tab | null;
  const activeTab: Tab = rawTab && allowedTabs.includes(rawTab) ? rawTab : 'overview';
  const setActiveTab = (t: string) => {
    const next = new URLSearchParams();
    if (t !== 'overview') next.set('tab', t);
    setParams(next, { replace: true });
  };
  const publishMutation = usePublishContest(id!);
  const assignMutation = useAssignCandidates(id!);
  const unassignMutation = useUnassignCandidates(id!);

  // GET /users is admin-only, so don't fire it for other roles.
  // Page size is large because the picker filters client-side (Spring caps size at 2000).
  const { data: candidatesData } = useUsers({ role: 'CANDIDATE', pageSize: 2000 }, isAdmin);
  const allCandidates =
    (
      candidatesData as unknown as {
        users?: { id: string; fullName: string; email: string; rollNumber?: string; branch?: string; division?: string; batch?: string }[];
      }
    )?.users ?? [];

  const filteredCandidates = allCandidates.filter((c) => {
    if (filterBranch && c.branch !== filterBranch) return false;
    if (filterDivision && c.division !== filterDivision) return false;
    if (filterBatch && c.batch !== filterBatch) return false;
    if (assignSearch) {
      const q = assignSearch.trim().toLowerCase();
      const match =
        c.fullName?.toLowerCase().includes(q) ||
        c.email?.toLowerCase().includes(q) ||
        c.rollNumber?.toLowerCase().includes(q);
      if (!match) return false;
    }
    return true;
  });

  const filteredAssignedCandidates = useMemo(() => {
    if (!contest?.candidates) return [];
    const query = assignedSearch.trim().toLowerCase();

    return contest.candidates.filter((c) => {
      const assignment = assignmentMap.get(c.id);
      const status = assignment?.sessionStatus ?? 'NOT_YET_STARTED';

      if (assignedStatusFilter !== 'ALL') {
        if (assignedStatusFilter === 'IN_PROGRESS' && status !== 'IN_PROGRESS') return false;
        if (assignedStatusFilter === 'NOT_YET_STARTED' && status !== 'NOT_YET_STARTED') return false;
        if (assignedStatusFilter === 'SUBMITTED' && status !== 'SUBMITTED' && status !== 'AUTO_SUBMITTED') return false;
        if (assignedStatusFilter === 'SWAPPED' && (assignment?.questionChangeCount ?? 0) === 0) return false;
      }

      if (query) {
        const roll = assignment?.rollNumber || (c as { rollNumber?: string }).rollNumber;
        const matchName = c.fullName?.toLowerCase().includes(query);
        const matchEmail = c.email?.toLowerCase().includes(query);
        const matchRoll = roll?.toLowerCase().includes(query);
        const matchQuestion = assignment?.assignedQuestions?.some((q) =>
          q.title?.toLowerCase().includes(query)
        );
        if (!matchName && !matchEmail && !matchRoll && !matchQuestion) {
          return false;
        }
      }

      return true;
    });
  }, [contest?.candidates, assignmentMap, assignedSearch, assignedStatusFilter]);

  const handleSelectAllFiltered = () => {
    const unassigned = filteredCandidates.filter((c) => !contest?.candidates?.some((cc) => cc.id === c.id));
    setSelectedCandidateIds((prev) => Array.from(new Set([...prev, ...unassigned.map((c) => c.id)])));
  };

  const handleDeselectAllFiltered = () => {
    const filteredIds = new Set(filteredCandidates.map((c) => c.id));
    setSelectedCandidateIds((prev) => prev.filter((cid) => !filteredIds.has(cid)));
    setMarkedForRemoval((prev) => prev.filter((cid) => !filteredIds.has(cid)));
  };

  if (isLoading) return <LoadingState message="Loading contest..." />;

  if (isError) {
    const status = (error as { response?: { status?: number } })?.response?.status;
    return (
      <Card className="mx-auto mt-8 max-w-md">
        <EmptyState
          icon={<AlertTriangle className="size-5" />}
          title={status === 403 ? 'Access denied' : 'Contest not found'}
          message={status === 403 ? "You don't have access to this contest." : "This contest doesn't exist or has been removed."}
          action={
            <ButtonLink to="/dashboard/contests" variant="secondary" size="sm" leadingIcon={<ArrowLeft className="size-4" />}>
              Back to contests
            </ButtonLink>
          }
        />
      </Card>
    );
  }

  if (!contest) return null;

  const handlePublish = async () => {
    try {
      await publishMutation.mutateAsync();
      setShowPublishConfirm(false);
    } catch (err: unknown) {
      setShowPublishConfirm(false);
      toast.error(getErrorMessage(err, 'Failed to publish contest'));
    }
  };

  const handleReuse = () => {
    if (!contest) return;
    reuseMutation.mutate(contest.id, {
      onSuccess: (newContest) => {
        toast.success('Contest copied as draft! Redirecting to edit...');
        navigate(`/dashboard/contests/${newContest.id}/edit`);
      },
      onError: (err) => {
        toast.error(getErrorMessage(err, 'Failed to reuse contest'));
      },
    });
  };

  const handleDelete = () => {
    if (!contest) return;
    deleteMutation.mutate(contest.id, {
      onSuccess: () => {
        setShowDeleteConfirm(false);
        navigate('/dashboard/contests');
      },
      onError: (err) => {
        setShowDeleteConfirm(false);
        toast.error(getErrorMessage(err, 'Failed to delete contest'));
      },
    });
  };

  const toggleCandidate = (cid: string) =>
    setSelectedCandidateIds((prev) => (prev.includes(cid) ? prev.filter((x) => x !== cid) : [...prev, cid]));

  // Unassigning is DRAFT-only; once the contest leaves DRAFT, stale marks are ignored
  const canUnassign = contest.status === 'DRAFT';
  const removeIds = canUnassign ? markedForRemoval : [];
  const toggleRemoval = (cid: string) =>
    setMarkedForRemoval((prev) => (prev.includes(cid) ? prev.filter((x) => x !== cid) : [...prev, cid]));

  const handleSave = async () => {
    if (selectedCandidateIds.length === 0 && removeIds.length === 0) {
      toast.error('Select at least one candidate');
      return;
    }
    try {
      if (selectedCandidateIds.length > 0) {
        await assignMutation.mutateAsync({ candidateIds: selectedCandidateIds });
        setSelectedCandidateIds([]);
      }
      if (removeIds.length > 0) {
        await unassignMutation.mutateAsync({ candidateIds: removeIds });
        setMarkedForRemoval([]);
      }
    } catch {
      // the global mutation handler already showed the error; keep the pending changes
    }
  };

  const addCount = selectedCandidateIds.length;
  const removeCount = removeIds.length;
  const saveLabel =
    addCount > 0 && removeCount > 0
      ? `Assign ${addCount} • Remove ${removeCount}`
      : removeCount > 0
        ? `Remove ${removeCount} candidate${removeCount === 1 ? '' : 's'}`
        : addCount > 0
          ? `Assign ${addCount} candidate${addCount === 1 ? '' : 's'}`
          : 'Assign candidates';

  const currentStatusIndex = CONTEST_STATUSES.indexOf(contest.status);

  return (
    <div className="mx-auto max-w-5xl space-y-6">
      {/* Header */}
      <div>
        <Link
          to="/dashboard/contests"
          className="mb-3 inline-flex items-center gap-1.5 rounded-lg text-[13px] text-fg-muted hover-fine:text-fg"
        >
          <ArrowLeft className="size-4" />
          Contests
        </Link>
        <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
          <div className="min-w-0">
            <div className="flex flex-wrap items-center gap-3">
              <h1 className="font-display text-2xl font-semibold tracking-[-0.03em] text-fg sm:text-[28px] sm:leading-9">{contest.title}</h1>
              <ContestStatusBadge status={contest.status} size="md" />
              {contest.resultsPublished && (
                <Badge tone="success" icon={<Check className="size-3" />}>
                  Results published
                </Badge>
              )}
            </div>
            <p className="mt-1 font-mono text-[11px] text-fg-subtle">{contest.id}</p>
          </div>
          {isAdmin && (
            <div className="flex flex-wrap shrink-0 items-center gap-2">
              <Button
                variant="secondary"
                leadingIcon={<Copy className="size-4" />}
                onClick={handleReuse}
                loading={reuseMutation.isPending}
                title="Create a copy of this contest as draft"
              >
                Reuse contest
              </Button>

              {contest.status === 'DRAFT' && (
                <>
                  <ButtonLink to={`/dashboard/contests/${contest.id}/edit`} variant="secondary" leadingIcon={<Pencil className="size-4" />}>
                    Edit details
                  </ButtonLink>
                  <Button
                    onClick={() => setShowPublishConfirm(true)}
                    disabled={contest.candidateCount === 0}
                    leadingIcon={<Send className="size-4" />}
                    title={contest.candidateCount === 0 ? 'Assign candidates before publishing' : undefined}
                  >
                    Publish contest
                  </Button>
                </>
              )}

              {contest.status !== 'ONGOING' ? (
                <Button
                  variant="ghost"
                  leadingIcon={<Trash2 className="size-4 text-danger" />}
                  onClick={() => setShowDeleteConfirm(true)}
                  title="Delete contest"
                  className="text-danger hover:bg-danger-soft hover:text-danger"
                >
                  Delete contest
                </Button>
              ) : (
                <Button
                  variant="ghost"
                  disabled
                  leadingIcon={<Trash2 className="size-4" />}
                  title="Contests cannot be deleted while live"
                >
                  Delete contest
                </Button>
              )}
            </div>
          )}
        </div>
      </div>

      {/* Lifecycle */}
      <Card className="px-5 py-4">
        <ol className="flex items-center" aria-label="Contest lifecycle">
          {CONTEST_STATUSES.map((s, i) => {
            const done = i < currentStatusIndex;
            const active = i === currentStatusIndex;
            return (
              <React.Fragment key={s}>
                <li className="flex items-center gap-2" aria-current={active ? 'step' : undefined}>
                  <span
                    className={cn(
                      'tabular flex size-6 shrink-0 items-center justify-center rounded-full text-[11px] font-semibold',
                      active ? 'bg-primary text-primary-fg' : done ? 'bg-primary-soft text-primary-text' : 'bg-surface-2 text-fg-subtle',
                    )}
                  >
                    {done ? <Check className="size-3.5" strokeWidth={3} /> : i + 1}
                  </span>
                  <span className={cn('hidden text-[13px] font-medium sm:inline', active ? 'text-fg' : done ? 'text-fg-muted' : 'text-fg-subtle')}>
                    {STATUS_LABELS[s]}
                  </span>
                </li>
                {i < CONTEST_STATUSES.length - 1 && (
                  <li aria-hidden className={cn('mx-3 h-px flex-1', i < currentStatusIndex ? 'bg-primary/40' : 'bg-line')} />
                )}
              </React.Fragment>
            );
          })}
        </ol>
      </Card>

      <Tabs value={activeTab} onValueChange={setActiveTab}>
        {allowedTabs.length > 1 && (
          <TabsList aria-label="Contest sections">
            <TabsTrigger value="overview" icon={<BookOpen />}>
              Overview
            </TabsTrigger>
            {isStaff && (
              <TabsTrigger value="candidates" icon={<Users />} count={contest.candidateCount > 0 ? contest.candidateCount : undefined}>
                Candidates
              </TabsTrigger>
            )}
            {!isCandidate && (
              <TabsTrigger value="questions" icon={<FileCode2 />}>
                Questions
              </TabsTrigger>
            )}
            {isStaff && (
              <TabsTrigger value="submissions" icon={<ListChecks />}>
                Submissions
              </TabsTrigger>
            )}
            {isStaff && hasResults && (
              <TabsTrigger value="results" icon={<Trophy />}>
                Results
              </TabsTrigger>
            )}
            {isStaff && hasResults && (
              <TabsTrigger value="analytics" icon={<BarChart3 />}>
                Analytics
              </TabsTrigger>
            )}
          </TabsList>
        )}

        {/* -- Overview -- */}
        <TabsContent value="overview" className="space-y-4 pt-6">
          {isCandidate && <ExamEntryCard contest={contest} />}

          <Card className="grid grid-cols-1 divide-y divide-line sm:grid-cols-3 sm:divide-x sm:divide-y-0">
            {[
              { icon: <Calendar />, label: 'Starts', value: dateFmt.format(new Date(contest.startTime)) },
              { icon: <Hourglass />, label: 'Ends', value: dateFmt.format(new Date(contest.endTime)) },
              { icon: <Clock />, label: 'Duration', value: `${contest.durationMinutes} minutes` },
            ].map((m) => (
              <div key={m.label} className="flex items-start gap-3 p-5">
                <span className="mt-0.5 text-fg-subtle [&>svg]:size-4" aria-hidden>
                  {m.icon}
                </span>
                <div>
                  <Eyebrow>{m.label}</Eyebrow>
                  <p className="tabular mt-1 text-sm font-medium text-fg">{m.value}</p>
                </div>
              </div>
            ))}
          </Card>

          <div className="grid gap-4 md:grid-cols-3">
            <Card className={cn('p-5', contest.description ? 'md:col-span-2' : 'md:col-span-3')}>
              {contest.description ? (
                <>
                  <Eyebrow>About this contest</Eyebrow>
                  <p className="mt-2 text-sm leading-6 whitespace-pre-wrap text-fg-muted">{contest.description}</p>
                </>
              ) : (
                <p className="text-sm text-fg-subtle">No description.</p>
              )}
            </Card>
            <Card className="p-5">
              <Eyebrow>Allowed languages</Eyebrow>
              <div className="mt-3 flex flex-wrap gap-2">
                {contest.allowedLanguages.map((lang) => (
                  <span
                    key={lang}
                    className="inline-flex items-center gap-1.5 rounded-lg border border-line bg-surface-2 px-2.5 py-1 font-mono text-[12px] text-fg-muted"
                  >
                    <Code2 className="size-3.5 text-fg-subtle" aria-hidden />
                    {languageLabel(lang)}
                  </span>
                ))}
              </div>
            </Card>
          </div>

          {isAdmin && contest.status === 'DRAFT' && contest.candidateCount === 0 && (
            <div className="flex items-start gap-3 rounded-2xl border border-warning/30 bg-warning-soft px-4 py-3.5">
              <AlertTriangle className="mt-0.5 size-4 shrink-0 text-warning-text" />
              <p className="text-sm text-warning-text">
                Assign candidates before publishing - a contest with no candidates cannot be published.{' '}
                <button type="button" onClick={() => setActiveTab('candidates')} className="font-medium underline underline-offset-2">
                  Assign candidates
                </button>
              </p>
            </div>
          )}
        </TabsContent>

        {/* -- Candidates -- */}
        {isStaff && (
          <TabsContent value="candidates" className="space-y-4 pt-6">
            {isAdmin && contest.status === 'ONGOING' && (
              <div className="flex items-center gap-3 rounded-2xl border border-warning/30 bg-warning-soft px-4 py-3.5 text-warning-text">
                <Lock className="size-4 shrink-0" />
                <div>
                  <p className="text-sm font-medium">Candidate assignments are locked</p>
                  <p className="text-xs text-warning-text/80">Candidates cannot be assigned or removed while the contest is live.</p>
                </div>
              </div>
            )}
            {isAdmin && contest.status !== 'ONGOING' && contest.status !== 'COMPLETED' && (
              <Card>
                <CardHeader
                  title="Assign candidates"
                  description="Filter by branch, division or batch, then pick who can take this contest."
                  actions={
                    <>
                      <Button size="sm" variant="secondary" onClick={handleSelectAllFiltered}>
                        Select all filtered
                      </Button>
                      <Button size="sm" variant="ghost" onClick={handleDeselectAllFiltered}>
                        Deselect
                      </Button>
                    </>
                  }
                />
                <CardBody className="space-y-4">
                  <div className="flex flex-col gap-3 sm:flex-row sm:items-center">
                    <div className="relative min-w-0 flex-1">
                      <Search className="pointer-events-none absolute left-3 top-1/2 size-4 -translate-y-1/2 text-fg-subtle" aria-hidden />
                      <Input
                        type="search"
                        value={assignSearch}
                        onChange={(e) => setAssignSearch(e.target.value)}
                        placeholder="Search candidates by name, email, or roll number..."
                        aria-label="Search candidates to assign"
                        className="h-10 pl-9 text-sm"
                      />
                      {assignSearch && (
                        <button
                          type="button"
                          onClick={() => setAssignSearch('')}
                          className="absolute right-2.5 top-1/2 -translate-y-1/2 rounded p-0.5 text-fg-subtle hover:text-fg"
                          aria-label="Clear search"
                        >
                          <X className="size-4" />
                        </button>
                      )}
                    </div>
                    <div className="grid grid-cols-3 gap-2">
                      <Select
                        aria-label="Branch"
                        value={filterBranch}
                        onChange={(e) => {
                          setFilterBranch(e.target.value);
                          if (e.target.value === 'MECH' || e.target.value === 'ECS') setFilterDivision('');
                        }}
                        className="sm:w-32"
                      >
                        <option value="">All branches</option>
                        <option value="CSE">CSE</option>
                        <option value="CE">CE</option>
                        <option value="ECS">ECS</option>
                        <option value="MECH">MECH</option>
                      </Select>
                      <Select
                        aria-label="Division"
                        value={filterDivision}
                        onChange={(e) => setFilterDivision(e.target.value)}
                        disabled={filterBranch === 'MECH' || filterBranch === 'ECS'}
                        className="sm:w-32"
                      >
                        <option value="">All divisions</option>
                        <option value="A">A</option>
                        <option value="B">B</option>
                        <option value="C">C</option>
                      </Select>
                      <Select aria-label="Batch" value={filterBatch} onChange={(e) => setFilterBatch(e.target.value)} className="sm:w-32">
                        <option value="">All batches</option>
                        <option value="A">A</option>
                        <option value="B">B</option>
                        <option value="C">C</option>
                        <option value="D">D</option>
                      </Select>
                    </div>
                  </div>

                  <div className="max-h-72 overflow-y-auto rounded-xl border border-line">
                    {filteredCandidates.length === 0 ? (
                      <p className="py-8 text-center text-sm text-fg-subtle">No candidates match these filters.</p>
                    ) : (
                      <ul className="divide-y divide-line">
                        {filteredCandidates.map((c) => {
                          const isAssigned = !!contest.candidates?.some((cc) => cc.id === c.id);
                          const isSelected = selectedCandidateIds.includes(c.id);
                          const isMarked = isAssigned && removeIds.includes(c.id);
                          const locked = isAssigned && !canUnassign;
                          return (
                            <li key={c.id}>
                              <label
                                className={cn(
                                  'flex items-center gap-3 px-3.5 py-2.5',
                                  locked ? 'cursor-default opacity-60' : 'cursor-pointer hover-fine:bg-surface-2/60',
                                  isSelected && 'bg-primary-soft',
                                  isMarked && 'bg-danger-soft',
                                )}
                              >
                                <input
                                  type="checkbox"
                                  checked={isAssigned ? !isMarked : isSelected}
                                  disabled={locked}
                                  onChange={() => (isAssigned ? toggleRemoval(c.id) : toggleCandidate(c.id))}
                                  className="size-4 accent-[var(--primary)]"
                                />
                                <div className="min-w-0 flex-1">
                                  <p className="truncate text-sm font-medium text-fg">{c.fullName}</p>
                                  <p className="truncate text-[12px] text-fg-subtle">
                                    {[c.rollNumber, c.email].filter(Boolean).join(' • ')}
                                  </p>
                                </div>
                                {isMarked ? (
                                  <Badge size="sm" tone="danger" icon={<X className="size-3" />}>
                                    Will be removed
                                  </Badge>
                                ) : (
                                  isAssigned && (
                                    <Badge size="sm" tone="success" icon={<Check className="size-3" />}>
                                      Enrolled
                                    </Badge>
                                  )
                                )}
                              </label>
                            </li>
                          );
                        })}
                      </ul>
                    )}
                  </div>

                  <div className="flex items-center justify-between gap-3">
                    <p className="tabular text-[13px] text-fg-muted">
                      {addCount > 0 || removeCount > 0
                        ? [addCount > 0 && `${addCount} to add`, removeCount > 0 && `${removeCount} to remove`].filter(Boolean).join(' • ')
                        : `${filteredCandidates.length} shown`}
                    </p>
                    <Button
                      onClick={handleSave}
                      loading={assignMutation.isPending || unassignMutation.isPending}
                      disabled={addCount === 0 && removeCount === 0}
                      variant={removeCount > 0 && addCount === 0 ? 'danger' : 'primary'}
                      leadingIcon={<Users className="size-4" />}
                    >
                      {saveLabel}
                    </Button>
                  </div>
                </CardBody>
              </Card>
            )}

            <Card className="overflow-hidden">
              <CardHeader
                title="Assigned candidates"
                description={
                  assignedSearch.trim() || assignedStatusFilter !== 'ALL'
                    ? `Showing ${filteredAssignedCandidates.length} of ${contest.candidateCount} enrolled candidates`
                    : contest.randomizeQuestions
                      ? `${contest.candidateCount} enrolled · Random question assignment enabled (${contest.questionsPerCandidate ?? 'All'} per candidate)`
                      : `${contest.candidateCount} enrolled`
                }
                className="border-b border-line"
              />
              {!contest.candidates || contest.candidates.length === 0 ? (
                <EmptyState icon={<Users className="size-5" />} message="No candidates assigned yet." />
              ) : (
                <>
                  <div className="flex flex-col gap-3 border-b border-line bg-surface-2/40 p-3 sm:flex-row sm:items-center">
                    <div className="relative min-w-0 flex-1">
                      <Search className="pointer-events-none absolute left-3 top-1/2 size-4 -translate-y-1/2 text-fg-subtle" aria-hidden />
                      <Input
                        type="search"
                        value={assignedSearch}
                        onChange={(e) => setAssignedSearch(e.target.value)}
                        placeholder="Search candidates by name, email, roll number, or assigned question..."
                        aria-label="Search assigned candidates"
                        className="h-9 pl-9 text-sm"
                      />
                      {assignedSearch && (
                        <button
                          type="button"
                          onClick={() => setAssignedSearch('')}
                          className="absolute right-2.5 top-1/2 -translate-y-1/2 rounded p-0.5 text-fg-subtle hover:text-fg"
                          aria-label="Clear search"
                        >
                          <X className="size-4" />
                        </button>
                      )}
                    </div>
                    <div className="flex items-center gap-2">
                      <Select
                        aria-label="Filter by session status"
                        value={assignedStatusFilter}
                        onChange={(e) => setAssignedStatusFilter(e.target.value)}
                        className="h-9 text-xs sm:w-44"
                      >
                        <option value="ALL">All statuses</option>
                        <option value="IN_PROGRESS">In Progress</option>
                        <option value="NOT_YET_STARTED">Not Started</option>
                        <option value="SUBMITTED">Submitted</option>
                        <option value="SWAPPED">Swapped (Question Changed)</option>
                      </Select>
                      {(assignedSearch.trim() !== '' || assignedStatusFilter !== 'ALL') && (
                        <Button
                          size="sm"
                          variant="ghost"
                          onClick={() => {
                            setAssignedSearch('');
                            setAssignedStatusFilter('ALL');
                          }}
                          className="h-9 text-xs text-fg-subtle hover:text-fg"
                        >
                          Clear
                        </Button>
                      )}
                    </div>
                  </div>

                  {filteredAssignedCandidates.length === 0 ? (
                    <EmptyState
                      icon={<Users className="size-5" />}
                      message="No candidates match your search filter."
                      action={
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => {
                            setAssignedSearch('');
                            setAssignedStatusFilter('ALL');
                          }}
                        >
                          Clear filter
                        </Button>
                      }
                    />
                  ) : (
                    <ul className="divide-y divide-line">
                      {filteredAssignedCandidates.map((c) => {
                        const assignment = assignmentMap.get(c.id);
                        const status = assignment?.sessionStatus;
                        const canSwap =
                          contest.status === 'ONGOING' &&
                          status === 'IN_PROGRESS' &&
                          (assignment?.availablePoolQuestions?.length ?? 0) > 0;

                        return (
                          <li key={c.id} className="flex flex-col gap-2.5 px-5 py-3.5 sm:flex-row sm:items-center sm:justify-between">
                            <div className="flex items-start gap-3 min-w-0 flex-1">
                              <Avatar name={c.fullName} />
                              <div className="min-w-0 flex-1">
                                <div className="flex flex-wrap items-center gap-2">
                                  <p className="truncate text-sm font-medium text-fg">{c.fullName}</p>
                                  {assignment?.rollNumber && (
                                    <span className="font-mono text-xs text-fg-subtle">({assignment.rollNumber})</span>
                                  )}
                                  {status === 'IN_PROGRESS' && (
                                    <Badge size="sm" tone="warning">In Progress</Badge>
                                  )}
                                  {status === 'SUBMITTED' && (
                                    <Badge size="sm" tone="success">Submitted</Badge>
                                  )}
                                  {status === 'AUTO_SUBMITTED' && (
                                    <Badge size="sm" tone="info">Auto-Submitted</Badge>
                                  )}
                                  {(!status || status === 'NOT_YET_STARTED') && (
                                    <Badge size="sm" tone="neutral">Not Started</Badge>
                                  )}
                                  {assignment && assignment.questionChangeCount > 0 && (
                                    <Badge size="sm" tone="danger" title={`Penalty: -${assignment.questionChangePenalty} pts`}>
                                      Swapped ({assignment.questionChangeCount}× · -{assignment.questionChangePenalty} pts)
                                    </Badge>
                                  )}
                                </div>
                                <p className="truncate text-[12px] text-fg-subtle">{c.email}</p>

                                {contest.randomizeQuestions && (
                                  <div className="mt-2 flex flex-wrap items-center gap-1.5">
                                    {assignment && assignment.assignedQuestions.length > 0 ? (
                                      <>
                                        <span className="text-[11px] font-medium text-fg-subtle">Assigned:</span>
                                        {assignment.assignedQuestions.map((q) => (
                                          <span
                                            key={q.questionId}
                                            className="inline-flex items-center gap-1 rounded-md border border-line bg-surface-2 px-2 py-0.5 text-[11px] text-fg-muted"
                                            title={`${q.points} pts · ${q.difficulty}`}
                                          >
                                            <span className="font-semibold text-fg">#{q.orderIndex}</span>
                                            <span>{q.title}</span>
                                            <span className="text-fg-subtle">({q.points} pts)</span>
                                          </span>
                                        ))}
                                      </>
                                    ) : (
                                      <span className="text-[11px] text-fg-subtle italic">
                                        Questions will be randomly assigned when candidate begins exam.
                                      </span>
                                    )}
                                  </div>
                                )}
                              </div>
                            </div>

                            {canSwap && (
                              <div className="shrink-0 self-start sm:self-center">
                                <Button
                                  size="sm"
                                  variant="secondary"
                                  leadingIcon={<RefreshCw className="size-3.5" />}
                                  onClick={() => assignment && setSelectedSwapAssignment(assignment)}
                                >
                                  Change Question
                                </Button>
                              </div>
                            )}
                          </li>
                        );
                      })}
                    </ul>
                  )}
                </>
              )}
            </Card>
          </TabsContent>
        )}

        {/* -- Questions -- */}
        {!isCandidate && (
          <TabsContent value="questions" className="pt-6">
            <QuestionListPanel contestId={contest.id} contest={contest} role={user?.role || 'CANDIDATE'} contestStatus={contest.status} />
          </TabsContent>
        )}

        {/* -- Submissions (Module 8) -- */}
        {isStaff && (
          <TabsContent value="submissions" className="pt-6">
            <ContestSubmissionsPanel
              contestId={contest.id}
              candidates={contest.candidates ?? []}
              canRejudge={isStaff}
              rejudgeLockedReason={contest.resultsPublished ? 'Results are published. Unpublish them to rejudge.' : undefined}
            />
          </TabsContent>
        )}

        {/* -- Results (Module 9) -- */}
        {isStaff && hasResults && (
          <TabsContent value="results" className="pt-6">
            <ResultsPanel contest={contest} />
          </TabsContent>
        )}

        {/* -- Analytics (Module 10) -- */}
        {isStaff && hasResults && activeTab === 'analytics' && (
          <TabsContent value="analytics" className="pt-6">
            <Suspense fallback={<AnalyticsSkeleton />}>
              <AnalyticsPanel contest={contest} />
            </Suspense>
          </TabsContent>
        )}
      </Tabs>

      <Dialog
        open={showPublishConfirm}
        onOpenChange={setShowPublishConfirm}
        dismissible={!publishMutation.isPending}
        icon={<Send className="size-5" />}
        title="Publish this contest?"
        description="Enrolled candidates will see it right away and it opens at its start time. Publishing cannot be undone."
        size="sm"
        footer={
          <>
            <Button variant="secondary" onClick={() => setShowPublishConfirm(false)} disabled={publishMutation.isPending}>
              Cancel
            </Button>
            <Button onClick={handlePublish} loading={publishMutation.isPending} leadingIcon={<Send className="size-4" />}>
              Publish contest
            </Button>
          </>
        }
      />

      <Dialog
        open={showDeleteConfirm}
        onOpenChange={setShowDeleteConfirm}
        dismissible={!deleteMutation.isPending}
        icon={<Trash2 className="size-5 text-danger" />}
        tone="danger"
        title="Delete this contest?"
        description={`“${contest.title}” and all its questions, test cases, student submissions, and results will be permanently deleted. This action cannot be undone.`}
        size="sm"
        footer={
          <>
            <Button variant="secondary" onClick={() => setShowDeleteConfirm(false)} disabled={deleteMutation.isPending}>
              Cancel
            </Button>
            <Button variant="danger" onClick={handleDelete} loading={deleteMutation.isPending}>
              Delete contest
            </Button>
          </>
        }
      />

      {selectedSwapAssignment && (
        <ChangeQuestionModal
          open={!!selectedSwapAssignment}
          onOpenChange={(open) => !open && setSelectedSwapAssignment(null)}
          contestId={contest.id}
          assignment={selectedSwapAssignment}
        />
      )}
    </div>
  );
};

export default ContestDetailPage;
