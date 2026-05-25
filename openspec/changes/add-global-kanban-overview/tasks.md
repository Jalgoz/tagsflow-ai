## 1. Existing Context Review

- [ ] 1.1 Inspect the current `/kanban` route, routing setup, placeholder tests, and app shell navigation labels.
- [ ] 1.2 Inspect existing Project Kanban column constants, grouping helpers, card metadata helpers, and card components for reusable pieces.
- [ ] 1.3 Inspect existing global task projection helpers for project name, assignee, tag, checklist, and subtask progress display reuse.
- [ ] 1.4 Confirm existing query hooks for projects, tasks, subtasks, members, and tags can load the required read-only board data.

## 2. Global Kanban Data Helpers

- [ ] 2.1 Add or reuse typed global Kanban card projection helpers that combine tasks with project, subtask, member, tag, checklist, and progress display data.
- [ ] 2.2 Add or reuse a pure grouping helper that returns every configured status column and places projected cards by task status.
- [ ] 2.3 Add pure filter helpers for project filtering with all-projects as the default state.
- [ ] 2.4 Add optional pure filter helpers for priority, assignee, and tag only if the existing UI can support them without broadening scope.
- [ ] 2.5 Ensure helpers derive checklist and subtask progress summaries without storing computed values or changing entity contracts.
- [ ] 2.6 Add focused unit tests for projection, grouping, empty configured columns, project filtering, optional filters if implemented, and missing metadata display values.

## 3. Read-Only Board UI

- [ ] 3.1 Create read-only global Kanban board components for the board container, configured columns, task cards, empty columns, and result counts.
- [ ] 3.2 Render compact task card metadata: title, project name, priority, due date, assignee, tags, checklist summary, and subtask progress summary.
- [ ] 3.3 Ensure subtasks remain metadata only and do not render as independent cards or management controls.
- [ ] 3.4 Add loading, error, no-tasks, and filtered-empty states without task or subtask creation actions.
- [ ] 3.5 Style the board for desktop and narrow viewports, preserving all configured columns with horizontal scrolling or responsive column sizing.

## 4. Route Wiring And Filters

- [ ] 4.1 Replace the `/kanban` placeholder with the global Kanban page wired to existing Application-layer query hooks.
- [ ] 4.2 Add project filter UI that shows all projects by default and filters to a selected single project.
- [ ] 4.3 Add optional priority, assignee, and tag filter controls only if they remain lightweight and consistent with existing filter UI patterns.
- [ ] 4.4 Apply active filters before grouping cards so all configured columns remain visible after filtering.
- [ ] 4.5 Add clear-filter behavior for implemented filters while preserving the read-only board scope.

## 5. Read-Only Boundaries And Navigation

- [ ] 5.1 Ensure the global board renders no task creation buttons, column add actions, task forms, or subtask forms.
- [ ] 5.2 Ensure task cards render no edit, delete, status-change, drag handle, or droppable behavior.
- [ ] 5.3 Ensure no global Kanban component calls task, subtask, project, member, or tag mutation hooks.
- [ ] 5.4 Add navigation from task cards and project links to `/projects/:projectId` for the related project without opening edit, delete, status, or subtask management surfaces.
- [ ] 5.5 Keep Project Detail > Kanban, `/tasks`, persistence, domain contracts, repository contracts, AI providers, settings, import/export, demo data, and dashboard metrics unchanged except for safe helper reuse.

## 6. Tests And Verification

- [ ] 6.1 Add component or route tests that verify `/kanban` renders all configured columns and places task cards in matching status columns.
- [ ] 6.2 Add tests for project filtering and optional priority, assignee, and tag filters if implemented.
- [ ] 6.3 Add tests for compact metadata rendering, including project name, assignee, tags, checklist summary, and subtask progress summary.
- [ ] 6.4 Add tests that verify read-only boundaries: no create, edit, delete, drag-and-drop, status mutation, or subtask management controls.
- [ ] 6.5 Add router tests for card or project-link navigation to `/projects/:projectId` where current test utilities support navigation assertions.
- [ ] 6.6 Run relevant checks: typecheck if available, lint, tests, build, and browser verification for `/kanban` at desktop and mobile widths.
