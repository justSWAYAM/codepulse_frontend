import React, { useMemo, useState } from 'react';
import { Link, useParams, useNavigate } from 'react-router-dom';
import { ArrowLeft, FlaskConical, Lock, Plus } from 'lucide-react';
import { QuestionForm } from '../components/question/QuestionForm';
import type { QuestionFormData } from '../components/question/QuestionForm';
import { TestCaseForm } from '../components/testcase/TestCaseForm';
import type { TestCaseFormData } from '../components/testcase/TestCaseForm';
import { TestCaseTable } from '../components/testcase/TestCaseTable';
import type { TestCaseAdminRecord } from '../api/testCaseApi';
import { useCreateQuestion } from '../hooks/useQuestions';
import { useContest } from '../hooks/useContests';
import { Button, ButtonLink, Card, CardBody, CardHeader, PageHeader } from '../components/ui';
import { EmptyState } from '../components/states/EmptyState';

export const QuestionCreatePage: React.FC = () => {
  const { contestId } = useParams<{ contestId: string }>();
  const navigate = useNavigate();
  const createMutation = useCreateQuestion(contestId!);
  const { data: contest } = useContest(contestId!);
  const locked = contest?.status === 'ONGOING' || contest?.status === 'COMPLETED';
  const [draftTestCases, setDraftTestCases] = useState<TestCaseAdminRecord[]>([]);
  const [showTestCaseForm, setShowTestCaseForm] = useState(false);

  const handleAddTestCase = (data: TestCaseFormData) => {
    const nextTestCase: TestCaseAdminRecord = {
      id: `${Date.now()}-${draftTestCases.length}`,
      input: data.input,
      expectedOutput: data.expectedOutput,
      isSample: data.isSample,
      weight: data.weight,
      orderIndex: draftTestCases.length,
    };

    setDraftTestCases((prev) => [...prev, nextTestCase]);
    setShowTestCaseForm(false);
  };

  const handleDeleteTestCase = (testCaseId: string) => {
    setDraftTestCases((prev) => prev.filter((testCase) => testCase.id !== testCaseId));
  };

  const handleSubmit = (data: QuestionFormData) => {
    createMutation.mutate(
      {
        ...data,
        testCases: draftTestCases.map(({ input, expectedOutput, isSample, weight }) => ({
          input,
          expectedOutput,
          isSample,
          weight,
        })),
      },
      {
        onSuccess: (created) => {
          // Navigate to the edit page with the test cases tab active,
          // so the admin can immediately add test cases after creation.
          navigate(
            `/dashboard/contests/${contestId}/questions/${created.id}/edit?tab=testcases`
          );
        },
      }
    );
  };

  const totalWeight = useMemo(
    () => draftTestCases.reduce((sum, testCase) => sum + testCase.weight, 0),
    [draftTestCases]
  );

  if (locked) {
    return (
      <Card className="mx-auto mt-8 max-w-md">
        <EmptyState
          icon={<Lock className="size-5" />}
          title="Questions are locked"
          message={`Questions can't be added once a contest is ${contest?.status === 'ONGOING' ? 'live' : 'completed'}.`}
          action={
            <ButtonLink
              to={`/dashboard/contests/${contestId}?tab=questions`}
              variant="secondary"
              size="sm"
              leadingIcon={<ArrowLeft className="size-4" />}
            >
              Back to questions
            </ButtonLink>
          }
        />
      </Card>
    );
  }

  return (
    <div className="space-y-6">
      <div className="space-y-3">
        <Link
          to={`/dashboard/contests/${contestId}?tab=questions`}
          className="inline-flex items-center gap-1.5 text-[13px] text-fg-muted transition-colors duration-150 hover-fine:text-fg"
        >
          <ArrowLeft className="size-3.5" aria-hidden />
          Back to contest
        </Link>
        <PageHeader title="Add question" description="Create a new programming question for this contest." />
      </div>

      <QuestionForm onSubmit={handleSubmit} isPending={createMutation.isPending} />

      <Card>
        <CardHeader
          icon={<FlaskConical className="size-4" />}
          title={
            <>
              Test cases <span className="tabular text-fg-subtle">({draftTestCases.length})</span>
            </>
          }
          description="Add inputs and expected outputs. They're saved together with the question."
          actions={
            !showTestCaseForm && (
              <Button size="sm" onClick={() => setShowTestCaseForm(true)} leadingIcon={<Plus className="size-4" />}>
                Add test case
              </Button>
            )
          }
        />

        <CardBody className="space-y-4">
          {showTestCaseForm && (
            <div className="rounded-xl border border-line bg-surface-2/60 p-4">
              <div className="mb-3 flex items-center justify-between">
                <p className="text-sm font-medium text-fg">New test case</p>
                <Button variant="ghost" size="sm" onClick={() => setShowTestCaseForm(false)}>
                  Cancel
                </Button>
              </div>
              <TestCaseForm onSubmit={handleAddTestCase} isPending={false} submitLabel="Save test case" />
            </div>
          )}

          {draftTestCases.length === 0 ? (
            !showTestCaseForm && (
              <div className="rounded-xl border border-dashed border-line-strong">
                <EmptyState
                  icon={<FlaskConical className="size-5" />}
                  title="No test cases added yet"
                  message="Add at least one hidden test case before publishing this question."
                />
              </div>
            )
          ) : (
            <div className="space-y-2">
              <p className="tabular text-[12px] text-fg-subtle">Total weight {totalWeight}</p>
              <TestCaseTable testCases={draftTestCases} onDelete={handleDeleteTestCase} isDeleting={false} />
            </div>
          )}
        </CardBody>
      </Card>
    </div>
  );
};
