import { render, screen } from '@testing-library/react';
import { MemoryRouter, Route, Routes } from 'react-router-dom';
import { beforeEach, describe, expect, it, vi } from 'vitest';

const auth = vi.hoisted(() => ({ value: {} as Record<string, unknown> }));
vi.mock('../context/AuthContext', () => ({ useAuth: () => auth.value }));

const toast = vi.hoisted(() => ({ error: vi.fn() }));
vi.mock('sonner', () => ({ toast }));

import { ProtectedRoute } from './ProtectedRoute';

const renderAt = (path: string) =>
  render(
    <MemoryRouter initialEntries={[path]}>
      <Routes>
        <Route path="/" element={<p>Landing</p>} />
        <Route path="/login" element={<p>Login page</p>} />
        <Route path="/dashboard" element={<p>Dashboard</p>} />
        <Route
          path="/dashboard/users"
          element={
            <ProtectedRoute roles={['ADMIN']}>
              <p>User management</p>
            </ProtectedRoute>
          }
        />
      </Routes>
    </MemoryRouter>,
  );

const signedInAs = (role: string) => {
  auth.value = { isAuthenticated: true, isLoading: false, user: { id: 'u1', email: 'x@y.z', fullName: 'X', role } };
};

describe('ProtectedRoute', () => {
  beforeEach(() => toast.error.mockReset());

  it('sends a signed-in user without the role to the dashboard with a note', () => {
    signedInAs('EVALUATOR');
    renderAt('/dashboard/users');
    expect(screen.getByText('Dashboard')).toBeInTheDocument();
    expect(screen.queryByText('Landing')).not.toBeInTheDocument();
    expect(toast.error).toHaveBeenCalledWith("You don't have access to that page.", { id: 'forbidden-route' });
  });

  it('renders the page for an allowed role', () => {
    signedInAs('ADMIN');
    renderAt('/dashboard/users');
    expect(screen.getByText('User management')).toBeInTheDocument();
    expect(toast.error).not.toHaveBeenCalled();
  });

  it('sends a signed-out visitor to login', () => {
    auth.value = { isAuthenticated: false, isLoading: false, user: null };
    renderAt('/dashboard/users');
    expect(screen.getByText('Login page')).toBeInTheDocument();
  });
});
