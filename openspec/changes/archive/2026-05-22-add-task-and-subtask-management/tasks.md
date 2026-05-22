## 1. Application Use Cases

- [x] 1.1 Create the task application module exports and query key file following the existing project/member/tag feature structure.
- [x] 1.2 Implement `createTaskUseCases` with list, list by project, get by ID, create, update, delete, status, assignee, tags, and checklist operations.
- [x] 1.3 Add task use case tests with a fake `TaskRepository` covering each task operation.
- [x] 1.4 Create the subtask application module exports and query key file following the task module structure.
- [x] 1.5 Implement `createSubtaskUseCases` with list, list by parent task, get by ID, create, update, delete, status, assignee, tags, and checklist operations.
- [x] 1.6 Add subtask use case tests with a fake `SubtaskRepository` covering each subtask operation.
- [x] 1.7 Add task and subtask repository context/provider wiring if the current app providers do not already expose those repositories to hooks.

## 2. Query Hooks

- [x] 2.1 Implement `useTasks`, `useTasksByProject`, and `useTask` read hooks.
- [x] 2.2 Implement `useCreateTask`, `useUpdateTask`, `useDeleteTask`, and `useUpdateTaskStatus` mutation hooks.
- [x] 2.3 Add helper invalidation logic for task list, project task list, task detail, and affected project queries.
- [x] 2.4 Implement `useSubtasksByTask` read hook.
- [x] 2.5 Implement `useCreateSubtask`, `useUpdateSubtask`, and `useDeleteSubtask` mutation hooks.
- [x] 2.6 Add helper invalidation logic for parent task and parent-task subtask queries after subtask mutations.
- [x] 2.7 Add hook tests for successful reads, mutations, and query invalidation where the current QueryClient test setup supports them.

## 3. Validation And Mapping

- [x] 3.1 Implement shared checklist form value schema and mapping helpers that emit only text and completed state.
- [x] 3.2 Implement the task form Zod schema with required title, status, priority, nullable dates, date range validation, nullable assignee, optional tags, and checklist validation.
- [x] 3.3 Implement task form mapping helpers for create values, edit values, create input, and update input.
- [x] 3.4 Add task form schema tests for valid data, missing required fields, invalid status, invalid priority, invalid date range, nullable assignee, optional tags, and checklist mapping.
- [x] 3.5 Implement the subtask form Zod schema using the same required field, date range, assignee, tag, and checklist rules.
- [x] 3.6 Implement subtask form mapping helpers for create values, edit values, create input, and update input.
- [x] 3.7 Add subtask form schema tests for valid data, missing required fields, invalid status, invalid priority, invalid date range, nullable assignee, optional tags, and checklist mapping.

## 4. Reusable Form Components

- [x] 4.1 Build a reusable checklist editor component with add, edit, complete toggle, and remove behavior.
- [x] 4.2 Add checklist editor tests for value mapping and basic add/remove/toggle interactions where UI utilities support them.
- [x] 4.3 Build `TaskForm` with required asterisk labels, validation messages, member selection, tag selection, checklist editor, cancel, and save behavior.
- [x] 4.4 Add `TaskForm` tests for required label rendering, invalid submit messages, cancel behavior, and valid submit mapping where UI utilities support them.
- [x] 4.5 Build `SubtaskForm` with required asterisk labels, validation messages, member selection, tag selection, checklist editor, cancel, and save behavior.
- [x] 4.6 Add `SubtaskForm` tests for required label rendering, invalid submit messages, cancel behavior, and valid submit mapping where UI utilities support them.

## 5. Project Tasks UI

- [x] 5.1 Extract a `ProjectTasksPanel` component for the Project Detail > Tasks tab.
- [x] 5.2 Load project tasks through `useTasksByProject` and render loading, error, empty, and populated states.
- [x] 5.3 Add create task state and wire valid saves through `useCreateTask` with success toast feedback.
- [x] 5.4 Render task rows or cards with title, status, priority, dates, assignee, tags, checklist summary, and expand/collapse controls.
- [x] 5.5 Add task edit state and wire valid saves through `useUpdateTask` with success toast feedback.
- [x] 5.6 Add task delete confirmation with `ConfirmDialog`, `useDeleteTask`, loading state, cancellation, and success toast feedback.
- [x] 5.7 Ensure opening task create, edit, delete, or completion confirmation closes conflicting task states.
- [x] 5.8 Update `ProjectDetailPage` so the Tasks tab renders `ProjectTasksPanel` while Kanban and AI Insights remain placeholders.

## 6. Subtasks Inside Task Area

- [x] 6.1 Load subtasks for expanded tasks through `useSubtasksByTask`.
- [x] 6.2 Render subtasks inside the parent task area with title, status, priority, dates, assignee, tags, and checklist summary.
- [x] 6.3 Add create subtask state inside the parent task area and wire saves through `useCreateSubtask` with success toast feedback.
- [x] 6.4 Add subtask edit state and wire saves through `useUpdateSubtask` with success toast feedback.
- [x] 6.5 Add subtask delete confirmation with `ConfirmDialog`, `useDeleteSubtask`, loading state, cancellation, and success toast feedback.
- [x] 6.6 Ensure opening subtask create, edit, or delete confirmation closes conflicting subtask states for the parent task.

## 7. Completion Warning And Field Mutations

- [x] 7.1 Add a shared project task status handler that checks pending subtasks before changing a task status to `done`, including quick status changes and task edit form saves.
- [x] 7.2 Use `ConfirmDialog` to warn before completing a task with pending subtasks.
- [x] 7.3 Wire cancel behavior so no status mutation is sent when the completion warning is cancelled.
- [x] 7.4 Wire confirm behavior so `useUpdateTaskStatus` marks the task as `done` and shows success toast feedback.
- [x] 7.5 Wire task assignee, tag, and checklist update actions through the task mutation hooks with useful success toast feedback when exposed in the UI.
- [x] 7.6 Wire subtask status, assignee, tag, and checklist update actions through the subtask mutation hooks with useful success toast feedback when exposed in the UI.
- [x] 7.7 Add focused tests for completion warning logic, cancellation, confirmation, and bypass behavior when no pending subtasks exist.

## 8. Edit-Mode Exclusivity And Feedback Tests

- [x] 8.1 Ensure a task being edited is not rendered as an actionable task row or card underneath its edit form.
- [x] 8.2 Ensure a subtask being edited is not rendered as an actionable subtask row or card underneath its edit form.
- [x] 8.3 Add UI tests for task edit-mode exclusivity where the current test utilities support the Project Detail task workflow.
- [x] 8.4 Add UI tests for subtask edit-mode exclusivity where the current test utilities support the Project Detail task workflow.
- [x] 8.5 Add UI tests for task and subtask deletion using `ConfirmDialog` where supported.
- [x] 8.6 Add UI tests for success toast feedback after task and subtask mutations where supported.

## 9. Verification

- [x] 9.1 Run the relevant task/subtask use case and validation tests.
- [x] 9.2 Run the relevant UI and hook tests that exist for the implemented task workflow.
- [x] 9.3 Run TypeScript typecheck.
- [x] 9.4 Run lint.
- [x] 9.5 Run the production build.
- [x] 9.6 Manually verify Project Detail > Tasks create, edit, delete, expand, subtask management, completion warning, required field labels, confirmations, and success toasts in the browser.
