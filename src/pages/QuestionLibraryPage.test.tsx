import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { MemoryRouter } from 'react-router-dom';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import QuestionLibraryPage from './QuestionLibraryPage';
import * as libraryHooks from '../hooks/useLibrary';
import { TooltipProvider } from '../components/ui';

describe('QuestionLibraryPage - Import Questions Entry Point', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    window.matchMedia ??= ((query: string) => ({ matches: false, media: query })) as never;

    vi.spyOn(libraryHooks, 'useSubjects').mockReturnValue({
      data: [
        { id: 'subj-1', name: 'Data Structures', createdBy: 'admin', createdAt: '2026-10-01' },
      ],
      isLoading: false,
    } as never);

    vi.spyOn(libraryHooks, 'useLibraryQuestions').mockReturnValue({
      data: {
        content: [],
        page: 0,
        size: 10,
        totalElements: 0,
        totalPages: 0,
      },
      isLoading: false,
      isError: false,
    } as never);

    vi.spyOn(libraryHooks, 'useCreateSubject').mockReturnValue({
      mutate: vi.fn(),
      isPending: false,
    } as never);
  });

  const renderPage = () => {
    return render(
      <QueryClientProvider client={new QueryClient()}>
        <MemoryRouter>
          <TooltipProvider>
            <QuestionLibraryPage />
          </TooltipProvider>
        </MemoryRouter>
      </QueryClientProvider>,
    );
  };

  it('Import Questions button is disabled when no subject folder is selected', () => {
    renderPage();

    const importButton = screen.getByRole('button', { name: /Import Questions/i });
    expect(importButton).toBeDisabled();
  });

  it('Import Questions button is enabled when a subject folder is selected and opens the dialog', async () => {
    const user = userEvent.setup();
    renderPage();

    // Select the subject folder
    const folderButton = screen.getByRole('button', { name: 'Data Structures' });
    await user.click(folderButton);

    const importButton = screen.getByRole('button', { name: /Import Questions/i });
    expect(importButton).toBeEnabled();

    await user.click(importButton);

    expect(await screen.findByRole('dialog')).toBeInTheDocument();
    expect(screen.getByText('Import questions into “Data Structures”')).toBeInTheDocument();
  });
});
