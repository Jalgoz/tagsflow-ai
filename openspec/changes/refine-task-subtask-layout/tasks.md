## 1. Focused Subtask Form Surface

- [ ] 1.1 Inspect existing `ConfirmDialog`, form, and panel styles to choose the smallest reusable non-destructive modal/dialog/overlay pattern for subtask forms.
- [ ] 1.2 Add a reusable focused form surface component or scoped project-task form overlay for create/edit forms without destructive-dialog styling.
- [ ] 1.3 Ensure the focused surface supports title, description, children content, cancel/close behavior, keyboard dismissal where appropriate, and responsive sizing.
- [ ] 1.4 Add focused surface tests for rendering, cancel behavior, and basic accessibility semantics where current test utilities support them.

## 2. Subtask State Refactor

- [ ] 2.1 Refactor `ProjectTasksPanel` subtask editor state so create/edit opens the focused surface instead of rendering `SubtaskForm` inline inside `SubtaskArea`.
- [ ] 2.2 Keep the "New subtask" action in the expanded parent task area and wire it to the focused create surface.
- [ ] 2.3 Wire focused create saves through the existing `useCreateSubtask` mutation and preserve the existing success toast.
- [ ] 2.4 Wire focused edit saves through the existing `useUpdateSubtask` mutation and preserve the existing success toast.
- [ ] 2.5 Preserve focused form cancel behavior so unsaved subtask values are discarded and no mutation is sent.
- [ ] 2.6 Preserve subtask delete behavior with the shared `ConfirmDialog`, `useDeleteSubtask`, loading state, cancellation, and success toast.
- [ ] 2.7 Ensure subtask create, subtask edit, and subtask delete confirmation states are mutually exclusive for the parent task area.
- [ ] 2.8 Ensure an edited subtask is not actionable in the compact subtask list underneath the focused edit surface.

## 3. Task And Subtask Layout Polish

- [ ] 3.1 Refine task card spacing so metadata, scope, tags, checklist summary, and task actions remain readable when subtasks are expanded.
- [ ] 3.2 Refine the subtasks section so the header, empty state, compact list, metadata, and action controls have clear hierarchy.
- [ ] 3.3 Remove or repurpose inline subtask form panel styles that are no longer used by Project Detail > Tasks.
- [ ] 3.4 Verify responsive behavior so task cards, subtask rows, action groups, and the focused form surface fit narrow and desktop viewports without text overlap.

## 4. Boundary And Regression Tests

- [ ] 4.1 Add or update Project Detail task workflow tests verifying subtask creation opens a focused surface rather than an inline form inside the task card.
- [ ] 4.2 Add or update tests verifying subtask editing opens a focused surface and the edited subtask is not actionable underneath.
- [ ] 4.3 Add or update tests verifying subtask delete still uses `ConfirmDialog` and preserves cancellation and success behavior where supported.
- [ ] 4.4 Add or update tests verifying required field indicators and validation messages still render inside the focused subtask form surface.
- [ ] 4.5 Add or update a `/tasks` route/page test verifying the global tasks page remains a placeholder and does not render the global tasks table.

## 5. Verification

- [ ] 5.1 Run relevant task/subtask form and Project Detail UI tests.
- [ ] 5.2 Run TypeScript typecheck.
- [ ] 5.3 Run lint.
- [ ] 5.4 Run the production build.
- [ ] 5.5 Manually verify Project Detail > Tasks create/edit/delete task behavior, expand/collapse, create/edit/delete subtask behavior, required labels, validation messages, confirmations, and success toasts in the browser.
- [ ] 5.6 Manually verify Project Detail > Tasks layout at desktop and mobile widths, including focused subtask create/edit surfaces and compact subtask lists.
