import React, { useState, useEffect } from 'react';
import { AlertTriangle, RefreshCw } from 'lucide-react';
import { toast } from 'sonner';
import { Button, Dialog, Field, Select, Textarea } from '../ui';
import { useChangeSessionQuestion } from '../../hooks/useContests';
import { getErrorMessage } from '../../lib/apiError';
import type { CandidateSessionAssignment } from '../../api/contestApi';

interface ChangeQuestionModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  contestId: string;
  assignment: CandidateSessionAssignment | null;
  onSuccess?: () => void;
}

export const ChangeQuestionModal: React.FC<ChangeQuestionModalProps> = ({
  open,
  onOpenChange,
  contestId,
  assignment,
  onSuccess,
}) => {
  const changeMutation = useChangeSessionQuestion(contestId);
  const [currentQuestionId, setCurrentQuestionId] = useState('');
  const [newQuestionId, setNewQuestionId] = useState('');
  const [reason, setReason] = useState('');

  useEffect(() => {
    if (open && assignment) {
      setCurrentQuestionId(assignment.assignedQuestions[0]?.questionId ?? '');
      setNewQuestionId(assignment.availablePoolQuestions[0]?.questionId ?? '');
      setReason('');
    }
  }, [open, assignment]);

  if (!assignment || !assignment.sessionId) return null;
  const sessionId = assignment.sessionId;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!currentQuestionId || !newQuestionId) {
      toast.error('Please select both the question to replace and the replacement question.');
      return;
    }

    try {
      await changeMutation.mutateAsync({
        sessionId,
        payload: {
          currentQuestionId,
          newQuestionId,
          reason: reason.trim() || undefined,
        },
      });
      onOpenChange(false);
      onSuccess?.();
    } catch (err) {
      toast.error(getErrorMessage(err, 'Failed to swap question'));
    }
  };

  const hasPoolQuestions = assignment.availablePoolQuestions.length > 0;

  return (
    <Dialog
      open={open}
      onOpenChange={onOpenChange}
      size="md"
      title="Change Assigned Question"
      description={`Swap an assigned question for ${assignment.candidateName}.`}
      icon={<RefreshCw className="size-5 text-warning" />}
      footer={
        <>
          <Button
            type="button"
            variant="secondary"
            onClick={() => onOpenChange(false)}
            disabled={changeMutation.isPending}
          >
            Cancel
          </Button>
          <Button
            type="submit"
            form="change-question-form"
            loading={changeMutation.isPending}
            disabled={!hasPoolQuestions || !currentQuestionId || !newQuestionId}
            leadingIcon={<RefreshCw className="size-4" />}
          >
            Confirm Swap (-5 pts)
          </Button>
        </>
      }
    >
      <form id="change-question-form" onSubmit={handleSubmit} className="space-y-4">
        {/* Warning Penalty Notice */}
        <div className="flex items-start gap-3 rounded-xl border border-warning/30 bg-warning/10 p-3.5 text-[13px] text-fg">
          <AlertTriangle className="size-5 shrink-0 text-warning" />
          <div className="space-y-1">
            <p className="font-semibold text-warning-text">Score Penalty Notice (-5 points)</p>
            <p className="text-fg-muted">
              Swapping this question will immediately replace it in the candidate's exam session and deduct{' '}
              <strong className="text-fg">5.00 points</strong> from their final score.
              {assignment.questionChangeCount > 0 && (
                <span className="block mt-1 text-fg-subtle">
                  This candidate has previously swapped {assignment.questionChangeCount}{' '}
                  {assignment.questionChangeCount === 1 ? 'question' : 'questions'} (-
                  {assignment.questionChangePenalty} pts).
                </span>
              )}
            </p>
          </div>
        </div>

        {/* Question to replace */}
        <Field label="Question to Replace" required>
          {({ id }) => (
            <Select
              id={id}
              value={currentQuestionId}
              onChange={(e) => setCurrentQuestionId(e.target.value)}
              disabled={changeMutation.isPending}
            >
              {assignment.assignedQuestions.map((q) => (
                <option key={q.questionId} value={q.questionId}>
                  #{q.orderIndex} — {q.title} ({q.points} pts, {q.difficulty})
                </option>
              ))}
            </Select>
          )}
        </Field>

        {/* Replacement Question */}
        <Field label="Replacement Question (From Contest Pool)" required>
          {({ id }) =>
            hasPoolQuestions ? (
              <Select
                id={id}
                value={newQuestionId}
                onChange={(e) => setNewQuestionId(e.target.value)}
                disabled={changeMutation.isPending}
              >
                {assignment.availablePoolQuestions.map((q) => (
                  <option key={q.questionId} value={q.questionId}>
                    {q.title} ({q.points} pts, {q.difficulty})
                  </option>
                ))}
              </Select>
            ) : (
              <p className="text-xs text-danger">No additional unassigned questions available in this contest pool.</p>
            )
          }
        </Field>

        {/* Reason */}
        <Field label="Reason / Notes (Optional)">
          {({ id }) => (
            <Textarea
              id={id}
              value={reason}
              onChange={(e) => setReason(e.target.value)}
              placeholder="e.g. Candidate requested alternate problem due to technical difficulty"
              rows={2}
              disabled={changeMutation.isPending}
            />
          )}
        </Field>
      </form>
    </Dialog>
  );
};
