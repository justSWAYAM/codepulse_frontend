import React from 'react';
import { Code2 } from 'lucide-react';

/**
 * EditorSlot — right region placeholder for Module 8's CodeEditorPanel.
 * Contains no editor code. When Module 8 lands, this file is replaced
 * by CodeEditorPanel; nothing else in the page changes.
 */
export const EditorSlot: React.FC = () => {
  return (
    <div className="h-full flex flex-col items-center justify-center bg-ink/[0.02] border-l border-hairline">
      <div className="flex flex-col items-center gap-4 text-center px-6">
        <div className="w-14 h-14 rounded-2xl bg-ink/5 flex items-center justify-center">
          <Code2 className="w-7 h-7 text-ink/20" />
        </div>
        <div>
          <p className="text-sm font-medium text-ink/30 mb-1">Code Editor</p>
          <p className="text-xs text-ink/20 max-w-[200px]">
            Code editor arrives with the Submission module
          </p>
        </div>
      </div>
    </div>
  );
};
