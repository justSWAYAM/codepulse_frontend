import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { QueryClient, QueryClientProvider, MutationCache } from '@tanstack/react-query';
import { QuestionImportDialog } from './QuestionImportDialog';
import { importApi } from './importApi';
import * as copyUtil from '../../../lib/copyText';
import { toast } from 'sonner';
import type { QuestionImportResponse, ImportTemplate } from './types';

vi.mock('sonner', () => ({
  toast: {
    success: vi.fn(),
    error: vi.fn(),
  },
}));

function createTestQueryClient() {
  return new QueryClient({
    mutationCache: new MutationCache({
      onError: (_error, _variables, _context, mutation) => {
        if ((mutation.meta as { silent?: boolean } | undefined)?.silent) return;
        toast.error('Global error');
      },
    }),
    defaultOptions: {
      queries: { retry: false, gcTime: 0 },
      mutations: { retry: false },
    },
  });
}

const mockTemplate: ImportTemplate = {
  type: 'MCQ',
  prompt: 'Generate 5 MCQ questions in JSON format:\n[{"title":"...","options":[]}]',
  maxQuestions: 50,
  maxPayloadBytes: 5000,
};

const mockPreviewResponse: QuestionImportResponse = {
  dryRun: true,
  result: {
    totalRows: 2,
    succeededCount: 1,
    failedCount: 1,
    errors: [{ rowNumber: 2, reason: 'Missing correct answer' }],
  },
  rows: [
    {
      rowNumber: 1,
      valid: true,
      title: 'Valid Question 1',
      difficulty: 'EASY',
      points: 10,
      descriptionPreview: 'Desc 1',
      detail: '4 options · correct: 1',
      errors: [],
    },
    {
      rowNumber: 2,
      valid: false,
      title: 'Invalid Question 2',
      difficulty: null,
      points: null,
      descriptionPreview: 'Desc 2',
      detail: '2 options',
      errors: ['Missing correct answer'],
    },
  ],
};

const mockConfirmResponse: QuestionImportResponse = {
  dryRun: false,
  result: {
    totalRows: 2,
    succeededCount: 1,
    failedCount: 1,
    errors: [{ rowNumber: 2, reason: 'Missing correct answer' }],
  },
  rows: mockPreviewResponse.rows,
};

describe('QuestionImportDialog', () => {
  let queryClient: QueryClient;
  const onOpenChange = vi.fn();

  beforeEach(() => {
    vi.clearAllMocks();
    window.matchMedia ??= ((query: string) => ({ matches: false, media: query })) as never;
    queryClient = createTestQueryClient();
    vi.spyOn(importApi, 'getTemplate').mockResolvedValue(mockTemplate);
    vi.spyOn(importApi, 'importQuestions').mockResolvedValue(mockPreviewResponse);
  });

  const renderDialog = (open = true) => {
    return render(
      <QueryClientProvider client={queryClient}>
        <QuestionImportDialog
          open={open}
          onOpenChange={onOpenChange}
          subjectId="subject-123"
          subjectName="Computer Science"
        />
      </QueryClientProvider>,
    );
  };

  it('1. Step navigation: Next disabled until type is chosen; Back returns without losing chosen type', async () => {
    const user = userEvent.setup();
    renderDialog();

    expect(screen.getByText('Step 1 of 3')).toBeInTheDocument();
    const nextButton = screen.getByRole('button', { name: 'Next' });
    expect(nextButton).toBeDisabled();

    // Select MCQ
    const mcqCard = screen.getByText('MCQ');
    await user.click(mcqCard);

    expect(nextButton).toBeEnabled();
    await user.click(nextButton);

    // Now in Step 2
    expect(await screen.findByText('Step 2 of 3')).toBeInTheDocument();

    // Click Back
    const backButton = screen.getByRole('button', { name: 'Back' });
    await user.click(backButton);

    // Back in Step 1, Next still enabled
    expect(screen.getByText('Step 1 of 3')).toBeInTheDocument();
    expect(screen.getByRole('button', { name: 'Next' })).toBeEnabled();
  });

  it('2. Step 2 shows prompt returned by template endpoint; Copy button copies exactly that text', async () => {
    const user = userEvent.setup();
    vi.spyOn(copyUtil, 'copyText').mockResolvedValue(true);
    renderDialog();

    await user.click(screen.getByText('MCQ'));
    await user.click(screen.getByRole('button', { name: 'Next' }));

    const textarea = await screen.findByRole('textbox');
    expect(textarea).toHaveValue(mockTemplate.prompt);

    const copyButton = screen.getByRole('button', { name: /Copy AI Prompt/i });
    await user.click(copyButton);

    expect(copyUtil.copyText).toHaveBeenCalledWith(mockTemplate.prompt);
    expect(toast.success).toHaveBeenCalledWith('Prompt copied');
  });

  it('3. Paste -> Preview calls endpoint with dryRun=true and right body; table shows valid and invalid rows', async () => {
    const user = userEvent.setup();
    renderDialog();

    await user.click(screen.getByText('MCQ'));
    await user.click(screen.getByRole('button', { name: 'Next' }));
    await user.click(await screen.findByRole('button', { name: 'Next' }));

    expect(screen.getByText('Step 3 of 3')).toBeInTheDocument();

    const textarea = screen.getByPlaceholderText('Paste the exact JSON response here...');
    fireEvent.change(textarea, { target: { value: '[{"title":"Test"}]' } });

    const previewButton = screen.getByRole('button', { name: 'Preview' });
    expect(previewButton).toBeEnabled();

    await user.click(previewButton);

    await waitFor(() => {
      expect(importApi.importQuestions).toHaveBeenCalledWith(
        { subjectId: 'subject-123', type: 'MCQ', payload: '[{"title":"Test"}]' },
        true,
      );
    });

    expect(await screen.findByText('Valid Question 1')).toBeInTheDocument();
    expect(screen.getByText('Invalid Question 2')).toBeInTheDocument();
    expect(screen.getByText('Missing correct answer')).toBeInTheDocument();
    expect(screen.getByText('1 valid')).toBeInTheDocument();
    expect(screen.getByText('1 with errors')).toBeInTheDocument();
  });

  it('4. Editing the textarea after preview hides table and disables Import', async () => {
    const user = userEvent.setup();
    renderDialog();

    await user.click(screen.getByText('MCQ'));
    await user.click(screen.getByRole('button', { name: 'Next' }));
    await user.click(await screen.findByRole('button', { name: 'Next' }));

    const textarea = screen.getByPlaceholderText('Paste the exact JSON response here...');
    fireEvent.change(textarea, { target: { value: '[{"title":"Test"}]' } });
    await user.click(screen.getByRole('button', { name: 'Preview' }));

    expect(await screen.findByText('Valid Question 1')).toBeInTheDocument();
    const importButton = screen.getByRole('button', { name: /Import 1 question/i });
    expect(importButton).toBeEnabled();

    // Edit textarea
    fireEvent.change(textarea, { target: { value: '[{"title":"Edited"}]' } });

    expect(screen.getByText('Text changed — preview again to update.')).toBeInTheDocument();
    expect(screen.queryByText('Valid Question 1')).not.toBeInTheDocument();
    expect(importButton).toBeDisabled();
  });

  it('5. Import calls dryRun=false, shows report, invalidates library queries, and Done closes dialog', async () => {
    const user = userEvent.setup();
    vi.spyOn(importApi, 'importQuestions')
      .mockResolvedValueOnce(mockPreviewResponse)
      .mockResolvedValueOnce(mockConfirmResponse);

    const invalidateSpy = vi.spyOn(queryClient, 'invalidateQueries');

    renderDialog();

    await user.click(screen.getByText('MCQ'));
    await user.click(screen.getByRole('button', { name: 'Next' }));
    await user.click(await screen.findByRole('button', { name: 'Next' }));

    const textarea = screen.getByPlaceholderText('Paste the exact JSON response here...');
    fireEvent.change(textarea, { target: { value: '[{"title":"Test"}]' } });
    await user.click(screen.getByRole('button', { name: 'Preview' }));

    const importButton = await screen.findByRole('button', { name: /Import 1 question/i });
    await user.click(importButton);

    await waitFor(() => {
      expect(importApi.importQuestions).toHaveBeenCalledWith(
        { subjectId: 'subject-123', type: 'MCQ', payload: '[{"title":"Test"}]' },
        false,
      );
    });

    expect(await screen.findByText('Import complete')).toBeInTheDocument();
    expect(screen.getByText('Failed Rows:')).toBeInTheDocument();
    expect(screen.getByText('Missing correct answer')).toBeInTheDocument();
    expect(invalidateSpy).toHaveBeenCalledWith({ queryKey: ['library'] });

    const doneButton = screen.getByRole('button', { name: 'Done' });
    await user.click(doneButton);

    expect(onOpenChange).toHaveBeenCalledWith(false);
  });

  it('6. Payload over the limit disables Preview and shows size warning', async () => {
    const user = userEvent.setup();
    vi.spyOn(importApi, 'getTemplate').mockResolvedValue({
      ...mockTemplate,
      maxPayloadBytes: 20, // very small limit for testing
    });

    renderDialog();

    await user.click(screen.getByText('MCQ'));
    await user.click(screen.getByRole('button', { name: 'Next' }));
    await user.click(await screen.findByRole('button', { name: 'Next' }));

    const textarea = screen.getByPlaceholderText('Paste the exact JSON response here...');
    fireEvent.change(textarea, {
      target: { value: 'This text is longer than twenty bytes limit' },
    });

    expect(screen.getByText(/Payload exceeds the maximum allowed size/i)).toBeInTheDocument();
    expect(screen.getByRole('button', { name: 'Preview' })).toBeDisabled();
  });

  it('7. Backend errors show the mapped inline message and no global toast', async () => {
    const user = userEvent.setup();
    const errorResponse = {
      response: {
        data: {
          code: 'IMPORT_PAYLOAD_INVALID',
          message: 'Malformed JSON provided',
        },
      },
    };
    vi.spyOn(importApi, 'importQuestions').mockRejectedValue(errorResponse);

    renderDialog();

    await user.click(screen.getByText('MCQ'));
    await user.click(screen.getByRole('button', { name: 'Next' }));
    await user.click(await screen.findByRole('button', { name: 'Next' }));

    const textarea = screen.getByPlaceholderText('Paste the exact JSON response here...');
    fireEvent.change(textarea, { target: { value: 'bad json' } });
    await user.click(screen.getByRole('button', { name: 'Preview' }));

    await waitFor(() => {
      expect(screen.getByRole('alert')).toHaveTextContent('Malformed JSON provided');
    });

    expect(toast.error).not.toHaveBeenCalled();
  });

  it('8. Closing and reopening dialog starts clean at step 1', async () => {
    const user = userEvent.setup();
    const { rerender } = renderDialog(true);

    await user.click(screen.getByText('MCQ'));
    await user.click(screen.getByRole('button', { name: 'Next' }));
    expect(await screen.findByText('Step 2 of 3')).toBeInTheDocument();

    // Trigger close
    rerender(
      <QueryClientProvider client={queryClient}>
        <QuestionImportDialog
          open={false}
          onOpenChange={onOpenChange}
          subjectId="subject-123"
          subjectName="Computer Science"
        />
      </QueryClientProvider>,
    );

    // Reopen
    rerender(
      <QueryClientProvider client={queryClient}>
        <QuestionImportDialog
          open={true}
          onOpenChange={onOpenChange}
          subjectId="subject-123"
          subjectName="Computer Science"
        />
      </QueryClientProvider>,
    );

    expect(screen.getByText('Step 1 of 3')).toBeInTheDocument();
    expect(screen.getByRole('button', { name: 'Next' })).toBeDisabled();
  });

  it('9. All-invalid preview: Import stays disabled and warning alert shows', async () => {
    const user = userEvent.setup();
    const allInvalidPreview: QuestionImportResponse = {
      dryRun: true,
      result: {
        totalRows: 1,
        succeededCount: 0,
        failedCount: 1,
        errors: [{ rowNumber: 1, reason: 'Invalid format' }],
      },
      rows: [
        {
          rowNumber: 1,
          valid: false,
          title: null,
          difficulty: null,
          points: null,
          descriptionPreview: '',
          detail: '',
          errors: ['Invalid format'],
        },
      ],
    };

    vi.spyOn(importApi, 'importQuestions').mockResolvedValue(allInvalidPreview);

    renderDialog();

    await user.click(screen.getByText('MCQ'));
    await user.click(screen.getByRole('button', { name: 'Next' }));
    await user.click(await screen.findByRole('button', { name: 'Next' }));

    const textarea = screen.getByPlaceholderText('Paste the exact JSON response here...');
    fireEvent.change(textarea, { target: { value: '[{}]' } });
    await user.click(screen.getByRole('button', { name: 'Preview' }));

    await waitFor(() => {
      expect(
        screen.getByText(
          'Nothing can be imported — fix the AI output or ask it to correct these rows.',
        ),
      ).toBeInTheDocument();
    });

    const importButton = screen.getByRole('button', { name: /Import 0 questions/i });
    expect(importButton).toBeDisabled();
  });
});
