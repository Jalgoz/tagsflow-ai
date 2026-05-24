## Context

The current Project Detail > Tasks workflow already has Application-layer task and subtask hooks, reusable `TaskForm` and `SubtaskForm` components, shared `ConfirmDialog`, toast feedback, member/tag selection, checklist editing, and Local Storage persistence behind repository ports. The issue is presentation layout: `SubtaskArea` renders subtask create/edit forms inline inside the expanded task area, causing task cards to become cramped when the full subtask form appears alongside task metadata and the compact subtask list.

This change is a focused Presentation-layer refinement. It must preserve the Ports and Adapters architecture: Domain owns task/subtask types and business rules, Application owns hooks and mutation orchestration, Infrastructure owns Local Storage repositories and future HTTP repository swap paths, and Presentation owns layout, modal/overlay state, confirmations, and toast feedback. AI provider concerns, including `GroqAIProvider` behind the provider-neutral AI port, are not part of this change.

## Goals / Non-Goals

**Goals:**

- Keep Project Detail > Tasks task cards visually clean, readable, and stable when subtasks are expanded.
- Move subtask create and edit forms from the inline task card content area into a reusable focused surface, such as a modal, dialog, or overlay.
- Keep the compact subtask list inside or directly under the parent task area so subtasks remain visually associated with the parent task.
- Keep the "New subtask" action near the parent task while preventing the full subtask form from stretching or splitting the task card.
- Preserve create, edit, delete, validation, required indicators, assignee selection, tag selection, checklist editing, `ConfirmDialog`, and toast behavior.
- Preserve edit-mode exclusivity so the active task or subtask cannot be acted on underneath its edit surface.
- Improve spacing and hierarchy for task metadata, subtasks, task actions, and subtask actions.

**Non-Goals:**

- No changes to domain model contracts, repository ports, query hook contracts, Local Storage schema, or `tagsflow_ai_db_v1`.
- No global `/tasks` table implementation; the route remains a placeholder.
- No Kanban drag and drop, dashboard metrics, settings, import/export, demo data, AI subtask generation, AI priority suggestion, or AI project summary.
- No app shell redesign, backend, authentication, cloud sync, real collaboration, or real-time notification system.
- No new runtime dependency unless implementation discovers a local blocker that cannot be solved with existing components.

## Decisions

1. Use a focused subtask form surface owned by Presentation.

Subtask creation and editing should open a reusable modal/dialog/overlay component that renders `SubtaskForm` outside the task card layout. `SubtaskArea` should keep only the compact subtask list, loading/error/empty states, and local action controls in the parent task area.

Alternative considered: keep the inline form and reduce its fields. This was rejected because it would weaken approved subtask behavior around assignee, tags, checklist, validation messages, and required indicators.

2. Avoid accidental loss of unsaved form input.

The focused subtask create/edit surface should always provide an explicit cancel or close action. If backdrop click or Escape key dismissal is supported, it must not silently discard dirty form state unless the current form pattern already does so consistently across the app.

Alternative considered: allowing every backdrop or Escape dismissal to close immediately. This was rejected because subtask forms can contain checklist, assignee, tag, and date input, and accidental dismissal would be frustrating.

3. Reuse `SubtaskForm` instead of creating a second form model.

The focused surface should compose the existing `SubtaskForm` so validation, required asterisks, assignee selection, tag selection, checklist editing, save, and cancel behavior stay consistent. If a wrapper component is needed, it should be a presentation wrapper around the existing form rather than a separate schema or mapping layer.

Alternative considered: create a simplified quick-add form inside each task. This was rejected because the requested behavior explicitly preserves the full subtask form behavior.

4. Keep subtask data orchestration unchanged.

Subtask create, update, status update, and delete must continue to use existing Application hooks such as `useCreateSubtask`, `useUpdateSubtask`, `useUpdateSubtaskStatus`, and `useDeleteSubtask`. The implementation must not call Local Storage or repository adapters directly from UI components.

Alternative considered: move subtask state into local React state and persist after closing the modal. This was rejected because persisted business entities must remain repository-backed through TanStack Query hooks.

5. Treat modal state and delete confirmation state as mutually exclusive.

Opening subtask create/edit closes subtask delete confirmation for the same parent task. Opening delete closes the focused subtask form. Closing the focused form discards unsaved form state. While a subtask is being edited, that subtask must not remain actionable in the compact list underneath.

Alternative considered: leave the edited row visible and disabled. This can work visually, but hiding or replacing the actionable row is clearer and already matches the approved edit-mode exclusivity behavior.

6. Keep the parent association visible in the focused surface.

The modal/dialog/overlay should identify that the user is creating or editing a subtask for the current parent task, using concise title/description text and preserving the parent context from the surrounding expanded task area. The parent task card remains visible behind the surface when the UI pattern allows it, but its covered controls must not be used to mutate the same subtask while editing.

Alternative considered: navigate to a separate subtask detail route. This was rejected because subtasks remain managed inside the parent task workflow and global task routes are out of scope.

7. Improve hierarchy through CSS and component boundaries, not data changes.

Task cards should prioritize title, status, priority, dates, assignee, tags, checklist summary, and actions. Expanded subtasks should render as compact rows/cards with restrained metadata and action grouping. Any spacing changes should be scoped to the Project Detail task components and shared overlay styles, avoiding a broad shell redesign.

Alternative considered: redesign all project detail panels. This was rejected because the change is meant to solve one layout issue without disturbing unrelated project, member, tag, Kanban, dashboard, AI, or settings surfaces.

## Risks / Trade-offs

- [Risk] A modal can hide parent context while creating a subtask. -> Mitigation: keep the "New subtask" action in the parent task area and include concise parent-aware copy in the focused surface.
- [Risk] Adding another dialog variant can duplicate `ConfirmDialog` styling. -> Mitigation: extract only the reusable non-destructive modal structure needed for form workflows, while keeping destructive actions on `ConfirmDialog`.
- [Risk] Edit-mode exclusivity can regress if the edited subtask remains clickable in the list. -> Mitigation: filter or replace the active subtask row while the edit surface is open and cover this behavior with focused UI tests where supported.
- [Risk] Mobile layouts can still feel cramped if the modal width or form actions are not responsive. -> Mitigation: reuse existing responsive form styles and add overlay constraints so fields and action buttons fit narrow viewports.
- [Risk] Toast and query behavior can regress during refactor. -> Mitigation: keep existing mutation calls and success toast calls intact, changing only where the form is rendered.

## Migration Plan

1. Add or reuse a focused form modal/dialog/overlay component in the Presentation layer.
2. Refactor `ProjectTasksPanel` subtask create/edit state so `SubtaskForm` renders in the focused surface instead of inline in `SubtaskArea`.
3. Keep the compact subtask list and "New subtask" action in the parent task area.
4. Preserve subtask delete confirmation with `ConfirmDialog` and success toast feedback.
5. Adjust scoped CSS for task cards, subtask lists, subtask actions, and the focused form surface.
6. Add or update focused UI tests for subtask modal create/edit, exclusivity, delete confirmation, validation indicators/messages, and `/tasks` remaining a placeholder where supported.
7. Run typecheck, lint, tests, build, and browser verification for Project Detail > Tasks on desktop and mobile widths.

Rollback is straightforward because no persistence, domain, or repository contracts change: revert the presentation refactor and render `SubtaskForm` inline again if needed.

## Open Questions

- None for proposal scope. During implementation, choose the smallest reusable focused surface that fits the current component and CSS patterns.
