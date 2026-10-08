import { describe, it, expect } from 'vitest';
import { render, screen } from '@testing-library/react';
import { ImportPreviewTable } from './ImportPreviewTable';
import type { ImportRowPreview } from './types';

describe('ImportPreviewTable', () => {
  it('renders with mixed fixture and displays OK / Error badges with error messages', () => {
    const fixture: ImportRowPreview[] = [
      {
        rowNumber: 1,
        valid: true,
        title: 'Valid Two Sum',
        difficulty: 'EASY',
        points: 50,
        descriptionPreview: 'Given an array of integers...',
        detail: 'DSA problem',
        errors: [],
      },
      {
        rowNumber: 2,
        valid: false,
        title: null,
        difficulty: null,
        points: null,
        descriptionPreview: 'Invalid row description',
        detail: '',
        errors: ['Title is missing', 'At least one test case or option required'],
      },
    ];

    render(<ImportPreviewTable rows={fixture} />);

    expect(screen.getByText('Valid Two Sum')).toBeInTheDocument();
    expect(screen.getByText('OK')).toBeInTheDocument();
    expect(screen.getByText('Error')).toBeInTheDocument();
    expect(screen.getByText('Title is missing')).toBeInTheDocument();
    expect(screen.getByText('At least one test case or option required')).toBeInTheDocument();
  });
});
