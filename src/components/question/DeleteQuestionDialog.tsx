import React from 'react';
import { Trash2 } from 'lucide-react';
import { Button, Dialog } from '../ui';

interface DeleteQuestionDialogProps {
  isOpen: boolean;
  onClose: () => void;
  onConfirm: () => void;
  title: string;
  isDeleting: boolean;
}

export const DeleteQuestionDialog: React.FC<DeleteQuestionDialogProps> = ({
  isOpen,
  onClose,
  onConfirm,
  title,
  isDeleting,
}) => (
  <Dialog
    open={isOpen}
    onOpenChange={(open) => !open && onClose()}
    title="Delete question?"
    description={
      <>
        <span className="font-medium text-fg">{title}</span> will be removed from this contest, along with its test
        cases. This can't be undone.
      </>
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
          Delete question
        </Button>
      </>
    }
  />
);
