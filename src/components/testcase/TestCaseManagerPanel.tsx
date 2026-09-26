import React, { useState } from 'react';
import { Plus, Upload, FlaskConical, Loader2 } from 'lucide-react';
import { TestCaseTable } from './TestCaseTable';
import { CreateTestCaseDialog } from './CreateTestCaseDialog';
import { BulkUploadTestCasesDialog } from './BulkUploadTestCasesDialog';
import { useTestCases, useCreateTestCase, useDeleteTestCase } from '../../hooks/useTestCases';
import type { TestCaseAdminRecord } from '../../api/testCaseApi';
import type { TestCaseFormData } from './TestCaseForm';

interface TestCaseManagerPanelProps {
  questionId: string;
  contestId: string;
}

export const TestCaseManagerPanel: React.FC<TestCaseManagerPanelProps> = ({
  questionId,
  contestId,
}) => {
  const [showCreateDialog, setShowCreateDialog] = useState(false);
  const [showBulkDialog, setShowBulkDialog] = useState(false);

  const { data: testCases, isLoading } = useTestCases(questionId);
  const createMutation = useCreateTestCase(contestId, questionId);
  const deleteMutation = useDeleteTestCase(contestId, questionId);

  const handleCreate = (data: TestCaseFormData) => {
    createMutation.mutate(data, {
      onSuccess: () => setShowCreateDialog(false),
    });
  };

  const handleDelete = (testCaseId: string) => {
    deleteMutation.mutate(testCaseId);
  };

  // Cast — admin always gets TestCaseAdminRecord[]
  const adminTestCases = (testCases ?? []) as TestCaseAdminRecord[];

  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-16">
        <Loader2 className="w-6 h-6 animate-spin text-ink/30" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header row */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="w-9 h-9 rounded-xl bg-accent-syntax/10 flex items-center justify-center">
            <FlaskConical className="w-4.5 h-4.5 text-accent-syntax" />
          </div>
          <div>
            <h2 className="font-display text-lg font-semibold text-ink">
              Test Cases ({adminTestCases.length})
            </h2>
            <p className="text-xs text-ink/40">
              Define inputs and expected outputs for automated grading
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2">
          <button
            onClick={() => setShowBulkDialog(true)}
            className="px-4 py-2 rounded-xl text-sm font-medium text-ink/60 border border-hairline hover:border-ink/20 hover:text-ink transition-colors cursor-pointer flex items-center gap-2"
          >
            <Upload className="w-3.5 h-3.5" />
            Bulk Upload
          </button>
          <button
            onClick={() => setShowCreateDialog(true)}
            className="px-4 py-2 rounded-xl bg-accent-compile text-white text-sm font-medium hover:bg-accent-compile-hover transition-colors cursor-pointer flex items-center gap-2"
          >
            <Plus className="w-3.5 h-3.5" />
            Add Test Case
          </button>
        </div>
      </div>

      {/* Table or empty state */}
      {adminTestCases.length === 0 ? (
        <div className="text-center py-16 bg-surface rounded-2xl border border-hairline">
          <div className="w-14 h-14 rounded-2xl bg-ink/[0.03] flex items-center justify-center mx-auto mb-4">
            <FlaskConical className="w-6 h-6 text-ink/20" />
          </div>
          <h3 className="font-display text-base font-semibold text-ink/70 mb-1">
            No test cases yet
          </h3>
          <p className="text-sm text-ink/40 max-w-sm mx-auto">
            Add at least one hidden test case before this question can be scored.
          </p>
        </div>
      ) : (
        <TestCaseTable
          testCases={adminTestCases}
          onDelete={handleDelete}
          isDeleting={deleteMutation.isPending}
        />
      )}

      {/* Dialogs */}
      <CreateTestCaseDialog
        isOpen={showCreateDialog}
        onClose={() => setShowCreateDialog(false)}
        onSubmit={handleCreate}
        isPending={createMutation.isPending}
      />

      <BulkUploadTestCasesDialog
        isOpen={showBulkDialog}
        onClose={() => setShowBulkDialog(false)}
        questionId={questionId}
        contestId={contestId}
      />
    </div>
  );
};
