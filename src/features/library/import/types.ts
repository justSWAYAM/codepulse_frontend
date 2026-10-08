import type { LibraryQuestionType } from '../../../api/libraryApi';

export type QuestionType = LibraryQuestionType;

export interface ImportTemplate {
  type: QuestionType;
  prompt: string;
  maxQuestions: number;
  maxPayloadBytes: number;
}

export interface ImportRowPreview {
  rowNumber: number;
  valid: boolean;
  title: string | null;
  difficulty: string | null;
  points: number | null;
  descriptionPreview: string;
  detail: string; // e.g. "4 options · correct: 2,3"
  errors: string[];
}

export interface BulkImportResult {
  totalRows: number;
  succeededCount: number;
  failedCount: number;
  errors: Array<{
    rowNumber: number;
    reason: string;
  }>;
}

export interface QuestionImportResponse {
  dryRun: boolean;
  result: BulkImportResult;
  rows: ImportRowPreview[];
}

export interface ImportQuestionsBody {
  subjectId: string;
  type: QuestionType;
  payload: string;
}

export const IMPORT_TYPES: { value: QuestionType; label: string; hint: string }[] = [
  { value: 'MCQ', label: 'MCQ', hint: 'Questions with options and correct answer(s)' },
  { value: 'DSA', label: 'DSA', hint: 'Coding problems (test cases added later)' },
  { value: 'SQL', label: 'SQL', hint: 'Schema + question (test cases added later)' },
  { value: 'THEORY', label: 'Theory', hint: 'Written-answer questions' },
];
