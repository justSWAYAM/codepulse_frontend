import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { SubjectFolderTree } from './SubjectFolderTree';
import * as libraryHooks from '../../hooks/useLibrary';
import * as authContext from '../../context/AuthContext';
import type { SubjectRecord } from '../../api/libraryApi';

describe('SubjectFolderTree Component', () => {
  const mockSubjects: SubjectRecord[] = [
    {
      id: 'subj-1',
      name: 'Algorithms',
      createdBy: 'user-evaluator-1',
      createdAt: '2026-10-01T12:00:00Z',
    },
    {
      id: 'subj-2',
      name: 'System Design',
      createdBy: 'user-other',
      createdAt: '2026-10-02T12:00:00Z',
    },
  ];

  const mockCreateMutate = vi.fn();
  const mockDeleteMutate = vi.fn();
  const mockOnSelect = vi.fn();

  beforeEach(() => {
    vi.clearAllMocks();

    Object.defineProperty(window, 'matchMedia', {
      writable: true,
      value: vi.fn().mockImplementation((query: string) => ({
        matches: false,
        media: query,
        onchange: null,
        addListener: vi.fn(),
        removeListener: vi.fn(),
        addEventListener: vi.fn(),
        removeEventListener: vi.fn(),
        dispatchEvent: vi.fn(),
      })),
    });

    vi.spyOn(libraryHooks, 'useSubjects').mockReturnValue({
      data: mockSubjects,
      isLoading: false,
    } as never);

    vi.spyOn(libraryHooks, 'useCreateSubject').mockReturnValue({
      mutate: mockCreateMutate,
      isPending: false,
    } as never);

    vi.spyOn(libraryHooks, 'useDeleteSubject').mockReturnValue({
      mutate: mockDeleteMutate,
      isPending: false,
    } as never);
  });

  const renderComponent = (
    selectedSubjectId?: string,
    role = 'EVALUATOR',
    userId = 'user-evaluator-1',
  ) => {
    vi.spyOn(authContext, 'useAuth').mockReturnValue({
      user: {
        id: userId,
        email: 'evaluator@example.com',
        fullName: 'Jane Evaluator',
        role: role as 'ADMIN' | 'EVALUATOR',
      },
      isAuthenticated: true,
      isLoading: false,
      login: vi.fn(),
      logout: vi.fn(),
      updateUser: vi.fn(),
    });

    return render(
      <QueryClientProvider client={new QueryClient()}>
        <SubjectFolderTree
          selectedSubjectId={selectedSubjectId}
          onSelectSubject={mockOnSelect}
        />
      </QueryClientProvider>,
    );
  };

  it('renders All questions and subject folders', () => {
    renderComponent();

    expect(screen.getByText('All questions')).toBeInTheDocument();
    expect(screen.getByText('Algorithms')).toBeInTheDocument();
    expect(screen.getByText('System Design')).toBeInTheDocument();
  });

  it('evaluator only sees delete button for folders they created', () => {
    renderComponent();

    expect(screen.getByRole('button', { name: 'Delete Algorithms folder' })).toBeInTheDocument();
    expect(screen.queryByRole('button', { name: 'Delete System Design folder' })).not.toBeInTheDocument();
  });

  it('admin sees delete button for all folders', () => {
    renderComponent(undefined, 'ADMIN', 'admin-user');

    expect(screen.getByRole('button', { name: 'Delete Algorithms folder' })).toBeInTheDocument();
    expect(screen.getByRole('button', { name: 'Delete System Design folder' })).toBeInTheDocument();
  });

  it('clicking delete opens confirmation dialog and confirming triggers deletion and resets selection', async () => {
    const user = userEvent.setup();
    renderComponent('subj-1');

    const deleteBtn = screen.getByRole('button', { name: 'Delete Algorithms folder' });
    await user.click(deleteBtn);

    expect(screen.getByText('Delete folder?')).toBeInTheDocument();
    expect(screen.getByText(/Questions in this folder will stay in the All questions folder/i)).toBeInTheDocument();

    const confirmBtn = screen.getByRole('button', { name: 'Delete folder' });
    await user.click(confirmBtn);

    expect(mockDeleteMutate).toHaveBeenCalledWith('subj-1', expect.anything());
  });

  it('selecting a folder triggers onSelectSubject with folder id', async () => {
    const user = userEvent.setup();
    renderComponent();

    const folderBtn = screen.getByText('Algorithms');
    await user.click(folderBtn);

    expect(mockOnSelect).toHaveBeenCalledWith('subj-1');
  });
});
