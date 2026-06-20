## 1. Baseline Review

- [ ] 1.1 Review `ProjectKanbanPanel`, `project-kanban-helpers`, `TaskForm`, `FocusedFormDialog`, `ConfirmDialog`, and existing Project Kanban tests.
- [ ] 1.2 Review global `/kanban` page and tests to identify the read-only boundary assertions that must remain unchanged.
- [ ] 1.3 Confirm no domain entity, repository port, Local Storage database version, or drag-and-drop dependency changes are needed before implementation.

## 2. Task Detail Surface

- [ ] 2.1 Add or extend Project Kanban task detail metadata helpers for title, description, scope fields, status, priority, dates, assignee, tags, checklist summary, and subtask progress.
- [ ] 2.2 Add a Project Kanban task detail popup/modal using the existing focused/modal visual pattern.
- [ ] 2.3 Wire card body click to open the detail surface while keeping edit/delete buttons as separate explicit actions.
- [ ] 2.4 Add close/cancel behavior for the detail surface that clears local UI state without sending mutations.
- [ ] 2.5 Ensure the detail surface shows compact subtask progress only and does not expose subtask create, edit, delete, or status controls.

## 3. Interaction State Coordination

- [ ] 3.1 Replace or tighten Project Kanban local UI state so detail, edit, delete confirmation, and pending-completion confirmation are mutually exclusive for the active task.
- [ ] 3.2 Ensure opening edit from a card or detail surface closes detail/delete/completion states and opens the existing task edit form.
- [ ] 3.3 Ensure opening delete from a card or detail surface closes detail/edit/completion states and opens `ConfirmDialog`.
- [ ] 3.4 Ensure the active task is not left actionable underneath its edit surface.

## 4. Edit And Delete Behavior

- [ ] 4.1 Preserve `TaskForm` initialization from the selected task and keep member, tag, checklist, validation, save, and cancel behavior intact.
- [ ] 4.2 Save valid task edits through the existing `useUpdateTask` path, including status changes from the form.
- [ ] 4.3 After a successful edit, close the edit surface, show a success toast, and rely on query-backed data to place the card in the correct column.
- [ ] 4.4 Confirm task deletion through the existing delete task hook, show a success toast, and rely on repository-defined subtask cleanup.
- [ ] 4.5 Cancel task deletion without sending a delete mutation and keep the task visible in its current column.

## 5. Completion Safety And Drag Preservation

- [ ] 5.1 Preserve drag-to-column behavior through existing dnd-kit wiring and `useUpdateTaskStatus`.
- [ ] 5.2 Keep same-column drops, canceled drops, and invalid destinations as no-op paths with no status mutation.
- [ ] 5.3 When dragging a task to `done` with pending subtasks, open `ConfirmDialog` before sending the status mutation.
- [ ] 5.4 When saving a task edit as `done` with pending subtasks, store the intended update and open `ConfirmDialog` before sending the update mutation.
- [ ] 5.5 Cancel pending-subtask confirmation without sending the intended update or status mutation.
- [ ] 5.6 Confirm pending-subtask completion by sending the original intended update or status mutation and showing a success toast.
- [ ] 5.7 Ensure all configured Kanban columns remain visible after detail, edit, delete, drag, and completion interactions.

## 6. Focused Tests

- [ ] 6.1 Add or update Project Kanban helper tests for any new detail metadata helper behavior.
- [ ] 6.2 Add Project Kanban UI tests verifying card click opens task detail and close/cancel sends no mutation.
- [ ] 6.3 Add Project Kanban UI tests verifying edit action opens the task edit form and saving a status change moves the card to the correct column.
- [ ] 6.4 Add Project Kanban UI tests verifying delete action opens `ConfirmDialog`, cancel keeps the task, and confirm removes it.
- [ ] 6.5 Add Project Kanban tests for dragging between columns where current test utilities support reliable drag-and-drop simulation.
- [ ] 6.6 Add Project Kanban tests for same-column or invalid drops sending no status mutation.
- [ ] 6.7 Add Project Kanban tests for pending-subtask confirmation when dragging to `done` and when saving edit status as `done`.
- [ ] 6.8 Add or update global `/kanban` tests verifying no edit, delete, creation, drag-and-drop, status mutation, or task detail modal behavior is introduced.

## 7. Verification

- [ ] 7.1 Run targeted tests for Project Kanban helpers and `ProjectKanbanPanel`.
- [ ] 7.2 Run targeted tests for global Kanban boundary coverage.
- [ ] 7.3 Run the relevant full test command available in the repo.
- [ ] 7.4 Run the build/typecheck command available in the repo.
- [ ] 7.5 Run `openspec validate enhance-project-kanban-task-interactions --strict`.
- [ ] 7.6 Manually verify Project Detail > Kanban in the browser at desktop and mobile widths, including detail, edit, delete, drag, and completion confirmation flows.
