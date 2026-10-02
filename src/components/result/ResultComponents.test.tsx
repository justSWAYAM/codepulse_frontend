import { fireEvent, render, screen, within } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import type React from 'react';
import { TooltipProvider } from '../ui';
import * as resultHooks from '../../hooks/useResults';
import { LeaderboardTable } from './LeaderboardTable';
import { PublishConfirmDialog } from './PublishConfirmDialog';
import { ScoreOverrideForm } from './ScoreOverrideForm';
import type { LeaderboardEntry, LeaderboardResponse, QuestionResultView } from '../../api/resultApi';

// jsdom has no matchMedia; the Dialog asks it whether the pointer is coarse
if (!window.matchMedia) {
  window.matchMedia = ((query: string) => ({
    matches: false,
    media: query,
    onchange: null,
    addListener: () => undefined,
    removeListener: () => undefined,
    addEventListener: () => undefined,
    removeEventListener: () => undefined,
    dispatchEvent: () => false,
  })) as typeof window.matchMedia;
}

const wrap = (ui: React.ReactNode) =>
  render(
    <QueryClientProvider client={new QueryClient()}>
      <MemoryRouter>
        <TooltipProvider>{ui}</TooltipProvider>
      </MemoryRouter>
    </QueryClientProvider>,
  );

const entry = (id: string, name: string, rank: number | undefined, total: number, status: LeaderboardEntry['status'] = 'SCORED'): LeaderboardEntry => ({
  resultId: `r-${id}`,
  rank,
  candidateId: id,
  candidateName: name,
  candidateEmail: `${id}@x.dev`,
  status,
  reviewReasons: [],
  totalScore: total,
  autoScore: total,
  maxScore: 100,
  adjusted: false,
  timeTakenSeconds: 600,
  questionScores: [],
});

describe('LeaderboardTable', () => {
  const entries = [entry('a', 'Asha', 1, 90), entry('b', 'Ravi', 2, 80), entry('c', 'Kiran', 2, 80), entry('d', 'Chitra', undefined, 0, 'ABSENT')];

  const ranksInOrder = () =>
    screen
      .getAllByRole('row')
      .slice(1)
      .map((row) => within(row).getAllByRole('cell')[0].textContent);

  it('shows server ranks: shared on ties, dash for absentees', () => {
    wrap(<LeaderboardTable questions={[]} entries={entries} onOpen={vi.fn()} />);
    expect(ranksInOrder()).toEqual(['1', '2', '2', '–']);
    expect(screen.getByText('Absent')).toBeInTheDocument();
  });

  it('sorting another column reorders rows without renumbering them', () => {
    wrap(<LeaderboardTable questions={[]} entries={entries} onOpen={vi.fn()} />);
    fireEvent.click(screen.getByRole('button', { name: /total/i }));
    fireEvent.click(screen.getByRole('button', { name: /total/i }));
    // whichever direction, every rank still belongs to its candidate
    const rows = screen.getAllByRole('row').slice(1);
    const asha = rows.find((r) => within(r).queryByText('Asha'))!;
    expect(within(asha).getAllByRole('cell')[0].textContent).toBe('1');
  });

  it('opens a candidate on click and on Enter', () => {
    const onOpen = vi.fn();
    wrap(<LeaderboardTable questions={[]} entries={entries} onOpen={onOpen} />);
    fireEvent.click(screen.getByRole('row', { name: /Ravi/ }));
    fireEvent.keyDown(screen.getByRole('row', { name: /Asha/ }), { key: 'Enter' });
    expect(onOpen).toHaveBeenNthCalledWith(1, 'b');
    expect(onOpen).toHaveBeenNthCalledWith(2, 'a');
  });
});

describe('PublishConfirmDialog', () => {
  const mutate = vi.fn();
  beforeEach(() => {
    mutate.mockReset();
    vi.spyOn(resultHooks, 'usePublishResults').mockReturnValue({ mutate, reset: vi.fn(), isPending: false, isError: false } as never);
  });

  const board = (needsReview: number) =>
    ({
      contestId: 'c1',
      contestTitle: 'Mock Test',
      readiness: { scored: 3, needsReview, absent: 0 },
    }) as unknown as LeaderboardResponse;

  it('publishes straight away when nothing is flagged', () => {
    wrap(<PublishConfirmDialog open onOpenChange={vi.fn()} leaderboard={board(0)} />);
    fireEvent.click(screen.getByRole('button', { name: /publish results/i }));
    expect(mutate).toHaveBeenCalledWith(false, expect.anything());
  });

  it('needs the acknowledgement before publishing flagged results', () => {
    wrap(<PublishConfirmDialog open onOpenChange={vi.fn()} leaderboard={board(2)} />);
    const publish = screen.getByRole('button', { name: /publish results/i });
    expect(publish).toBeDisabled();

    fireEvent.click(screen.getByRole('checkbox', { name: /reviewed the 2 flagged/i }));
    expect(publish).toBeEnabled();
    fireEvent.click(publish);
    expect(mutate).toHaveBeenCalledWith(true, expect.anything());
  });
});

describe('ScoreOverrideForm', () => {
  const mutate = vi.fn();
  beforeEach(() => {
    mutate.mockReset();
    vi.spyOn(resultHooks, 'useManualEvaluation').mockReturnValue({ mutate, reset: vi.fn(), isPending: false, isError: false } as never);
  });

  const question = (over: Partial<QuestionResultView> = {}): QuestionResultView => ({
    questionId: 'q1',
    title: 'Two sum',
    orderIndex: 1,
    maxPoints: 50,
    autoScore: 50,
    finalScore: 50,
    countedSubmission: { id: 'sub-1', language: 'PYTHON', status: 'ACCEPTED', submittedAt: '2026-10-03T10:00:00Z' },
    submitAttempts: 1,
    systemErrorCount: 0,
    overrideOutdated: false,
    history: [],
    ...over,
  });

  it('rejects a score above the question points and a missing comment', async () => {
    wrap(<ScoreOverrideForm contestId="c1" candidateId="u1" question={question()} />);
    fireEvent.change(screen.getByLabelText(/final score/i), { target: { value: '60' } });
    fireEvent.click(screen.getByRole('button', { name: /save adjusted score/i }));

    expect(await screen.findByText(/can’t be more than 50/)).toBeInTheDocument();
    expect(screen.getByText(/say why you’re adjusting/i)).toBeInTheDocument();
    expect(mutate).not.toHaveBeenCalled();
  });

  it('sends the counted submission with the adjusted score', async () => {
    wrap(<ScoreOverrideForm contestId="c1" candidateId="u1" question={question()} />);
    fireEvent.change(screen.getByLabelText(/final score/i), { target: { value: '12.5' } });
    fireEvent.change(screen.getByLabelText(/comment/i), { target: { value: 'hard-coded output' } });
    fireEvent.click(screen.getByRole('button', { name: /save adjusted score/i }));

    await vi.waitFor(() =>
      expect(mutate).toHaveBeenCalledWith({ submissionId: 'sub-1', adjustedScore: 12.5, comments: 'hard-coded output' }, expect.anything()),
    );
  });

  it('is locked while results are published', () => {
    wrap(<ScoreOverrideForm contestId="c1" candidateId="u1" question={question()} disabled disabledReason="Results are published." />);
    expect(screen.getByLabelText(/final score/i)).toBeDisabled();
    expect(screen.getByRole('button', { name: /save adjusted score/i })).toBeDisabled();
    expect(screen.getByText('Results are published.')).toBeInTheDocument();
  });
});
