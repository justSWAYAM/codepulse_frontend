import React, { useEffect, useState } from 'react';
import { DragDropContext, Droppable, Draggable } from '@hello-pangea/dnd';
import type { DropResult } from '@hello-pangea/dnd';
import { useNavigate } from 'react-router-dom';
import { FileCode2, LibraryBig, Lock, Plus, Shuffle } from 'lucide-react';
import { Button, Card, Input, Skeleton } from '../ui';
import { EmptyState } from '../states/EmptyState';
import { QuestionCard } from './QuestionCard';
import { DeleteQuestionDialog } from './DeleteQuestionDialog';
import { useQuestions, useReorderQuestions, useDeleteQuestion } from '../../hooks/useQuestions';
import { useContest, useUpdateContest } from '../../hooks/useContests';
import type { UserRole } from '../../api/userApi';
import type { ContestDetailRecord, ContestRecord, ContestStatus } from '../../api/contestApi';
import { LibraryPickerDialog } from '../library/LibraryPickerDialog';
import { cn } from '../../lib/cn';

interface QuestionListPanelProps {
  contestId: string;
  role: UserRole;
  contestStatus: ContestStatus;
  contest?: ContestRecord | ContestDetailRecord;
}

export const QuestionListPanel: React.FC<QuestionListPanelProps> = ({
  contestId,
  role,
  contestStatus,
  contest,
}) => {
  const navigate = useNavigate();
  const isAdmin = role === 'ADMIN';
  const isCandidate = role === 'CANDIDATE';
  // Questions freeze once the contest starts (the backend refuses changes too)
  const locked = contestStatus === 'ONGOING' || contestStatus === 'COMPLETED';
  const canEdit = isAdmin && !locked;

  const { data: questions = [], isLoading } = useQuestions(contestId);
  const reorderMutation = useReorderQuestions(contestId);
  const deleteMutation = useDeleteQuestion(contestId);

  const { data: fetchedContest } = useContest(contestId);
  const currentContest = contest ?? fetchedContest;
  const updateContestMutation = useUpdateContest(contestId);

  const [randomizeEnabled, setRandomizeEnabled] = useState(false);
  const [questionsPerCandidate, setQuestionsPerCandidate] = useState<number>(1);
  const [isInitialized, setIsInitialized] = useState(false);

  useEffect(() => {
    if (currentContest && !isInitialized) {
      setRandomizeEnabled(Boolean(currentContest.randomizeQuestions));
      setQuestionsPerCandidate(
        currentContest.questionsPerCandidate ?? (questions.length > 0 ? questions.length : 1),
      );
      setIsInitialized(true);
    }
  }, [currentContest, isInitialized, questions.length]);

  const hasChanges =
    currentContest &&
    (randomizeEnabled !== Boolean(currentContest.randomizeQuestions) ||
      (randomizeEnabled && questionsPerCandidate !== currentContest.questionsPerCandidate));

  const isCountTooHigh =
    randomizeEnabled && questions.length > 0 && questionsPerCandidate > questions.length;
  const isInvalid = randomizeEnabled && (questionsPerCandidate < 1 || isCountTooHigh);

  const handleSaveRandomSettings = () => {
    if (isInvalid) return;
    updateContestMutation.mutate({
      randomizeQuestions: randomizeEnabled,
      questionsPerCandidate: randomizeEnabled ? Number(questionsPerCandidate) : null,
    });
  };

  const [deleteDialog, setDeleteDialog] = useState<{ isOpen: boolean; id: string; title: string }>({
    isOpen: false,
    id: '',
    title: '',
  });
  const [libraryPickerOpen, setLibraryPickerOpen] = useState(false);

  const handleDragEnd = (result: DropResult) => {
    if (!result.destination || !canEdit) return;
    if (result.destination.index === result.source.index) return;

    // Create a new array and move the item
    const items = Array.from(questions);
    const [reorderedItem] = items.splice(result.source.index, 1);
    items.splice(result.destination.index, 0, reorderedItem);

    // Call API with new ordered list of IDs
    const orderedIds = items.map((item) => item.id);
    reorderMutation.mutate({ orderedIds });
  };

  const handleDelete = () => {
    if (deleteDialog.id) {
      deleteMutation.mutate(deleteDialog.id, {
        onSuccess: () => setDeleteDialog({ isOpen: false, id: '', title: '' }),
      });
    }
  };

  const addButton = (
    <Button
      size="sm"
      onClick={() => navigate(`/dashboard/contests/${contestId}/questions/new`)}
      leadingIcon={<Plus className="size-4" />}
    >
      Add question
    </Button>
  );

  const addFromLibraryButton = canEdit ? (
    <Button
      size="sm"
      variant="secondary"
      onClick={() => setLibraryPickerOpen(true)}
      leadingIcon={<LibraryBig className="size-4" />}
    >
      Add from library
    </Button>
  ) : null;

  if (isLoading) {
    return (
      <div className="space-y-3" aria-busy="true">
        {[1, 2, 3].map((i) => (
          <Skeleton key={i} className="h-[66px] rounded-xl" />
        ))}
      </div>
    );
  }

  // Candidate view restrictions
  if (isCandidate && contestStatus !== 'ONGOING') {
    return (
      <Card>
        <EmptyState
          icon={<FileCode2 className="size-5" />}
          title="Questions hidden"
          message="Questions appear here when the contest starts. Come back at the start time."
        />
      </Card>
    );
  }

  if (questions.length === 0) {
    return (
      <>
        <Card>
          <EmptyState
            icon={<FileCode2 className="size-5" />}
            title="No questions yet"
            message={
              canEdit
                ? 'Add the first programming question to this contest.'
                : 'No questions have been added to this contest yet.'
            }
            action={
              canEdit ? (
                <div className="flex flex-wrap justify-center gap-2">
                  {addButton}
                  {addFromLibraryButton}
                </div>
              ) : undefined
            }
          />
        </Card>
        <LibraryPickerDialog contestId={contestId} open={libraryPickerOpen} onOpenChange={setLibraryPickerOpen} />
      </>
    );
  }

  return (
    <div className="space-y-4">
      {isAdmin && (
        <div className="flex items-center justify-between gap-3">
          <h2 className="font-display text-[15px] font-semibold tracking-[-0.015em] text-fg">
            Questions <span className="tabular text-fg-subtle">({questions.length})</span>
          </h2>
          {canEdit && (
            <div className="flex flex-wrap justify-end gap-2">
              {addFromLibraryButton}
              {addButton}
            </div>
          )}
        </div>
      )}

      {/* Random Question Assignment Configuration (Admin, DRAFT) */}
      {isAdmin && canEdit && (
        <Card className="p-4 sm:p-5">
          <div className="flex items-start justify-between gap-4">
            <div className="space-y-1">
              <div className="flex items-center gap-2">
                <Shuffle className="size-4 text-primary" aria-hidden />
                <span className="text-[14px] font-semibold text-fg">Random Question Assignment</span>
                {randomizeEnabled && (
                  <span className="rounded-md bg-primary-soft px-2 py-0.5 text-[11px] font-medium text-primary-text">
                    Active
                  </span>
                )}
              </div>
              <p className="text-xs text-fg-subtle">
                Randomly assign a subset of questions from this pool to each candidate when their exam begins.
              </p>
            </div>
            <button
              type="button"
              role="switch"
              aria-checked={randomizeEnabled}
              onClick={() => setRandomizeEnabled(!randomizeEnabled)}
              className={cn(
                'relative inline-flex h-6 w-11 shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-200 ease-in-out focus:outline-none focus-visible:ring-2 focus-visible:ring-primary',
                randomizeEnabled ? 'bg-primary' : 'bg-surface-3',
              )}
            >
              <span
                className={cn(
                  'pointer-events-none inline-block size-5 transform rounded-full bg-white shadow ring-0 transition duration-200 ease-in-out',
                  randomizeEnabled ? 'translate-x-5' : 'translate-x-0',
                )}
              />
            </button>
          </div>

          {randomizeEnabled && (
            <div className="mt-4 border-t border-line pt-4 space-y-3">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                <div className="space-y-0.5">
                  <label htmlFor="questions-per-candidate-input" className="text-xs font-medium text-fg">
                    Questions per candidate
                  </label>
                  <p className="text-xs text-fg-subtle">
                    Each candidate will receive <strong>{questionsPerCandidate}</strong> random question
                    {questionsPerCandidate !== 1 ? 's' : ''} out of the <strong>{questions.length}</strong> available
                    in the pool.
                  </p>
                </div>
                <div className="flex items-center gap-2 shrink-0">
                  <Input
                    id="questions-per-candidate-input"
                    type="number"
                    min={1}
                    max={questions.length}
                    value={questionsPerCandidate}
                    onChange={(e) => {
                      const val = parseInt(e.target.value, 10);
                      setQuestionsPerCandidate(isNaN(val) ? 1 : Math.max(1, val));
                    }}
                    className="w-24 h-9 text-sm tabular font-medium text-center"
                  />
                  <Button
                    size="sm"
                    onClick={handleSaveRandomSettings}
                    loading={updateContestMutation.isPending}
                    disabled={!hasChanges || isInvalid}
                  >
                    Save
                  </Button>
                </div>
              </div>

              {isCountTooHigh && (
                <p className="text-xs text-danger-text font-medium">
                  Cannot assign {questionsPerCandidate} questions: there are only {questions.length} questions in the contest pool.
                </p>
              )}
            </div>
          )}

          {!randomizeEnabled && hasChanges && (
            <div className="mt-3 border-t border-line pt-3 flex justify-end">
              <Button
                size="sm"
                variant="secondary"
                onClick={handleSaveRandomSettings}
                loading={updateContestMutation.isPending}
              >
                Save disabled state
              </Button>
            </div>
          )}
        </Card>
      )}

      {/* Read-only Random Assignment Badge when locked or published */}
      {currentContest?.randomizeQuestions && (locked || contestStatus === 'PUBLISHED') && (
        <div className="flex items-center gap-2.5 rounded-xl border border-primary/25 bg-primary-soft/30 px-3.5 py-2.5 text-xs text-fg">
          <Shuffle className="size-4 text-primary shrink-0" aria-hidden />
          <span>
            <strong>Random Question Assignment Active:</strong> Each candidate receives{' '}
            <strong>{currentContest.questionsPerCandidate}</strong> random questions drawn from this pool of {questions.length} questions.
          </span>
        </div>
      )}

      {isAdmin && locked && (
        <p className="flex items-center gap-2 rounded-xl border border-line bg-surface-2/60 px-3.5 py-2.5 text-[13px] text-fg-muted">
          <Lock className="size-3.5 shrink-0 text-fg-subtle" aria-hidden />
          This contest is {contestStatus === 'ONGOING' ? 'live' : 'completed'}, so its questions and test cases are locked.
        </p>
      )}

      {isAdmin && locked ? (
        <div className="space-y-2">
          {questions.map((question, index) => (
            <QuestionCard
              key={question.id}
              question={question}
              role={role}
              index={index}
              readOnly
              onEdit={(id) => navigate(`/dashboard/contests/${contestId}/questions/${id}/edit`)}
            />
          ))}
        </div>
      ) : isAdmin ? (
        <DragDropContext onDragEnd={handleDragEnd}>
          <Droppable droppableId="questions-list">
            {(provided) => (
              <div {...provided.droppableProps} ref={provided.innerRef} className="space-y-2">
                {questions.map((question, index) => (
                  <Draggable key={question.id} draggableId={question.id} index={index}>
                    {(provided) => (
                      <div
                        ref={provided.innerRef}
                        {...provided.draggableProps}
                        {...provided.dragHandleProps}
                        style={{ ...provided.draggableProps.style }}
                      >
                        <QuestionCard
                          question={question}
                          role={role}
                          index={index}
                          onEdit={(id) => navigate(`/dashboard/contests/${contestId}/questions/${id}/edit`)}
                          onDelete={(id, title) => setDeleteDialog({ isOpen: true, id, title })}
                        />
                      </div>
                    )}
                  </Draggable>
                ))}
                {provided.placeholder}
              </div>
            )}
          </Droppable>
        </DragDropContext>
      ) : (
        <div className="space-y-2">
          {questions.map((question, index) => (
            <QuestionCard
              key={question.id}
              question={question}
              role={role}
              index={index}
              onClick={() => {
                // Future integration for Module 6 (Assessment)
                console.log(`Navigate to assessment question ${question.id}`);
              }}
            />
          ))}
        </div>
      )}

      <DeleteQuestionDialog
        isOpen={deleteDialog.isOpen}
        onClose={() => setDeleteDialog({ isOpen: false, id: '', title: '' })}
        onConfirm={handleDelete}
        title={deleteDialog.title}
        isDeleting={deleteMutation.isPending}
      />
      <LibraryPickerDialog contestId={contestId} open={libraryPickerOpen} onOpenChange={setLibraryPickerOpen} />
    </div>
  );
};
