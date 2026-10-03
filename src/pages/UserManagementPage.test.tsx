import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { MemoryRouter } from 'react-router-dom';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { TooltipProvider } from '../components/ui';
import * as userHooks from '../hooks/useUsers';
import * as auth from '../context/AuthContext';
import UserManagementPage from './UserManagementPage';

const userRecord = (id: string, fullName: string, role = 'CANDIDATE') => ({
  id,
  fullName,
  email: `${id}@codepulse.dev`,
  role,
  isActive: true,
  createdAt: '2026-10-01T10:00:00Z',
});

const deleteMutate = vi.fn();
const mutation = { mutate: vi.fn(), mutateAsync: vi.fn(), isPending: false } as never;

const renderPage = () => {
  render(
    <QueryClientProvider client={new QueryClient()}>
      <MemoryRouter>
        <TooltipProvider>
          <UserManagementPage />
        </TooltipProvider>
      </MemoryRouter>
    </QueryClientProvider>,
  );
};

describe('UserManagementPage delete', () => {
  beforeEach(() => {
    // jsdom has no matchMedia; Dialog calls it on open
    window.matchMedia ??= ((query: string) => ({ matches: false, media: query })) as never;
    deleteMutate.mockReset();
    vi.spyOn(auth, 'useAuth').mockReturnValue({ user: { id: 'admin1', role: 'ADMIN' } } as never);
    vi.spyOn(userHooks, 'useUsers').mockReturnValue({
      data: { users: [userRecord('admin1', 'Ada Admin', 'ADMIN'), userRecord('cand1', 'Ravi Kumar')], total: 2 },
      isLoading: false,
      isError: false,
      refetch: vi.fn(),
    } as never);
    vi.spyOn(userHooks, 'useDeactivateUser').mockReturnValue(mutation);
    vi.spyOn(userHooks, 'useReactivateUser').mockReturnValue(mutation);
    vi.spyOn(userHooks, 'useDeleteUser').mockReturnValue({ mutate: deleteMutate, isPending: false } as never);
  });

  it('confirms before deleting and sends the user id', async () => {
    const user = userEvent.setup();
    renderPage();

    await user.click(screen.getByRole('button', { name: 'Actions for Ravi Kumar' }));
    await user.click(await screen.findByRole('menuitem', { name: /delete/i }));

    const dialog = await screen.findByRole('dialog');
    expect(dialog).toHaveTextContent('Permanently delete Ravi Kumar (cand1@codepulse.dev)?');
    expect(deleteMutate).not.toHaveBeenCalled();

    await user.click(screen.getByRole('button', { name: 'Delete' }));
    expect(deleteMutate).toHaveBeenCalledWith('cand1', expect.anything());
  });

  it('offers no delete on the signed-in admin’s own row', async () => {
    const user = userEvent.setup();
    renderPage();

    await user.click(screen.getByRole('button', { name: 'Actions for Ada Admin' }));
    expect(await screen.findByRole('menuitem', { name: /edit/i })).toBeInTheDocument();
    expect(screen.queryByRole('menuitem', { name: /delete/i })).not.toBeInTheDocument();
  });
});
