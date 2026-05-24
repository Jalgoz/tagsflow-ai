## Why

The `/tasks` route currently exists only as a placeholder even though project-scoped task management is already available inside Project Detail. Users need a read-and-manage global view to review existing work across all projects without leaving task creation project-scoped.

## What Changes

- Replace the `/tasks` placeholder with a functional global tasks page.
- Display tasks from all projects with project name, task metadata, assignment, tags, checklist summary, and subtask progress context.
- Add global filtering by project, status, priority, assignee, tag, overdue state, and upcoming deadline window.
- Add search across task title and task description where available.
- Add sorting by due date, priority, status, project, and title.
- Support expandable parent task rows or cards that show compact subtask details.
- Allow editing existing tasks from the global view by reusing the existing task form, validation, update hooks, and pending-subtask completion warning.
- Allow deleting existing tasks from the global view using the shared confirmation dialog and existing repository cleanup behavior.
- Keep task and subtask creation out of the global `/tasks` page; users must choose a project before creating new work.
- Add focused tests for filter, search, sort, rendering, expansion, creation boundary, and supported edit/delete behavior.

Out of scope:
- Creating tasks from `/tasks`.
- Creating subtasks from `/tasks`.
- Kanban drag and drop or global Kanban implementation.
- Dashboard metrics.
- AI subtask generation, AI priority suggestion, or AI project summary.
- Settings, import/export, and demo data.
- Persistence, domain model, or repository contract changes.
- Redesigning the app shell.

## Capabilities

### New Capabilities

- `global-tasks-view`: Covers the functional `/tasks` route, cross-project task display, filtering, search, sorting, subtask expansion, existing-task edit/delete workflows, creation boundaries, safe completion behavior, feedback usage, and focused tests.

### Modified Capabilities

- None.

## Impact

- Affected code areas include the `/tasks` route page, task list presentation components, shared task metadata rendering, task filtering/search/sorting helpers, task form integration, confirmation and toast usage, and focused tests.
- The implementation must reuse existing Application-layer hooks and repository-backed data access for projects, tasks, subtasks, members, and tags.
- No new external dependencies, backend APIs, authentication, collaboration, real-time behavior, AI providers, or Local Storage schema changes are expected.
- Future HTTP repositories remain compatible because the global view must consume existing repository ports through Application-layer hooks rather than direct Local Storage access.
