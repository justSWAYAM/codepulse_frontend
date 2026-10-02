import { fireEvent, render, screen, within } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { describe, expect, it, vi } from 'vitest';
import type React from 'react';
import { TooltipProvider } from '../ui';
import { ChartCard } from './ChartCard';
import { DifficultyCheck } from './DifficultyCheck';
import { TestCasePassRateList } from './TestCasePassRateList';
import AnalyticsPanel from './AnalyticsPanel';
import * as hooks from '../../hooks/useAnalytics';
import * as auth from '../../context/AuthContext';
import type { QuestionStats, TestCaseStats } from '../../api/analyticsApi';

// jsdom has neither; Recharts and the Dialog ask for them
globalThis.ResizeObserver ??= class {
  observe() {}
  unobserve() {}
  disconnect() {}
} as unknown as typeof ResizeObserver;

const wrap = (ui: React.ReactNode) =>
  render(
    <QueryClientProvider client={new QueryClient()}>
      <MemoryRouter>
        <TooltipProvider>{ui}</TooltipProvider>
      </MemoryRouter>
    </QueryClientProvider>,
  );

describe('ChartCard', () => {
  const table = { columns: ['Band', 'Candidates'], rows: [['0–10 %', 2], ['10–20 %', 5]] };

  it('labels the chart and always carries a hidden data table', () => {
    wrap(
      <ChartCard title="Score distribution" summary="Most candidates scored 10–20 %." table={table}>
        <svg />
      </ChartCard>,
    );
    expect(screen.getByRole('img', { name: 'Most candidates scored 10–20 %.' })).toBeInTheDocument();
    expect(screen.getByRole('table')).toHaveClass('sr-only');
  });

  it('"Show as table" swaps the chart for a visible table', () => {
    wrap(
      <ChartCard title="Score distribution" summary="s" table={table}>
        <svg />
      </ChartCard>,
    );
    fireEvent.click(screen.getByRole('button', { name: /show as table/i }));
    expect(screen.queryByRole('img')).not.toBeInTheDocument();
    const t = screen.getByRole('table');
    expect(t).not.toHaveClass('sr-only');
    expect(within(t).getByText('10–20 %')).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /show as chart/i })).toHaveAttribute('aria-pressed', 'true');
  });
});

describe('DifficultyCheck', () => {
  const q = (over: Partial<QuestionStats>) =>
    ({ difficulty: 'EASY', difficultyMatches: false, averageRatio: 0.5, ...over }) as QuestionStats;

  it('says "Not enough data" without an observed difficulty', () => {
    wrap(<DifficultyCheck question={q({ observedDifficulty: undefined })} />);
    expect(screen.getByText('Not enough data')).toBeInTheDocument();
  });

  it('confirms a match', () => {
    wrap(<DifficultyCheck question={q({ observedDifficulty: 'EASY', difficultyMatches: true })} />);
    expect(screen.getByText('as expected')).toBeInTheDocument();
  });

  it('shows how a mislabelled question actually played', () => {
    wrap(<DifficultyCheck question={q({ observedDifficulty: 'MEDIUM' })} />);
    expect(screen.getByText('Played as medium')).toBeInTheDocument();
    expect(screen.getByText('Easy')).toBeInTheDocument();
    expect(screen.getByText('Medium')).toBeInTheDocument();
  });
});

describe('TestCasePassRateList', () => {
  const tc = (over: Partial<TestCaseStats>): TestCaseStats => ({
    testCaseId: Math.random().toString(),
    orderIndex: 1,
    sample: false,
    weight: 10,
    evaluated: 5,
    passed: 5,
    passRate: 1,
    wrongAnswer: 0,
    timeLimit: 0,
    memoryLimit: 0,
    runtimeError: 0,
    compilationError: 0,
    suspicious: false,
    ...over,
  });

  it('flags the suspicious case with what to do, and links admins to the test cases', () => {
    wrap(
      <TestCasePassRateList
        testCases={[tc({ sample: true }), tc({ passed: 0, passRate: 0, wrongAnswer: 5, suspicious: true })]}
        editLink="/dashboard/contests/c1/questions/q1/edit?tab=testcases"
      />,
    );
    expect(screen.getByText(/Nobody passed this test/)).toBeInTheDocument();
    expect(screen.getByText('5 WA')).toBeInTheDocument();
    expect(screen.getByRole('link', { name: /open test cases/i })).toHaveAttribute(
      'href',
      '/dashboard/contests/c1/questions/q1/edit?tab=testcases',
    );
  });

  it('has no edit link for evaluators and an empty state before any scoring', () => {
    const { unmount } = wrap(<TestCasePassRateList testCases={[tc({ passed: 0, passRate: 0, suspicious: true })]} />);
    expect(screen.queryByRole('link')).not.toBeInTheDocument();
    unmount();
    wrap(<TestCasePassRateList testCases={[tc({ evaluated: 0, passed: 0, passRate: 0 })]} />);
    expect(screen.getByText('No scored submissions yet.')).toBeInTheDocument();
  });
});

describe('AnalyticsPanel', () => {
  it('shows the provisional banner and the empty state before anyone finishes', () => {
    const coverage = { totalCandidates: 4, withResult: 0, inProgress: 4, judging: 0, absent: 0, contestCompleted: false, provisional: true };
    vi.spyOn(hooks, 'useContestAnalytics').mockReturnValue({
      data: { coverage, scores: { maxScore: 100, participants: 0 }, scoreDistribution: [], timeDistribution: [], attention: {} },
      isLoading: false,
      isError: false,
    } as never);
    vi.spyOn(hooks, 'useQuestionAnalytics').mockReturnValue({ data: { coverage, questions: [] }, isLoading: false, isError: false } as never);
    vi.spyOn(auth, 'useAuth').mockReturnValue({ user: { role: 'EVALUATOR' } } as never);

    wrap(<AnalyticsPanel contest={{ id: 'c1' } as never} />);

    expect(screen.getByRole('status')).toHaveTextContent('0 of 4 candidates have a result. 4 still writing');
    expect(screen.getByText('Analytics appear here as candidates finish.')).toBeInTheDocument();
  });
});
