import { Users, User, LayoutDashboard, Trophy, type LucideIcon } from 'lucide-react';
import { LibraryBig } from 'lucide-react';

export interface NavItem {
  label: string;
  candidateLabel?: string;  // optional override label for CANDIDATE role
  path: string;
  icon: LucideIcon;
  roles: Array<'CANDIDATE' | 'EVALUATOR' | 'ADMIN'>;
}

export const navigationItems: NavItem[] = [
  {
    label: 'Dashboard',
    path: '/dashboard',
    icon: LayoutDashboard,
    roles: ['ADMIN', 'EVALUATOR', 'CANDIDATE'],
  },
  {
    label: 'Contests',
    candidateLabel: 'My Contests',
    path: '/dashboard/contests',
    icon: Trophy,
    roles: ['ADMIN', 'EVALUATOR', 'CANDIDATE'],
  },
  {
    label: 'Users',
    path: '/dashboard/users',
    icon: Users,
    roles: ['ADMIN'],
  },
  {
    label: 'Profile',
    path: '/dashboard/profile',
    icon: User,
    roles: ['ADMIN', 'EVALUATOR', 'CANDIDATE'],
  },
  {
    label: 'Question library',
    path: '/dashboard/library',
    icon: LibraryBig,
    roles: ['ADMIN', 'EVALUATOR'],
  },
];

export const getNavItemsForRole = (role: 'CANDIDATE' | 'EVALUATOR' | 'ADMIN'): NavItem[] => {
  return navigationItems.filter((item) => item.roles.includes(role));
};
