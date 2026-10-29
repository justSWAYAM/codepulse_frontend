import { render, screen, fireEvent } from '@testing-library/react';
import { MemoryRouter, Route, Routes } from 'react-router-dom';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { TooltipProvider } from '../components/ui';
import * as contestHooks from '../hooks/useContests';
import * as userHooks from '../hooks/useUsers';
import * as sessionHooks from '../hooks/useAssessmentSession';
import * as auth from '../context/AuthContext';
import ContestDetailPage from './ContestDetailPage';

const mutation = { mutateAsync: vi.fn(), isPending: false } as never;

const renderAs = (
  role: string,
  status: string,
  initialEntries = ['/dashboard/contests/c1'],
  customContest: Record<string, unknown> = {},
) => {
  vi.spyOn(auth, 'useAuth').mockReturnValue({ user: { id: 'u1', role } } as never);
  vi.spyOn(contestHooks, 'useContest').mockReturnValue({
    data: {
      id: 'c1',
      title: 'Mock Test',
      description: null,
      startTime: '2026-10-01T10:00:00Z',
      endTime: '2026-10-01T11:00:00Z',
      durationMinutes: 60,
      allowedLanguages: ['PYTHON'],
      status,
      candidateCount: 3,
      createdAt: '2026-09-30T10:00:00Z',
      resultsPublished: false,
      candidates: [],
      ...customContest,
    },
    isLoading: false,
    isError: false,
  } as never);
  render(
    <QueryClientProvider client={new QueryClient()}>
      <MemoryRouter initialEntries={initialEntries}>
        <TooltipProvider>
          <Routes>
            <Route path="/dashboard/contests/:id" element={<ContestDetailPage />} />
          </Routes>
        </TooltipProvider>
      </MemoryRouter>
    </QueryClientProvider>,
  );
};

describe('ContestDetailPage analytics tab', () => {
  beforeEach(() => {
    vi.spyOn(contestHooks, 'usePublishContest').mockReturnValue(mutation);
    vi.spyOn(contestHooks, 'useAssignCandidates').mockReturnValue(mutation);
    vi.spyOn(contestHooks, 'useUnassignCandidates').mockReturnValue(mutation);
    vi.spyOn(contestHooks, 'useDeleteContest').mockReturnValue(mutation);
    vi.spyOn(contestHooks, 'useReuseContest').mockReturnValue(mutation);
    vi.spyOn(userHooks, 'useUsers').mockReturnValue({ data: undefined } as never);
    vi.spyOn(sessionHooks, 'useAssessmentSession').mockReturnValue({ data: undefined, isLoading: false, isError: false } as never);
    vi.spyOn(sessionHooks, 'useStartSession').mockReturnValue(mutation);
  });

  it.each(['ADMIN', 'EVALUATOR'])('%s sees Results and Analytics on a live or completed contest', (role) => {
    renderAs(role, 'COMPLETED');
    expect(screen.getByRole('tab', { name: /analytics/i })).toBeInTheDocument();
    expect(screen.getByRole('tab', { name: /results/i })).toBeInTheDocument();
  });

  it('staff see no Analytics tab before the contest starts', () => {
    renderAs('ADMIN', 'PUBLISHED');
    expect(screen.queryByRole('tab', { name: /analytics/i })).not.toBeInTheDocument();
  });

  it('candidates never see Analytics', () => {
    renderAs('CANDIDATE', 'COMPLETED');
    expect(screen.queryByRole('tab', { name: /analytics/i })).not.toBeInTheDocument();
  });

  it('admin sees Reuse contest button on any contest', () => {
    renderAs('ADMIN', 'COMPLETED');
    expect(screen.getByRole('button', { name: /reuse contest/i })).toBeInTheDocument();
  });

  it('admin sees Delete contest disabled on live ONGOING contest', () => {
    renderAs('ADMIN', 'ONGOING');
    const deleteBtn = screen.getByRole('button', { name: /delete contest/i });
    expect(deleteBtn).toBeDisabled();
  });

  it('admin sees Delete contest enabled on completed contest', () => {
    renderAs('ADMIN', 'COMPLETED');
    const deleteBtn = screen.getByRole('button', { name: /delete contest/i });
    expect(deleteBtn).not.toBeDisabled();
  });

  it('candidates tab shows assignment locked warning when contest is ONGOING', () => {
    renderAs('ADMIN', 'ONGOING', ['/dashboard/contests/c1?tab=candidates']);
    expect(screen.getByText(/candidate assignments are locked/i)).toBeInTheDocument();
  });

  it('filters assigned candidates by search input and status dropdown in live contest', () => {
    vi.spyOn(contestHooks, 'useCandidateAssignments').mockReturnValue({
      data: [
        {
          candidateId: 'cand1',
          rollNumber: '20011',
          sessionStatus: 'IN_PROGRESS',
          questionChangeCount: 3,
          questionChangePenalty: 15,
          assignedQuestions: [{ questionId: 'q1', title: 'Find First and Last Position', points: 10, difficulty: 'MEDIUM', orderIndex: 1 }],
          availablePoolQuestions: [{ questionId: 'q2', title: 'Two Sum', points: 10, difficulty: 'EASY' }],
        },
        {
          candidateId: 'cand2',
          rollNumber: '20003',
          sessionStatus: 'NOT_YET_STARTED',
          questionChangeCount: 0,
          questionChangePenalty: 0,
          assignedQuestions: [],
          availablePoolQuestions: [],
        },
      ],
    } as never);

    renderAs('ADMIN', 'ONGOING', ['/dashboard/contests/c1?tab=candidates'], {
      candidateCount: 2,
      candidates: [
        { id: 'cand1', fullName: 'Neha Patil', email: 'neha@codepulse.dev' },
        { id: 'cand2', fullName: 'Omkar Joshi', email: 'omkar@codepulse.dev' },
      ],
    });

    // Both candidates visible initially
    expect(screen.getByText('Neha Patil')).toBeInTheDocument();
    expect(screen.getByText('(20011)')).toBeInTheDocument();
    expect(screen.getByText('Omkar Joshi')).toBeInTheDocument();
    expect(screen.getByText('(20003)')).toBeInTheDocument();

    const searchInput = screen.getByLabelText(/search assigned candidates/i);

    // Search by name
    fireEvent.change(searchInput, { target: { value: 'Neha' } });
    expect(screen.getByText('Neha Patil')).toBeInTheDocument();
    expect(screen.queryByText('Omkar Joshi')).not.toBeInTheDocument();
    expect(screen.getByText(/showing 1 of 2 enrolled candidates/i)).toBeInTheDocument();

    // Search by roll number
    fireEvent.change(searchInput, { target: { value: '20003' } });
    expect(screen.queryByText('Neha Patil')).not.toBeInTheDocument();
    expect(screen.getByText('Omkar Joshi')).toBeInTheDocument();

    // Clear search using clear button
    const clearBtn = screen.getByRole('button', { name: /^clear$/i });
    fireEvent.click(clearBtn);
    expect(screen.getByText('Neha Patil')).toBeInTheDocument();
    expect(screen.getByText('Omkar Joshi')).toBeInTheDocument();

    // Filter by session status
    const statusSelect = screen.getByLabelText(/filter by session status/i);
    fireEvent.change(statusSelect, { target: { value: 'IN_PROGRESS' } });
    expect(screen.getByText('Neha Patil')).toBeInTheDocument();
    expect(screen.queryByText('Omkar Joshi')).not.toBeInTheDocument();

    // Filter by swapped
    fireEvent.change(statusSelect, { target: { value: 'SWAPPED' } });
    expect(screen.getByText('Neha Patil')).toBeInTheDocument();
    expect(screen.queryByText('Omkar Joshi')).not.toBeInTheDocument();

    // No match empty state
    fireEvent.change(searchInput, { target: { value: 'Unknown' } });
    expect(screen.getByText(/no candidates match your search filter/i)).toBeInTheDocument();

    const clearFilterBtn = screen.getByRole('button', { name: /clear filter/i });
    fireEvent.click(clearFilterBtn);
    expect(screen.getByText('Neha Patil')).toBeInTheDocument();
    expect(screen.getByText('Omkar Joshi')).toBeInTheDocument();
  });
});
