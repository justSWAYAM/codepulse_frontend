import React, { useEffect, useState } from 'react';
import { ArrowLeft, BookOpen, FlaskConical, LibraryBig } from 'lucide-react';
import { useNavigate, useParams, useSearchParams } from 'react-router-dom';
import { QuestionForm, type QuestionFormData } from '../components/question/QuestionForm';
import { TestCaseManagerPanel } from '../components/testcase/TestCaseManagerPanel';
import { ButtonLink, Card, Field, PageHeader, Select, Tabs, TabsContent, TabsList, TabsTrigger, Badge } from '../components/ui';
import { LoadingState } from '../components/states/LoadingState';
import { EmptyState } from '../components/states/EmptyState';
import { useLibraryQuestion, useSubjects, useUpdateLibraryQuestion } from '../hooks/useLibrary';
import { useAuth } from '../context/AuthContext';

const LibraryQuestionEditPage: React.FC = () => {
  const { questionId } = useParams<{ questionId: string }>();
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const initialTab = searchParams.get('tab') === 'testcases' ? 'testcases' : 'details';
  const [activeTab, setActiveTab] = useState<'details' | 'testcases'>(initialTab);

  const { user } = useAuth();
  const { data: question, isLoading: questionLoading } = useLibraryQuestion(questionId);
  const { data: subjects = [], isLoading: subjectsLoading } = useSubjects();
  const updateMutation = useUpdateLibraryQuestion(questionId!);

  const [subjectId, setSubjectId] = useState<string>('');

  useEffect(() => {
    if (question?.subjectId) {
      setSubjectId(question.subjectId);
    }
  }, [question?.subjectId]);

  const canEdit = Boolean(
    user &&
      question &&
      (user.role === 'ADMIN' || user.id === question.createdBy || user.fullName === question.authorName),
  );

  const handleSubmit = (data: QuestionFormData) => {
    updateMutation.mutate(
      {
        ...data,
        subjectId: subjectId || undefined,
      },
      {
        onSuccess: () => {
          navigate('/dashboard/library');
        },
      },
    );
  };

  if (questionLoading) {
    return <LoadingState message="Loading question…" />;
  }

  if (!question) {
    return (
      <EmptyState
        title="Question not found"
        message="It may have been deleted or moved. Go back to the question library."
        action={
          <ButtonLink to="/dashboard/library" variant="secondary" size="sm">
            Back to library
          </ButtonLink>
        }
      />
    );
  }

  return (
    <div className="space-y-6">
      <ButtonLink
        to="/dashboard/library"
        variant="ghost"
        size="sm"
        leadingIcon={<ArrowLeft className="size-3.5" aria-hidden />}
      >
        Back to library
      </ButtonLink>

      <PageHeader
        eyebrow="Question library"
        title="Edit library question"
        description="Update the question details, subject filing, or manage test cases."
      />

      <Tabs value={activeTab} onValueChange={(v) => setActiveTab(v as 'details' | 'testcases')}>
        <TabsList>
          <TabsTrigger value="details" icon={<BookOpen />}>
            Details
          </TabsTrigger>
          <TabsTrigger value="testcases" icon={<FlaskConical />}>
            Test cases
          </TabsTrigger>
        </TabsList>

        <TabsContent value="details" className="pt-6 space-y-6">
          <Card className="p-5 sm:p-6">
            <div className="grid gap-4 sm:grid-cols-2">
              <Field label="Subject folder" hint="The folder where this question is organized." required>
                {({ id }) => (
                  <Select
                    id={id}
                    value={subjectId}
                    onChange={(event) => setSubjectId(event.target.value)}
                    disabled={subjectsLoading || !canEdit}
                  >
                    <option value="">Unfiled</option>
                    {subjects.map((subject) => (
                      <option key={subject.id} value={subject.id}>
                        {subject.name}
                      </option>
                    ))}
                  </Select>
                )}
              </Field>
              <div>
                <span className="block text-sm font-medium text-fg">Question type</span>
                <p className="mt-0.5 text-xs text-fg-subtle">Question type is set during creation.</p>
                <div className="mt-2">
                  <Badge tone="primary" size="md">
                    {question.questionType}
                  </Badge>
                </div>
              </div>
            </div>
          </Card>

          <QuestionForm
            defaultValues={question}
            onSubmit={handleSubmit}
            isPending={updateMutation.isPending}
            readOnly={!canEdit}
          />

          <div className="flex items-center gap-2 text-xs text-fg-subtle">
            <LibraryBig className="size-4" aria-hidden />
            Changes made here apply to this library question. Independent contest copies are not modified.
          </div>
        </TabsContent>

        <TabsContent value="testcases" className="pt-6">
          {question.questionType === 'MCQ' || question.questionType === 'THEORY' ? (
            <div className="rounded-2xl border border-line bg-surface p-6 text-center text-sm text-fg-muted">
              Test cases are only applicable to DSA and SQL questions.
            </div>
          ) : (
            <TestCaseManagerPanel
              questionId={questionId!}
              contestId=""
              readOnly={!canEdit}
              question={question as any}
            />
          )}
        </TabsContent>
      </Tabs>
    </div>
  );
};

export default LibraryQuestionEditPage;

