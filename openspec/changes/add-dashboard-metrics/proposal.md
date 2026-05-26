## Why

The `/dashboard` route is still a placeholder while the core project, task, subtask, member, tag, global tasks, project Kanban, and global Kanban workflows already exist. The MVP needs a functional dashboard that summarizes project and task health from current local business data without persisting computed values.

## What Changes

- Replace the `/dashboard` placeholder with a functional dashboard page.
- Load projects, tasks, subtasks, members, and tags through existing Application-layer hooks.
- Add pure dashboard metric helpers for project counts, task counts, overdue work, upcoming deadlines, completed-this-week work, average project progress, task status distribution, and task priority distribution.
- Reuse approved domain rules for task progress, project progress, overdue detection, upcoming deadline detection, and completed task detection where applicable.
- Add dashboard UI sections for summary metric cards, project health overview, task status chart, priority chart, upcoming deadlines, blocked work, and recently completed tasks where practical.
- Use Recharts for dashboard charts because it is already part of the project dependencies.
- Add navigation from dashboard items to project detail or task-oriented routes without adding dashboard CRUD workflows.
- Add loading, error, empty, and no-data states so the dashboard does not render broken charts or stale placeholder content.
- Add focused tests for dashboard metric helpers and supported dashboard rendering behavior.
- Keep derived metrics out of Local Storage and recompute them from projects, tasks, and subtasks.
- Exclude task CRUD, subtask CRUD, Kanban behavior changes, AI features, settings, import/export, demo data, persistence changes, domain model contract changes, repository contract changes, and app shell redesign.

## Capabilities

### New Capabilities
- `dashboard-metrics`: Defines the functional `/dashboard` page, derived dashboard metrics, dashboard charts/lists, navigation behavior, state handling, persistence boundaries, and focused test expectations.

### Modified Capabilities
- None.

## Impact

- Affected code: dashboard page, dashboard-specific presentation components, dashboard metric helper module, and tests.
- Existing dependencies: Recharts, React Router, TanStack Query hooks, and approved domain rules.
- Existing data sources: Application-layer hooks for projects, tasks, subtasks, members, and tags.
- Persistence: no Local Storage schema changes and no persisted metric snapshots.
- Contracts: no changes to domain entity types, repository ports, AI provider ports, or existing project/task/Kanban behavior.
