import React, { useState } from 'react';
import { Folder, FolderOpen, Plus, Trash2 } from 'lucide-react';
import { useCreateSubject, useDeleteSubject, useSubjects } from '../../hooks/useLibrary';
import { useAuth } from '../../context/AuthContext';
import type { SubjectRecord } from '../../api/libraryApi';
import { Button, Input, Spinner } from '../ui';
import { DeleteFolderDialog } from './DeleteFolderDialog';
import { cn } from '../../lib/cn';

interface SubjectFolderTreeProps {
  selectedSubjectId?: string;
  onSelectSubject: (subjectId?: string) => void;
}

export const SubjectFolderTree: React.FC<SubjectFolderTreeProps> = ({ selectedSubjectId, onSelectSubject }) => {
  const { data: subjects = [], isLoading } = useSubjects();
  const createSubject = useCreateSubject();
  const deleteSubject = useDeleteSubject();

  let user: any = null;
  try {
    user = useAuth().user;
  } catch {
    user = null;
  }

  const [isCreating, setIsCreating] = useState(false);
  const [name, setName] = useState('');
  const [subjectToDelete, setSubjectToDelete] = useState<SubjectRecord | null>(null);

  const canDeleteSubject = (subject: SubjectRecord) => {
    if (!user) return false;
    if (user.role === 'ADMIN') return true;
    return user.id === subject.createdBy;
  };

  const handleCreate = (event: React.FormEvent) => {
    event.preventDefault();
    const trimmedName = name.trim();
    if (!trimmedName || createSubject.isPending) return;
    createSubject.mutate(trimmedName, {
      onSuccess: () => {
        setName('');
        setIsCreating(false);
      },
    });
  };

  const handleDeleteConfirm = () => {
    if (!subjectToDelete) return;
    const deletedId = subjectToDelete.id;
    deleteSubject.mutate(deletedId, {
      onSuccess: () => {
        if (selectedSubjectId === deletedId) {
          onSelectSubject(undefined);
        }
        setSubjectToDelete(null);
      },
    });
  };

  return (
    <div className="space-y-2">
      <div className="flex items-center justify-between border-b border-line px-2 pb-2">
        <p className="font-mono text-[10px] font-medium uppercase tracking-[0.08em] text-fg-subtle">Subjects</p>
        <button
          type="button"
          aria-label="Create subject folder"
          className="press-sm rounded-lg p-1.5 text-fg-muted hover-fine:bg-surface-2 hover-fine:text-fg focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring/50"
          onClick={() => setIsCreating((value) => !value)}
        >
          <Plus className="size-4" aria-hidden />
        </button>
      </div>

      {isCreating && (
        <form className="space-y-2 px-1 pt-1" onSubmit={handleCreate}>
          <Input
            value={name}
            onChange={(event) => setName(event.target.value)}
            placeholder="Folder name"
            aria-label="New subject folder name"
            autoFocus
          />
          <div className="flex justify-end gap-2">
            <Button type="button" variant="ghost" size="sm" onClick={() => setIsCreating(false)}>
              Cancel
            </Button>
            <Button type="submit" size="sm" loading={createSubject.isPending}>
              Add
            </Button>
          </div>
        </form>
      )}

      {isLoading ? (
        <div className="flex items-center gap-2 px-2 py-3 text-sm text-fg-subtle" aria-busy="true">
          <Spinner size={14} /> Loading folders
        </div>
      ) : (
        <div className="space-y-1">
          <button
            type="button"
            className={cn(
              'flex min-h-10 w-full items-center gap-2 rounded-xl px-3 text-left text-[13px] transition-colors duration-150',
              !selectedSubjectId ? 'bg-primary-soft font-medium text-primary-text' : 'text-fg-muted hover-fine:bg-surface-2 hover-fine:text-fg',
            )}
            onClick={() => onSelectSubject(undefined)}
          >
            <FolderOpen className="size-4 shrink-0" aria-hidden />
            All questions
          </button>
          {subjects.map((subject) => {
            const isSelected = selectedSubjectId === subject.id;
            const canDelete = canDeleteSubject(subject);
            return (
              <div
                key={subject.id}
                className={cn(
                  'group flex min-h-10 w-full items-center justify-between rounded-xl px-3 text-[13px] transition-colors duration-150',
                  isSelected
                    ? 'bg-primary-soft font-medium text-primary-text'
                    : 'text-fg-muted hover-fine:bg-surface-2 hover-fine:text-fg',
                )}
              >
                <button
                  type="button"
                  className="flex min-w-0 flex-1 items-center gap-2 text-left"
                  onClick={() => onSelectSubject(subject.id)}
                >
                  <Folder className="size-4 shrink-0" aria-hidden />
                  <span className="truncate">{subject.name}</span>
                </button>
                {canDelete && (
                  <button
                    type="button"
                    aria-label={`Delete ${subject.name} folder`}
                    title="Delete folder"
                    className="ml-1 rounded-md p-1 opacity-0 transition-opacity group-hover:opacity-100 focus-visible:opacity-100 text-fg-subtle hover-fine:bg-danger-soft hover-fine:text-danger-text focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-danger"
                    onClick={(e) => {
                      e.stopPropagation();
                      setSubjectToDelete(subject);
                    }}
                  >
                    <Trash2 className="size-3.5" />
                  </button>
                )}
              </div>
            );
          })}
        </div>
      )}

      {subjectToDelete && (
        <DeleteFolderDialog
          isOpen={Boolean(subjectToDelete)}
          onClose={() => setSubjectToDelete(null)}
          onConfirm={handleDeleteConfirm}
          folderName={subjectToDelete.name}
          isDeleting={deleteSubject.isPending}
        />
      )}
    </div>
  );
};
