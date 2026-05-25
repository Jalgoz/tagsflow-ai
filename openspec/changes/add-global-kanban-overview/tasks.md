## 1. Existing Context Review

- [x] 1.1 Inspect the current `/kanban` route, routing setup, placeholder tests, and app shell navigation labels.
- [x] 1.2 Inspect existing Project Kanban column constants, grouping helpers, card metadata helpers, and card components for reusable pieces.
- [x] 1.3 Inspect existing global task projection helpers for project name, assignee, tag, checklist, and subtask progress display reuse.
- [x] 1.4 Confirm existing query hooks for projects, tasks, subtasks, members, and tags can load the required read-only board data.

## 2. Global Kanban Data Helpers

- [x] 2.1 Add or reuse typed global Kanban card projection helpers that combine tasks with project, subtask, member, tag, checklist, and progress display data.
- [x] 2.2 Add or reuse a pure grouping helper that returns every configured status column and places projected cards by task status.
- [x] 2.3 Add pure filter helpers for project filtering with all-projects as the default state.
- [x] 2.4 Add optional pure filter helpers for priority, assignee, and tag only if the existing UI can support them without broadening scope.
- [x] 2.5 Ensure helpers derive checklist and subtask progress summaries without storing computed values or changing entity contracts.
- [x] 2.6 Add focused unit tests for projection, grouping, empty configured columns, project filtering, optional filters if implemented, and missing metadata display values.

## 3. Read-Only Board UI

- [x] 3.1 Create read-only global Kanban board components for the board container, configured columns, task cards, empty columns, and result counts.
- [x] 3.2 Render compact task card metadata: title, project name, priority, due date, assignee, tags, checklist summary, and subtask progress summary.
- [x] 3.3 Ensure subtasks remain metadata only and do not render as independent cards or management controls.
- [x] 3.4 Add loading, error, no-tasks, and filtered-empty states without task or subtask creation actions.
- [x] 3.5 Style the board for desktop and narrow viewports, preserving all configured columns with horizontal scrolling or responsive column sizing.

## 4. Route Wiring And Filters

- [x] 4.1 Replace the `/kanban` placeholder with the global Kanban page wired to existing Application-layer query hooks.
- [x] 4.2 Add project filter UI that shows all projects by default and filters to a selected single project.
- [x] 4.3 Add optional priority, assignee, and tag filter controls only if they remain lightweight and consistent with existing filter UI patterns.
- [x] 4.4 Apply active filters before grouping cards so all configured columns remain visible after filtering.
- [x] 4.5 Add clear-filter behavior for implemented filters while preserving the read-only board scope.

## 5. Read-Only Boundaries And Navigation

- [x] 5.1 Ensure the global board renders no task creation buttons, column add actions, task forms, or subtask forms.
- [x] 5.2 Ensure task cards render no edit, delete, status-change, drag handle, or droppable behavior.
- [x] 5.3 Ensure no global Kanban component calls task, subtask, project, member, or tag mutation hooks.
- [x] 5.4 Add navigation from task cards and project links to `/projects/:projectId` for the related project without opening edit, delete, status, or subtask management surfaces.
- [x] 5.5 Keep Project Detail > Kanban, `/tasks`, persistence, domain contracts, repository contracts, AI providers, settings, import/export, demo data, and dashboard metrics unchanged except for safe helper reuse.

## 6. Tests And Verification

- [x] 6.1 Add component or route tests that verify `/kanban` renders all configured columns and places task cards in matching status columns.
- [x] 6.2 Add tests for project filtering and optional priority, assignee, and tag filters if implemented.
- [x] 6.3 Add tests for compact metadata rendering, including project name, assignee, tags, checklist summary, and subtask progress summary.
- [x] 6.4 Add tests that verify read-only boundaries: no create, edit, delete, drag-and-drop, status mutation, or subtask management controls.
- [x] 6.5 Add router tests for card or project-link navigation to `/projects/:projectId` where current test utilities support navigation assertions.
- [ ] 6.6 Run relevant checks: typecheck if available, lint, tests, build, and browser verification for `/kanban` at desktop and mobile widths.

