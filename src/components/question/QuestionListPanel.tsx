import React, { useState } from 'react';
import { DragDropContext, Droppable, Draggable } from '@hello-pangea/dnd';
import type { DropResult } from '@hello-pangea/dnd';
import { useNavigate } from 'react-router-dom';
import { FileCode2, Plus } from 'lucide-react';
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

  if (isLoading) {
    return (
      <div className="space-y-4">
        {[1, 2, 3].map((i) => (
          <div key={i} className="h-20 bg-surface-2 animate-pulse rounded-lg" />
        ))}
      </div>
    );
  }

  // Candidate view restrictions
  if (isCandidate && contestStatus !== 'ONGOING') {
    return (
      <div className="text-center py-12 bg-surface rounded-lg border border-line">
        <FileCode2 className="mx-auto h-12 w-12 text-fg-subtle mb-4" />
        <h3 className="text-lg font-medium text-fg">Questions hidden</h3>
        <p className="text-fg-muted mt-2">Questions will appear here when the contest starts.</p>
      </div>
    );
  }

  if (questions.length === 0) {
    return (
      <div className="text-center py-12 bg-surface rounded-lg border border-line">
        <FileCode2 className="mx-auto h-12 w-12 text-fg-subtle mb-4" />
        <h3 className="text-lg font-medium text-fg">No questions yet</h3>
        <p className="text-fg-muted mt-2 max-w-sm mx-auto">
          {isAdmin 
            ? "Get started by adding the first programming question to this contest."
            : "No questions have been added to this contest yet."}
        </p>
        {isAdmin && (
          <button
            onClick={() => navigate(`/dashboard/contests/${contestId}/questions/new`)}
            className="mt-6 inline-flex items-center gap-2 bg-primary text-white px-4 py-2 rounded-md hover:bg-primary-hover transition-colors"
          >
            <Plus size={20} />
            <span>Add Question</span>
          </button>
        )}
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {isAdmin && (
        <div className="flex justify-between items-center mb-6">
          <h2 className="text-lg font-medium text-fg">Questions ({questions.length})</h2>
          <button
            onClick={() => navigate(`/dashboard/contests/${contestId}/questions/new`)}
            className="inline-flex items-center gap-2 bg-primary text-white px-4 py-2 rounded-md hover:bg-primary-hover transition-colors text-sm font-medium"
          >
            <Plus size={18} />
            <span>Add Question</span>
          </button>
        </div>
      )}

      {isAdmin ? (
        <DragDropContext onDragEnd={handleDragEnd}>
          <Droppable droppableId="questions-list">
            {(provided) => (
              <div
                {...provided.droppableProps}
                ref={provided.innerRef}
                className="space-y-3"
              >
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
        <div className="space-y-3">
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
