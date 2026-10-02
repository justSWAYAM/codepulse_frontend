import { render, screen } from '@testing-library/react';
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

const renderAs = (role: string, status: string) => {
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
    },
    isLoading: false,
    isError: false,
  } as never);
  render(
    <QueryClientProvider client={new QueryClient()}>
      <MemoryRouter initialEntries={['/dashboard/contests/c1']}>
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
});
