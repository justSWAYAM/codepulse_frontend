import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { MemoryRouter } from 'react-router-dom';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { AddQuestionsToFolderModal } from './AddQuestionsToFolderModal';
import * as libraryHooks from '../../hooks/useLibrary';
import * as authContext from '../../context/AuthContext';
import type { LibraryQuestionRecord, SubjectRecord } from '../../api/libraryApi';

describe('AddQuestionsToFolderModal Component', () => {
  const targetSubject: SubjectRecord = {
    id: 'subj-target',
    name: 'Dynamic Programming',
    createdBy: 'user-eval-1',
    createdAt: '2026-10-01T12:00:00Z',
  };

  const mockQuestions: LibraryQuestionRecord[] = [
    {
      id: 'q-1',
      title: 'Fibonacci Sequence',
      questionType: 'DSA',
      difficulty: 'EASY',
      points: 20,
      subjectId: null,
      subjectName: null,
      authorName: 'Ada Lovelace',
      createdAt: '2026-10-01T12:00:00Z',
    },
    {
      id: 'q-2',
      title: 'Coin Change',
      questionType: 'DSA',
      difficulty: 'MEDIUM',
      points: 50,
      subjectId: 'subj-other',
      subjectName: 'Algorithms',
      authorName: 'Alan Turing',
      createdAt: '2026-10-02T12:00:00Z',
    },
  ];

  const mockAddMutate = vi.fn();
  const mockOnOpenChange = vi.fn();

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

    vi.spyOn(authContext, 'useAuth').mockReturnValue({
      user: {
        id: 'user-eval-1',
        email: 'evaluator@example.com',
        fullName: 'Jane Evaluator',
        role: 'EVALUATOR',
      },
      isAuthenticated: true,
      isLoading: false,
      login: vi.fn(),
      logout: vi.fn(),
      updateUser: vi.fn(),
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

    vi.spyOn(libraryHooks, 'useSubjects').mockReturnValue({
      data: [targetSubject],
      isLoading: false,
    } as never);

    vi.spyOn(libraryHooks, 'useAddQuestionsToSubject').mockReturnValue({
      mutate: mockAddMutate,
      isPending: false,
    } as never);
  });

  const renderComponent = (open = true) => {
    return render(
      <QueryClientProvider client={new QueryClient()}>
        <MemoryRouter>
          <AddQuestionsToFolderModal
            open={open}
            onOpenChange={mockOnOpenChange}
            targetSubject={targetSubject}
          />
        </MemoryRouter>
      </QueryClientProvider>,
    );
  };

  it('renders dialog title and questions from library', () => {
    renderComponent();

    expect(screen.getByText('Add questions to Dynamic Programming')).toBeInTheDocument();
    expect(screen.getByText('Fibonacci Sequence')).toBeInTheDocument();
    expect(screen.getByText('Coin Change')).toBeInTheDocument();
  });

  it('allows selecting questions and submitting to target subject', async () => {
    const user = userEvent.setup();
    renderComponent();

    const checkbox = screen.getByRole('checkbox', { name: 'Select Fibonacci Sequence' });
    await user.click(checkbox);

    expect(screen.getByText('1 question selected')).toBeInTheDocument();

    const addBtn = screen.getByRole('button', { name: /Add to Dynamic Programming/i });
    expect(addBtn).toBeEnabled();
    await user.click(addBtn);

    expect(mockAddMutate).toHaveBeenCalledWith(['q-1'], expect.anything());
  });
});
