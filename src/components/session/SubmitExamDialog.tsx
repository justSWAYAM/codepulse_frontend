import React from 'react';
import { AlertTriangle, Send } from 'lucide-react';
import { Button, Dialog } from '../ui';

interface SubmitExamDialogProps {
  isOpen: boolean;
  onClose: () => void;
  onConfirm: () => void;
  isSubmitting: boolean;
}

/** Confirmation before the manual final submit. Irreversible — ends the session. */
export const SubmitExamDialog: React.FC<SubmitExamDialogProps> = ({ isOpen, onClose, onConfirm, isSubmitting }) => (
  <Dialog
    open={isOpen}
    onOpenChange={(o) => !o && onClose()}
    dismissible={!isSubmitting}
    tone="warning"
    icon={<AlertTriangle className="size-5" />}
    size="sm"
    title="Submit your exam?"
    description="You won’t be able to make further changes, and any time remaining is forfeited. Your best submission for each question is what counts."
    footer={
      <>
        <Button variant="secondary" onClick={onClose} disabled={isSubmitting}>
          Keep working
        </Button>
        <Button variant="danger" onClick={onConfirm} loading={isSubmitting} leadingIcon={<Send className="size-4" />}>
          Submit exam
        </Button>
      </>
    }
  />
);
