import React from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { ArrowLeft } from 'lucide-react';
import { QuestionForm } from '../components/question/QuestionForm';
import type { QuestionFormData } from '../components/question/QuestionForm';
import { useCreateQuestion } from '../hooks/useQuestions';

export const QuestionCreatePage: React.FC = () => {
  const { contestId } = useParams<{ contestId: string }>();
  const navigate = useNavigate();
  const createMutation = useCreateQuestion(contestId!);

  const handleSubmit = (data: QuestionFormData) => {
    createMutation.mutate(data, {
      onSuccess: () => {
        navigate(`/dashboard/contests/${contestId}`);
      },
    });
  };

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
      <div className="flex-1 overflow-hidden p-8">
        <QuestionForm onSubmit={handleSubmit} isPending={createMutation.isPending} />
      </div>
    </div>
  );
};
