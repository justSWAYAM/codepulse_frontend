import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { ChangeQuestionModal } from './ChangeQuestionModal';
import * as contestHooks from '../../hooks/useContests';
import type { CandidateSessionAssignment } from '../../api/contestApi';

describe('ChangeQuestionModal Component', () => {
  const mockAssignment: CandidateSessionAssignment = {
    candidateId: 'cand-123',
    candidateName: 'Alice Developer',
    candidateEmail: 'alice@example.com',
    rollNumber: 'ROLL-101',
    sessionId: 'session-456',
    sessionStatus: 'IN_PROGRESS',
    startedAt: '2026-10-29T10:00:00Z',
    endsAt: '2026-10-29T12:00:00Z',
    submittedAt: null,
    faultCount: 0,
    questionChangeCount: 0,
    questionChangePenalty: 0,
    assignedQuestions: [
      {
        questionId: 'q-assigned-1',
        title: 'Two Sum',
        orderIndex: 1,
        points: 20,
        difficulty: 'EASY',
      },
      {
        questionId: 'q-assigned-2',
        title: 'Valid Palindrome',
        orderIndex: 2,
        points: 30,
        difficulty: 'MEDIUM',
      },
    ],
    availablePoolQuestions: [
      {
        questionId: 'q-pool-1',
        title: 'Merge Intervals',
        orderIndex: 3,
        points: 40,
        difficulty: 'HARD',
      },
      {
        questionId: 'q-pool-2',
        title: 'Reverse Linked List',
        orderIndex: 4,
        points: 25,
        difficulty: 'EASY',
      },
    ],
  };

  const mockMutateAsync = vi.fn();
  const mockOnOpenChange = vi.fn();
  const mockOnSuccess = vi.fn();

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

    vi.spyOn(contestHooks, 'useChangeSessionQuestion').mockReturnValue({
      mutateAsync: mockMutateAsync,
      isPending: false,
      reset: vi.fn(),
    } as unknown as ReturnType<typeof contestHooks.useChangeSessionQuestion>);
  });

  const renderModal = (assignment: CandidateSessionAssignment | null = mockAssignment, open = true) => {
    const qc = new QueryClient({ defaultOptions: { queries: { retry: false } } });
    return render(
      <QueryClientProvider client={qc}>
        <ChangeQuestionModal
          open={open}
          onOpenChange={mockOnOpenChange}
          contestId="contest-789"
          assignment={assignment}
          onSuccess={mockOnSuccess}
        />
      </QueryClientProvider>,
    );
  };

  it('renders modal with penalty notice and candidate details', () => {
    renderModal();

    expect(screen.getByRole('dialog')).toBeInTheDocument();
    expect(screen.getByText('Change Assigned Question')).toBeInTheDocument();
    expect(screen.getByText(/Swap an assigned question for Alice Developer/i)).toBeInTheDocument();
    expect(screen.getByText(/Score Penalty Notice \(-5 points\)/i)).toBeInTheDocument();
    expect(screen.getByText(/5\.00 points/i)).toBeInTheDocument();
  });

  it('populates replacement and pool question options and handles submit', async () => {
    const user = userEvent.setup();
    mockMutateAsync.mockResolvedValueOnce({
      ...mockAssignment,
      questionChangeCount: 1,
      questionChangePenalty: 5,
    });

    renderModal();

    const selects = screen.getAllByRole('combobox');
    expect(selects).toHaveLength(2);

    // Question to Replace: options include Two Sum and Valid Palindrome
    expect(screen.getByText(/#1 — Two Sum/i)).toBeInTheDocument();
    expect(screen.getByText(/#2 — Valid Palindrome/i)).toBeInTheDocument();

    // Replacement question: Merge Intervals and Reverse Linked List
    expect(screen.getByText(/Merge Intervals/i)).toBeInTheDocument();
    expect(screen.getByText(/Reverse Linked List/i)).toBeInTheDocument();

    // Type optional reason
    const reasonInput = screen.getByRole('textbox');
    await user.type(reasonInput, 'Candidate experienced environment glitch');

    // Click confirm swap button
    const confirmBtn = screen.getByRole('button', { name: /Confirm Swap \(-5 pts\)/i });
    expect(confirmBtn).not.toBeDisabled();
    await user.click(confirmBtn);

    await waitFor(() => {
      expect(mockMutateAsync).toHaveBeenCalledWith({
        sessionId: 'session-456',
        payload: {
          currentQuestionId: 'q-assigned-1',
          newQuestionId: 'q-pool-1',
          reason: 'Candidate experienced environment glitch',
        },
      });
      expect(mockOnOpenChange).toHaveBeenCalledWith(false);
      expect(mockOnSuccess).toHaveBeenCalled();
    });
  });

  it('disables submit button and informs user when no pool questions are available', () => {
    const noPoolAssignment: CandidateSessionAssignment = {
      ...mockAssignment,
      availablePoolQuestions: [],
    };

    renderModal(noPoolAssignment);

    expect(screen.getByText(/No additional unassigned questions available in this contest pool/i)).toBeInTheDocument();
    const confirmBtn = screen.getByRole('button', { name: /Confirm Swap \(-5 pts\)/i });
    expect(confirmBtn).toBeDisabled();
  });

  it('closes modal when Cancel button is clicked', async () => {
    const user = userEvent.setup();
    renderModal();

    const cancelBtn = screen.getByRole('button', { name: /Cancel/i });
    await user.click(cancelBtn);

    expect(mockOnOpenChange).toHaveBeenCalledWith(false);
  });
});
