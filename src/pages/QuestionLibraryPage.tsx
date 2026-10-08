import React, { useState } from 'react';
import { Plus, Upload } from 'lucide-react';
import { PageHeader, ButtonLink, Button, Tooltip } from '../components/ui';
import { SubjectFolderTree } from '../components/library/SubjectFolderTree';
import { LibraryQuestionTable } from '../components/library/LibraryQuestionTable';
import { useSubjects } from '../hooks/useLibrary';
import { QuestionImportDialog } from '../features/library/import/QuestionImportDialog';

const QuestionLibraryPage: React.FC = () => {
  const [subjectId, setSubjectId] = useState<string>();
  const [importOpen, setImportOpen] = useState(false);
  const { data: subjects = [] } = useSubjects();
  const selectedSubject = subjects.find((s) => s.id === subjectId);

  const importButton = (
    <Button
      variant="secondary"
      disabled={!selectedSubject}
      onClick={() => setImportOpen(true)}
      leadingIcon={<Upload className="size-4" />}
    >
      Import Questions
    </Button>
  );

  return (
    <div className="space-y-6">
      <PageHeader
        title="Question library"
        description="Browse shared questions by subject, difficulty, type, or author."
        actions={
          <div className="flex items-center gap-2">
            {!selectedSubject ? (
              <Tooltip content="Select a folder first">
                <span className="inline-block cursor-not-allowed">{importButton}</span>
              </Tooltip>
            ) : (
              importButton
            )}
            <ButtonLink to="/dashboard/library/new" leadingIcon={<Plus className="size-4" />}>
              Create question
            </ButtonLink>
          </div>
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

      {selectedSubject && (
        <QuestionImportDialog
          open={importOpen}
          onOpenChange={setImportOpen}
          subjectId={selectedSubject.id}
          subjectName={selectedSubject.name}
        />
      )}
    </div>
  );
};

export default QuestionLibraryPage;