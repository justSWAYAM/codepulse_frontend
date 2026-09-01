import React from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { ArrowLeft } from 'lucide-react';
import { QuestionForm } from '../components/question/QuestionForm';
import type { QuestionFormData } from '../components/question/QuestionForm';
import { useQuestion, useUpdateQuestion } from '../hooks/useQuestions';

export const QuestionEditPage: React.FC = () => {
  const { contestId, questionId } = useParams<{ contestId: string; questionId: string }>();
  const navigate = useNavigate();
  
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
    return <div className="p-8 text-red-500">Question not found.</div>;
  }

  return (
    <div className="flex flex-col h-[calc(100vh-4rem)]">
      {/* Header */}
      <div className="bg-white border-b border-[#E4E2DC] px-8 py-6 shrink-0 flex justify-between items-start">
        <div>
          <button
            onClick={() => navigate(`/dashboard/contests/${contestId}`)}
            className="flex items-center gap-2 text-sm text-gray-500 hover:text-[#1B1E3A] mb-4 transition-colors"
          >
            <ArrowLeft size={16} />
            Back to Contest
          </button>
          <h1 className="text-3xl font-display font-bold text-[#1B1E3A]">
            Edit Question
          </h1>
          <p className="text-gray-500 mt-1">
            Update properties and markdown for this question.
          </p>
        </div>
      </div>

      {/* Main Content */}
      <div className="flex-1 overflow-hidden p-8">
        <QuestionForm
          defaultValues={question as QuestionFormData}
          onSubmit={handleSubmit}
          isPending={updateMutation.isPending}
        />
      </div>
    </div>
  );
};
