import React, { useState } from 'react';
import { LibraryBig } from 'lucide-react';
import { useAddQuestionsToContest } from '../../hooks/useLibrary';
import { Button, Dialog } from '../ui';
import { SubjectFolderTree } from './SubjectFolderTree';
import { LibraryQuestionTable } from './LibraryQuestionTable';

interface LibraryPickerDialogProps {
  contestId: string;
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export const LibraryPickerDialog: React.FC<LibraryPickerDialogProps> = ({ contestId, open, onOpenChange }) => {
  const [subjectId, setSubjectId] = useState<string>();
  const [selectedIds, setSelectedIds] = useState<string[]>([]);
  const addQuestions = useAddQuestionsToContest(contestId);

  const close = (nextOpen: boolean) => {
    if (nextOpen) {
      onOpenChange(true);
      return;
    }
    if (!addQuestions.isPending) {
      setSelectedIds([]);
      setSubjectId(undefined);
      onOpenChange(false);
    }
  };

  const handleImport = () => {
    if (!selectedIds.length) return;
    addQuestions.mutate(selectedIds, {
      onSuccess: () => close(false),
    });
  };

  return (
    <Dialog
      open={open}
      onOpenChange={close}
      title="Add from question library"
      description="Select reusable questions to copy into this contest. Contest copies can be edited independently."
      icon={<LibraryBig className="size-5" />}
      size="xl"
      dismissible={!addQuestions.isPending}
      footer={
        <>
          <Button variant="secondary" onClick={() => close(false)} disabled={addQuestions.isPending}>
            Cancel
          </Button>
          <Button onClick={handleImport} loading={addQuestions.isPending} disabled={!selectedIds.length}>
            Import selected
          </Button>
        </>
      }
    >
      <div className="grid min-h-120 gap-5 lg:grid-cols-[190px_minmax(0,1fr)]">
        <aside className="border-b border-line pb-4 lg:border-b-0 lg:border-r lg:pb-0 lg:pr-5">
          <SubjectFolderTree selectedSubjectId={subjectId} onSelectSubject={setSubjectId} />
        </aside>
        <div className="min-w-0">
          <LibraryQuestionTable
            selectedSubjectId={subjectId}
            selectable
            selectedIds={selectedIds}
            onSelectionChange={setSelectedIds}
          />
        </div>
      </div>
    </Dialog>
  );
};