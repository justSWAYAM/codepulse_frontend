import React from 'react';
import { useAuth } from '../context/AuthContext';
import { useLogout } from '../hooks/useAuth';
import { LogOut } from 'lucide-react';
import { motion } from 'framer-motion';

const DashboardPage: React.FC = () => {
  const { user } = useAuth();
  const logoutMutation = useLogout();

  return (
    <div className="min-h-screen bg-background flex items-center justify-center px-4">
      <motion.div
        initial={{ opacity: 0, y: 16 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.4 }}
        className="bg-surface rounded-2xl border border-hairline p-10 max-w-md w-full text-center shadow-sm"
      >
        <div className="w-12 h-12 rounded-xl bg-accent-compile/10 flex items-center justify-center mx-auto mb-4">
          <span className="text-2xl">👋</span>
        </div>
        <h1 className="font-display text-2xl font-bold text-ink mb-2">
          Welcome{user?.fullName ? `, ${user.fullName}` : ''}!
        </h1>
        <p className="text-sm text-ink/50 mb-1">
          You're logged in as{' '}
          <span className="font-mono text-xs px-1.5 py-0.5 rounded bg-ink/5 text-ink/70">
            {user?.role}
          </span>
        </p>
        <p className="text-xs text-ink/40 mb-6">
          Your dashboard will be built in Module 2.
        </p>
        <button
          onClick={() => logoutMutation.mutate()}
          disabled={logoutMutation.isPending}
          className="inline-flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium text-ink/60 border border-hairline hover:border-ink/20 hover:text-ink transition-colors cursor-pointer"
        >
          <LogOut className="w-4 h-4" />
          Log out
        </button>
      </motion.div>
    </div>
  );
};

export default DashboardPage;
