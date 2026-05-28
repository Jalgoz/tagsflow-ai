## Context

The app already has frontend-only local persistence, domain entities and rules, Application-layer query hooks, project and task management, global tasks, project Kanban, and global Kanban overview. `DashboardPage` still renders placeholder copy, so users have no first-screen summary of project and task health.

Dashboard metrics must be derived from existing local business data. Local Storage remains the persistence adapter behind repository ports, and future HTTP repositories must be able to supply the same project, task, subtask, member, and tag entities without changing dashboard business logic. AI providers are not involved in this slice.

One important limitation is that current task and subtask contracts do not include completion timestamps. This change must not add `completedAt` or alter persistence contracts. Any "completed this week" display must therefore avoid pretending the app knows when a task was completed unless the existing model already supports that data at implementation time.

## Goals / Non-Goals

**Goals:**
- Replace `/dashboard` placeholder content with a useful summary dashboard.
- Load source data through existing Application-layer hooks for projects, tasks, subtasks, members, and tags.
- Add pure metric helpers that use domain entities and approved domain rules for progress and deadline classification.
- Render summary metric cards, project health, status and priority charts, upcoming deadlines, blocked work, and recently completed work where data supports it.
- Use Recharts for status and priority visualizations because it is already installed.
- Keep all dashboard values recomputed from current data and out of Local Storage.
- Provide loading, error, empty, and no-data states.
- Add focused helper tests and practical dashboard rendering tests.

**Non-Goals:**
- No project, task, or subtask CRUD from the dashboard.
- No Kanban drag and drop or changes to global tasks/global Kanban behavior.
- No AI project summary, AI priority suggestion, AI subtask generation, or Groq calls.
- No settings, import/export, demo data, authentication, backend, cloud sync, collaboration, or notifications.
- No changes to domain entity contracts, repository ports, Local Storage database shape, or app shell redesign.

## Decisions

### Decision: Put dashboard aggregation in pure Application-layer helpers

Dashboard aggregation should live in a dashboard-focused helper module under the Application layer, such as `application/dashboard`, and expose plain functions that accept projects, tasks, subtasks, members, tags, and a reference date. The page remains responsible for rendering and navigation, while the helpers remain testable without React.

Alternative considered: compute metrics inline in `DashboardPage`. That would make the page harder to test, duplicate domain rule usage, and encourage presentation-specific logic to grow into a large component.

Alternative considered: add dashboard metrics to the Domain layer. The metrics are product-screen aggregation rather than core invariant rules, so keeping them in Application avoids overloading Domain while still depending only on domain types and rules.

### Decision: Use existing hooks as the dashboard data boundary

`DashboardPage` should call existing hooks such as `useProjects`, `useTasks`, `useSubtasks`, `useMembers`, and `useTags`. The page must not instantiate repositories, read Local Storage, or bypass TanStack Query.

This preserves the Ports and Adapters architecture: Presentation loads through Application hooks; Application uses Domain ports and rules; Infrastructure implements Local Storage today and can be replaced by HTTP repositories later without dashboard changes.

### Decision: Reuse approved domain rules for derived classifications

Average project progress should be derived by calling approved progress rules. Overdue and upcoming deadline counts/lists should be derived by calling approved deadline rules. Completed task detection should use the canonical `done` status.

Alternative considered: duplicate progress and deadline logic in the dashboard helpers. That would create inconsistent behavior between dashboard, global tasks, and Kanban surfaces.

The dashboard should use a default upcoming deadline window of 7 days. This value should be imported from an existing shared constant if available, or defined as a named dashboard/application constant if not. Avoid hardcoded magic numbers inside dashboard components.

### Decision: Treat "completed this week" as constrained by available data

The current task model can identify completed tasks via `status: done`, but it cannot prove the date a task became done. The implementation must not infer historical completion timestamps from unrelated fields. If no completion timestamp exists, the dashboard should show a clearly labeled no-data state or a clearly labeled supported proxy, such as done tasks due this week, rather than an exact "completed this week" claim.

Alternative considered: add `completedAt` to tasks and subtasks. That is out of scope because this change explicitly preserves domain and repository contracts.

### Decision: Use Recharts without adding chart dependencies

The dashboard should use Recharts for task status and priority charts because `recharts` is already installed and approved in project dependencies. Charts should render only when data exists; otherwise the dashboard should show clean empty states.

Alternative considered: add a different chart library. That adds dependency and design surface without need.

## Risks / Trade-offs

- [Risk] Aggregating all projects, tasks, and subtasks on every dashboard render could become expensive as local data grows. -> Mitigation: keep helpers pure and memoize derived results in the page around query data and reference date.
- [Risk] Task-specific dashboard list items should navigate to the related project detail route because no standalone task detail route exists in the MVP. Aggregate task metric cards may navigate to `/tasks` for cross-project review.
- [Risk] "Completed this week" can be misleading without completion timestamps. -> Mitigation: do not present exact completion timing unless supported by existing data; render no-data or clearly labeled proxy text.
- [Risk] Dashboard cards could drift from global tasks and Kanban classifications. -> Mitigation: reuse shared domain status, priority, progress, deadline, and Kanban/status constants where available.
- [Risk] Recharts components can render poorly with empty arrays or zero values. -> Mitigation: gate charts behind no-data checks and test empty behavior.
- [Risk] Dashboard navigation might imply editing is available inline. -> Mitigation: dashboard interactions navigate to existing project detail or task routes and do not expose mutation controls.

## Migration Plan

No data migration is required. The implementation replaces placeholder presentation code and adds derived helpers/tests only. Rollback is limited to restoring the placeholder dashboard and removing dashboard-specific helper/tests; Local Storage data remains compatible.

## Open Questions

- Should a future change add explicit completion timestamps to support exact completed-this-week and recently-completed metrics? This is intentionally deferred because it would alter domain and persistence contracts.
