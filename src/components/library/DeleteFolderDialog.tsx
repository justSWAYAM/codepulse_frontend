import React from 'react';
import { Trash2 } from 'lucide-react';
import { Button, Dialog } from '../ui';

interface DeleteFolderDialogProps {
  isOpen: boolean;
  onClose: () => void;
  onConfirm: () => void;
  folderName: string;
  isDeleting: boolean;
}

export const DeleteFolderDialog: React.FC<DeleteFolderDialogProps> = ({
  isOpen,
  onClose,
  onConfirm,
  folderName,
  isDeleting,
}) => (
  <Dialog
    open={isOpen}
    onOpenChange={(open) => !open && onClose()}
    title="Delete folder?"
    description={
      <span>
        <span className="font-medium text-fg">{folderName}</span> will be permanently deleted.
        <span className="mt-1 block text-fg-subtle">
          Questions in this folder will stay in the All questions folder as unfiled questions.
        </span>
      </span>
    }
    icon={<Trash2 className="size-5" />}
    tone="danger"
    size="sm"
    dismissible={!isDeleting}
    footer={
      <>
        <Button variant="secondary" onClick={onClose} disabled={isDeleting}>
          Cancel
        </Button>
        <Button variant="danger" onClick={onConfirm} loading={isDeleting}>
          Delete folder
        </Button>
      </>
    }
  />
);

