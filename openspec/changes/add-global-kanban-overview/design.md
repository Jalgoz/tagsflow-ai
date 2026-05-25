## Context

The global `/kanban` route is currently a placeholder or non-functional overview, while Project Detail > Kanban already implements the interactive project-scoped board. The MVP separates these concerns: project boards are where users create and move project tasks, and the global board is an overview for scanning workflow state across projects.

This change remains frontend-only and must preserve the established Ports and Adapters architecture. Domain owns task status values, task/subtask entities, checklist data, progress rules, and repository ports. Application owns use cases and TanStack Query hooks. Infrastructure owns Local Storage repository adapters behind those ports and remains replaceable by future HTTP adapters. Presentation owns the `/kanban` page, board layout, filter state, compact metadata display, empty/loading/error states, and navigation.

The global board must not read Local Storage directly, must not call mutation hooks, must not change `tagsflow_ai_db_v1`, and must not introduce new domain or repository contracts. The AI provider layer is not involved: GroqAIProvider remains behind the provider-neutral AI interface for separately approved AI features, and this change does not call AI providers or validate AI JSON responses. Import/export validation also remains outside this change.

## Goals / Non-Goals

**Goals:**

- Replace the `/kanban` placeholder with a functional read-only global Kanban overview.
- Load projects, tasks, subtasks, members, and tags through existing Application-layer query hooks or use cases.
- Render every configured Kanban column for `backlog`, `todo`, `in_progress`, `blocked`, `review`, and `done`.
- Group top-level tasks from all projects by task status.
- Show compact card metadata for title, project name, priority, due date, assignee, tags, checklist summary, and subtask progress summary.
- Filter by all projects by default or a selected single project.
- Add priority, assignee, and tag filters if they can be implemented with existing UI patterns and pure helpers without turning the board into another global task table.
- Navigate from a card or project link to `/projects/:projectId` for editing and project-scoped Kanban movement.
- Reuse existing global task projection and Kanban metadata helpers where practical.
- Keep columns configuration-driven through shared task status or Kanban column constants.

**Non-Goals:**

- No drag and drop on the global board.
- No task creation, editing, deletion, or status mutation from `/kanban`.
- No subtask create, edit, delete, status mutation, or expanded subtask management from `/kanban`.
- No dashboard metrics, AI features, settings, import/export, demo data, or app shell redesign.
- No changes to task/subtask entity contracts, repository port contracts, query hook contracts, Local Storage keys, or persistence cleanup behavior.
- No new backend, authentication, cloud sync, real collaboration, or real-time notifications.
- No new external dependency is expected for this read-only board.

## Decisions

1. Build a Presentation-layer global board from existing Application data.

The `/kanban` page should compose existing projects, tasks, subtasks, members, and tags into card view models. This keeps the route frontend-only and repository-backed without adding joined repository methods.

Alternative considered: add a global Kanban repository method that returns pre-grouped records. This was rejected because existing ports already expose the needed data, and a board-specific repository contract would add unnecessary future HTTP migration surface.

2. Reuse or extend pure projection and metadata helpers.

Project name resolution, assignee display, tag display, checklist summary, and subtask progress summary should reuse existing global task or Kanban helpers where practical. If the current helpers are too page-specific, add small pure helpers that accept domain entities and return display-ready metadata without mutating data.

Alternative considered: duplicate metadata resolution inside React card components. This was rejected because it would repeat business-adjacent display rules already needed by `/tasks` and Project Kanban.

3. Group tasks by shared configured columns.

The global board should use shared task status or Kanban column constants to render columns and group cards. The grouping helper must return all configured columns, including empty columns, so the workflow shape remains stable.

Alternative considered: hardcode column arrays inside the global board JSX. This was rejected because the MVP requires configuration-driven Kanban behavior for future column changes.

4. Keep `/kanban` strictly read-only.

The global board should not render create buttons, edit/delete controls, drag handles, droppable behavior, status quick actions, subtask management controls, or mutation-confirmation dialogs. Its only task-level action is navigation to project detail.

Alternative considered: allow global status movement because the route looks like a Kanban board. This was rejected because the approved MVP assigns status movement to Project Detail > Kanban and keeps global Kanban as an overview to reduce cross-project mutation risk.

5. Filter before grouping.

The page should apply project and optional lightweight filters to the projected task cards before grouping them into columns. This keeps empty configured columns visible while ensuring card counts and contents reflect active filters.

Alternative considered: group first and filter inside each column component. This was rejected because it spreads filtering behavior across components and makes the logic harder to unit test.

6. Navigate to project detail rather than task mutation surfaces.

Clicking a global Kanban task card or its project link must navigate to `/projects/:projectId` for the related project. The global board must not open edit forms, delete dialogs, status controls, task detail overlays, or subtask management surfaces.

Project Detail views remain the place for editing, deleting, subtask management, and project-scoped Kanban movement.

Alternative considered: deep-link directly to a task edit state. This was rejected for this slice because no task-detail route contract is approved and it would expand the read-only global board into a mutation workflow.

7. Preserve local-first and future HTTP migration boundaries.

Because the board consumes Application-layer query hooks rather than Local Storage directly, future HTTP repositories can replace Local Storage adapters without changing the global Kanban behavior. Derived card metadata and progress summaries are recomputed from loaded entities and are not persisted.

Alternative considered: cache global board cards in Local Storage. This was rejected because derived metrics must not be persisted and would risk stale cross-project metadata.

## Risks / Trade-offs

- [Risk] The global board can duplicate `/tasks` filtering scope. -> Mitigation: keep filters lightweight and board-oriented; `/tasks` remains the richer searchable/sortable management view.
- [Risk] Six columns can be cramped on small screens. -> Mitigation: preserve all configured columns with horizontal scrolling or responsive column sizing rather than hiding workflow states.
- [Risk] Users may expect drag and drop because the board uses Kanban columns. -> Mitigation: remove drag affordances, avoid droppable styling, and make navigation to project detail clear.
- [Risk] Metadata helpers can become coupled to one page. -> Mitigation: keep projection/grouping helpers pure and typed, with focused unit tests.
- [Risk] Filtered boards may show many empty columns. -> Mitigation: keep empty column states compact and include visible result counts so the workflow remains understandable.

## Migration Plan

1. Inspect the existing `/kanban` placeholder, Project Kanban column constants, global task projection helpers, task metadata helpers, and route tests.
2. Add or reuse pure global Kanban projection, filtering, and grouping helpers that return all configured columns.
3. Build read-only global Kanban board/card components with loading, error, empty, and filtered-empty states.
4. Wire `/kanban` to existing query hooks for projects, tasks, subtasks, members, and tags.
5. Add project filtering and optional priority, assignee, and tag filters if they fit the current UI without broadening scope.
6. Add navigation from cards or project links to `/projects/:projectId`.
7. Add focused helper and UI tests for grouping, columns, filters, metadata, read-only boundaries, and navigation.
8. Run relevant checks: typecheck, lint, tests, build, and browser verification for `/kanban` at desktop and mobile widths.

Rollback is presentation-only: restore the `/kanban` placeholder and remove the new board helpers/components. No data migration is required because persistence contracts and stored data do not change.

## Open Questions

- None for proposal scope. During implementation, decide whether optional priority, assignee, and tag filters fit the current filter control layout without reducing board readability.
