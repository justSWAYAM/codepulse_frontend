import React, { useMemo, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { ArrowLeft, FlaskConical, Plus } from 'lucide-react';
import { QuestionForm } from '../components/question/QuestionForm';
import type { QuestionFormData } from '../components/question/QuestionForm';
import { TestCaseForm } from '../components/testcase/TestCaseForm';
import type { TestCaseFormData } from '../components/testcase/TestCaseForm';
import { TestCaseTable } from '../components/testcase/TestCaseTable';
import type { TestCaseAdminRecord } from '../api/testCaseApi';
import { useCreateQuestion } from '../hooks/useQuestions';

export const QuestionCreatePage: React.FC = () => {
  const { contestId } = useParams<{ contestId: string }>();
  const navigate = useNavigate();
  const createMutation = useCreateQuestion(contestId!);
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

  return (
    <div className="flex flex-col h-[calc(100vh-4rem)]">
      {/* Header */}
      <div className="bg-white border-b border-[#E4E2DC] px-8 py-6 shrink-0">
        <button
          onClick={() => navigate(`/dashboard/contests/${contestId}`)}
          className="flex items-center gap-2 text-sm text-gray-500 hover:text-[#1B1E3A] mb-4 transition-colors"
        >
          <ArrowLeft size={16} />
          Back to Contest
        </button>
        <h1 className="text-3xl font-display font-bold text-[#1B1E3A]">
          Add Question
        </h1>
        <p className="text-gray-500 mt-1">
          Create a new programming question for this contest.
        </p>
      </div>

      {/* Main Content */}
      <div className="flex-1 overflow-y-auto p-8">
        <QuestionForm onSubmit={handleSubmit} isPending={createMutation.isPending} />

        <div className="mt-8 rounded-2xl border border-[#E4E2DC] bg-white p-6">
          <div className="flex items-center justify-between gap-4 mb-4">
            <div className="flex items-center gap-3">
              <div className="w-9 h-9 rounded-xl bg-[#2F9E6E]/10 flex items-center justify-center">
                <FlaskConical className="w-4.5 h-4.5 text-[#2F9E6E]" />
              </div>
              <div>
                <h2 className="font-display text-lg font-semibold text-[#1B1E3A]">
                  Test Cases ({draftTestCases.length})
                </h2>
                <p className="text-xs text-[#1B1E3A]/40">
                  Add inputs and expected outputs before saving this question.
                </p>
              </div>
            </div>

            {!showTestCaseForm && (
              <button
                type="button"
                onClick={() => setShowTestCaseForm(true)}
                className="inline-flex items-center gap-2 px-4 py-2 rounded-xl bg-[#2F9E6E] text-white text-sm font-medium hover:bg-[#25825a] transition-colors cursor-pointer"
              >
                <Plus className="w-3.5 h-3.5" />
                Add Test Case
              </button>
            )}
          </div>

          {showTestCaseForm && (
            <div className="mb-5 rounded-xl border border-[#E4E2DC] bg-[#F7F7F5] p-4">
              <div className="flex items-center justify-between mb-3">
                <p className="text-sm font-medium text-[#1B1E3A]">New test case</p>
                <button
                  type="button"
                  onClick={() => setShowTestCaseForm(false)}
                  className="text-sm text-[#1B1E3A]/60 hover:text-[#1B1E3A]"
                >
                  Cancel
                </button>
              </div>
              <TestCaseForm
                onSubmit={handleAddTestCase}
                isPending={false}
                submitLabel="Save Test Case"
              />
            </div>
          )}

          {draftTestCases.length === 0 ? (
            <div className="text-center py-12 bg-[#F7F7F5] rounded-2xl border border-[#E4E2DC]">
              <div className="w-14 h-14 rounded-2xl bg-[#1B1E3A]/[0.03] flex items-center justify-center mx-auto mb-4">
                <FlaskConical className="w-6 h-6 text-[#1B1E3A]/20" />
              </div>
              <h3 className="font-display text-base font-semibold text-[#1B1E3A]/70 mb-1">
                No test cases added yet
              </h3>
              <p className="text-sm text-[#1B1E3A]/40 max-w-sm mx-auto">
                Add at least one hidden test case for the question before publishing it.
              </p>
            </div>
          ) : (
            <div className="space-y-3">
              <div className="flex items-center justify-between text-xs text-[#1B1E3A]/40">
                <span>{draftTestCases.length} test case{draftTestCases.length !== 1 ? 's' : ''}</span>
                <span>Total weight: {totalWeight}</span>
              </div>
              <TestCaseTable
                testCases={draftTestCases}
                onDelete={handleDeleteTestCase}
                isDeleting={false}
              />
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
