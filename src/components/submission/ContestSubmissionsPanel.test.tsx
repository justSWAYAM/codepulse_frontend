
import { fireEvent, render, screen, waitFor } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { beforeEach, describe, expect, it, vi } from 'vitest';

const api = vi.hoisted(() => ({ contestSubmissions: vi.fn(), getForEvaluator: vi.fn(), rejudge: vi.fn() }));
vi.mock('../../api/submissionApi', () => ({ submissionApi: api }));
vi.mock('../../api/questionApi', () => ({
  questionApi: {
    getQuestions: vi.fn().mockResolvedValue([
      { id: 'q2', title: 'Second', orderIndex: 1, points: 50 },
      { id: 'q1', title: 'First', orderIndex: 0, points: 100 },
    ]),
  },
}));

import { ContestSubmissionsPanel } from './ContestSubmissionsPanel';

const row = {
  id: 's1',
  questionId: 'q1',
  candidateId: 'u1',
  candidateName: 'Asha Rao',
  candidateEmail: 'asha@example.com',
  candidateRollNumber: 'CS-01',
  type: 'SUBMIT',
  language: 'PYTHON',
  status: 'ACCEPTED',
  score: 100,
  passedCount: 5,
  totalCount: 5,
  submittedAt: '2026-10-01T10:00:00Z',
};

const renderPanel = () =>
  render(
    <QueryClientProvider client={new QueryClient({ defaultOptions: { queries: { retry: false } } })}>
      <MemoryRouter>
        <ContestSubmissionsPanel
          contestId="c1"
          candidates={[{ id: 'u1', fullName: 'Asha Rao', email: 'asha@example.com', role: 'CANDIDATE', active: true, createdAt: '' }]}
          canRejudge
        />
      </MemoryRouter>
    </QueryClientProvider>,
  );

describe('ContestSubmissionsPanel', () => {
  beforeEach(() => {
    Object.values(api).forEach((f) => f.mockReset());
    api.contestSubmissions.mockResolvedValue({ content: [row], page: 0, size: 20, totalElements: 1, totalPages: 1 });
  });

  it('lists submissions with candidate, question number and verdict', async () => {
    renderPanel();
    expect(await screen.findByText('Asha Rao', { selector: 'div' })).toBeInTheDocument();
    expect(await screen.findByText('Q1. First', { selector: 'td div' })).toBeInTheDocument();
    expect(screen.getByText('Accepted', { selector: 'td span' })).toBeInTheDocument();
    expect(screen.getByText('1–1 of 1')).toBeInTheDocument();
  });

  it('sends filters to the API and resets to the first page', async () => {
    renderPanel();
    await screen.findByText('Q1. First', { selector: 'td div' });
    fireEvent.change(screen.getByLabelText('Filter by verdict'), { target: { value: 'WRONG_ANSWER' } });
    fireEvent.change(screen.getByLabelText('Filter by type'), { target: { value: 'SUBMIT' } });
    await waitFor(() =>
      expect(api.contestSubmissions).toHaveBeenLastCalledWith('c1', expect.objectContaining({ status: 'WRONG_ANSWER', type: 'SUBMIT', page: 0 })),
    );
  });

  it('opens the detail sheet on row click', async () => {
    api.getForEvaluator.mockResolvedValue({
      ...row,
      sessionId: 'x',
      sourceCode: 'print(1)',
      compileOutput: null,
      evaluatedAt: null,
      testCaseResults: [],
    });
    renderPanel();
    fireEvent.click(await screen.findByRole('row', { name: /open submission by asha rao/i }));
    expect(await screen.findByRole('dialog')).toBeInTheDocument();
    expect(await screen.findByText('print(1)')).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /rejudge/i })).toBeInTheDocument();
  });
});
