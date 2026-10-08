import React, { useState } from 'react';
import { Plus, Upload, FlaskConical } from 'lucide-react';
import { Button, Card, CardHeader } from '../ui';
import { LoadingState } from '../states/LoadingState';
import { EmptyState } from '../states/EmptyState';
import { TestCaseTable } from './TestCaseTable';
import { CreateTestCaseDialog } from './CreateTestCaseDialog';
import { BulkUploadTestCasesDialog } from './BulkUploadTestCasesDialog';
import { useTestCases, useCreateTestCase, useDeleteTestCase } from '../../hooks/useTestCases';
import { useQuestion } from '../../hooks/useQuestions';
import type { TestCaseAdminRecord } from '../../api/testCaseApi';
import type { TestCaseFormData } from './TestCaseForm';
import { TestCasePromptButton } from '../../features/library/import/TestCasePromptButton';
import type { PromptSource } from '../../features/library/import/testCasePrompts';
import type { QuestionRecord } from '../../api/questionApi';

interface TestCaseManagerPanelProps {
  questionId: string;
  contestId: string;
  /** Contest is live/completed: list and preview only */
  readOnly?: boolean;
  question?: QuestionRecord | PromptSource;
}

export const TestCaseManagerPanel: React.FC<TestCaseManagerPanelProps> = ({
  questionId,
  contestId,
  readOnly = false,
  question,
}) => {
  const [showCreateDialog, setShowCreateDialog] = useState(false);
  const [showBulkDialog, setShowBulkDialog] = useState(false);

  const { data: fetchedQuestion } = useQuestion(contestId, questionId);
  const activeQuestion = question ?? fetchedQuestion;
  const promptSource: PromptSource | null = activeQuestion
    ? {
        title: activeQuestion.title,
        description: activeQuestion.description,
        questionType: (activeQuestion as any).questionType ?? 'DSA',
        schemaSql: (activeQuestion as any).schemaSql ?? null,
      }
    : null;

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
            readOnly ? undefined : (
              <>
                {promptSource && <TestCasePromptButton question={promptSource} />}
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
            )
          }
        />
        {adminTestCases.length === 0 && (
          <div className="border-t border-line">
            <EmptyState
              icon={<FlaskConical className="size-5" />}
              title="No test cases yet"
              message={
                readOnly
                  ? 'This question has no test cases.'
                  : 'Add at least one hidden test case before this question can be scored.'
              }
              action={readOnly ? undefined : addButton}
            />
          </div>
        )}
      </Card>

      {adminTestCases.length > 0 && (
        <TestCaseTable
          testCases={adminTestCases}
          onDelete={readOnly ? undefined : handleDelete}
          isDeleting={deleteMutation.isPending}
        />
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
