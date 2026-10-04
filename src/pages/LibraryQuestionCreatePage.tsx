import React, { useState } from 'react';
import { ArrowLeft, LibraryBig } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { QuestionForm } from '../components/question/QuestionForm';
import type { QuestionFormData } from '../components/question/QuestionForm';
import { ButtonLink, Card, Field, PageHeader, Select } from '../components/ui';
import { useCreateLibraryQuestion, useSubjects } from '../hooks/useLibrary';
import type { LibraryQuestionType } from '../api/libraryApi';

const LibraryQuestionCreatePage: React.FC = () => {
  const navigate = useNavigate();
  const { data: subjects = [], isLoading: subjectsLoading } = useSubjects();
  const createQuestion = useCreateLibraryQuestion();
  const [subjectId, setSubjectId] = useState('');
  const [questionType, setQuestionType] = useState<LibraryQuestionType>('DSA');

  const handleSubmit = (data: QuestionFormData) => {
    if (!subjectId) return;
    createQuestion.mutate(
      { ...data, subjectId, questionType },
      { onSuccess: () => navigate('/dashboard/library') },
    );
  };

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
        title="Create library question"
        description="Create a reusable programming question and file it under a subject folder."
      />
      <Card className="p-5 sm:p-6">
        <div className="grid gap-4 sm:grid-cols-2">
          <Field label="Subject folder" hint="Choose where other staff members will find this question." required>
            {({ id }) => (
              <Select
                id={id}
                value={subjectId}
                onChange={(event) => setSubjectId(event.target.value)}
                disabled={subjectsLoading}
                aria-required="true"
              >
                <option value="">Select a subject</option>
                {subjects.map((subject) => (
                  <option key={subject.id} value={subject.id}>
                    {subject.name}
                  </option>
                ))}
              </Select>
            )}
          </Field>
          <Field label="Question type" hint="Choose how this question will be used." required>
            {({ id }) => (
              <Select id={id} value={questionType} onChange={(event) => setQuestionType(event.target.value as LibraryQuestionType)}>
                <option value="DSA">DSA</option>
                <option value="SQL">SQL</option>
                <option value="MCQ">MCQ</option>
                <option value="THEORY">Theory</option>
              </Select>
            )}
          </Field>
        </div>
      </Card>
      {!subjectId && <p className="text-[12px] text-fg-subtle">Select a subject folder before saving.</p>}
      <QuestionForm onSubmit={handleSubmit} isPending={createQuestion.isPending} />
      <div className="flex items-center gap-2 text-xs text-fg-subtle">
        <LibraryBig className="size-4" aria-hidden />
        Library questions are shared with staff, while contest copies remain independent.
      </div>
    </div>
  );
};

export default LibraryQuestionCreatePage;