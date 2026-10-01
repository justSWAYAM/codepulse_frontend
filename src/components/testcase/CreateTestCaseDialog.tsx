import React from 'react';
import { FlaskConical } from 'lucide-react';
import { Dialog } from '../ui';
import { TestCaseForm } from './TestCaseForm';
import type { TestCaseFormData } from './TestCaseForm';

interface CreateTestCaseDialogProps {
  isOpen: boolean;
  onClose: () => void;
  onSubmit: (data: TestCaseFormData) => void;
  isPending: boolean;
}

export const CreateTestCaseDialog: React.FC<CreateTestCaseDialogProps> = ({
  isOpen,
  onClose,
  onSubmit,
  isPending,
}) => (
  <Dialog
    open={isOpen}
    onOpenChange={(open) => !open && onClose()}
    title="Add test case"
    description="Define the input and the output a correct solution prints."
    icon={<FlaskConical className="size-5" />}
    size="lg"
    dismissible={!isPending}
  >
    <TestCaseForm onSubmit={onSubmit} isPending={isPending} />
  </Dialog>
);
