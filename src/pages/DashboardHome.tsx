import React from 'react';
import { Link } from 'react-router-dom';
import { motion } from 'framer-motion';
import { ArrowRight, CalendarClock, CheckCircle2, Plus, Radio, Trophy, User, Users, type LucideIcon } from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { useContests } from '../hooks/useContests';
import type { ContestStatus } from '../api/contestApi';
import { Card, PageHeader, Skeleton } from '../components/ui';
import { RoleBadge } from '../components/RoleBadge';
import { cn } from '../lib/cn';

const EASE = [0.23, 1, 0.32, 1] as const;

const section = (i: number) => ({
  initial: { opacity: 0, y: 8 },
  animate: { opacity: 1, y: 0 },
  transition: { duration: 0.25, delay: i * 0.04, ease: EASE },
});

const getGreeting = () => {
  const hour = new Date().getHours();
  if (hour < 12) return 'Good morning';
  if (hour < 17) return 'Good afternoon';
  return 'Good evening';
};

/** One contest count; reads only totalElements, so it asks for a single row. */
const StatCard: React.FC<{ label: string; status: ContestStatus; icon: LucideIcon; hint: string }> = ({
  label,
  status,
  icon: Icon,
  hint,
}) => {
  const { data, isLoading, isError } = useContests({ status, size: 1 });
  return (
    <Card className="p-5">
      <div className="flex items-center justify-between gap-2">
        <span className="text-[13px] font-medium text-fg-muted">{label}</span>
        <Icon className="size-4 text-fg-subtle" aria-hidden />
      </div>
      <div className="mt-3 h-9">
        {isLoading ? (
          <Skeleton className="h-8 w-12" />
        ) : (
          <span className="font-display text-[28px] font-semibold leading-9 tracking-[-0.03em] text-fg tabular">
            {isError ? '–' : (data?.totalElements ?? 0)}
          </span>
        )}
      </div>
      <p className="mt-1 text-[12px] text-fg-subtle">{isError ? 'Couldn’t load this count.' : hint}</p>
    </Card>
  );
};

interface QuickLink {
  title: string;
  description: string;
  icon: LucideIcon;
  path: string;
}

const DashboardHome: React.FC = () => {
  const { user } = useAuth();
  const role = user?.role;
  const isCandidate = role === 'CANDIDATE';

  const links: QuickLink[] = [
    ...(role === 'ADMIN'
      ? [
          {
            title: 'Create a contest',
            description: 'Set up a new contest, add questions and assign candidates.',
            icon: Plus,
            path: '/dashboard/contests/new',
          },
        ]
      : []),
    {
      title: isCandidate ? 'My contests' : 'Browse contests',
      description: isCandidate
        ? 'See the contests assigned to you and start an assessment.'
        : 'Review drafts, published and running contests.',
      icon: Trophy,
      path: '/dashboard/contests',
    },
    ...(role === 'ADMIN'
      ? [
          {
            title: 'Manage users',
            description: 'Create, edit and manage accounts. Import users in bulk from CSV.',
            icon: Users,
            path: '/dashboard/users',
          },
        ]
      : []),
    {
      title: 'My profile',
      description: 'Update your personal information and change your password.',
      icon: User,
      path: '/dashboard/profile',
    },
  ];

  return (
    <div className="space-y-6">
      <motion.div {...section(0)}>
        <PageHeader
          eyebrow="Dashboard"
          title={`${getGreeting()}, ${user?.fullName?.split(' ')[0] || 'there'}`}
          description={
            isCandidate
              ? 'Your contests and assessments, all in one place.'
              : 'An overview of contests across CodePulse.'
          }
          actions={role ? <RoleBadge role={role} /> : undefined}
        />
      </motion.div>

      <motion.section {...section(1)} aria-label="Contest overview" className="grid grid-cols-1 gap-4 sm:grid-cols-3">
        <StatCard label="Live now" status="ONGOING" icon={Radio} hint="Contests in progress" />
        <StatCard label="Upcoming" status="PUBLISHED" icon={CalendarClock} hint="Published, not started" />
        <StatCard label="Completed" status="COMPLETED" icon={CheckCircle2} hint="Finished contests" />
      </motion.section>

      <motion.section {...section(2)} aria-labelledby="quick-links-heading">
        <h2 id="quick-links-heading" className="mb-3 font-display text-[15px] font-semibold tracking-[-0.015em] text-fg">
          Quick links
        </h2>
        <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
          {links.map((link) => {
            const Icon = link.icon;
            return (
              <Link
                key={link.path}
                to={link.path}
                className={cn(
                  'press group flex items-start gap-4 rounded-2xl border border-line bg-surface p-5 shadow-card',
                  'hover-fine:border-line-strong hover-fine:bg-surface-2/40',
                )}
              >
                <div className="flex size-10 shrink-0 items-center justify-center rounded-xl bg-primary-soft text-primary-text">
                  <Icon className="size-5" aria-hidden />
                </div>
                <div className="min-w-0 flex-1">
                  <h3 className="font-display text-[15px] font-semibold tracking-[-0.015em] text-fg">{link.title}</h3>
                  <p className="mt-1 text-[13px] leading-5 text-fg-muted">{link.description}</p>
                </div>
                <ArrowRight
                  className="mt-0.5 size-4 shrink-0 text-fg-subtle"
                  aria-hidden
                />
              </Link>
            );
          })}
        </div>
      </motion.section>
    </div>
  );
};

export default DashboardHome;
