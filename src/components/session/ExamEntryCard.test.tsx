import { render, screen } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { beforeEach, describe, expect, it, vi } from 'vitest';

import { ExamEntryCard } from './ExamEntryCard';
import * as assessmentSessionHook from '../../hooks/useAssessmentSession';
import * as resultHooks from '../../hooks/useResults';

const mockUseAssessmentSession = vi.spyOn(assessmentSessionHook, 'useAssessmentSession');
const mockUseStartSession = vi.spyOn(assessmentSessionHook, 'useStartSession');

const contest = {
  id: 'contest-1',
  title: 'Sample Contest',
  description: null,
  startTime: '2025-01-01T00:00:00Z',
  endTime: '2025-01-02T00:00:00Z',
  durationMinutes: 45,
  allowedLanguages: ['JAVA'],
  status: 'ONGOING',
  candidateCount: 1,
  createdAt: '2025-01-01T00:00:00Z',
  candidates: [],
} as any;

describe('ExamEntryCard session states', () => {
  beforeEach(() => {
    mockUseAssessmentSession.mockReturnValue({ data: undefined } as any);
    mockUseStartSession.mockReturnValue({
      mutateAsync: vi.fn(),
      isPending: false,
    } as any);
  });

  it('shows the start button only when the session lookup reports no session', () => {
    mockUseAssessmentSession.mockReturnValue({
      data: undefined,
      isLoading: false,
      isFetching: false,
      isError: true,
      error: { response: { status: 404 } },
    } as any);

    render(
      <QueryClientProvider client={new QueryClient()}>
        <MemoryRouter>
        <ExamEntryCard contest={contest} />
      </MemoryRouter>
      </QueryClientProvider>
    );

    expect(mockUseAssessmentSession).toHaveBeenCalledWith('contest-1', true);
    expect(screen.getByRole('button', { name: /start exam/i })).toBeInTheDocument();
  });

  it('shows the scheduled state before the assessment window without a session lookup', () => {
    render(
      <QueryClientProvider client={new QueryClient()}>
        <MemoryRouter>
        <ExamEntryCard
          contest={{
            ...contest,
            status: 'PUBLISHED',
            startTime: '2099-01-01T00:00:00Z',
            endTime: '2099-01-02T00:00:00Z',
          }}
        />
      </MemoryRouter>
      </QueryClientProvider>
    );

    expect(screen.getByText(/exam opens on/i)).toBeInTheDocument();
  });

  it('shows Start when GET returns the NOT_YET_STARTED session state', () => {
    mockUseAssessmentSession.mockReturnValue({
      data: { status: 'NOT_YET_STARTED' },
      isLoading: false,
      isFetching: false,
      isError: false,
      error: null,
    } as any);

    render(
      <QueryClientProvider client={new QueryClient()}>
        <MemoryRouter>
        <ExamEntryCard contest={contest} />
      </MemoryRouter>
      </QueryClientProvider>
    );

    expect(screen.getByRole('button', { name: /start exam/i })).toBeInTheDocument();
  });

  it('does not show a start action after the cached session is submitted', () => {
    mockUseAssessmentSession.mockReturnValue({
      data: { status: 'SUBMITTED' },
    } as any);

    render(
      <QueryClientProvider client={new QueryClient()}>
        <MemoryRouter>
        <ExamEntryCard contest={contest} />
      </MemoryRouter>
      </QueryClientProvider>
    );

    expect(screen.getByText(/already submitted/i)).toBeInTheDocument();
    expect(screen.queryByRole('button', { name: /start exam/i })).not.toBeInTheDocument();
  });

  it('shows the published score instead of the submitted note once results are out', () => {
    mockUseAssessmentSession.mockReturnValue({
      data: { status: 'SUBMITTED' },
      isLoading: false,
      isFetching: false,
      isError: false,
    } as any);
    const myResult = vi.spyOn(resultHooks, 'useMyResult').mockReturnValue({
      data: { contestId: 'contest-1', contestTitle: 'Sample', published: true, status: 'SCORED', totalScore: 42.5, maxScore: 100, rank: 3, rankedCount: 10 },
      isLoading: false,
    } as any);

    render(
      <QueryClientProvider client={new QueryClient()}>
        <MemoryRouter>
          <ExamEntryCard contest={{ ...contest, status: 'COMPLETED', resultsPublished: true }} />
        </MemoryRouter>
      </QueryClientProvider>
    );

    expect(screen.getByText('Rank 3 of 10')).toBeInTheDocument();
    expect(screen.getByRole('link', { name: /view breakdown/i })).toHaveAttribute('href', '/dashboard/contests/contest-1/result');
    expect(screen.queryByText(/already submitted/i)).not.toBeInTheDocument();
    myResult.mockRestore();
  });

  it('keeps the "results appear here" note until results are published', () => {
    mockUseAssessmentSession.mockReturnValue({
      data: { status: 'SUBMITTED' },
      isLoading: false,
      isFetching: false,
      isError: false,
    } as any);
    const myResult = vi.spyOn(resultHooks, 'useMyResult');

    render(
      <QueryClientProvider client={new QueryClient()}>
        <MemoryRouter>
          <ExamEntryCard contest={{ ...contest, status: 'COMPLETED', resultsPublished: false }} />
        </MemoryRouter>
      </QueryClientProvider>
    );

    expect(screen.getByText(/results appear here once/i)).toBeInTheDocument();
    expect(myResult).not.toHaveBeenCalled();
    myResult.mockRestore();
  });
});
