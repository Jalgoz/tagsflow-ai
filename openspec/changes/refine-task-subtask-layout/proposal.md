## Why

Project Detail > Tasks currently supports subtask creation inside the task card layout, but the inline form makes expanded task cards cramped and visually unbalanced. Refining the subtask interaction now keeps the project-scoped task workflow usable while preserving the approved task and subtask behavior.

## What Changes

- Refine Project Detail > Tasks so task cards remain clean, readable, and visually balanced when subtasks are present.
- Move subtask create and edit forms out of the main task card content area into a reusable modal, dialog, or focused overlay.
- Keep a compact subtask list displayed inside or directly under the parent task area so subtasks remain visually associated with their parent task.
- Keep the "New subtask" action near the parent task, with the action opening the focused subtask form surface instead of stretching or splitting the task card.
- Preserve existing subtask behavior: create, edit, delete with `ConfirmDialog`, success toast feedback, required field indicators, validation messages, assignee selection, tag selection, and checklist editing.
- Preserve edit-mode exclusivity for both tasks and subtasks so the entity being edited does not remain actionable underneath the active edit surface.
- Improve spacing and visual hierarchy for task metadata, the subtasks section, task actions, and subtask actions.
- Keep the global `/tasks` route as a placeholder and do not implement the global tasks table in this change.
- Do not change task or subtask domain models, repository contracts, query hooks, persistence behavior, AI features, Kanban drag and drop, dashboard metrics, settings, import/export, or the app shell.

## Capabilities

### New Capabilities

- None.

### Modified Capabilities

- `task-and-subtask-management`: refine Project Detail > Tasks layout requirements so subtask create/edit uses a focused modal/dialog/overlay while preserving the compact parent-associated subtask list and existing task/subtask behavior.

## Impact

- Affected areas: Project Detail > Tasks presentation components, reusable task/subtask form composition, subtask create/edit state handling, task/subtask action layout, and focused UI tests where supported.
- Unaffected areas: domain rules, repository ports, Local Storage schema and `tagsflow_ai_db_v1`, application use case contracts, global `/tasks` table implementation, Kanban drag and drop, AI workflows, dashboard metrics, settings, import/export, backend migration paths, authentication, cloud sync, and collaboration.
- Dependencies: no new runtime dependencies are expected; the implementation should reuse existing React, form, validation, confirmation dialog, toast, member selection, tag selection, and checklist editor patterns.
