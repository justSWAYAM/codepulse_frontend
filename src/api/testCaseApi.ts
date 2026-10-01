import apiClient from '../lib/apiClient';
import type { ApiWrapper } from './auth';

// ── Types ──

export interface TestCaseAdminRecord {
  id: string;
  input: string;
  expectedOutput: string;
  isSample: boolean;
  weight: number;
  orderIndex: number;
}

// Candidate view — no expectedOutput, no weight (Section 4.2)
export interface TestCaseSampleRecord {
  id: string;
  input: string;
  orderIndex: number;
}

export interface CreateTestCasePayload {
  input: string;
  expectedOutput: string;
  isSample: boolean;
  weight: number;
}

// Mirrors backend common/dto/RowError
export interface RowError {
  rowNumber: number;
  reason: string;
}

export interface TestCaseBulkUploadResult {
  totalRows: number;
  succeededCount: number;
  failedCount: number;
  errors: RowError[];
}

// ── API Functions ──

export const testCaseApi = {
  // Returns TestCaseAdminRecord[] (admin/evaluator) or TestCaseSampleRecord[] (candidate)
  getTestCases: async (
    questionId: string
  ): Promise<TestCaseAdminRecord[] | TestCaseSampleRecord[]> => {
    const { data } = await apiClient.get<
      ApiWrapper<TestCaseAdminRecord[] | TestCaseSampleRecord[]>
    >(`/questions/${questionId}/test-cases`);
    return data.data;
  },

  createTestCase: async (
    questionId: string,
    payload: CreateTestCasePayload
  ): Promise<TestCaseAdminRecord> => {
    const { data } = await apiClient.post<ApiWrapper<TestCaseAdminRecord>>(
      `/questions/${questionId}/test-cases`,
      payload
    );
    return data.data;
  },

  bulkUploadTestCases: async (
    questionId: string,
    file: File
  ): Promise<TestCaseBulkUploadResult> => {
    const formData = new FormData();
    formData.append('file', file);
    const { data } = await apiClient.post<ApiWrapper<TestCaseBulkUploadResult>>(
      `/questions/${questionId}/test-cases/bulk`,
      formData,
      { headers: { 'Content-Type': 'multipart/form-data' } }
    );
    return data.data;
  },

  // Note the URL shape: NOT nested under /questions/{questionId}/ like the three
  // calls above — this one endpoint lives at /api/test-cases/{id} on the backend
  // (Module 5 backend plan, Section 4 — a deliberate second controller).
  deleteTestCase: async (testCaseId: string): Promise<void> => {
    await apiClient.delete(`/test-cases/${testCaseId}`);
  },
};
