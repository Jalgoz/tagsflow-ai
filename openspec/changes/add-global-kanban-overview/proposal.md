## Why

The `/kanban` route still lacks the approved MVP global overview while Project Detail > Kanban already provides the interactive project-scoped board. Users need a read-only cross-project Kanban view to scan task flow across all projects without creating, editing, deleting, or moving work from the global board.

## What Changes

- Replace the `/kanban` placeholder or non-functional route with a read-only global Kanban overview.
- Render tasks from all projects grouped into the approved task status columns: `backlog`, `todo`, `in_progress`, `blocked`, `review`, and `done`.
- Show compact card metadata: task title, project name, priority, due date, assignee, tags, checklist summary, and subtask progress summary.
- Add project filtering with all projects shown by default and single-project filtering available.
- Add lightweight priority, assignee, and tag filters only if they fit the existing UI patterns without broadening the route into another global task table.
- Keep the global board strictly read-only: no task creation, editing, deletion, drag-and-drop, status mutation, or subtask management.
- Provide navigation from task cards or project links to `/projects/:projectId`, where project-scoped editing and Kanban movement remain available.
- Reuse existing global task projection or metadata helpers where practical for project names, assignees, tags, checklist summary, and subtask progress summary.
- Keep columns configuration-driven through shared task status or Kanban column constants.
- Add focused tests for grouping, column rendering, filtering, read-only boundaries, card navigation, and metadata rendering.

Out of scope:
- Drag and drop from `/kanban`.
- Task creation, editing, deletion, or status updates from `/kanban`.
- Subtask CRUD or subtask status mutation.
- Dashboard metrics, AI features, settings, import/export, demo data, and app shell redesign.
- Changes to task or subtask persistence behavior, domain model contracts, or repository contracts.
- Backend APIs, authentication, cloud sync, real collaboration, or real-time notifications.

## Capabilities

### New Capabilities
- `global-kanban-overview`: Covers the functional read-only `/kanban` route, cross-project task grouping by configured status columns, compact task metadata, project and optional lightweight filters, navigation to project detail, read-only boundaries, and focused tests.

### Modified Capabilities
- None.

## Impact

- Affected Presentation code: `/kanban` route page, global Kanban board columns/cards, filter controls, empty/loading/error states, metadata display, and navigation wiring.
- Affected Application integration: existing query hooks or use cases for projects, tasks, subtasks, members, and tags; no mutation hooks should be invoked from the global board.
- Affected shared/domain code: shared task status or Kanban column constants and pure grouping/projection helpers may be reused or extended without changing entity contracts.
- Persistence: no Local Storage schema changes, no `tagsflow_ai_db_v1` changes, and no repository port changes.
- Dependencies: no new external dependency is expected because this board is read-only and must not add drag-and-drop behavior.
- Future migration: the overview must consume repository-backed Application data so future HTTP repositories can replace Local Storage without changing global Kanban business behavior.
