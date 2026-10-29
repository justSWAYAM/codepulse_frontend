import React, { useState } from 'react';
import { FolderPlus } from 'lucide-react';
import { Button, Dialog } from '../ui';
import { LibraryQuestionTable } from './LibraryQuestionTable';
import { useAddQuestionsToSubject } from '../../hooks/useLibrary';
import type { SubjectRecord } from '../../api/libraryApi';

interface AddQuestionsToFolderModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  targetSubject: SubjectRecord;
}

export const AddQuestionsToFolderModal: React.FC<AddQuestionsToFolderModalProps> = ({
  open,
  onOpenChange,
  targetSubject,
}) => {
  const [selectedIds, setSelectedIds] = useState<string[]>([]);
  const addMutation = useAddQuestionsToSubject(targetSubject.id);

  if (!open) return null;

  const close = () => {
    if (!addMutation.isPending) {
      setSelectedIds([]);
      onOpenChange(false);
    }
  };

  const handleAdd = () => {
    if (!selectedIds.length) return;
    addMutation.mutate(selectedIds, {
      onSuccess: () => {
        setSelectedIds([]);
        onOpenChange(false);
      },
    });
  };

  return (
    <Dialog
      open={open}
      onOpenChange={(next) => !next && close()}
      title={`Add questions to ${targetSubject.name}`}
      description={
        <span>
          Select questions from the question library to add into <span className="font-medium text-fg">{targetSubject.name}</span>.
        </span>
      }
      icon={<FolderPlus className="size-5" />}
      size="xl"
      dismissible={!addMutation.isPending}
      footer={
        <div className="flex w-full items-center justify-end gap-2">
          <Button variant="secondary" size="sm" onClick={close} disabled={addMutation.isPending}>
            Cancel
          </Button>
          <Button
            variant="primary"
            size="sm"
            onClick={handleAdd}
            loading={addMutation.isPending}
            disabled={selectedIds.length === 0}
          >
            Add to {targetSubject.name} {selectedIds.length > 0 ? `(${selectedIds.length})` : ''}
          </Button>
        </div>
      }
    >
      <div className="space-y-4 pt-2">
        <LibraryQuestionTable
          selectable
          selectedIds={selectedIds}
          onSelectionChange={setSelectedIds}
        />
      </div>
    </Dialog>
  );
};
