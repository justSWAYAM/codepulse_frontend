import React, { useState } from 'react';
import { DragDropContext, Droppable, Draggable } from '@hello-pangea/dnd';
import type { DropResult } from '@hello-pangea/dnd';
import { useNavigate } from 'react-router-dom';
import { FileCode2, Plus } from 'lucide-react';
import { Button, Card, Skeleton } from '../ui';
import { EmptyState } from '../states/EmptyState';
import { QuestionCard } from './QuestionCard';
import { DeleteQuestionDialog } from './DeleteQuestionDialog';
import { useQuestions, useReorderQuestions, useDeleteQuestion } from '../../hooks/useQuestions';
import type { UserRole } from '../../api/userApi';
import type { ContestStatus } from '../../api/contestApi';

interface QuestionListPanelProps {
  contestId: string;
  role: UserRole;
  contestStatus: ContestStatus;
}

export const QuestionListPanel: React.FC<QuestionListPanelProps> = ({
  contestId,
  role,
  contestStatus,
}) => {
  const navigate = useNavigate();
  const isAdmin = role === 'ADMIN';
  const isCandidate = role === 'CANDIDATE';

  const { data: questions = [], isLoading } = useQuestions(contestId);
  const reorderMutation = useReorderQuestions(contestId);
  const deleteMutation = useDeleteQuestion(contestId);

  const [deleteDialog, setDeleteDialog] = useState<{ isOpen: boolean; id: string; title: string }>({
    isOpen: false,
    id: '',
    title: '',
  });

  const handleDragEnd = (result: DropResult) => {
    if (!result.destination || !isAdmin) return;
    if (result.destination.index === result.source.index) return;

    // Create a new array and move the item
    const items = Array.from(questions);
    const [reorderedItem] = items.splice(result.source.index, 1);
    items.splice(result.destination.index, 0, reorderedItem);

    // Call API with new ordered list of IDs
    const orderedIds = items.map(item => item.id);
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
      <Card>
        <EmptyState
          icon={<FileCode2 className="size-5" />}
          title="No questions yet"
          message={
            isAdmin
              ? 'Add the first programming question to this contest.'
              : 'No questions have been added to this contest yet.'
          }
          action={isAdmin ? addButton : undefined}
        />
      </Card>
    );
  }

  return (
    <div className="space-y-4">
      {isAdmin && (
        <div className="flex items-center justify-between gap-3">
          <h2 className="font-display text-[15px] font-semibold tracking-[-0.015em] text-fg">
            Questions <span className="tabular text-fg-subtle">({questions.length})</span>
          </h2>
          {addButton}
        </div>
      )}

      {isAdmin ? (
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
    </div>
  );
};
