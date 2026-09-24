# CodePulse Enterprise — Module 4: Frontend Plan
**Scope: Frontend only. Pages in scope: Question List (embedded in Contest Detail), Question Create/Edit, Question Detail (candidate view with Monaco editor placeholder). Backend (Module 4) must be working — do not touch it.**

---

## 1. Purpose of This Document

This is the single reference for building Module 4 of the frontend. It contains:
- Design direction (continuing the established CodePulse light-mode identity)
- The full component and page inventory with rationale
- Shared components that must be completed or extended before Question pages work
- New dependencies needed and why
- A strict build sequence
- API layer specification

No code is written here — only specifications.

---

## 2. Tech Stack for Module 4

All core libraries were installed in previous modules. Two new dependencies are needed:

| Category | Library | Why |
|---|---|---|
| Build tool | Vite + React + TypeScript | Unchanged |
| Styling | Tailwind CSS | Unchanged |
| Animation | Framer Motion | List entrance animations, form transitions |
| Icons | lucide-react | `FileCode2`, `Trophy`, `Clock`, `ChevronUp`, `ChevronDown`, `GripVertical`, `Trash2`, `Pencil`, `Plus`, `Eye`, `MemoryStick` |
| Forms | React Hook Form + Zod | `QuestionCreatePage` and `QuestionEditPage` |
| Data/state | TanStack Query | `useQuestions()`, `useQuestion()`, `useCreateQuestion()`, `useUpdateQuestion()`, `useDeleteQuestion()`, `useReorderQuestions()` |
| HTTP | Axios | `questionApi.*` calls through `apiClient` |
| Routing | React Router v6+ | New routes nested under `/dashboard/contests/:id/questions` |
| Toasts | sonner | Success/error on create, update, delete, reorder |
| **NEW** | `react-markdown` | Render markdown descriptions in question detail view (candidate + admin) |
| **NEW** | `@hello-pangea/dnd` | Drag-and-drop reordering of questions in the admin question list (replaces `react-beautiful-dnd` which is unmaintained) |

**Install command:**
```bash
npm install react-markdown @hello-pangea/dnd
```

`remark-gfm` (GitHub Flavored Markdown — tables, strikethrough) can optionally be added alongside `react-markdown`:
```bash
npm install remark-gfm
```

---

## 3. Design Direction (Continuation of Module 3)

Module 4 introduces the first **content-authoring** pages. The design must balance the data-density of Module 3 (contest list/detail) with richer form layouts for the markdown editor.

### 3.1 Color tokens (unchanged from Module 1)

| Token | Hex | Use in Module 4 |
|---|---|---|
| `background` | `#FAFAF8` | Page background |
| `surface` | `#FFFFFF` | Question cards, form panels |
| `ink` | `#1B1E3A` | Headings, body text |
| `accent-compile` | `#2F9E6E` | EASY difficulty badge, Save button, action CTAs |
| `accent-syntax` | `#E8A33D` | MEDIUM difficulty badge, edit/reorder actions |
| `accent-error` | `#E85D4E` | HARD difficulty badge, delete confirmations, validation errors |
| `hairline` | `#E4E2DC` | Card borders, dividers |

### 3.2 Difficulty badge color mapping

The `DifficultyBadge` component (new in this module) maps to the platform's color system:

| Difficulty | Color | Rationale |
|---|---|---|
| `EASY` | `accent-compile` green | Green = passing tests = approachable |
| `MEDIUM` | `accent-syntax` amber | Amber = caution = requires more thought |
| `HARD` | `accent-error` red | Red = danger = challenging |

This is intentional color reuse of the existing palette — no new colors needed.

### 3.3 Typography (unchanged)

- **Display:** Space Grotesk for page titles (`Questions`, `Add Question`, question title in detail)
- **Body:** Inter for form labels, table content, description text
- **Mono:** JetBrains Mono for: point values, time/memory limits, question IDs — these are technical values and the monospace face is appropriate

### 3.4 Layout

- **Question List:** Embedded inside the `ContestDetailPage` (Module 3) as a new **"Questions" tab** alongside the existing "Overview" and "Candidates" tabs. This keeps all contest-related content in one place and avoids a separate `/questions` top-level route.
- **Question Create/Edit:** Full-page forms accessible via routes nested under `/dashboard/contests/:contestId/questions/new` and `/dashboard/contests/:contestId/questions/:questionId/edit`. The markdown editor needs breathing room — a full-page layout is appropriate.
- **Question Detail (candidate view):** Embedded within the Assessment page (Module 6) via a `QuestionPanel` component. This module only builds the standalone question display component; the full Assessment page integration is Module 6's responsibility.

---

## 4. Site Map for Module 4

```
/dashboard/contests/:id                            → ContestDetailPage (EXISTING — add "Questions" tab)
  tab: Overview                                    → EXISTING
  tab: Candidates                                  → EXISTING
  tab: Questions                                   → NEW — QuestionListPanel

/dashboard/contests/:contestId/questions/new       → QuestionCreatePage (NEW)
/dashboard/contests/:contestId/questions/:id/edit  → QuestionEditPage (NEW)
```

**Candidate-specific:**
The route `/dashboard/contests/:contestId/questions/:id` (standalone detail page) is intentionally **not** built in Module 4. Candidates will view questions within the Assessment Session UI (Module 6). What we build here is the `QuestionDetailCard` component that both Module 4 admin views and Module 6 candidate views will share.

---

## 5. Component Inventory

### 5.1 New Pages

#### `QuestionCreatePage` (`/dashboard/contests/:contestId/questions/new`)

| Property | Value |
|---|---|
| **Access** | Admin only (enforced by `ProtectedRoute`) |
| **Purpose** | Full-screen form to author a new question in a specific contest |
| **Layout** | Two-column: form fields (left, ~60%) + markdown preview (right, ~40%) with live preview as the admin types |
| **Form fields** | Title, Description (textarea/markdown editor), Difficulty (select: EASY/MEDIUM/HARD), Points (number input), Time Limit ms (number input), Memory Limit KB (number input) |
| **Validation** | Zod schema mirroring backend constraints (title required, difficulty required, points 1–1000, timeLimitMs 100–10000, memoryLimitKb 4096–1048576) |
| **On success** | Navigate to `ContestDetailPage` (Questions tab), show success toast |
| **Back navigation** | Breadcrumb: `Contests → [Contest Title] → Add Question` |

#### `QuestionEditPage` (`/dashboard/contests/:contestId/questions/:id/edit`)

| Property | Value |
|---|---|
| **Access** | Admin only |
| **Purpose** | Edit an existing question — same form layout as Create, pre-populated with current values |
| **On load** | Fetch question detail via `useQuestion(contestId, questionId)`, populate form |
| **On success** | Navigate back to Contest Detail (Questions tab), show success toast |
| **Delete action** | "Delete Question" button in page header — opens `DeleteQuestionDialog`, not inline |

### 5.2 New Components

#### `QuestionListPanel` (embedded in `ContestDetailPage`)

| Property | Value |
|---|---|
| **Location** | `src/components/question/QuestionListPanel.tsx` |
| **Purpose** | The questions tab content within Contest Detail. Shows all questions in order. Admin sees drag-handle + edit/delete actions. Candidate sees read-only list (only when contest is ONGOING). |
| **Admin features** | Drag-and-drop reordering (via `@hello-pangea/dnd`), "Add Question" button, edit/delete per row |
| **Candidate features** | Read-only list; each question row is clickable (future: opens within Assessment modal in Module 6) |
| **Empty state** | "No questions yet. Add the first question." — admin sees Add button; candidate sees "Questions will appear here when the contest starts." |
| **Loading state** | Skeleton rows while `useQuestions()` fetches |

#### `QuestionCard`

| Property | Value |
|---|---|
| **Location** | `src/components/question/QuestionCard.tsx` |
| **Purpose** | A single question row in the list — title, difficulty badge, points, time/memory limits, and action buttons (admin) |
| **Drag handle** | Admin view only — `GripVertical` icon on the left, used by `@hello-pangea/dnd` |
| **Props** | `question: QuestionAdminResponse | QuestionCandidateResponse`, `contestId: string`, `role: UserRole`, `index: number` |

#### `DifficultyBadge`

| Property | Value |
|---|---|
| **Location** | `src/components/DifficultyBadge.tsx` |
| **Purpose** | Pill badge mapping `EASY/MEDIUM/HARD` to green/amber/red |
| **Props** | `difficulty: 'EASY' \| 'MEDIUM' \| 'HARD'` |
| **Reuse** | Used in `QuestionCard`, `QuestionDetailCard`, `QuestionCreatePage` preview |

#### `QuestionDetailCard`

| Property | Value |
|---|---|
| **Location** | `src/components/question/QuestionDetailCard.tsx` |
| **Purpose** | Rich display of a single question's full details — title, markdown-rendered description, difficulty/points/limits metadata bar. Used by both admin detail view and candidate assessment view (Module 6). |
| **Markdown rendering** | `react-markdown` with `remark-gfm` for tables/code blocks. Code blocks styled with JetBrains Mono. |
| **Props** | `question: QuestionAdminResponse | QuestionCandidateResponse` |

#### `QuestionForm`

| Property | Value |
|---|---|
| **Location** | `src/components/question/QuestionForm.tsx` |
| **Purpose** | Shared React Hook Form + Zod form used by both `QuestionCreatePage` and `QuestionEditPage` |
| **Inputs** | Title (text), Description (textarea with markdown preview toggle), Difficulty (radio group or select), Points (number), Time Limit ms (number), Memory Limit KB (number) |
| **Live preview** | When description textarea is in focus or edited, the right column shows the rendered `react-markdown` output in real time |
| **Props** | `defaultValues?: Partial<QuestionFormData>`, `onSubmit: (data: QuestionFormData) => void`, `isPending: boolean` |

#### `DeleteQuestionDialog`

| Property | Value |
|---|---|
| **Location** | `src/components/question/DeleteQuestionDialog.tsx` |
| **Purpose** | Confirmation dialog before deleting a question. Shows the question title in the warning message. |
| **Trigger** | Trash icon in `QuestionCard` action menu or Delete button in `QuestionEditPage` header |
| **On confirm** | Calls `useDeleteQuestion()`, on success navigates to Contest Detail (Questions tab) + shows toast |

---

## 6. API Layer

### 6.1 Types (`src/api/questionApi.ts`)

```typescript
export type Difficulty = 'EASY' | 'MEDIUM' | 'HARD';

// Admin view — full metadata
export interface QuestionAdminRecord {
  id: string;
  contestId: string;
  title: string;
  description: string;
  difficulty: Difficulty;
  points: number;
  timeLimitMs: number;
  memoryLimitKb: number;
  orderIndex: number;
  createdAt: string;
  createdBy: string;
  // Module 5 will add: testCases: TestCaseAdminRecord[]
}

// Candidate view — restricted
export interface QuestionCandidateRecord {
  id: string;
  contestId: string;
  title: string;
  description: string;
  difficulty: Difficulty;
  points: number;
  timeLimitMs: number;
  memoryLimitKb: number;
  orderIndex: number;
  // Module 5 will add: sampleTestCases: TestCaseSampleRecord[]
}

export type QuestionRecord = QuestionAdminRecord | QuestionCandidateRecord;

export interface CreateQuestionPayload {
  title: string;
  description: string;
  difficulty: Difficulty;
  points: number;
  timeLimitMs: number;
  memoryLimitKb: number;
}

export interface UpdateQuestionPayload {
  title?: string;
  description?: string;
  difficulty?: Difficulty;
  points?: number;
  timeLimitMs?: number;
  memoryLimitKb?: number;
}

export interface ReorderQuestionsPayload {
  orderedIds: string[];
}
```

### 6.2 API Functions (`src/api/questionApi.ts`)

```typescript
export const questionApi = {

  // Returns QuestionAdminRecord[] (admin/evaluator) or QuestionCandidateRecord[] (candidate)
  getQuestions: async (contestId: string): Promise<QuestionRecord[]> => {
    const { data } = await apiClient.get<ApiWrapper<QuestionRecord[]>>(
      `/contests/${contestId}/questions`
    );
    return data.data;
  },

  getQuestion: async (contestId: string, questionId: string): Promise<QuestionRecord> => {
    const { data } = await apiClient.get<ApiWrapper<QuestionRecord>>(
      `/contests/${contestId}/questions/${questionId}`
    );
    return data.data;
  },

  createQuestion: async (
    contestId: string,
    payload: CreateQuestionPayload
  ): Promise<QuestionAdminRecord> => {
    const { data } = await apiClient.post<ApiWrapper<QuestionAdminRecord>>(
      `/contests/${contestId}/questions`,
      payload
    );
    return data.data;
  },

  updateQuestion: async (
    contestId: string,
    questionId: string,
    payload: UpdateQuestionPayload
  ): Promise<QuestionAdminRecord> => {
    const { data } = await apiClient.put<ApiWrapper<QuestionAdminRecord>>(
      `/contests/${contestId}/questions/${questionId}`,
      payload
    );
    return data.data;
  },

  deleteQuestion: async (contestId: string, questionId: string): Promise<void> => {
    await apiClient.delete(`/contests/${contestId}/questions/${questionId}`);
  },

  reorderQuestions: async (
    contestId: string,
    payload: ReorderQuestionsPayload
  ): Promise<QuestionAdminRecord[]> => {
    const { data } = await apiClient.patch<ApiWrapper<QuestionAdminRecord[]>>(
      `/contests/${contestId}/questions/reorder`,
      payload
    );
    return data.data;
  },
};
```

---

## 7. Hooks

**File:** `src/hooks/useQuestions.ts`

```typescript
export const questionKeys = {
  all: (contestId: string) => ['questions', contestId] as const,
  detail: (contestId: string, questionId: string) =>
    ['questions', contestId, questionId] as const,
};

// List
export const useQuestions = (contestId: string) =>
  useQuery({
    queryKey: questionKeys.all(contestId),
    queryFn: () => questionApi.getQuestions(contestId),
    enabled: !!contestId,
  });

// Single
export const useQuestion = (contestId: string, questionId: string) =>
  useQuery({
    queryKey: questionKeys.detail(contestId, questionId),
    queryFn: () => questionApi.getQuestion(contestId, questionId),
    enabled: !!contestId && !!questionId,
  });

// Create
export const useCreateQuestion = (contestId: string) => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (payload: CreateQuestionPayload) =>
      questionApi.createQuestion(contestId, payload),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: questionKeys.all(contestId) });
      toast.success('Question created successfully');
    },
  });
};

// Update
export const useUpdateQuestion = (contestId: string, questionId: string) => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (payload: UpdateQuestionPayload) =>
      questionApi.updateQuestion(contestId, questionId, payload),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: questionKeys.all(contestId) });
      queryClient.invalidateQueries({ queryKey: questionKeys.detail(contestId, questionId) });
      toast.success('Question updated successfully');
    },
  });
};

// Delete
export const useDeleteQuestion = (contestId: string) => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (questionId: string) =>
      questionApi.deleteQuestion(contestId, questionId),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: questionKeys.all(contestId) });
      toast.success('Question deleted');
    },
  });
};

// Reorder (optimistic update recommended)
export const useReorderQuestions = (contestId: string) => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (payload: ReorderQuestionsPayload) =>
      questionApi.reorderQuestions(contestId, payload),
    onMutate: async (payload) => {
      // Optimistic update — reorder the cached list immediately before the request resolves
      await queryClient.cancelQueries({ queryKey: questionKeys.all(contestId) });
      const previous = queryClient.getQueryData(questionKeys.all(contestId));
      // Reorder cached data by orderedIds...
      return { previous };
    },
    onError: (_err, _vars, context) => {
      // Roll back on error
      queryClient.setQueryData(questionKeys.all(contestId), context?.previous);
      toast.error('Reorder failed — reverted');
    },
    onSettled: () => {
      queryClient.invalidateQueries({ queryKey: questionKeys.all(contestId) });
    },
  });
};
```

---

## 8. Routing

Add these routes to `App.tsx` inside the `AppShell` wrapper:

```tsx
{/* Question routes — nested under a specific contest */}
<Route
  path="contests/:contestId/questions/new"
  element={
    <ProtectedRoute roles={['ADMIN']}>
      <QuestionCreatePage />
    </ProtectedRoute>
  }
/>
<Route
  path="contests/:contestId/questions/:questionId/edit"
  element={
    <ProtectedRoute roles={['ADMIN']}>
      <QuestionEditPage />
    </ProtectedRoute>
  }
/>
```

The question list itself does not need a new route — it is rendered as a tab inside the existing `ContestDetailPage` route.

---

## 9. ContestDetailPage Changes

The existing `ContestDetailPage` already has tabs. Add a third **"Questions"** tab:

| Tab | Shown to | Contents |
|---|---|---|
| Overview | All | Contest metadata, timeline, description |
| Candidates | Admin / Evaluator | Candidate assignment panel |
| Questions | All | `QuestionListPanel` — full list for admin, filtered/restricted for candidate |

**Admin view of Questions tab:**
- Header row: "Questions (N)" label + "Add Question" button (links to `/contests/:contestId/questions/new`)
- Drag-and-drop list using `@hello-pangea/dnd`
- Each `QuestionCard` shows: drag handle (admin only), order number, title, `DifficultyBadge`, points, time/memory limits, edit/delete action buttons

**Candidate view of Questions tab:**
- Only shown when contest is `ONGOING` (hide tab or show "Questions will be available when the contest is live" message otherwise)
- Read-only list without drag handles or action buttons
- Each `QuestionCard` row is clickable (no-op in Module 4; wired to Assessment view in Module 6)

---

## 10. Zod Schema (shared between Create and Edit forms)

```typescript
// src/components/question/QuestionForm.tsx

const questionSchema = z.object({
  title: z
    .string()
    .min(1, 'Title is required')
    .max(255, 'Title must not exceed 255 characters'),
  description: z.string().min(1, 'Description is required'),
  difficulty: z.enum(['EASY', 'MEDIUM', 'HARD'], {
    required_error: 'Difficulty is required',
  }),
  points: z
    .number({ required_error: 'Points is required' })
    .min(1, 'Minimum 1 point')
    .max(1000, 'Maximum 1000 points'),
  timeLimitMs: z
    .number({ required_error: 'Time limit is required' })
    .min(100, 'Minimum 100ms')
    .max(10000, 'Maximum 10,000ms'),
  memoryLimitKb: z
    .number({ required_error: 'Memory limit is required' })
    .min(4096, 'Minimum 4096 KB (4 MB)')
    .max(1048576, 'Maximum 1,048,576 KB (1 GB)'),
});

type QuestionFormData = z.infer<typeof questionSchema>;
```

---

## 11. Build Sequence

Follow this order. Each step should be independently verifiable before proceeding.

1. **Install new dependencies**
   ```bash
   npm install react-markdown remark-gfm @hello-pangea/dnd
   npm install --save-dev @types/react-markdown
   ```

2. **Create `DifficultyBadge.tsx`** — simplest new component, no data dependencies. Verify it renders correctly with each of the three difficulties.

3. **Create `src/api/questionApi.ts`** — all types and API functions. No UI yet.

4. **Create `src/hooks/useQuestions.ts`** — all hooks.

5. **Create `QuestionDetailCard.tsx`** — uses `react-markdown` to render descriptions. Test it locally with a hard-coded markdown string before wiring to real data.

6. **Create `QuestionCard.tsx`** — single row component. Admin variant shows drag handle and action buttons. Candidate variant shows nothing clickable yet.

7. **Create `QuestionListPanel.tsx`** — the full list with `@hello-pangea/dnd` wrapping the admin card list. Test drag-and-drop locally with mock data before wiring `useReorderQuestions`.

8. **Add the Questions tab to `ContestDetailPage`** — import `QuestionListPanel`, add the tab trigger and content. Verify the tab appears and loads real data from the API.

9. **Create `QuestionForm.tsx`** — shared form component with live markdown preview.

10. **Create `QuestionCreatePage.tsx`** — wraps `QuestionForm`, wires `useCreateQuestion`, handles success navigation.

11. **Create `QuestionEditPage.tsx`** — fetches existing question via `useQuestion()`, populates `QuestionForm` defaultValues, wires `useUpdateQuestion`.

12. **Create `DeleteQuestionDialog.tsx`** — confirmation dialog. Wire delete button in `QuestionCard` and `QuestionEditPage`.

13. **Add routes to `App.tsx`** — add the two new `ProtectedRoute` entries.

14. **End-to-end test** (see Definition of Done below).

---

## 12. Role-Based UI Rules

| UI Element | Admin | Evaluator | Candidate |
|---|---|---|---|
| "Add Question" button | ✅ Visible | ❌ Hidden | ❌ Hidden |
| Drag handle on question cards | ✅ Visible | ❌ Hidden | ❌ Hidden |
| Edit/Delete actions on cards | ✅ Visible | ❌ Hidden | ❌ Hidden |
| Questions tab in Contest Detail | ✅ Always | ✅ Always | ✅ Only when ONGOING |
| Question create/edit routes | ✅ Accessible | ❌ 403 redirect | ❌ 403 redirect |
| `createdBy` shown in question detail | ✅ Shown | ✅ Shown | ❌ Not in API response |

---

## 13. Definition of Done

- [ ] Admin can navigate to a contest and see the new "Questions" tab
- [ ] Questions tab is empty with a clear "Add your first question" CTA for a contest with no questions
- [ ] Admin clicks "Add Question" and is navigated to `QuestionCreatePage`
- [ ] All form fields validate correctly — empty title, invalid points, missing difficulty all show inline errors
- [ ] Admin submits a valid form — question appears in the contest's question list with correct details
- [ ] `DifficultyBadge` renders green/amber/red for EASY/MEDIUM/HARD correctly
- [ ] Admin can drag and drop a question to a new position — order persists on page reload
- [ ] Admin can click "Edit" on a question card — navigated to `QuestionEditPage` with all fields pre-populated
- [ ] Admin can update a field and save — updated value reflected in the list
- [ ] Admin can delete a question via the `DeleteQuestionDialog` — question removed from the list
- [ ] Markdown description renders correctly in `QuestionDetailCard` — bold, code blocks, lists all work
- [ ] Candidate JWT viewing an `ONGOING` contest sees the Questions tab and a read-only list (no add/edit/delete controls)
- [ ] Candidate on a non-ONGOING contest does not see question content (tab hidden or shows "Contest not started" message)
- [ ] No TypeScript errors (`npm run build` passes)
- [ ] New routes (`/contests/:contestId/questions/new`, `/contests/:contestId/questions/:id/edit`) redirect non-admin users to the dashboard home

**Future Enhancements (Module 6 and beyond):** Candidate clicking a question row opens the Assessment IDE. Inline test case display below the question description (Module 5). Question navigation panel (jump between questions 1/2/3 during exam).
