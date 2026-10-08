import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { CopyPromptButton } from './CopyPromptButton';
import * as copyUtil from '../../../lib/copyText';
import { toast } from 'sonner';

vi.mock('sonner', () => ({
  toast: {
    success: vi.fn(),
    error: vi.fn(),
  },
}));

describe('CopyPromptButton', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('renders with default label and copies text on click', async () => {
    vi.spyOn(copyUtil, 'copyText').mockResolvedValue(true);
    const getText = vi.fn().mockReturnValue('Sample prompt text');

    render(<CopyPromptButton getText={getText} />);

    const button = screen.getByRole('button', { name: /Copy AI Prompt/i });
    expect(button).toBeInTheDocument();

    fireEvent.click(button);

    await waitFor(() => {
      expect(screen.getByRole('button', { name: /Copied ✓/i })).toBeInTheDocument();
    });

    expect(getText).toHaveBeenCalled();
    expect(copyUtil.copyText).toHaveBeenCalledWith('Sample prompt text');
    expect(toast.success).toHaveBeenCalledWith('Prompt copied');
  });

  it('opens fallback manual-copy dialog if copying fails', async () => {
    vi.spyOn(copyUtil, 'copyText').mockResolvedValue(false);
    const getText = vi.fn().mockReturnValue('Fallback prompt content');

    render(<CopyPromptButton getText={getText} label="Copy Prompt" />);

    const button = screen.getByRole('button', { name: /Copy Prompt/i });
    fireEvent.click(button);

    await waitFor(() => {
      expect(screen.getByText('Copy manually')).toBeInTheDocument();
      expect(screen.getByDisplayValue('Fallback prompt content')).toBeInTheDocument();
    });
  });
});
