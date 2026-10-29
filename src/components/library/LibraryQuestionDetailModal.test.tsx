import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { LibraryQuestionDetailModal } from './LibraryQuestionDetailModal';
import * as libraryHooks from '../../hooks/useLibrary';
import * as authContext from '../../context/AuthContext';
import type { LibraryQuestionDetailRecord } from '../../api/libraryApi';

describe('LibraryQuestionDetailModal Component', () => {
  const mockQuestion: LibraryQuestionDetailRecord = {
    id: 'q-test-1',
    title: 'Sort an Array',
    questionType: 'DSA',
    difficulty: 'EASY',
    points: 10,
    timeLimitMs: 2000,
    memoryLimitKb: 262144,
    subjectId: 'subj-1',
    subjectName: 'Algorithms',
    authorName: 'System Admin',
    createdBy: 'admin-uuid',
    createdAt: '2026-10-29T10:00:00Z',
    description: '## Problem Statement\n\nGiven an array of `n` integers, sort it.',
    testCases: [
      {
        id: 'tc-1',
        input: '5\n5 2 8 1 3',
        expectedOutput: '1 2 3 5 8',
        isSample: true,
        weight: 10,
        orderIndex: 0,
      },
      {
        id: 'tc-2',
        input: '2\n2 1',
        expectedOutput: '1 2',
        isSample: false,
        weight: 10,
        orderIndex: 1,
      },
    ],
    options: [],
    schemaSql: null,
    orderMatters: null,
    modelAnswer: null,
  };

  const mockOnClose = vi.fn();
  const mockOnEdit = vi.fn();
  const mockOnDelete = vi.fn();

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
        id: 'admin-uuid',
        fullName: 'System Admin',
        email: 'admin@codepulse.dev',
        role: 'ADMIN',
      },
      login: vi.fn(),
      logout: vi.fn(),
      updateUser: vi.fn(),
      isAuthenticated: true,
      isLoading: false,
    });
  });

  it('renders question details with description preview using prose-cp', () => {
    vi.spyOn(libraryHooks, 'useLibraryQuestion').mockReturnValue({
      data: mockQuestion,
      isLoading: false,
      isError: false,
    } as never);

    render(
      <LibraryQuestionDetailModal
        questionId="q-test-1"
        isOpen={true}
        onClose={mockOnClose}
        onEdit={mockOnEdit}
        onDelete={mockOnDelete}
      />
    );

    // Title and metadata
    expect(screen.getByText('Sort an Array')).toBeInTheDocument();
    expect(screen.getAllByText(/10 pts/).length).toBeGreaterThanOrEqual(1);
    expect(screen.getByText('2000 ms')).toBeInTheDocument();
    expect(screen.getByText('256 MB')).toBeInTheDocument();
    expect(screen.getByText('Author: System Admin')).toBeInTheDocument();

    // Description header and prose-cp container
    expect(screen.getByText('Description')).toBeInTheDocument();
    const proseEl = document.querySelector('.prose-cp');
    expect(proseEl).toBeInTheDocument();
    expect(screen.getByRole('heading', { level: 2, name: 'Problem Statement' })).toBeInTheDocument();
    expect(screen.getByText(/Given an array of/)).toBeInTheDocument();

    // Sample test cases
    expect(screen.getByText('Sample #1')).toBeInTheDocument();
    expect(screen.getByText((content) => content.includes('5 2 8 1 3'))).toBeInTheDocument();
    expect(screen.getByText((content) => content.includes('1 2 3 5 8'))).toBeInTheDocument();
  });

  it('calls onEdit and onDelete when buttons are clicked', async () => {
    const user = userEvent.setup();
    vi.spyOn(libraryHooks, 'useLibraryQuestion').mockReturnValue({
      data: mockQuestion,
      isLoading: false,
      isError: false,
    } as never);

    render(
      <LibraryQuestionDetailModal
        questionId="q-test-1"
        isOpen={true}
        onClose={mockOnClose}
        onEdit={mockOnEdit}
        onDelete={mockOnDelete}
      />
    );

    const editButton = screen.getByRole('button', { name: /Edit question/i });
    await user.click(editButton);
    expect(mockOnEdit).toHaveBeenCalledWith('q-test-1');
    expect(mockOnClose).toHaveBeenCalled();

    const deleteButton = screen.getByRole('button', { name: /Delete/i });
    await user.click(deleteButton);
    expect(mockOnDelete).toHaveBeenCalledWith({ id: 'q-test-1', title: 'Sort an Array' });
  });

  it('renders loading state when question is fetching', () => {
    vi.spyOn(libraryHooks, 'useLibraryQuestion').mockReturnValue({
      data: undefined,
      isLoading: true,
      isError: false,
    } as never);

    render(
      <LibraryQuestionDetailModal
        questionId="q-test-1"
        isOpen={true}
        onClose={mockOnClose}
      />
    );

    expect(screen.getByText(/Loading question details/i)).toBeInTheDocument();
  });
});
