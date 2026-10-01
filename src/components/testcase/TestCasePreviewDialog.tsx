import React from 'react';
import { Eye } from 'lucide-react';
import { Badge, Dialog, Eyebrow } from '../ui';
import type { TestCaseAdminRecord } from '../../api/testCaseApi';

interface TestCasePreviewDialogProps {
  isOpen: boolean;
  onClose: () => void;
  testCase: TestCaseAdminRecord | null;
}

const CodeBlock: React.FC<{ label: string; value: string }> = ({ label, value }) => (
  <div>
    <Eyebrow className="mb-2">{label}</Eyebrow>
    <pre className="scroll-thin max-h-72 overflow-auto rounded-xl border border-editor-line bg-editor-bg px-4 py-3 font-mono text-[13px] leading-6 whitespace-pre-wrap break-words text-editor-fg">
      {value}
    </pre>
  </div>
);

export const TestCasePreviewDialog: React.FC<TestCasePreviewDialogProps> = ({ isOpen, onClose, testCase }) => {
  if (!testCase) return null;

  return (
    <Dialog
      open={isOpen}
      onOpenChange={(open) => !open && onClose()}
      title={`Test case #${testCase.orderIndex + 1}`}
      description={
        <span className="flex flex-wrap items-center gap-2">
          <Badge tone={testCase.isSample ? 'primary' : 'neutral'} size="sm">
            {testCase.isSample ? 'Sample' : 'Hidden'}
          </Badge>
          <span className="tabular">Weight {testCase.weight}</span>
        </span>
      }
      icon={<Eye className="size-5" />}
      size="lg"
    >
      <div className="space-y-4">
        <CodeBlock label="Input" value={testCase.input} />
        <CodeBlock label="Expected output" value={testCase.expectedOutput} />
      </div>
    </Dialog>
  );
};
