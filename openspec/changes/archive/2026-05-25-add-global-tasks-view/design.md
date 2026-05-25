## Context

The current `/tasks` route renders a placeholder. Project Detail > Tasks already provides task and subtask management with repository-backed Application hooks, `TaskForm`, `SubtaskForm`, `FocusedFormDialog`, `ConfirmDialog`, toast feedback, member/tag selectors, checklist editing, and the pending-subtask completion warning.

This change promotes `/tasks` into a global review and management page for existing tasks across all projects. It remains frontend-only and must preserve the established Ports and Adapters architecture: Domain owns entities and reusable rules, Application owns use cases and TanStack Query hooks, Infrastructure owns Local Storage repository implementations behind ports, and Presentation owns page composition, filtering state, edit/delete surfaces, confirmations, and toasts. The page must not read Local Storage directly or change the `tagsflow_ai_db_v1` schema.

The AI provider layer is not used by this change. `GroqAIProvider` remains behind the provider-neutral AI port for separately approved AI features, and this global tasks view must not call Groq or introduce AI response handling.

## Goals / Non-Goals

**Goals:**

- Replace the `/tasks` placeholder with a functional global task view.
- Load tasks, projects, subtasks, members, and tags through existing Application-layer hooks.
- Present each task with enough cross-project context to scan title, project, status, priority, dates, assignee, tags, checklist progress, and subtask progress.
- Provide deterministic filtering, search, and sorting that can be unit tested independently from React rendering where practical.
- Support compact subtask expansion under each parent task without presenting subtasks as independent global task cards.
- Allow editing and deleting existing tasks using the same form, warning, confirmation, mutation, and toast patterns used by project-scoped task management.
- Keep task creation and subtask creation out of the global page and guide users to choose a project first.

**Non-Goals:**

- No task or subtask creation from `/tasks`.
- No Kanban drag and drop, global Kanban implementation, dashboard metrics, settings, import/export, demo data, or AI features.
- No changes to Domain entity contracts, repository ports, query hook contracts, Local Storage schema, or persistence cleanup rules.
- No app shell redesign and no new backend, authentication, cloud sync, real collaboration, or real-time notifications.
- No new runtime dependency unless implementation discovers a specific local blocker that existing React, TanStack Query, TanStack Table, and shared components cannot handle.

## Decisions

1. Build a Presentation-layer global task projection.

The page should compose existing task, project, subtask, member, and tag data into a `GlobalTaskRow`-style view model in Presentation or a small Presentation-adjacent helper. The projection can resolve project name, assignee display, tag objects, checklist counts, and subtask counts without changing the Domain model.

Alternative considered: add repository methods that return joined global task records. This was rejected because the MVP is frontend-only, current repositories already expose the required entities, and adding joined repository contracts would create unnecessary backend migration surface.

2. Keep filtering, search, and sorting as pure helpers.

Project, status, priority, assignee, tag, overdue, upcoming deadline, title/description search, and sort behavior should be implemented in pure typed helpers that accept projected rows and filter/sort state. This keeps the logic testable and avoids duplicating business rules inside JSX.

Alternative considered: embed all filter and sort checks directly in `TasksPage`. This was rejected because the page would become difficult to test and maintain as filters grow.

3. Reuse Domain deadline and progress rules where they already exist.

Overdue and upcoming deadline filters should rely on existing deadline rule semantics for open work where practical. Subtask progress summaries should use the approved progress calculation behavior: a task without subtasks is 0% unless done, and a task with subtasks uses completed subtasks over total subtasks. Project progress remains derived elsewhere and is not persisted.

Alternative considered: store denormalized overdue, upcoming, or progress values. This was rejected because derived metrics must not be persisted and would risk stale values.

The global tasks view should use a default upcoming deadline window of 7 days. This value should be defined as a named constant so future dashboard or settings slices can reuse or adjust it without duplicating magic numbers.

4. Reuse the existing task edit path.

Editing from the global view should render `TaskForm` in a focused surface and submit through `useUpdateTask`. Required field asterisks, validation messages, member selection, tag selection, checklist editing, cancel behavior, and success toast behavior should remain consistent with Project Detail > Tasks.

Alternative considered: create a simplified inline editor for the global table. This was rejected because it would duplicate validation and form mapping behavior and make the pending-subtask completion warning easier to miss.

5. Preserve the pending-subtask completion warning on global edits.

When an edit changes a task status to `done`, the page must check the task's subtasks and open the existing shared confirmation pattern if any subtask is not done. The update must not be sent until the user confirms. If the task has no pending subtasks, the update can be submitted directly.

Alternative considered: only warn on direct status quick-actions and not form saves. This was rejected because the user can mark a task done through the edit form, so the same safety rule must apply.

6. Use a scan-friendly table or dense card list without adding creation affordances.

The page may use TanStack Table or a local list implementation, but the result should be compact, responsive, and optimized for scanning cross-project work. Empty states and guidance can link or navigate to `/projects` so users choose a project before creating tasks. There must be no global "new task" or "new subtask" action.

Alternative considered: mirror Project Detail > Tasks with full cards and create forms. This was rejected because `/tasks` is for global review and existing-task management, while creation remains project-scoped.

7. Keep subtasks read-only in the global tasks view.

Expanded subtasks in the global `/tasks` page should provide compact read-only context only. They should display subtask title, status, priority, assignee, tags, due date, and checklist summary, but they should not expose subtask create, edit, delete, or status mutation actions in this slice.

Alternative considered: allowing full subtask editing from the global tasks page. This was rejected because subtask management is already available inside Project Detail > Tasks, and adding global subtask mutation workflows would make this slice too broad.

8. Keep delete behavior delegated to existing hooks and repository cleanup.

Global task deletion should open `ConfirmDialog`, then call `useDeleteTask` with the task and project context required by the hook. Repository-defined subtask cleanup must remain in Infrastructure/Application behavior; the UI should not manually delete child subtasks.

Alternative considered: manually remove related subtasks from the global page after deleting a task. This was rejected because cleanup behavior already belongs behind repository ports.

## Risks / Trade-offs

- [Risk] Joining all local entities in the page can make `TasksPage` too large. -> Mitigation: extract projection and filter/sort helpers plus focused row/card components.
- [Risk] Global filters can become ambiguous when a member or tag was deleted. -> Mitigation: support unassigned and missing-reference display states while still filtering by current catalog IDs.
- [Risk] Upcoming deadline behavior can be inconsistent if every component defines its own window. -> Mitigation: use a named constant or helper for the default upcoming window and cover it with tests.
- [Risk] Editing from a filtered view can make a task disappear after save. -> Mitigation: show a success toast and let the active filters naturally determine the refreshed list.
- [Risk] A compact global table can become cramped on small screens. -> Mitigation: use responsive columns or switch to stacked cards at narrow widths while preserving the same data and actions.

## Migration Plan

1. Add global task projection and filter/search/sort helpers with focused tests.
2. Replace the `TasksPage` placeholder with data loading through existing hooks and page-local filter/sort/search state.
3. Add global task row/card rendering with empty, loading, and error states.
4. Add compact subtask expansion under parent tasks.
5. Add edit and delete flows using `TaskForm`, `FocusedFormDialog`, `ConfirmDialog`, existing mutation hooks, pending-subtask completion confirmation, and success toasts.
6. Update `/tasks` tests from placeholder assertions to functional rendering and behavior coverage.
7. Run typecheck, lint, tests, build, and browser verification for `/tasks` at desktop and mobile widths.

Rollback is presentation-only: restore the placeholder route and remove the new page helpers/components. No data migration is required because persistence contracts and stored data do not change.

## Open Questions

- None for proposal scope. During implementation, choose table versus responsive card presentation based on the current component and CSS patterns, while keeping the required data, filters, sorting, expansion, and actions intact.
