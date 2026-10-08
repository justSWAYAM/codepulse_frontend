import React, { useState } from 'react';
import { Link, useParams, useNavigate, useSearchParams } from 'react-router-dom';
import { ArrowLeft, BookOpen, FlaskConical } from 'lucide-react';
import { QuestionForm } from '../components/question/QuestionForm';
import type { QuestionFormData } from '../components/question/QuestionForm';
import { TestCaseManagerPanel } from '../components/testcase/TestCaseManagerPanel';
import { useQuestion, useUpdateQuestion } from '../hooks/useQuestions';
import { useContest } from '../hooks/useContests';
import { Button, PageHeader, Tabs, TabsContent, TabsList, TabsTrigger } from '../components/ui';
import { LoadingState } from '../components/states/LoadingState';
import { EmptyState } from '../components/states/EmptyState';

export const QuestionEditPage: React.FC = () => {
  const { contestId, questionId } = useParams<{ contestId: string; questionId: string }>();
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const initialTab = searchParams.get('tab') === 'testcases' ? 'testcases' : 'details';
  const [activeTab, setActiveTab] = useState<'details' | 'testcases'>(initialTab);

  const { data: question, isLoading } = useQuestion(contestId!, questionId!);
  const updateMutation = useUpdateQuestion(contestId!, questionId!);
  const { data: contest } = useContest(contestId!);
  // Questions and test cases freeze once the contest starts (the backend refuses changes too)
  const locked = contest?.status === 'ONGOING' || contest?.status === 'COMPLETED';

  const handleSubmit = (data: QuestionFormData) => {
    updateMutation.mutate(data, {
      onSuccess: () => {
        navigate(`/dashboard/contests/${contestId}?tab=questions`);
      },
    });
  };

  const backLink = (
    <Link
      to={`/dashboard/contests/${contestId}?tab=questions`}
      className="inline-flex items-center gap-1.5 text-[13px] text-fg-muted transition-colors duration-150 hover-fine:text-fg"
    >
      <ArrowLeft className="size-3.5" aria-hidden />
      Back to contest
    </Link>
  );

  if (isLoading) {
    return <LoadingState message="Loading question…" />;
  }

  if (!question) {
    return (
      <EmptyState
        title="Question not found"
        message="It may have been deleted. Go back to the contest to see its current questions."
        action={
          <Button variant="secondary" size="sm" onClick={() => navigate(`/dashboard/contests/${contestId}?tab=questions`)}>
            Back to contest
          </Button>
        }
      />
    );
  }

  return (
    <div className="space-y-6">
      <div className="space-y-3">
        {backLink}
        {locked ? (
          <PageHeader
            title="View question"
            description={`Locked because the contest is ${contest?.status === 'ONGOING' ? 'live' : 'completed'}. Questions and test cases can't be changed.`}
          />
        ) : (
          <PageHeader title="Edit question" description="Update the properties and Markdown description of this question." />
        )}
      </div>

      <Tabs value={activeTab} onValueChange={(v) => setActiveTab(v as 'details' | 'testcases')}>
        <TabsList>
          <TabsTrigger value="details" icon={<BookOpen />}>
            Details
          </TabsTrigger>
          <TabsTrigger value="testcases" icon={<FlaskConical />}>
            Test cases
          </TabsTrigger>
        </TabsList>

        <TabsContent value="details" className="pt-6">
          <QuestionForm
            defaultValues={question as QuestionFormData}
            onSubmit={handleSubmit}
            isPending={updateMutation.isPending}
            readOnly={locked}
          />
        </TabsContent>
        <TabsContent value="testcases" className="pt-6">
          <TestCaseManagerPanel questionId={questionId!} contestId={contestId!} readOnly={locked} question={question} />
        </TabsContent>
      </Tabs>
    </div>
  );
};
