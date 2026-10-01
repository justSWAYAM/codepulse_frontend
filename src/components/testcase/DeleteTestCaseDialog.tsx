import React from 'react';
import { Trash2 } from 'lucide-react';
import { Button, Dialog } from '../ui';

interface DeleteTestCaseDialogProps {
  isOpen: boolean;
  onClose: () => void;
  onConfirm: () => void;
  isDeleting: boolean;
}

export const DeleteTestCaseDialog: React.FC<DeleteTestCaseDialogProps> = ({
  isOpen,
  onClose,
  onConfirm,
  isDeleting,
}) => (
  <Dialog
    open={isOpen}
    onOpenChange={(open) => !open && onClose()}
    title="Delete test case?"
    description="This can't be undone. Test cases can't be edited, so you'll need to re-create it from scratch if you still need it."
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
          Delete test case
        </Button>
      </>
    }
  />
);
