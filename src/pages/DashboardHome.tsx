import React from 'react';
import { Link } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { Users, User, ArrowRight, Sparkles } from 'lucide-react';
import { motion } from 'framer-motion';

const container = {
  hidden: { opacity: 0 },
  show: {
    opacity: 1,
    transition: { staggerChildren: 0.08, delayChildren: 0.1 },
  },
};

const item = {
  hidden: { opacity: 0, y: 12 },
  show: { opacity: 1, y: 0, transition: { duration: 0.35 } },
};

const DashboardHome: React.FC = () => {
  const { user } = useAuth();

  const getGreeting = () => {
    const hour = new Date().getHours();
    if (hour < 12) return 'Good morning';
    if (hour < 17) return 'Good afternoon';
    return 'Good evening';
  };

  const cards = [
    ...(user?.role === 'ADMIN'
      ? [
          {
            title: 'Manage Users',
            description: 'Create, edit, and manage user accounts. Import users in bulk via CSV.',
            icon: Users,
            path: '/dashboard/users',
            gradient: 'from-primary/10 to-primary/5',
            iconBg: 'bg-primary/15',
            iconColor: 'text-primary-text',
          },
        ]
      : []),
    {
      title: 'My Profile',
      description: 'View and update your personal information and change your password.',
      icon: User,
      path: '/dashboard/profile',
      gradient: 'from-warning/10 to-warning/5',
      iconBg: 'bg-warning-soft',
      iconColor: 'text-warning-text',
    },
  ];

  return (
    <motion.div variants={container} initial="hidden" animate="show">
      {/* Header */}
      <motion.div variants={item} className="mb-8">
        <div className="flex items-center gap-2 mb-1">
          <Sparkles className="w-4 h-4 text-warning-text" />
          <span className="text-xs font-mono text-fg-subtle uppercase tracking-widest">
            Dashboard
          </span>
        </div>
        <h1 className="font-display text-3xl md:text-4xl font-bold text-fg mb-2">
          {getGreeting()}, {user?.fullName?.split(' ')[0] || 'there'}
        </h1>
        <p className="text-sm text-fg-muted">
          You're signed in as{' '}
          <span className="font-mono text-xs px-1.5 py-0.5 rounded bg-fg/5 text-fg-muted">
            {user?.role}
          </span>
        </p>
      </motion.div>

      {/* Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {cards.map((card) => {
          const Icon = card.icon;
          return (
            <motion.div key={card.path} variants={item}>
              <Link
                to={card.path}
                className={`group block p-6 rounded-2xl border border-line bg-gradient-to-br ${card.gradient} hover:border-line-strong transition hover:shadow-sm`}
              >
                <div className="flex items-start justify-between mb-4">
                  <div
                    className={`w-11 h-11 rounded-xl ${card.iconBg} flex items-center justify-center`}
                  >
                    <Icon className={`w-5 h-5 ${card.iconColor}`} />
                  </div>
                  <ArrowRight className="w-4 h-4 text-fg-subtle group-hover:text-fg-muted group-hover:translate-x-0.5 transition" />
                </div>
                <h3 className="font-display text-lg font-semibold text-fg mb-1">
                  {card.title}
                </h3>
                <p className="text-sm text-fg-muted leading-relaxed">
                  {card.description}
                </p>
              </Link>
            </motion.div>
          );
        })}
      </div>

      {/* Quick info strip */}
      <motion.div
        variants={item}
        className="mt-8 p-4 rounded-xl bg-surface border border-line flex items-center gap-3"
      >
        <div className="w-8 h-8 rounded-lg bg-fg/5 flex items-center justify-center">
          <span className="text-base">💡</span>
        </div>
        <p className="text-xs text-fg-subtle leading-relaxed">
          More features — contests, questions, and submissions — will appear here as they're built.
          Stay tuned!
        </p>
      </motion.div>
    </motion.div>
  );
};

export default DashboardHome;
