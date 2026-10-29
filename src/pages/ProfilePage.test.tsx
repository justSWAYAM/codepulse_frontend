import { render, screen } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { describe, expect, it, vi } from 'vitest';
import * as auth from '../context/AuthContext';
import * as userHooks from '../hooks/useUsers';
import ProfilePage from './ProfilePage';

const renderProfile = () => {
  render(
    <QueryClientProvider client={new QueryClient()}>
      <MemoryRouter>
        <ProfilePage />
      </MemoryRouter>
    </QueryClientProvider>,
  );
};

describe('ProfilePage', () => {
  it('locks profile and credentials for CANDIDATE', () => {
    vi.spyOn(auth, 'useAuth').mockReturnValue({
      user: {
        id: 'c1',
        fullName: 'Aarav Sharma',
        email: 'aarav@codepulse.dev',
        role: 'CANDIDATE',
      },
    } as never);

    vi.spyOn(userHooks, 'useCurrentUser').mockReturnValue({
      data: {
        id: 'c1',
        fullName: 'Aarav Sharma',
        email: 'aarav@codepulse.dev',
        role: 'CANDIDATE',
        isActive: true,
        createdAt: '2026-09-01T10:00:00Z',
        rollNumber: '20015',
        year: 3,
        branch: 'CSE',
        division: 'B',
        batch: 'B2',
      },
      isLoading: false,
    } as never);

    renderProfile();

    // Verify read-only identity and academic details are displayed
    expect(screen.getByText('Aarav Sharma')).toBeInTheDocument();
    expect(screen.getByText('aarav@codepulse.dev')).toBeInTheDocument();
    expect(screen.getByText('20015')).toBeInTheDocument();
    expect(screen.getByText('CSE')).toBeInTheDocument();

    // Verify institutional locked notice is shown
    expect(screen.getByText('Profile and credentials locked')).toBeInTheDocument();
    expect(
      screen.getByText(/managed exclusively by the administrator/i)
    ).toBeInTheDocument();

    // Verify edit forms and action buttons are NOT rendered
    expect(screen.queryByText('Personal information')).not.toBeInTheDocument();
    expect(screen.queryByRole('button', { name: /save changes/i })).not.toBeInTheDocument();
    expect(screen.queryByText('Change password')).not.toBeInTheDocument();
    expect(screen.queryByRole('button', { name: /change password/i })).not.toBeInTheDocument();
  });

  it('allows ADMIN to edit personal information and change password', () => {
    vi.spyOn(auth, 'useAuth').mockReturnValue({
      user: {
        id: 'a1',
        fullName: 'System Admin',
        email: 'admin@codepulse.dev',
        role: 'ADMIN',
      },
    } as never);

    vi.spyOn(userHooks, 'useCurrentUser').mockReturnValue({
      data: {
        id: 'a1',
        fullName: 'System Admin',
        email: 'admin@codepulse.dev',
        role: 'ADMIN',
        isActive: true,
        createdAt: '2026-01-01T10:00:00Z',
      },
      isLoading: false,
    } as never);

    renderProfile();

    // Verify locked banner is NOT shown
    expect(screen.queryByText('Profile and credentials locked')).not.toBeInTheDocument();

    // Verify Personal information and Change password forms ARE rendered
    expect(screen.getByText('Personal information')).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /save changes/i })).toBeInTheDocument();
    expect(screen.getByRole('heading', { name: 'Change password' })).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /change password/i })).toBeInTheDocument();
  });
});
