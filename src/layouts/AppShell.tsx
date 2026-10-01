import React, { useEffect, useState } from 'react';
import { Outlet, Link, NavLink, useLocation, useNavigate } from 'react-router-dom';
import { ChevronsLeft, ChevronsRight, LogOut, Menu as MenuIcon, UserRound } from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { useLogout } from '../hooks/useAuth';
import { getNavItemsForRole, type NavItem } from '../config/navigation';
import { cn } from '../lib/cn';
import {
  BrandMark,
  IconButton,
  Menu,
  MenuContent,
  MenuItem,
  MenuLabel,
  MenuSeparator,
  MenuTrigger,
  Sheet,
  ThemeToggle,
  Tooltip,
} from '../components/ui';

const ROLE_LABELS: Record<string, string> = {
  ADMIN: 'Administrator',
  EVALUATOR: 'Evaluator',
  CANDIDATE: 'Candidate',
};

const COLLAPSE_KEY = 'cp:sidebar-collapsed';

function readCollapsed() {
  try {
    return localStorage.getItem(COLLAPSE_KEY) === '1';
  } catch {
    return false;
  }
}

export const Avatar: React.FC<{ name?: string; size?: number; className?: string }> = ({ name, size = 32, className }) => {
  const initials = (name || 'U')
    .split(/\s+/)
    .filter(Boolean)
    .slice(0, 2)
    .map((p) => p[0])
    .join('')
    .toUpperCase();
  return (
    <span
      aria-hidden
      className={cn(
        'inline-flex shrink-0 items-center justify-center rounded-full bg-primary-soft font-semibold text-primary-text ring-1 ring-inset ring-primary/15',
        className,
      )}
      style={{ width: size, height: size, fontSize: size * 0.38 }}
    >
      {initials}
    </span>
  );
};

/** One nav renderer for desktop, collapsed and mobile. Selection is instant (seen tens of times a day). */
const NavList: React.FC<{ items: NavItem[]; collapsed?: boolean; isCandidate: boolean; onNavigate?: () => void }> = ({
  items,
  collapsed,
  isCandidate,
  onNavigate,
}) => (
  <nav aria-label="Main" className="flex flex-col gap-0.5">
    {items.map((item) => {
      const Icon = item.icon;
      const label = item.candidateLabel && isCandidate ? item.candidateLabel : item.label;
      const link = (
        <NavLink
          key={item.path}
          to={item.path}
          end={item.path === '/dashboard'}
          onClick={onNavigate}
          className={({ isActive }) =>
            cn(
              'press relative flex h-10 items-center gap-3 rounded-xl px-3 text-[13.5px] font-medium',
              collapsed && 'justify-center px-0',
              isActive
                ? 'bg-primary-soft text-primary-text'
                : 'text-fg-muted hover-fine:bg-surface-2 hover-fine:text-fg',
            )
          }
        >
          <Icon className="size-[18px] shrink-0" aria-hidden />
          {collapsed ? <span className="sr-only">{label}</span> : <span className="truncate">{label}</span>}
        </NavLink>
      );
      return collapsed ? (
        <Tooltip key={item.path} content={label} side="right">
          {link}
        </Tooltip>
      ) : (
        <React.Fragment key={item.path}>{link}</React.Fragment>
      );
    })}
  </nav>
);

const AppShell: React.FC = () => {
  const { user } = useAuth();
  const logoutMutation = useLogout();
  const location = useLocation();
  const navigate = useNavigate();
  const [collapsed, setCollapsed] = useState(readCollapsed);
  const [mobileOpen, setMobileOpen] = useState(false);

  const navItems = user ? getNavItemsForRole(user.role) : [];
  const isCandidate = user?.role === 'CANDIDATE';
  const roleLabel = user?.role ? ROLE_LABELS[user.role] ?? user.role : '';

  useEffect(() => {
    try {
      localStorage.setItem(COLLAPSE_KEY, collapsed ? '1' : '0');
    } catch {
      // ignore
    }
  }, [collapsed]);

  // Close the mobile drawer on navigation
  useEffect(() => setMobileOpen(false), [location.pathname]);

  const userMenu = (
    <Menu>
      <MenuTrigger asChild>
        <button
          type="button"
          className="press flex items-center gap-2.5 rounded-full p-0.5 pr-0.5 sm:rounded-xl sm:py-1 sm:pl-1 sm:pr-3 hover-fine:bg-surface-2"
          aria-label="Account menu"
        >
          <Avatar name={user?.fullName} />
          <span className="hidden text-left sm:block">
            <span className="block max-w-40 truncate text-[13px] font-medium leading-4 text-fg">{user?.fullName}</span>
            <span className="block text-[11px] leading-4 text-fg-subtle">{roleLabel}</span>
          </span>
        </button>
      </MenuTrigger>
      <MenuContent className="w-56">
        <MenuLabel>
          <span className="block truncate text-[13px] font-medium text-fg">{user?.fullName}</span>
          <span className="block truncate">{user?.email}</span>
        </MenuLabel>
        <MenuSeparator />
        <MenuItem icon={<UserRound />} onSelect={() => navigate('/dashboard/profile')}>
          Profile
        </MenuItem>
        <MenuSeparator />
        <MenuItem
          icon={<LogOut />}
          tone="danger"
          disabled={logoutMutation.isPending}
          onSelect={() => logoutMutation.mutate()}
        >
          Log out
        </MenuItem>
      </MenuContent>
    </Menu>
  );

  return (
    <div className="flex min-h-dvh bg-canvas">
      {/* ─── Desktop sidebar ─── */}
      <aside
        className={cn(
          'sticky top-0 hidden h-dvh shrink-0 flex-col border-r border-line bg-surface md:flex',
          collapsed ? 'w-[72px]' : 'w-60',
        )}
      >
        <div className={cn('flex h-16 items-center', collapsed ? 'justify-center' : 'px-5')}>
          <Link to="/dashboard" aria-label="CodePulse home" className="rounded-xl">
            <BrandMark size={30} withWordmark={!collapsed} />
          </Link>
        </div>
        <div className={'flex-1 overflow-y-auto px-3 py-3'}>
          <NavList items={navItems} collapsed={collapsed} isCandidate={isCandidate} />
        </div>
        <div className={cn('border-t border-line p-3', collapsed && 'flex justify-center')}>
          <Tooltip content={collapsed ? 'Expand sidebar' : 'Collapse sidebar'} side="right">
            <IconButton
              aria-label={collapsed ? 'Expand sidebar' : 'Collapse sidebar'}
              onClick={() => setCollapsed((c) => !c)}
              size="sm"
            >
              {collapsed ? <ChevronsRight className="size-4" /> : <ChevronsLeft className="size-4" />}
            </IconButton>
          </Tooltip>
        </div>
      </aside>

      {/* ─── Mobile drawer ─── */}
      <Sheet
        open={mobileOpen}
        onOpenChange={setMobileOpen}
        side="left"
        width="max-w-[280px]"
        title={<BrandMark size={28} />}
      >
        <div className="p-3">
          <NavList items={navItems} isCandidate={isCandidate} onNavigate={() => setMobileOpen(false)} />
        </div>
      </Sheet>

      {/* ─── Main column ─── */}
      <div className="flex min-w-0 flex-1 flex-col">
        <header className="sticky top-0 z-[var(--z-sticky)] flex h-16 items-center gap-3 border-b border-line bg-canvas/85 px-4 backdrop-blur-md md:px-8">
          <IconButton aria-label="Open navigation" className="md:hidden" onClick={() => setMobileOpen(true)}>
            <MenuIcon className="size-5" />
          </IconButton>
          <Link to="/dashboard" className="md:hidden" aria-label="CodePulse home">
            <BrandMark size={28} withWordmark={false} />
          </Link>
          <div className="flex-1" />
          <ThemeToggle />
          <div className="mx-1 hidden h-6 w-px bg-line sm:block" aria-hidden />
          {userMenu}
        </header>

        <main className="flex-1">
          <div className="mx-auto w-full max-w-7xl px-4 py-6 md:px-8 md:py-8">
            <Outlet />
          </div>
        </main>
      </div>
    </div>
  );
};

export default AppShell;
