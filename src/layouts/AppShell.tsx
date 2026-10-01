import React, { useState } from 'react';
import { Outlet, Link, useLocation } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { useLogout } from '../hooks/useAuth';
import { getNavItemsForRole } from '../config/navigation';
import {
  Terminal,
  LogOut,
  ChevronLeft,
  ChevronRight,
  Menu,
  X,
} from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';

const AppShell: React.FC = () => {
  const { user } = useAuth();
  const logoutMutation = useLogout();
  const location = useLocation();
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  const navItems = user ? getNavItemsForRole(user.role) : [];

  const getRoleLabel = (role: string) => {
    switch (role) {
      case 'ADMIN':
        return 'Administrator';
      case 'EVALUATOR':
        return 'Evaluator';
      case 'CANDIDATE':
        return 'Candidate';
      default:
        return role;
    }
  };

  return (
    <div className="min-h-screen bg-canvas flex flex-col">
      {/* ─── Top Navbar ─── */}
      <header className="h-16 bg-surface border-b border-line flex items-center justify-between px-4 md:px-6 z-30 sticky top-0">
        {/* Left: Brand + Mobile toggle */}
        <div className="flex items-center gap-3">
          <button
            onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
            className="md:hidden p-2 rounded-lg hover:bg-fg/5 transition-colors cursor-pointer"
          >
            {mobileMenuOpen ? (
              <X className="w-5 h-5 text-fg" />
            ) : (
              <Menu className="w-5 h-5 text-fg" />
            )}
          </button>
          <Link to="/dashboard" className="flex items-center gap-2.5 group">
            <div className="w-8 h-8 rounded-lg bg-primary flex items-center justify-center group-hover:bg-primary-hover transition-colors">
              <Terminal className="w-4 h-4 text-primary-text" />
            </div>
            <span className="font-display text-lg font-bold text-fg tracking-tight hidden sm:inline">
              Code<span className="text-primary-text">Pulse</span>
            </span>
          </Link>
        </div>

        {/* Right: User menu */}
        <div className="flex items-center gap-3">
          <div className="text-right hidden sm:block">
            <p className="text-sm font-medium text-fg leading-tight">
              {user?.fullName}
            </p>
            <p className="text-[11px] text-fg-subtle font-mono leading-tight">
              {user?.role ? getRoleLabel(user.role) : ''}
            </p>
          </div>
          {/* Avatar */}
          <div className="w-8 h-8 rounded-full bg-gradient-to-br from-primary to-warning flex items-center justify-center text-white text-xs font-bold uppercase">
            {user?.fullName?.charAt(0) || 'U'}
          </div>
          <button
            onClick={() => logoutMutation.mutate()}
            disabled={logoutMutation.isPending}
            className="p-2 rounded-lg text-fg-subtle hover:text-danger-text hover:bg-danger-soft transition-colors cursor-pointer"
            title="Log out"
          >
            <LogOut className="w-4 h-4" />
          </button>
        </div>
      </header>

      <div className="flex flex-1 overflow-hidden">
        {/* ─── Desktop Sidebar ─── */}
        <motion.aside
          animate={{ width: sidebarCollapsed ? 72 : 240 }}
          transition={{ duration: 0.2, ease: 'easeInOut' }}
          className="hidden md:flex flex-col bg-surface border-r border-line relative z-20 shrink-0"
        >
          <nav className="flex-1 py-4 px-3 space-y-1">
            {navItems.map((item) => {
              const isActive =
                item.path === '/dashboard'
                  ? location.pathname === '/dashboard'
                  : location.pathname.startsWith(item.path);
              const Icon = item.icon;

              return (
                <Link
                  key={item.path}
                  to={item.path}
                  className={`flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-medium transition group relative ${
                    isActive
                      ? 'bg-primary/10 text-primary-text'
                      : 'text-fg-muted hover:text-fg hover:bg-fg/5'
                  }`}
                >
                  {isActive && (
                    <motion.div
                      layoutId="sidebar-active"
                      className="absolute left-0 top-1/2 -translate-y-1/2 w-[3px] h-6 rounded-r-full bg-primary"
                      transition={{ type: 'spring', stiffness: 300, damping: 30 }}
                    />
                  )}
                  <Icon className="w-[18px] h-[18px] shrink-0" />
                  <AnimatePresence mode="wait">
                    {!sidebarCollapsed && (
                      <motion.span
                        initial={{ opacity: 0, width: 0 }}
                        animate={{ opacity: 1, width: 'auto' }}
                        exit={{ opacity: 0, width: 0 }}
                        transition={{ duration: 0.15 }}
                        className="overflow-hidden whitespace-nowrap"
                      >
                        {item.candidateLabel && user?.role === 'CANDIDATE'
                          ? item.candidateLabel
                          : item.label}
                      </motion.span>
                    )}
                  </AnimatePresence>
                </Link>
              );
            })}
          </nav>

          {/* Collapse toggle */}
          <button
            onClick={() => setSidebarCollapsed(!sidebarCollapsed)}
            className="absolute -right-3 top-8 w-6 h-6 rounded-full bg-surface border border-line flex items-center justify-center text-fg-subtle hover:text-fg hover:border-line-strong transition-colors cursor-pointer shadow-sm z-10"
          >
            {sidebarCollapsed ? (
              <ChevronRight className="w-3 h-3" />
            ) : (
              <ChevronLeft className="w-3 h-3" />
            )}
          </button>
        </motion.aside>

        {/* ─── Mobile Sidebar Overlay ─── */}
        <AnimatePresence>
          {mobileMenuOpen && (
            <>
              <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                className="fixed inset-0 bg-fg/20 backdrop-blur-sm z-40 md:hidden"
                onClick={() => setMobileMenuOpen(false)}
              />
              <motion.aside
                initial={{ x: -280 }}
                animate={{ x: 0 }}
                exit={{ x: -280 }}
                transition={{ type: 'spring', damping: 25, stiffness: 250 }}
                className="fixed left-0 top-16 bottom-0 w-[260px] bg-surface border-r border-line z-50 md:hidden flex flex-col"
              >
                <nav className="flex-1 py-4 px-3 space-y-1">
                  {navItems.map((item) => {
                    const isActive =
                      item.path === '/dashboard'
                        ? location.pathname === '/dashboard'
                        : location.pathname.startsWith(item.path);
                    const Icon = item.icon;

                    return (
                      <Link
                        key={item.path}
                        to={item.path}
                        onClick={() => setMobileMenuOpen(false)}
                        className={`flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-medium transition ${
                          isActive
                            ? 'bg-primary/10 text-primary-text'
                            : 'text-fg-muted hover:text-fg hover:bg-fg/5'
                        }`}
                      >
                        <Icon className="w-[18px] h-[18px]" />
                        {item.candidateLabel && user?.role === 'CANDIDATE'
                          ? item.candidateLabel
                          : item.label}
                      </Link>
                    );
                  })}
                </nav>

                {/* Mobile user info */}
                <div className="p-4 border-t border-line">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-primary to-warning flex items-center justify-center text-white font-bold shrink-0 shadow-sm shadow-primary/20">
                      {user?.fullName?.charAt(0) || 'U'}
                    </div>
                    <div>
                      <p className="text-sm font-medium text-fg">
                        {user?.fullName}
                      </p>
                      <p className="text-[11px] text-fg-subtle font-mono">
                        {user?.role ? getRoleLabel(user.role) : ''}
                      </p>
                    </div>
                  </div>
                </div>
              </motion.aside>
            </>
          )}
        </AnimatePresence>

        {/* ─── Main Content ─── */}
        <main className="flex-1 overflow-y-auto">
          <div className="p-4 md:p-8 max-w-7xl mx-auto">
            <Outlet />
          </div>
        </main>
      </div>
    </div>
  );
};

export default AppShell;
