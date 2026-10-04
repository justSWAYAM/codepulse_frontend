import React, { useState } from 'react';
import { Plus } from 'lucide-react';
import { PageHeader, ButtonLink } from '../components/ui';
import { SubjectFolderTree } from '../components/library/SubjectFolderTree';
import { LibraryQuestionTable } from '../components/library/LibraryQuestionTable';

const QuestionLibraryPage: React.FC = () => {
  const [subjectId, setSubjectId] = useState<string>();

  return (
    <div className="space-y-6">
      <PageHeader
        title="Question library"
        description="Browse shared questions by subject, difficulty, type, or author."
        actions={
          <ButtonLink to="/dashboard/library/new" leadingIcon={<Plus className="size-4" />}>
            Create question
          </ButtonLink>
        }
      />
      <div className="grid gap-5 lg:grid-cols-[220px_minmax(0,1fr)]">
        <aside className="rounded-2xl border border-line bg-surface p-3 shadow-card lg:p-4">
          <SubjectFolderTree selectedSubjectId={subjectId} onSelectSubject={setSubjectId} />
        </aside>
        <section className="min-w-0" aria-label="Library questions">
          <LibraryQuestionTable selectedSubjectId={subjectId} />
        </section>
      </div>
    </div>
  );
};

export default QuestionLibraryPage;