import { render, screen, fireEvent } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { QuestionListPanel } from './QuestionListPanel';
import * as questionsHook from '../../hooks/useQuestions';
import * as contestsHook from '../../hooks/useContests';

const mockQuestions = [
  {
    id: 'q1',
    contestId: 'contest-1',
    title: 'Two Sum',
    description: 'Find two numbers',
    difficulty: 'EASY',
    points: 100,
    timeLimitMs: 2000,
    memoryLimitKb: 262144,
    orderIndex: 1,
    createdAt: '2026-01-01T00:00:00Z',
    createdBy: 'admin',
    testCases: [],
  },
  {
    id: 'q2',
    contestId: 'contest-1',
    title: 'Reverse String',
    description: 'Reverse string',
    difficulty: 'EASY',
    points: 100,
    timeLimitMs: 2000,
    memoryLimitKb: 262144,
    orderIndex: 2,
    createdAt: '2026-01-01T00:00:00Z',
    createdBy: 'admin',
    testCases: [],
  },
] as any;

describe('QuestionListPanel - Random Question Assignment', () => {
  const updateContestMutate = vi.fn();

  beforeEach(() => {
    vi.clearAllMocks();
    vi.spyOn(questionsHook, 'useQuestions').mockReturnValue({
      data: mockQuestions,
      isLoading: false,
    } as any);
    vi.spyOn(questionsHook, 'useReorderQuestions').mockReturnValue({
      mutate: vi.fn(),
    } as any);
    vi.spyOn(questionsHook, 'useDeleteQuestion').mockReturnValue({
      mutate: vi.fn(),
      isPending: false,
    } as any);
    vi.spyOn(contestsHook, 'useUpdateContest').mockReturnValue({
      mutate: updateContestMutate,
      isPending: false,
    } as any);
  });

  const renderComponent = (contestStatus = 'DRAFT', contestOverrides = {}) => {
    const contest = {
      id: 'contest-1',
      title: 'Sample Contest',
      status: contestStatus,
      randomizeQuestions: false,
      questionsPerCandidate: null,
      ...contestOverrides,
    } as any;

    vi.spyOn(contestsHook, 'useContest').mockReturnValue({
      data: contest,
    } as any);

    return render(
      <QueryClientProvider client={new QueryClient()}>
        <MemoryRouter>
          <QuestionListPanel
            contestId="contest-1"
            contest={contest}
            role="ADMIN"
            contestStatus={contestStatus as any}
          />
        </MemoryRouter>
      </QueryClientProvider>,
    );
  };

  it('renders Random Question Assignment card for admin in DRAFT status', () => {
    renderComponent('DRAFT');
    expect(screen.getByText('Random Question Assignment')).toBeInTheDocument();
    expect(screen.getByRole('switch')).toBeInTheDocument();
    expect(screen.getByRole('switch')).toHaveAttribute('aria-checked', 'false');
  });

  it('enables random assignment when switch is toggled and reveals input', () => {
    renderComponent('DRAFT');
    const switchButton = screen.getByRole('switch');
    fireEvent.click(switchButton);

    expect(switchButton).toHaveAttribute('aria-checked', 'true');
    expect(screen.getByLabelText(/Questions per candidate/i)).toBeInTheDocument();
  });

  it('allows setting questionsPerCandidate and calls updateContest when saving', () => {
    renderComponent('DRAFT');
    const switchButton = screen.getByRole('switch');
    fireEvent.click(switchButton);

    const input = screen.getByLabelText(/Questions per candidate/i);
    fireEvent.change(input, { target: { value: '1' } });

    const saveButton = screen.getByRole('button', { name: /^Save$/i });
    fireEvent.click(saveButton);

    expect(updateContestMutate).toHaveBeenCalledWith({
      randomizeQuestions: true,
      questionsPerCandidate: 1,
    });
  });

  it('displays read-only badge when random assignment is active on an ONGOING contest', () => {
    renderComponent('ONGOING', { randomizeQuestions: true, questionsPerCandidate: 2 });
    expect(screen.getByText(/Random Question Assignment Active:/i)).toBeInTheDocument();
    expect(screen.queryByRole('switch')).not.toBeInTheDocument();
  });
});

