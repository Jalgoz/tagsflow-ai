## Context

Project Detail > Kanban already renders a project-scoped board with configured status columns, dnd-kit drag-and-drop, task creation, task edit/delete entry points, pending-subtask completion confirmation for drag-to-done, and Application-layer hooks for tasks, subtasks, members, and tags. The remaining gap is interaction completeness: clicking a card does not provide a task detail inspection surface, card actions must be reliably connected, and edit/delete/detail/confirmation state must be coordinated so users can manage a task without leaving the Kanban tab.

This is a frontend-only Project Kanban refinement. Presentation owns the board, task card actions, modal/dialog state, and user feedback. Application continues to own TanStack Query hooks and mutation orchestration. Domain continues to own task/subtask entities, status values, checklist/subtask completion rules, and repository ports. Infrastructure continues to own Local Storage adapters behind those ports and remains replaceable by future HTTP repositories. No UI component may read Local Storage directly, and no Groq or AI provider behavior is involved.

## Goals / Non-Goals

**Goals:**

- Open a task detail popup/modal when the user clicks a Project Kanban task card.
- Show full task inspection metadata without enabling subtask CRUD from Kanban.
- Make edit, delete, open detail, drag movement, and completion confirmation behavior reliable and mutually exclusive for the active task.
- Reuse `TaskForm`, `FocusedFormDialog` or the existing focused surface pattern, `ConfirmDialog`, toast feedback, and existing task hooks.
- Keep drag-and-drop behavior query-backed and configuration-driven through shared Kanban column configuration.
- Ensure edited status changes use the same update path as other task edits and move the card to the correct configured column after save.
- Preserve the pending-subtask warning when a task is dragged or edited to `done`.
- Add focused tests for the Project Kanban interaction paths and for the global `/kanban` read-only boundary.

**Non-Goals:**

- No global `/kanban` editing, deletion, drag-and-drop, creation, or task detail modal.
- No task creation outside the existing Project Detail > Kanban creation flow.
- No subtask creation, editing, deletion, or drag-and-drop from Kanban cards or detail surfaces.
- No dashboard, settings, import/export, demo data, onboarding, or AI workflow changes.
- No domain entity changes, repository port changes, Local Storage key/version changes, or new drag-and-drop dependency.
- No app shell redesign.

## Decisions

1. Add a Project Kanban task detail surface in Presentation.

Clicking the non-action area of a Kanban task card should open a focused detail modal or popup that displays the task fields and derived metadata. The surface is read-only by default and may offer edit/delete actions that transition into the existing edit or delete flows. Closing the surface only clears local UI state and does not call any mutation.

Alternative considered: navigate to Project Detail > Tasks or a new route for details. This was rejected because the requested workflow keeps users in the Kanban context and no new task route is approved for this slice.

2. Use one active task interaction state coordinator.

The board should treat detail, edit, delete confirmation, and pending-completion confirmation as mutually exclusive states for the active task. Opening one state closes the others. When a task is being edited, the same task must not remain actionable underneath the edit surface. This can be implemented with a discriminated union or equivalent local state owned by `ProjectKanbanPanel`.

Alternative considered: keep separate independent booleans for each modal. This was rejected because independent flags make it easier to show overlapping surfaces or mutate the wrong active task.

3. Reuse existing task form and mutation paths.

Task editing from Kanban should compose the existing `TaskForm`, `taskToFormValues`, `updateTaskInputFromFormValues`, and `useUpdateTask`. If the submitted status differs from the current task status, that status is part of the same update mutation as other edited fields. Query invalidation then moves the card into the correct column after the update succeeds.

Alternative considered: use `useUpdateTaskStatus` for status and `useUpdateTask` for the other edited fields. This was rejected for form saves because a single update path is easier to reason about and matches the existing task edit contract.

4. Guard completion from both drag and edit saves.

The same pending-subtask rule applies when a card is dragged to `done` and when an edit form is saved with status `done`. If pending subtasks exist, the board opens `ConfirmDialog` before sending the mutation. Canceling the dialog clears only the pending confirmation state and sends no mutation. Confirming sends the original intended status update or task update and shows success toast feedback.

Alternative considered: guard only drag-to-done because Project Kanban already has a drag confirmation. This was rejected because completion safety is user-action based, not interaction-method based.

5. Preserve query-backed drag behavior.

Drag end handling should send a status mutation only when the destination column exists and differs from the task's current status. Same-column drops, canceled drops, and drops without a valid destination should do nothing. Failed mutations should leave the board reflecting the previous query-backed state rather than committing unconfirmed local status changes.

Alternative considered: optimistic local movement before mutation completion. This was rejected because the existing completion confirmation and failure behavior are clearer when the board stays query-backed.

6. Keep subtasks as compact metadata.

Kanban cards and the task detail surface may show subtask progress, such as completed/total or done/total. They must not render subtask forms, subtask edit/delete actions, or subtasks as independent Kanban cards. Detailed subtask CRUD remains in Project Detail > Tasks and the global tasks expansion behavior approved elsewhere.

Alternative considered: embed the reusable `TaskSubtaskArea` in the Kanban detail modal. This was rejected because it would add subtask CRUD to Kanban, which is explicitly out of scope.

7. Keep global Kanban untouched.

The global `/kanban` route remains a read-only overview. This change should not share mutation-capable Project Kanban controls into the global board. A focused regression test should verify the global route still exposes no create/edit/delete/drag/status mutation controls when feasible.

Alternative considered: reuse the new detail modal in global Kanban. This was rejected because global Kanban is explicitly read-only and navigates to project context instead of managing tasks.

## Risks / Trade-offs

- [Risk] Card click handling can conflict with drag listeners or edit/delete buttons. Mitigation: define separate clickable regions, stop propagation from action buttons, and test card click versus action click behavior.
- [Risk] Multiple dialogs can overlap if state is not coordinated. Mitigation: use a single active interaction state or central close-conflicts helper with tests for mutual exclusivity.
- [Risk] Drag-and-drop tests can be brittle under jsdom. Mitigation: cover pure helpers and state transitions where possible, and add UI drag tests only with the existing project test utilities where reliable.
- [Risk] Saving an edit to `done` with pending subtasks can lose form intent if confirmation is modeled only as status. Mitigation: store the pending form submission payload until the user confirms or cancels.
- [Risk] Detail modal can become a second task management surface. Mitigation: keep it inspection-focused, reuse existing edit/delete transitions, and exclude subtask CRUD.
- [Risk] Global Kanban could accidentally inherit mutable controls through shared card components. Mitigation: keep mutation-capable components Project Kanban scoped or make read-only/mutable modes explicit and tested.

## Migration Plan

1. Add Project Kanban task detail view model helpers if existing card metadata helpers do not cover all required fields.
2. Add a Project Kanban task detail modal/popup using the existing focused/modal visual pattern.
3. Refactor Project Kanban active interaction state so detail, edit, delete, and completion confirmation are mutually exclusive.
4. Wire card click, edit action, delete action, and close/cancel handlers to the coordinated state.
5. Update task edit save handling so status changes use `useUpdateTask` and trigger pending-subtask confirmation when saving as `done` with pending subtasks.
6. Preserve drag-to-status behavior and no-op same-column/canceled-drop behavior.
7. Add or update focused tests for detail, close without mutation, edit/save column movement, delete confirm/cancel, drag movement, same-column no-op, pending-subtask confirmation, and global Kanban read-only boundaries.
8. Run targeted tests, full test/build checks where practical, and browser verification for Project Detail > Kanban.

Rollback is presentation-only: remove the detail surface and interaction-state refactor while keeping the existing query-backed Kanban board. No data migration is required because persisted data and repository contracts do not change.

## Open Questions

- None for proposal scope. During implementation, choose the exact modal title/action copy and card click region based on the existing Project Kanban component and focused form styles.
