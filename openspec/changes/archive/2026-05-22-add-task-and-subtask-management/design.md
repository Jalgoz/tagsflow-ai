## Context

The current codebase already has strict domain entities, task and subtask repository ports, Local Storage repository adapters, member/tag catalog management, Project Detail with a placeholder Tasks tab, and reusable confirmation/toast feedback. This change turns the project-scoped task workflow into usable MVP functionality without changing domain or persistence contracts.

The implementation must preserve the Ports and Adapters architecture:
- Domain owns task/subtask types, status and priority constants, checklist types, repository ports, and pure rules such as pending-subtask completion detection.
- Infrastructure continues to implement persistence through Local Storage repositories behind the existing ports.
- Application owns use cases, TanStack Query hooks, query invalidation, and form validation schemas.
- Presentation owns forms, task/subtask list rendering, edit/create state, confirmation dialogs, and toast feedback.

## Goals / Non-Goals

**Goals:**
- Add task and subtask Application-layer use cases that delegate through existing repository ports.
- Add task and subtask query hooks that follow the established project/member/tag hook patterns.
- Add Zod-backed schemas for task and subtask forms, including date ordering and checklist validation.
- Build reusable `TaskForm`, `SubtaskForm`, and checklist editor components.
- Make Project Detail > Tasks a functional project-scoped task management view.
- Support existing member assignment and existing tag assignment for tasks and subtasks.
- Use shared `ConfirmDialog` for task deletion, subtask deletion, and completing a task with pending subtasks.
- Use shared toast feedback after successful task and subtask mutations.
- Preserve edit-mode exclusivity so an item being edited is not also rendered as an actionable item beneath the edit surface.
- Add focused tests that match the current Vitest and Testing Library setup where supported.

**Non-Goals:**
- No kanban drag and drop, global tasks table, dashboard metrics, AI task features, settings, import/export, or demo data.
- No new backend, authentication, cloud sync, or real collaboration.
- No change to the `tagsflow_ai_db_v1` persistence key or repository contracts.
- No inline member creation from task forms.
- No complex inline tag creation from task forms; existing tag catalog selection is enough for this slice.
- No new notification or confirmation system.

## Decisions

1. Keep task orchestration in Application use cases.
   - Decision: create `createTaskUseCases` and `createSubtaskUseCases` modules that wrap `TaskRepository` and `SubtaskRepository`.
   - Rationale: this matches existing project, member, and tag use cases and keeps Presentation from calling repository adapters directly.
   - Alternative considered: call repository hooks directly from UI. Rejected because it would weaken the existing architecture boundary.

2. Use existing repository ports and Local Storage adapters without contract changes.
   - Decision: implement the requested operations using current port methods such as `listByProjectId`, `setStatus`, `assignMember`, `setTagIds`, and `setChecklist`.
   - Rationale: the domain and persistence slices already approved these contracts, and future HTTP repositories can implement the same ports.
   - Alternative considered: extend ports with UI-specific operations. Rejected because the current ports already cover the needed behavior.

3. Model task/subtask hooks after the existing feature hooks.
   - Decision: add query key factories and hooks for task and subtask reads and mutations, with invalidation of all affected task, subtask, project, member, and tag views where relevant.
   - Rationale: TanStack Query is the approved orchestration layer for business data, and consistent key structure keeps future global task and kanban features easier to add.
   - Alternative considered: local React state as the source of truth. Rejected because persisted business entities must remain repository-backed.

4. Keep completion warning logic explicit and domain-driven.
   - Decision: when a task status is changed to `done`, load or use the task's subtasks and call the existing pending-subtask domain rule before opening a confirmation dialog.
   - Rationale: the warning is a business rule, but the dialog is a Presentation decision. Keeping the rule pure avoids duplicating status logic in components.
   - Alternative considered: always block completion until subtasks are done. Rejected because the approved rule allows completion after explicit confirmation.
   - The completion warning must apply to every UI path that can set a task status to `done`, including quick status changes and saving the task edit form with `done` selected. The user must be able to cancel the status change before any mutation is sent.

5. Treat the Project Detail Tasks tab as the only task management surface in this slice.
   - Decision: implement task CRUD and nested subtask CRUD inside Project Detail > Tasks, with a lightweight detail/edit surface rather than a separate route.
   - Rationale: this satisfies the project workflow while avoiding global tasks table and kanban scope.
   - Alternative considered: implement `/tasks` globally first. Rejected because the requested scope is project task workflows and global tasks are explicitly out of scope.

6. Reuse member and tag catalogs through selection controls.
   - Decision: forms load existing members and tags through current hooks and persist selected IDs on tasks and subtasks.
   - Rationale: it integrates assignments without changing member/tag catalog contracts or adding inline creation complexity.
   - Alternative considered: inline member/tag creation inside task forms. Rejected for this slice because it increases UI state and validation surface.

7. Use practical defaults for task and subtask forms.

Task and subtask forms should require `title`, `status`, and `priority`, but `status` and `priority` should have sensible defaults when creating new records.

Default values:
- task status: `todo`
- subtask status: `todo`
- task priority: `medium`
- subtask priority: `medium`
- start date: `null`
- due date: `null`
- assignee: `null`
- tags: empty array
- checklist: empty array

The required asterisk should still appear for title, status, and priority, even when status and priority are preselected by default.

Alternative considered: forcing users to manually choose status and priority every time. This was rejected because it adds unnecessary friction to common task creation.

8. Keep edit, create, and delete confirmation state mutually exclusive.
   - Decision: opening create, edit, or delete confirmation state closes conflicting state for the same list area. The entity being edited is rendered only as an edit form, not as an actionable card or row beneath it.
   - Rationale: this follows the existing edit-mode UX expectation and prevents duplicate actions against the same entity.
   - Alternative considered: render edit form inline while keeping the original row active. Rejected because it creates conflicting actions and test ambiguity.

## Risks / Trade-offs

- [Risk] Project Detail can become too large if task and subtask UI is implemented directly in the page. -> Mitigation: extract `ProjectTasksPanel`, `TaskForm`, `SubtaskForm`, checklist editor, and focused row/card components.
- [Risk] Query invalidation can miss related views such as project task counts. -> Mitigation: centralize query keys and invalidate project detail, task lists, task detail, and subtask lists after relevant mutations.
- [Risk] Completion warning can be bypassed if only one status path checks pending subtasks. -> Mitigation: route all UI status changes to a shared handler that checks pending subtasks before calling `useUpdateTaskStatus`.
- [Risk] Form mapping can drift from domain input shape. -> Mitigation: add schema tests and checklist mapping tests for create and edit values.
- [Risk] Toast noise can become excessive for every small field change. -> Mitigation: show success toasts for explicit user actions and mutation completions, with concise copy.
- [Risk] UI tests for toast and query invalidation may require utilities not yet present. -> Mitigation: add tests where current setup supports them and keep unsupported cases as clear implementation notes rather than broad test infrastructure churn.

## Migration Plan

1. Add Application-layer task/subtask modules and tests without changing persisted data shape.
2. Add validation schemas and form mapping tests.
3. Add reusable Presentation components.
4. Replace Project Detail > Tasks placeholder with the new task panel.
5. Add completion warning and deletion confirmations with existing feedback primitives.
6. Run typecheck, lint, tests, and build checks available in the project.

Rollback is straightforward because no persistence schema or repository contract changes are introduced. Reverting this change removes the new Application and Presentation slice while existing persisted task/subtask data remains compatible with the current Local Storage schema.

## Open Questions

- None for proposal scope. The implementation should use current repository and UI patterns unless local code inspection reveals a smaller established component boundary.
