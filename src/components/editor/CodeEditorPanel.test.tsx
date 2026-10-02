
import { fireEvent, render, screen, waitFor } from '@testing-library/react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { TooltipProvider } from '../ui';

// Monaco can't run in jsdom — a textarea stands in for it
vi.mock('./MonacoEditor', () => ({
  default: ({ value, onChange, ariaLabel }: { value: string; onChange: (v: string) => void; ariaLabel?: string }) => (
    <textarea aria-label={ariaLabel} value={value} onChange={(e) => onChange(e.target.value)} />
  ),
}));

const api = vi.hoisted(() => ({
  run: vi.fn(),
  submit: vi.fn(),
  getForCandidate: vi.fn(),
  myHistory: vi.fn(),
}));
vi.mock('../../api/submissionApi', () => ({ submissionApi: api }));

import { CodeEditorPanel } from './CodeEditorPanel';

const question = {
  id: 'q1',
  contestId: 'c1',
  title: 'Sum',
  description: '',
  difficulty: 'EASY',
  points: 100,
  timeLimitMs: 1000,
  memoryLimitKb: 262144,
  orderIndex: 0,
  sampleTestCases: [{ id: 't1', input: '1 2', orderIndex: 0 }],
} as const;

const renderPanel = () =>
  render(
    <QueryClientProvider client={new QueryClient({ defaultOptions: { queries: { retry: false } } })}>
      <TooltipProvider>
        <CodeEditorPanel contestId="c1" question={question as never} allowedLanguages={['PYTHON', 'JAVA']} />
      </TooltipProvider>
    </QueryClientProvider>,
  );

describe('CodeEditorPanel', () => {
  beforeEach(() => {
    localStorage.clear();
    Object.values(api).forEach((f) => f.mockReset());
    api.myHistory.mockResolvedValue({ content: [], page: 0, size: 50, totalElements: 0, totalPages: 0 });
  });

  it('only offers the contest’s allowed languages, defaulting to the first', async () => {
    renderPanel();
    const select = screen.getByLabelText('Language') as HTMLSelectElement;
    expect([...select.options].map((o) => o.value)).toEqual(['PYTHON', 'JAVA']);
    expect(select.value).toBe('PYTHON');
    expect(((await screen.findByLabelText(/code editor, python 3/i)) as HTMLTextAreaElement).value).toContain('def main');
  });

  it('runs sample tests and shows each sample’s verdict and output', async () => {
    // Run answers with the candidate view itself, sample outputs included
    api.run.mockResolvedValue({
      id: 'r1',
      questionId: 'q1',
      type: 'RUN',
      language: 'PYTHON',
      status: 'WRONG_ANSWER',
      sampleResults: [{ testCaseId: 't1', input: '1 2', actualOutput: '4', stderr: null, status: 'WRONG_ANSWER', timeMs: 12, memoryKb: 900 }],
      hiddenSummary: { passed: 0, total: 0 },
    });

    renderPanel();
    const editor = await screen.findByLabelText(/code editor, python 3/i);
    fireEvent.change(editor, { target: { value: 'print(4)' } });
    fireEvent.click(screen.getByRole('button', { name: /^run$/i }));

    expect(await screen.findAllByText('Wrong answer')).not.toHaveLength(0);
    expect(api.run).toHaveBeenCalledWith({ questionId: 'q1', language: 'PYTHON', sourceCode: 'print(4)' });
    expect(api.getForCandidate).not.toHaveBeenCalled();
    expect(screen.getByText('4')).toBeInTheDocument();
    expect(screen.getByText('0 / 1')).toBeInTheDocument();
  });

  it('shows the backend reason inline when submitting is refused', async () => {
    api.submit.mockRejectedValue({ response: { status: 422, data: { message: 'INVALID_STATE: SUBMISSION_LIMIT_REACHED' } } });
    renderPanel();
    await screen.findByLabelText(/code editor, python 3/i);
    fireEvent.click(screen.getByRole('button', { name: /^submit$/i }));
    expect(await screen.findByRole('alert')).toHaveTextContent(/reached the limit/i);
  });

  it('keeps a draft per language across remounts', async () => {
    const { unmount } = renderPanel();
    const editor = await screen.findByLabelText(/code editor, python 3/i);
    fireEvent.change(editor, { target: { value: 'print("draft")' } });
    await waitFor(() => expect(localStorage.getItem('cp:draft:anonymous:c1:q1:PYTHON')).toBe('print("draft")'), { timeout: 2000 });
    unmount();
    renderPanel();
    expect(await screen.findByLabelText(/code editor, python 3/i)).toHaveValue('print("draft")');
  });
});
