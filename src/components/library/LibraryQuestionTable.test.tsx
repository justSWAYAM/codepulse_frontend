import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { MemoryRouter } from 'react-router-dom';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { LibraryQuestionTable } from './LibraryQuestionTable';
import * as libraryHooks from '../../hooks/useLibrary';
import * as authContext from '../../context/AuthContext';
import type { LibraryQuestionRecord } from '../../api/libraryApi';

const mockedNavigate = vi.fn();
vi.mock('react-router-dom', async () => {
  const actual = await vi.importActual('react-router-dom');
  return {
    ...actual,
    useNavigate: () => mockedNavigate,
  };
});

describe('LibraryQuestionTable Component', () => {
  const mockQuestions: LibraryQuestionRecord[] = [
    {
      id: 'q-1',
      title: 'Binary Search Tree Validation',
      questionType: 'DSA',
      difficulty: 'MEDIUM',
      points: 100,
      subjectId: 'subj-1',
      subjectName: 'Algorithms',
      authorName: 'Ada Lovelace',
      createdAt: '2026-10-01T12:00:00Z',
    },
    {
      id: 'q-2',
      title: 'Employee Department SQL',
      questionType: 'SQL',
      difficulty: 'EASY',
      points: 50,
      subjectId: 'subj-2',
      subjectName: 'Databases',
      authorName: 'Alan Turing',
      createdAt: '2026-10-02T12:00:00Z',
    },
  ];

  const mockDeleteMutate = vi.fn();

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

    vi.spyOn(libraryHooks, 'useLibraryQuestions').mockReturnValue({
      data: {
        content: mockQuestions,
        page: 0,
        size: 10,
        totalElements: 2,
        totalPages: 1,
      },
      isLoading: false,
      isError: false,
    } as never);

    vi.spyOn(libraryHooks, 'useDeleteLibraryQuestion').mockReturnValue({
      mutate: mockDeleteMutate,
      isPending: false,
    } as never);

    vi.spyOn(libraryHooks, 'useLibraryQuestion').mockImplementation(((id?: string) => {
      if (!id) return { data: undefined, isLoading: false, isError: false } as never;
      const q = mockQuestions.find((item) => item.id === id);
      return {
        data: q
          ? {
              ...q,
              description: 'Find if a BST is valid.',
              timeLimitMs: 2000,
              memoryLimitKb: 262144,
              createdBy: 'user-ada',
              testCases: [],
              options: [],
              schemaSql: null,
              orderMatters: null,
              modelAnswer: null,
            }
          : undefined,
        isLoading: false,
        isError: false,
      } as never;
    }) as never);
  });

  const renderComponent = (props: React.ComponentProps<typeof LibraryQuestionTable> = {}, role = 'ADMIN', fullName = 'Ada Lovelace') => {
    vi.spyOn(authContext, 'useAuth').mockReturnValue({
      user: {
        id: 'user-1',
        email: 'test@example.com',
        fullName,
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
        <MemoryRouter>
          <LibraryQuestionTable {...props} />
        </MemoryRouter>
      </QueryClientProvider>,
    );
  };

  it('renders questions in the table with title, type, and difficulty', () => {
    renderComponent();

    expect(screen.getByText('Binary Search Tree Validation')).toBeInTheDocument();
    expect(screen.getByText('Employee Department SQL')).toBeInTheDocument();
    expect(screen.getByText('Algorithms')).toBeInTheDocument();
    expect(screen.getByText('Databases')).toBeInTheDocument();
  });

  it('shows view, edit, and delete buttons for admin users', () => {
    renderComponent({}, 'ADMIN');

    expect(screen.getByRole('button', { name: 'View Binary Search Tree Validation' })).toBeInTheDocument();
    expect(screen.getByRole('button', { name: 'Edit Binary Search Tree Validation' })).toBeInTheDocument();
    expect(screen.getByRole('button', { name: 'Delete Binary Search Tree Validation' })).toBeInTheDocument();
  });

  it('navigates to the edit page when edit button is clicked', async () => {
    const user = userEvent.setup();
    renderComponent({}, 'ADMIN');

    const editBtn = screen.getByRole('button', { name: 'Edit Binary Search Tree Validation' });
    await user.click(editBtn);

    expect(mockedNavigate).toHaveBeenCalledWith('/dashboard/library/q-1/edit');
  });

  it('opens delete confirmation dialog and triggers deletion when confirmed', async () => {
    const user = userEvent.setup();
    renderComponent({}, 'ADMIN');

    const deleteBtn = screen.getByRole('button', { name: 'Delete Binary Search Tree Validation' });
    await user.click(deleteBtn);

    expect(screen.getByText('Delete question?')).toBeInTheDocument();
    expect(screen.getByText(/will be removed from the question library/i)).toBeInTheDocument();

    const confirmDeleteBtn = screen.getByRole('button', { name: 'Delete question' });
    await user.click(confirmDeleteBtn);

    expect(mockDeleteMutate).toHaveBeenCalledWith('q-1', expect.anything());
  });

  it('opens question detail modal when question title is clicked', async () => {
    const user = userEvent.setup();
    renderComponent({}, 'ADMIN');

    const titleBtn = screen.getByRole('button', { name: 'Binary Search Tree Validation' });
    await user.click(titleBtn);

    expect(screen.getByText('Description')).toBeInTheDocument();
    expect(screen.getByText('Find if a BST is valid.')).toBeInTheDocument();
  });

  it('restricts edit and delete for evaluators who are not the author', () => {
    renderComponent({}, 'EVALUATOR', 'Different Evaluator');

    expect(screen.getByRole('button', { name: 'View Binary Search Tree Validation' })).toBeInTheDocument();
    expect(screen.queryByRole('button', { name: 'Edit Binary Search Tree Validation' })).not.toBeInTheDocument();
    expect(screen.queryByRole('button', { name: 'Delete Binary Search Tree Validation' })).not.toBeInTheDocument();
  });

  it('hides action column in selectable picker mode', () => {
    renderComponent({ selectable: true });

    expect(screen.queryByRole('button', { name: 'Edit Binary Search Tree Validation' })).not.toBeInTheDocument();
    expect(screen.queryByRole('button', { name: 'Delete Binary Search Tree Validation' })).not.toBeInTheDocument();
    expect(screen.getByRole('checkbox', { name: 'Select Binary Search Tree Validation' })).toBeInTheDocument();
  });
});
