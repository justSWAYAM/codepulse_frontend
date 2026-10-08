import { CopyPromptButton } from './CopyPromptButton';
import { supportsTestCasePrompt, buildTestCasePrompt, type PromptSource } from './testCasePrompts';

export function TestCasePromptButton({ question }: { question: PromptSource }) {
  if (!supportsTestCasePrompt(question.questionType)) return null; // hidden for MCQ/THEORY
  return (
    <CopyPromptButton
      label="Test Case Prompt"
      variant="secondary"
      getText={() => buildTestCasePrompt(question)}
    />
  );
}
