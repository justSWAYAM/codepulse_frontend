Here is the detailed, file-by-file frontend implementation plan for **Module 5A (Question Library)**, built on your stack (**React 19 + TypeScript + Vite + Tailwind CSS + shadcn/ui + TanStack Query + TanStack Table**).

---

## 1. Directory Structure & New Files

```text
src/
├── features/
│   └── library/
│       ├── api/
│       │   ├── libraryApi.ts
│       │   └── libraryHooks.ts
│       ├── components/
│       │   ├── SubjectFolderTree.tsx
│       │   ├── LibraryQuestionTable.tsx
│       │   └── LibraryPickerDialog.tsx
│       └── pages/
│           └── QuestionLibraryPage.tsx

```

---

## 2. API Service Layer (`libraryApi.ts`)

**Location:** `src/features/library/api/libraryApi.ts`

Uses your shared `apiClient` Axios instance.

```typescript
import apiClient from '@/lib/apiClient';
import { PagedResponse } from '@/types/api';
import { QuestionType, Difficulty } from '@/types/question';

export interface Subject {
  id: string;
  name: string;
  createdBy: string;
  createdAt: string;
}

export interface LibraryQuestion {
  id: string;
  title: string;
  questionType: QuestionType;
  difficulty: Difficulty;
  points: number;
  subjectId: string;
  subjectName: string;
  authorName: string;
  createdAt: string;
}

export interface LibraryQueryParams {
  subjectId?: string;
  type?: QuestionType;
  page?: number;
  size?: number;
  search?: string;
}

export const libraryApi = {
  getSubjects: async (): Promise<Subject[]> => {
    const { data } = await apiClient.get('/api/library/subjects');
    return data.data;
  },

  createSubject: async (name: string): Promise<Subject> => {
    const { data } = await apiClient.post('/api/library/subjects', { name });
    return data.data;
  },

  getQuestions: async (params: LibraryQueryParams): Promise<PagedResponse<LibraryQuestion>> => {
    const { data } = await apiClient.get('/api/library/questions', { params });
    return data.data;
  },

  addToContest: async (contestId: string, questionIds: string[]): Promise<void> => {
    await apiClient.post(`/api/contests/${contestId}/questions/from-library`, { questionIds });
  },
};

```

---

## 3. TanStack Query Hooks (`libraryHooks.ts`)

**Location:** `src/features/library/api/libraryHooks.ts`

```typescript
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { libraryApi, LibraryQueryParams } from './libraryApi';
import { toast } from 'sonner';

export const useSubjects = () => {
  return useQuery({
    queryKey: ['library-subjects'],
    queryFn: libraryApi.getSubjects,
  });
};

export const useCreateSubject = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (name: string) => libraryApi.createSubject(name),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['library-subjects'] });
      toast.success('Subject folder created successfully');
    },
    onError: (err: any) => {
      toast.error(err.response?.data?.message || 'Failed to create subject folder');
    },
  });
};

export const useLibraryQuestions = (params: LibraryQueryParams) => {
  return useQuery({
    queryKey: ['library-questions', params],
    queryFn: () => libraryApi.getQuestions(params),
    placeholderData: (previousData) => previousData,
  });
};

export const useAddQuestionsToContest = (contestId: string) => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (questionIds: string[]) => libraryApi.addToContest(contestId, questionIds),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['contest-questions', contestId] });
      toast.success('Selected questions added to contest successfully');
    },
    onError: (err: any) => {
      toast.error(err.response?.data?.message || 'Failed to add questions to contest');
    },
  });
};

```

---

## 4. UI Components

### A. Subject Folder Tree (`SubjectFolderTree.tsx`)

**Location:** `src/features/library/components/SubjectFolderTree.tsx`

Allows evaluators/admins to browse questions by subject folders.

```tsx
import React, { useState } from 'react';
import { useSubjects, useCreateSubject } from '../api/libraryHooks';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Folder, Plus, FolderOpen } from 'lucide-react';

interface SubjectFolderTreeProps {
  selectedSubjectId?: string;
  onSelectSubject: (subjectId?: string) => void;
}

export const SubjectFolderTree: React.FC<SubjectFolderTreeProps> = ({
  selectedSubjectId,
  onSelectSubject,
}) => {
  const { data: subjects, isLoading } = useSubjects();
  const createSubject = useCreateSubject();
  const [newFolderName, setNewFolderName] = useState('');
  const [isCreating, setIsCreating] = useState(false);

  const handleCreate = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newFolderName.trim()) return;
    createSubject.mutate(newFolderName.trim(), {
      onSuccess: () => {
        setNewFolderName('');
        setIsCreating(false);
      },
    });
  };

  if (isLoading) return <div className="p-4 text-sm text-muted-foreground">Loading folders...</div>;

  return (
    <div className="space-y-2 p-2">
      <div className="flex items-center justify-between px-2 pb-2 border-b">
        <span className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
          Subjects / Folders
        </span>
        <Button variant="ghost" size="icon" className="h-6 w-6" onClick={() => setIsCreating(!isCreating)}>
          <Plus className="h-4 w-4" />
        </Button>
      </div>

      {isCreating && (
        <form onSubmit={handleCreate} className="space-y-2 p-1">
          <Input
            placeholder="Folder name..."
            value={newFolderName}
            onChange={(e) => setNewFolderName(e.target.value)}
            className="h-8 text-xs"
            autoFocus
          />
          <div className="flex gap-1 justify-end">
            <Button type="button" variant="ghost" size="sm" className="h-7 text-xs" onClick={() => setIsCreating(false)}>
              Cancel
            </Button>
            <Button type="submit" size="sm" className="h-7 text-xs">Add</Button>
          </div>
        </form>
      )}

      <div className="space-y-1">
        <button
          onClick={() => onSelectSubject(undefined)}
          className={`w-full flex items-center gap-2 px-2 py-1.5 rounded-md text-sm text-left transition-colors ${
            !selectedSubjectId ? 'bg-primary/10 text-primary font-medium' : 'hover:bg-muted text-muted-foreground'
          }`}
        >
          <FolderOpen className="h-4 w-4" />
          <span>All Questions</span>
        </button>

        {subjects?.map((sub) => {
          const isSelected = selectedSubjectId === sub.id;
          return (
            <button
              key={sub.id}
              onClick={() => onSelectSubject(sub.id)}
              className={`w-full flex items-center gap-2 px-2 py-1.5 rounded-md text-sm text-left transition-colors ${
                isSelected ? 'bg-primary/10 text-primary font-medium' : 'hover:bg-muted text-muted-foreground'
              }`}
            >
              <Folder className="h-4 w-4" />
              <span className="truncate">{sub.name}</span>
            </button>
          );
        })}
      </div>
    </div>
  );
};

```

### B. Library Question Table (`LibraryQuestionTable.tsx`)

**Location:** `src/features/library/components/LibraryQuestionTable.tsx`

Reuses your shared `DataTable` component.

```tsx
import React, { useState } from 'react';
import { useLibraryQuestions } from '../api/libraryHooks';
import { DataTable } from '@/components/shared/DataTable';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { QuestionType } from '@/types/question';

interface LibraryQuestionTableProps {
  selectedSubjectId?: string;
  selectable?: boolean;
  selectedIds?: string[];
  onSelectionChange?: (ids: string[]) => void;
}

export const LibraryQuestionTable: React.FC<LibraryQuestionTableProps> = ({
  selectedSubjectId,
  selectable = false,
  selectedIds = [],
  onSelectionChange,
}) => {
  const [page, setPage] = useState(0);
  const [type, setType] = useState<QuestionType | undefined>(undefined);
  const [search, setSearch] = useState('');

  const { data, isLoading } = useLibraryQuestions({
    subjectId: selectedSubjectId,
    type,
    page,
    size: 10,
    search,
  });

  const columns = [
    ...(selectable ? [{
      id: 'select',
      header: () => <span />,
      cell: ({ row }: any) => (
        <input
          type="checkbox"
          checked={selectedIds.includes(row.original.id)}
          onChange={(e) => {
            if (e.target.checked) {
              onSelectionChange?.([...selectedIds, row.original.id]);
            } else {
              onSelectionChange?.(selectedIds.filter((id) => id !== row.original.id));
            }
          }}
          className="rounded border-input"
        />
      ),
    }] : []),
    {
      accessorKey: 'title',
      header: 'Title',
      cell: ({ row }: any) => <span className="font-medium">{row.original.title}</span>,
    },
    {
      accessorKey: 'questionType',
      header: 'Type',
      cell: ({ row }: any) => <Badge variant="outline">{row.original.questionType}</Badge>,
    },
    {
      accessorKey: 'difficulty',
      header: 'Difficulty',
      cell: ({ row }: any) => {
        const diff = row.original.difficulty;
        const color = diff === 'EASY' ? 'bg-green-500/10 text-green-500' : diff === 'MEDIUM' ? 'bg-yellow-500/10 text-yellow-500' : 'bg-red-500/10 text-red-500';
        return <span className={`px-2 py-0.5 rounded text-xs font-semibold ${color}`}>{diff}</span>;
      },
    },
    {
      accessorKey: 'subjectName',
      header: 'Subject',
    },
    {
      accessorKey: 'authorName',
      header: 'Author',
    },
  ];

  return (
    <div className="space-y-4">
      <div className="flex gap-4 items-center justify-between">
        <Input
          placeholder="Search questions..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          className="max-w-sm"
        />
        <Select value={type || 'ALL'} onValueChange={(val) => setType(val === 'ALL' ? undefined : (val as QuestionType))}>
          <SelectTrigger className="w-[180px]">
            <SelectValue placeholder="Filter Type" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="ALL">All Types</SelectItem>
            <SelectItem value="DSA">DSA</SelectItem>
            <SelectItem value="SQL">SQL</SelectItem>
            <SelectItem value="MCQ">MCQ</SelectItem>
            <SelectItem value="THEORY">Theory</SelectItem>
          </SelectContent>
        </Select>
      </div>

      <DataTable
        columns={columns}
        data={data?.content || []}
        isLoading={isLoading}
        pageCount={data?.totalPages || 0}
        pageIndex={page}
        onPageChange={setPage}
      />
    </div>
  );
};

```

### C. Contest Picker Dialog (`LibraryPickerDialog.tsx`)

**Location:** `src/features/library/components/LibraryPickerDialog.tsx`

Mounted inside your `ContestDetailPage` to allow teachers to pick questions from the library and copy them into their exam.

```tsx
import React, { useState } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { SubjectFolderTree } from './SubjectFolderTree';
import { LibraryQuestionTable } from './LibraryQuestionTable';
import { useAddQuestionsToContest } from '../api/libraryHooks';
import { toast } from 'sonner';

interface LibraryPickerDialogProps {
  contestId: string;
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export const LibraryPickerDialog: React.FC<LibraryPickerDialogProps> = ({ contestId, open, onOpenChange }) => {
  const [selectedSubjectId, setSelectedSubjectId] = useState<string | undefined>();
  const [selectedQuestionIds, setSelectedQuestionIds] = useState<string[]>([]);
  const addQuestions = useAddQuestionsToContest(contestId);

  const handleImport = () => {
    if (selectedQuestionIds.length === 0) {
      toast.error('Please select at least one question');
      return;
    }
    addQuestions.mutate(selectedQuestionIds, {
      onSuccess: () => {
        setSelectedQuestionIds([]);
        onOpenChange(false);
      },
    });
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-5xl h-[80vh] flex flex-col">
        <DialogHeader>
          <DialogTitle>Add Questions from Library</DialogTitle>
        </DialogHeader>

        <div className="grid grid-cols-4 gap-4 flex-1 overflow-hidden border-t pt-4">
          <div className="col-span-1 border-r pr-4 overflow-y-auto">
            <SubjectFolderTree
              selectedSubjectId={selectedSubjectId}
              onSelectSubject={setSelectedSubjectId}
            />
          </div>
          <div className="col-span-3 overflow-y-auto">
            <LibraryQuestionTable
              selectedSubjectId={selectedSubjectId}
              selectable={true}
              selectedIds={selectedQuestionIds}
              onSelectionChange={setSelectedQuestionIds}
            />
          </div>
        </div>

        <DialogFooter className="border-t pt-4">
          <div className="flex items-center justify-between w-full">
            <span className="text-sm text-muted-foreground">
              {selectedQuestionIds.length} question(s) selected
            </span>
            <div className="flex gap-2">
              <Button variant="outline" onClick={() => onOpenChange(false)}>Cancel</Button>
              <Button onClick={handleImport} disabled={selectedQuestionIds.length === 0 || addQuestions.isPending}>
                Import Selected
              </Button>
            </div>
          </div>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};

```

---

## 5. Main Page (`QuestionLibraryPage.tsx`)

**Location:** `src/features/library/pages/QuestionLibraryPage.tsx`

Registered as a dedicated route (`/library`) inside your `AppShell` layout.

```tsx
import React, { useState } from 'react';
import { SubjectFolderTree } from '../components/SubjectFolderTree';
import { LibraryQuestionTable } from '../components/LibraryQuestionTable';
import { Button } from '@/components/ui/button';
import { Plus } from 'lucide-react';
import { useNavigate } from 'react-router-dom';

export const QuestionLibraryPage: React.FC = () => {
  const [selectedSubjectId, setSelectedSubjectId] = useState<string | undefined>();
  const navigate = useNavigate();

  return (
    <div className="flex h-full gap-6 p-6">
      {/* Sidebar Folders */}
      <aside className="w-64 shrink-0 border rounded-lg bg-card p-4">
        <SubjectFolderTree
          selectedSubjectId={selectedSubjectId}
          onSelectSubject={setSelectedSubjectId}
        />
      </aside>

      {/* Main Content */}
      <main className="flex-1 flex flex-col gap-6 overflow-hidden">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold tracking-tight">Question Library</h1>
            <p className="text-sm text-muted-foreground">
              Manage shared institutional questions organized by subject folders.
            </p>
          </div>
          <Button onClick={() => navigate('/library/new')}>
            <Plus className="h-4 w-4 mr-2" />
            Create Question
          </Button>
        </div>

        <div className="flex-1 border rounded-lg bg-card p-4 overflow-y-auto">
          <LibraryQuestionTable selectedSubjectId={selectedSubjectId} />
        </div>
      </main>
    </div>
  );
};

export default QuestionLibraryPage;

```