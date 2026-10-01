import React, { useState } from 'react';
import { Plus, Upload, FlaskConical } from 'lucide-react';
import { Button, Card, CardHeader } from '../ui';
import { LoadingState } from '../states/LoadingState';
import { EmptyState } from '../states/EmptyState';
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

export const TestCaseManagerPanel: React.FC<TestCaseManagerPanelProps> = ({ questionId, contestId }) => {
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
    return <LoadingState message="Loading test cases…" />;
  }

  const addButton = (
    <Button size="sm" onClick={() => setShowCreateDialog(true)} leadingIcon={<Plus className="size-4" />}>
      Add test case
    </Button>
  );

  return (
    <div className="space-y-4">
      <Card>
        <CardHeader
          icon={<FlaskConical className="size-4" />}
          title={
            <>
              Test cases <span className="tabular text-fg-subtle">({adminTestCases.length})</span>
            </>
          }
          description="Inputs and expected outputs used for automated grading."
          className="flex-wrap"
          actions={
            <>
              <Button
                variant="secondary"
                size="sm"
                onClick={() => setShowBulkDialog(true)}
                leadingIcon={<Upload className="size-4" />}
              >
                Bulk upload
              </Button>
              {addButton}
            </>
          }
        />
        {adminTestCases.length === 0 && (
          <div className="border-t border-line">
            <EmptyState
              icon={<FlaskConical className="size-5" />}
              title="No test cases yet"
              message="Add at least one hidden test case before this question can be scored."
              action={addButton}
            />
          </div>
        )}
      </Card>

      {adminTestCases.length > 0 && (
        <TestCaseTable testCases={adminTestCases} onDelete={handleDelete} isDeleting={deleteMutation.isPending} />
      )}

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
