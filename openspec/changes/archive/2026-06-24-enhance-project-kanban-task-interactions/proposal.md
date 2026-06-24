## Why

Project Detail > Kanban already provides the project-scoped board, but task card interactions are incomplete: users need to inspect, edit, delete, and safely complete tasks without leaving the Kanban context. This change tightens the existing Project Kanban capability so card detail, edit, delete, and status movement behavior are fully connected and consistent with the approved task workflows.

## What Changes

- Add a task detail popup/modal for Project Detail > Kanban task cards.
- Show task title, description, in-scope content, out-of-scope content, status, priority, start date, due date, assignee, tags, checklist summary, and subtask progress in the detail surface.
- Ensure clicking a Kanban task card opens details, while card edit/delete actions open their expected focused surfaces.
- Reuse the existing `TaskForm` or current task edit form pattern for Project Kanban task edits.
- Reuse `FocusedFormDialog` or the existing focused form/modal pattern for task edit/detail surfaces.
- Reuse `ConfirmDialog` for task deletion and pending-subtask completion warnings.
- Show toast notifications for successful task edits, deletes, and status movement.
- Keep detail, edit, delete confirmation, and completion confirmation states mutually exclusive for the active task.
- Preserve Project Kanban drag-and-drop behavior, including no mutation when dropping into the same column.
- Support status changes through the edit form so a saved status moves the card to the correct column.
- Preserve completion safety when dragging or saving a task as `done` with pending subtasks.
- Keep subtasks as compact metadata only in Kanban cards and the detail surface.
- Add focused tests for detail opening/closing, edit, delete, drag movement, same-column drop, completion confirmation, and global Kanban non-regression.
- Do not modify global `/kanban`, dashboard, settings, import/export, demo data, AI workflows, domain contracts, repository contracts, or the Local Storage database version.

## Capabilities

### New Capabilities

- None

### Modified Capabilities

- `project-kanban`: strengthen task card interaction requirements for detail inspection, connected edit/delete actions, edit-driven status changes, completion safety, and drag-and-drop preservation.

## Impact

- Affected Presentation code: Project Detail Kanban board, Kanban task cards, task detail modal, focused edit surface, delete confirmation wiring, completion confirmation state, and scoped CSS.
- Affected Application integration: existing task query and mutation hooks for update, delete, status movement, and query-backed board refresh.
- Affected Shared/Domain usage: existing shared Kanban status column configuration and task/subtask progress rules are reused; no domain entity or repository port changes are introduced.
- Affected tests: focused Project Kanban component/helper tests and a global `/kanban` read-only boundary regression check where the existing test setup supports it.
- Dependencies: no new drag-and-drop library; existing dnd-kit usage is preserved.
- Persistence: no Local Storage key, version, database shape, or backup/import behavior changes.
