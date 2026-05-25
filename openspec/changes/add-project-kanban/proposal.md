## Why

Project Detail > Kanban is still a placeholder while Project Detail > Tasks already supports project-scoped task CRUD. The MVP requires an interactive project Kanban board so users can review and move existing project tasks through the approved workflow without leaving the project detail context.

## What Changes

- Replace the Project Detail > Kanban placeholder with a functional project-scoped Kanban board.
- Render project tasks grouped by the approved task statuses: `backlog`, `todo`, `in_progress`, `blocked`, `review`, and `done`.
- Show compact task card metadata for title, priority, due date, assignee, tags, checklist summary, and subtask progress summary.
- Support drag and drop task movement between status columns using the existing approved dnd-kit dependency when available.
- Update task status through existing task mutation hooks and preserve repository/domain contracts.
- Preserve the pending-subtask completion warning before moving a task to `done`.
- Allow project-scoped task creation from a selected Kanban column using the existing `TaskForm`, defaulting status to that column.
- Allow editing and deleting existing tasks from Kanban cards using the existing `TaskForm`, shared `ConfirmDialog`, and success toast feedback.
- Keep subtasks as compact card metadata only; do not add subtask CRUD inside the Kanban board.
- Keep board columns and status behavior configuration-driven through shared task status/Kanban constants.
- Add focused tests for grouping, column rendering, drag/status movement, pending-subtask warning, column-scoped creation, and supported edit/delete behavior.

## Capabilities

### New Capabilities
- `project-kanban`: Project-scoped Kanban board behavior for rendering, moving, creating, editing, and deleting tasks within Project Detail.

### Modified Capabilities
- `project-management`: Project Detail > Kanban changes from a placeholder tab to a separately approved functional project tab while AI Insights remains out of scope.

## Impact

- Affected Presentation code: Project Detail Kanban tab, Kanban board/card components, task create/edit surfaces, delete confirmation wiring, and toast usage.
- Affected Application integration: existing task query and mutation hooks, especially project-scoped task listing, create/update/delete, and status update.
- Affected Domain/shared code: shared task status or Kanban column constants may be reused or centralized, but task and subtask entity contracts do not change.
- Dependencies: use dnd-kit if already installed; do not introduce another drag-and-drop library.
- Persistence: no Local Storage schema/key changes and no repository contract changes.
- Out of scope: global Kanban overview, global tasks table changes, subtask CRUD inside Kanban, dashboard metrics, AI features, settings, import/export, demo data, and app shell redesign.
