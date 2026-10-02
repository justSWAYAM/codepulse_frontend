import { render, screen } from '@testing-library/react';
import { MemoryRouter, Route, Routes } from 'react-router-dom';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { describe, expect, it, vi } from 'vitest';
import * as resultHooks from '../hooks/useResults';
import MyResultPage from './MyResultPage';

const renderPage = () =>
  render(
    <QueryClientProvider client={new QueryClient()}>
      <MemoryRouter initialEntries={['/dashboard/contests/c1/result']}>
        <Routes>
          <Route path="/dashboard/contests/:contestId/result" element={<MyResultPage />} />
        </Routes>
      </MemoryRouter>
    </QueryClientProvider>,
  );

describe('MyResultPage', () => {
  it('shows a calm "not published yet" state, never an error', () => {
    vi.spyOn(resultHooks, 'useMyResult').mockReturnValue({
      data: { contestId: 'c1', contestTitle: 'Mock Test', published: false },
      isLoading: false,
      isError: false,
    } as never);

    renderPage();

    expect(screen.getByText(/haven’t been published yet/i)).toBeInTheDocument();
    expect(screen.queryByRole('alert')).not.toBeInTheDocument();
    expect(screen.queryByText(/rank/i)).not.toBeInTheDocument();
  });

  it('shows the total, rank and per-question breakdown once published', () => {
    vi.spyOn(resultHooks, 'useMyResult').mockReturnValue({
      data: {
        contestId: 'c1',
        contestTitle: 'Mock Test',
        published: true,
        publishedAt: '2026-10-03T10:00:00Z',
        status: 'SCORED',
        totalScore: 70,
        maxScore: 150,
        rank: 2,
        rankedCount: 41,
        adjusted: true,
        questions: [
          { questionId: 'q1', title: 'Two sum', orderIndex: 1, maxPoints: 100, finalScore: 20, verdict: 'ACCEPTED', passedCount: 5, totalCount: 5, countedSubmissionId: 's1', adjusted: true },
          { questionId: 'q2', title: 'Reverse', orderIndex: 2, maxPoints: 50, finalScore: 0, adjusted: false },
        ],
      },
      isLoading: false,
      isError: false,
    } as never);

    renderPage();

    expect(screen.getByText('Rank 2 of 41')).toBeInTheDocument();
    expect(screen.getByText('Two sum')).toBeInTheDocument();
    expect(screen.getByText('Adjusted')).toBeInTheDocument();
    expect(screen.getByText('Not attempted')).toBeInTheDocument();
  });
});
