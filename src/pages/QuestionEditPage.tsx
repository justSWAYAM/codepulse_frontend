import React, { useState } from 'react';
import { useParams, useNavigate, useSearchParams } from 'react-router-dom';
import { ArrowLeft, BookOpen, FlaskConical } from 'lucide-react';
import { QuestionForm } from '../components/question/QuestionForm';
import type { QuestionFormData } from '../components/question/QuestionForm';
import { TestCaseManagerPanel } from '../components/testcase/TestCaseManagerPanel';
import { useQuestion, useUpdateQuestion } from '../hooks/useQuestions';

export const QuestionEditPage: React.FC = () => {
  const { contestId, questionId } = useParams<{ contestId: string; questionId: string }>();
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const initialTab = searchParams.get('tab') === 'testcases' ? 'testcases' : 'details';
  const [activeTab, setActiveTab] = useState<'details' | 'testcases'>(initialTab);

  const { data: question, isLoading } = useQuestion(contestId!, questionId!);
  const updateMutation = useUpdateQuestion(contestId!, questionId!);

  const handleSubmit = (data: QuestionFormData) => {
    updateMutation.mutate(data, {
      onSuccess: () => {
        navigate(`/dashboard/contests/${contestId}`);
      },
    });
  };

  if (isLoading) {
    return <div className="p-8">Loading question data...</div>;
  }

  if (!question) {
    return <div className="p-8 text-danger-text">Question not found.</div>;
  }

  return (
    <div className="flex flex-col h-[calc(100vh-4rem)]">
      {/* Header */}
      <div className="bg-surface border-b border-line px-8 py-6 shrink-0 flex justify-between items-start">
        <div>
          <button
            onClick={() => navigate(`/dashboard/contests/${contestId}`)}
            className="flex items-center gap-2 text-sm text-fg-muted hover:text-fg mb-4 transition-colors"
          >
            <ArrowLeft size={16} />
            Back to Contest
          </button>
          <h1 className="text-3xl font-display font-bold text-fg">
            Edit Question
          </h1>
          <p className="text-fg-muted mt-1">
            Update properties and markdown for this question.
          </p>
        </div>
      </div>

      {/* Tabs — only show when questionId exists (always true on this page) */}
      {questionId && (
        <div className="flex gap-1 px-8 pt-4 border-b border-line bg-surface shrink-0">
          <button
            onClick={() => setActiveTab('details')}
            className={`flex items-center gap-2 px-4 py-2.5 text-sm font-medium border-b-2 -mb-px transition-colors cursor-pointer ${
              activeTab === 'details'
                ? 'border-fg text-fg'
                : 'border-transparent text-fg-muted hover:text-fg'
            }`}
          >
            <BookOpen className="w-4 h-4" />
            Details
          </button>
          <button
            onClick={() => setActiveTab('testcases')}
            className={`flex items-center gap-2 px-4 py-2.5 text-sm font-medium border-b-2 -mb-px transition-colors cursor-pointer ${
              activeTab === 'testcases'
                ? 'border-fg text-fg'
                : 'border-transparent text-fg-muted hover:text-fg'
            }`}
          >
            <FlaskConical className="w-4 h-4" />
            Test Cases
          </button>
        </div>
      )}

      {/* Main Content */}
      <div className="flex-1 overflow-hidden p-8">
        {activeTab === 'details' ? (
          <QuestionForm
            defaultValues={question as QuestionFormData}
            onSubmit={handleSubmit}
            isPending={updateMutation.isPending}
          />
        ) : (
          <div className="h-full overflow-y-auto">
            <TestCaseManagerPanel
              questionId={questionId!}
              contestId={contestId!}
            />
          </div>
        )}
      </div>
    </div>
  );
};

