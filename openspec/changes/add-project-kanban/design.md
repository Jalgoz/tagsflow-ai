## Context

Project Detail > Tasks already provides project-scoped task CRUD, task editing through `TaskForm`, destructive confirmation through `ConfirmDialog`, toast feedback, and the pending-subtask completion warning. Project Detail > Kanban is still a placeholder, leaving the MVP without the required project-scoped board for moving existing tasks across workflow statuses.

This change is frontend-only and must preserve the established Ports and Adapters boundaries. Domain owns task entities, status values, checklist/subtask progress rules, and repository ports. Application owns use cases and TanStack Query hooks. Infrastructure owns Local Storage repository adapters behind those ports and remains replaceable by future HTTP adapters. Presentation owns board composition, drag-and-drop interaction, form surfaces, confirmations, and toasts.

The Kanban board must not read Local Storage directly, must not change the `tagsflow_ai_db_v1` schema, and must not introduce new task, subtask, project, member, tag, or repository contracts. The AI provider layer is not involved: `GroqAIProvider` remains behind the provider-neutral AI port for separately approved AI features, and this change does not call Groq or validate AI JSON responses.

## Goals / Non-Goals

**Goals:**

- Replace Project Detail > Kanban placeholder content with a functional project-scoped Kanban board.
- Load project tasks, subtasks, members, and tags through existing Application-layer hooks.
- Render tasks in the approved status columns: `backlog`, `todo`, `in_progress`, `blocked`, `review`, and `done`.
- Support drag-and-drop movement between columns using dnd-kit when it is already installed.
- Update moved task status through existing task mutation hooks and show success toast feedback.
- Preserve the pending-subtask completion warning before moving a task to `done`.
- Reuse `TaskForm` for task creation and editing, including required field asterisks and validation messages.
- Use shared `ConfirmDialog` for task deletion and repository-defined cleanup behavior.
- Keep subtasks visible only as compact task-card metadata.
- Keep columns and status behavior configuration-driven through shared task/Kanban constants.

**Non-Goals:**

- No global Kanban overview implementation.
- No changes to the global tasks table.
- No subtask create, edit, delete, or drag-and-drop behavior inside Kanban cards.
- No dashboard metrics, AI subtask generation, AI priority suggestion, AI project summary, settings, import/export, or demo data.
- No changes to domain entity contracts, repository port contracts, Local Storage keys, or persistence cleanup behavior.
- No new drag-and-drop library and no app shell redesign.
- No backend, authentication, cloud sync, real collaboration, or real-time notifications.

## Decisions

1. Use a Presentation-layer board composed from existing Application hooks.

The Project Kanban tab should load project tasks through the existing project-scoped task hook and load subtasks, members, and tags through the existing hooks needed for card metadata. A small board view model can resolve assignee names, tag labels, checklist counts, and subtask progress without changing Domain entities.

Alternative considered: add a repository method that returns pre-grouped Kanban data. This was rejected because the current ports already expose the needed data, the MVP is local-first, and adding a board-specific repository contract would make future HTTP migration less clean.

2. Group tasks through a pure helper keyed by shared status configuration.

Board columns should come from shared task status or Kanban column constants rather than JSX-local arrays. A pure grouping helper can return all configured columns, including empty columns, and place each project task into the column matching its status.

Alternative considered: hardcode columns inside the board component. This was rejected because the MVP explicitly requires configuration-driven Kanban behavior so columns can be changed later.

3. Use dnd-kit for drag-and-drop.

The Project Kanban board must use dnd-kit for drag-and-drop interactions. If the dependency is already installed, reuse it. If it is not installed, this slice may add the required dnd-kit package because project Kanban drag-and-drop is part of the approved MVP.

Dropping a card into a different status column should call the existing task status mutation hook. Dropping into the original column should avoid a redundant mutation.

Alternative considered: add a different drag-and-drop library. This was rejected because dnd-kit is the approved dependency and the change explicitly forbids adding another drag-and-drop dependency.

4. Treat movement to `done` as a guarded status update.

Drag-and-drop movement to `done` should use the same safety rule as existing task workflows: if the task has pending subtasks, open `ConfirmDialog` and defer the mutation until the user confirms. If the user cancels, no mutation is sent and the query-backed card remains in its previous status. If no subtasks are pending, the status update can be sent directly.

Alternative considered: allow Kanban drag-and-drop to bypass the warning because it is only a visual board. This was rejected because the warning is a domain-level UX rule for completing tasks with unfinished child work.

5. Reuse existing task create and edit surfaces.

Creating from a column should open the existing `TaskForm` in the current focused form surface pattern and prefill the task status from the selected column. Editing a card should open the same form for that task. The board should close conflicting create, edit, and delete/complete confirmation states so the active entity is not actionable underneath its form.

Alternative considered: create a compact Kanban-specific task form. This was rejected because it would duplicate validation, required-label, member, tag, and checklist behavior.

6. Keep Kanban cards compact and subtask metadata read-only.

Cards should expose task-level scan metadata: title, priority, due date, assignee, tags, checklist summary, and subtask progress summary. Full subtask management remains in Project Detail > Tasks, and subtasks must not render as independent Kanban cards.

Alternative considered: expand cards into full task/subtask management panels. This was rejected because it would duplicate the Tasks tab and make the board too dense for repeated drag-and-drop use.

7. Use horizontal scrolling for narrow viewports.

The Project Kanban board should preserve all configured columns on narrow screens and allow horizontal scrolling rather than collapsing or hiding workflow columns. Cards should keep readable metadata and avoid forcing drag targets into an unusable compressed layout.

Alternative considered: collapsing columns into a single mobile list. This was rejected because the project Kanban view is primarily a workflow board, and hiding columns would weaken the mental model of moving tasks across statuses.

8. Keep global Kanban overview out of this slice.

The MVP distinguishes interactive Project Kanban from Global Kanban overview. This change implements only the project-scoped board because it is the missing Project Detail tab. Global Kanban remains a separately approved slice so it can define overview filtering and read-only behavior without mixing project-level creation and mutation rules into the same implementation.

## Risks / Trade-offs

- [Risk] Kanban components can become too coupled to task forms and confirmation state. -> Mitigation: keep board grouping/card rendering separate from create/edit/delete/status orchestration.
- [Risk] Drag-and-drop tests can be brittle with browser-like pointer events. -> Mitigation: unit test grouping/status transition helpers and add UI interaction tests only where current test utilities support reliable drag simulation.
- [Risk] Moving a card to `done` can appear visually optimistic before confirmation. -> Mitigation: rely on query-backed state and only update after confirmed mutation; do not commit local status changes before the warning resolves.
- [Risk] Loading subtasks for every task can make card metadata more complex. -> Mitigation: derive compact subtask counts/progress from existing subtask data and keep the card display read-only.
- [Risk] Narrow screens can make six columns cramped. -> Mitigation: use horizontal scrolling or responsive column sizing while preserving stable column/card dimensions and readable metadata.

## Migration Plan

1. Add or reuse shared Kanban column/task status configuration and pure task grouping/progress metadata helpers.
2. Build reusable Project Kanban board and card components that render configured columns and compact task metadata.
3. Wire Project Detail > Kanban to existing project task, subtask, member, and tag hooks with loading, error, empty, and populated states.
4. Add dnd-kit drag-and-drop movement and status mutation through existing task hooks.
5. Add pending-subtask completion confirmation for drops into `done`.
6. Add column-scoped task creation using `TaskForm` with default status from the selected column.
7. Add task editing and deletion from cards using `TaskForm`, `ConfirmDialog`, existing mutation hooks, and success toasts.
8. Add focused helper and UI tests where supported.
9. Run typecheck, lint, tests, build, and browser verification for Project Detail > Kanban at desktop and mobile widths.

Rollback is presentation-only: restore the Kanban tab placeholder and remove the new board helpers/components. No data migration is required because persistence contracts and stored data do not change.

## Open Questions

- None for proposal scope. During implementation, choose the exact card action placement and focused form surface based on existing Project Detail > Tasks patterns.
