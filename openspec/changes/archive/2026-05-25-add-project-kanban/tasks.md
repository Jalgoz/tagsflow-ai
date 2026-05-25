## 1. Board Foundations

- [x] 1.1 Inspect existing task status constants, task hooks, form surfaces, feedback components, and installed dnd-kit packages.
- [x] 1.2 Add or reuse shared Kanban column configuration for `backlog`, `todo`, `in_progress`, `blocked`, `review`, and `done`.
- [x] 1.3 Implement pure project Kanban grouping helpers that return every configured column and place project tasks by status.
- [x] 1.4 Implement pure card metadata helpers for checklist summary, subtask progress summary, assignee display, tag display, and neutral empty values.
- [x] 1.5 Add focused unit tests for grouping helpers, empty columns, checklist summary, and subtask progress summary.

## 2. Board Rendering

- [x] 2.1 Create Project Kanban board components for columns, task cards, empty states, loading states, and error states.
- [x] 2.2 Render compact task card metadata: title, priority, due date, assignee, tags, checklist summary, and subtask progress summary.
- [x] 2.3 Ensure subtasks remain read-only metadata and are not rendered as independent Kanban cards or management controls.
- [x] 2.4 Replace the Project Detail > Kanban placeholder with the board wired to existing project-scoped task, subtask, member, and tag hooks.
- [x] 2.5 Update the Project Detail tab behavior so Kanban is functional while AI Insights remains a placeholder.

## 3. Drag And Status Updates

- [x] 3.1 Ensure dnd-kit is available, then wire dnd-kit sensors, draggable cards, droppable columns, and drop handling without adding another drag-and-drop dependency.
- [x] 3.2 Update task status through the existing task status mutation hook when a card is dropped into a different status column.
- [x] 3.3 Avoid sending a status mutation when a card is dropped back into its original column.
- [x] 3.4 Show success toast feedback after a task status update succeeds.
- [x] 3.5 Preserve query-backed board state so cards remain in their previous status when a move is cancelled or fails.

## 4. Completion Warning

- [x] 4.1 Detect pending subtasks when a dragged task is moved to the `done` column.
- [x] 4.2 Open the shared `ConfirmDialog` before sending the `done` status mutation when pending subtasks exist.
- [x] 4.3 Cancel the pending-subtask confirmation without sending a mutation or changing persisted task status.
- [x] 4.4 Confirm the pending-subtask dialog by sending the existing task status mutation and showing a success toast.

## 5. Task Create, Edit, And Delete

- [x] 5.1 Add column-level task creation actions that open the existing `TaskForm` in the current focused form surface pattern.
- [x] 5.2 Default new task status to the selected column and scope created tasks to the current project.
- [x] 5.3 Preserve `TaskForm` required field asterisks, validation messages, member selection, tag selection, checklist editing, save, and cancel behavior.
- [x] 5.4 Add task edit actions on Kanban cards using the existing `TaskForm` and update task mutation hook.
- [x] 5.5 Ensure the edited task is not left actionable underneath the edit surface and conflicting create/edit/delete/complete states are closed.
- [x] 5.6 Add task delete actions on Kanban cards using shared `ConfirmDialog`, existing delete task mutation hook, repository-defined cleanup, and success toast feedback.

## 6. Tests And Verification

- [x] 6.1 Add component tests for rendering approved Kanban columns and placing task cards in matching status columns where current test utilities support the providers.
- [ ] 6.2 Add drag/status movement tests where current test utilities support reliable dnd-kit interaction, including same-column no-op behavior.
- [ ] 6.3 Add pending-subtask completion warning tests for cancel and confirm paths.
- [x] 6.4 Add task creation tests verifying selected-column default status and project scoping where current UI test utilities support form interaction.
- [ ] 6.5 Add task edit and delete tests where current UI test utilities support the required providers and interactions.
- [ ] 6.6 Run relevant checks: typecheck, lint, tests, build, and browser verification for Project Detail > Kanban at desktop and mobile widths.
