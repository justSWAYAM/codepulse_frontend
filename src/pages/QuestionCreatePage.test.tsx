import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { MemoryRouter, Route, Routes } from 'react-router-dom';
import { beforeEach, describe, expect, it, vi } from 'vitest';

import { QuestionCreatePage } from './QuestionCreatePage';
import * as questionHooks from '../hooks/useQuestions';
import * as contestHooks from '../hooks/useContests';

vi.mock('../components/testcase/TestCaseForm', () => ({
  TestCaseForm: ({ onSubmit }: { onSubmit: (data: any) => void }) => (
    <button
      type="button"
      onClick={() =>
        onSubmit({
          input: '1 2\n3 4',
          expectedOutput: '5',
          isSample: false,
          weight: 50,
        })
      }
    >
      Save Test Case
    </button>
  ),
}));

const mutateMock = vi.fn();

vi.spyOn(questionHooks, 'useCreateQuestion').mockImplementation(() => ({
  mutate: mutateMock,
  isPending: false,
} as any));

// The page loads its contest to decide whether questions are still editable
let contestStatus = 'DRAFT';
vi.spyOn(contestHooks, 'useContest').mockImplementation(() => ({
  data: { id: 'contest-1', status: contestStatus },
} as any));

const renderPage = () =>
  render(
    <MemoryRouter initialEntries={['/dashboard/contests/contest-1/questions/new']}>
      <Routes>
        <Route path="/dashboard/contests/:contestId/questions/new" element={<QuestionCreatePage />} />
      </Routes>
    </MemoryRouter>
  );

describe('QuestionCreatePage', () => {
  beforeEach(() => {
    mutateMock.mockReset();
    contestStatus = 'DRAFT';
  });

  it('includes drafted test cases in the create payload and keeps the test-case UI visible', async () => {
    renderPage();

    fireEvent.change(screen.getByPlaceholderText(/e.g., Two Sum/i), {
      target: { value: 'Two Sum' },
    });
    fireEvent.change(screen.getByPlaceholderText(/Write question description in Markdown format/i), {
      target: { value: '# Problem\nSolve it' },
    });
    fireEvent.change(screen.getAllByRole('spinbutton')[0], { target: { value: '200' } });
    fireEvent.change(screen.getAllByRole('spinbutton')[1], { target: { value: '1000' } });
    fireEvent.change(screen.getAllByRole('spinbutton')[2], { target: { value: '512000' } });

    fireEvent.click(screen.getByRole('button', { name: /add test case/i }));
    fireEvent.click(screen.getByRole('button', { name: /^save test case$/i }));
    fireEvent.click(screen.getByRole('button', { name: /^save question$/i }));

    await waitFor(() => {
      expect(mutateMock).toHaveBeenCalledWith(
        expect.objectContaining({
          title: 'Two Sum',
          description: '# Problem\nSolve it',
          testCases: [
            expect.objectContaining({
              input: '1 2\n3 4',
              expectedOutput: '5',
              weight: 50,
            }),
          ],
        }),
        expect.objectContaining({ onSuccess: expect.any(Function) })
      );
    });
  });

  it('shows a locked notice instead of the form once the contest is live', () => {
    contestStatus = 'ONGOING';
    renderPage();

    expect(screen.getByText('Questions are locked')).toBeInTheDocument();
    expect(screen.getByRole('link', { name: /back to questions/i })).toHaveAttribute(
      'href',
      '/dashboard/contests/contest-1?tab=questions'
    );
    expect(screen.queryByRole('button', { name: /^save question$/i })).not.toBeInTheDocument();
  });
});
