## Context

TagsFlow AI already has project, member, and tag mutation flows backed by Application-layer hooks and Local Storage repositories. Those flows currently own their confirmation and success-feedback details inside page components, which makes destructive confirmations and mutation feedback inconsistent as more CRUD modules are added.

This change is Presentation-layer focused. It must preserve the Ports and Adapters boundaries: domain entities, repository ports, Local Storage adapters, TanStack Query hooks, and future HTTP repository migration paths remain unchanged. The same is true for AI concerns: `GroqAIProvider` remains behind the provider-neutral AI port and is not part of this feedback slice.

## Goals / Non-Goals

**Goals:**
- Define reusable destructive confirmation behavior through a shared `ConfirmDialog` component.
- Define reusable success and error notification behavior through a toast provider and hook.
- Wire the reusable feedback patterns into existing project, member, and tag mutation flows.
- Keep feedback accessible with visible text, dialog semantics, keyboard-friendly dismissal, and non-blocking success notifications.
- Establish UX rules that future task, subtask, settings, assignment, import/export, and AI flows can reuse.

**Non-Goals:**
- No task CRUD, subtask CRUD, kanban drag and drop, dashboard metrics, settings implementation, import/export, or AI feature implementation.
- No persistence, repository, domain, Local Storage, or backend behavior changes.
- No real-time notification system, collaboration messaging, authentication, or cloud sync.
- No third-party toast library unless implementation discovers a strong local justification.
- No broad visual redesign of the app shell or existing pages.

## Decisions

1. Build feedback primitives in the Presentation layer.

`ConfirmDialog`, `ToastProvider`, and `useToast` belong under shared presentation UI because they are visual interaction patterns, not business rules. Application hooks continue to return mutation state and data; pages decide when to show confirmation and when to enqueue feedback.

Alternative considered: put feedback into Application hooks. That would make hooks aware of UI messaging and reduce reuse across future non-React or test contexts, so it is avoided.

2. Use a blocking dialog only for confirmation, not success.

Destructive actions require an explicit user decision, so `ConfirmDialog` should be modal and block the action until cancel or confirm. Successful create/update/delete/assignment actions should use toast notifications so users are informed without being forced through another dialog.

Alternative considered: inline confirmation panels. They preserve context but have already produced inconsistent sizing and state-management issues across pages. A shared dialog provides a single pattern before more modules are added.

3. Keep confirmation content supplied by the caller.

The shared dialog handles layout, buttons, destructive styling, disabled/loading state, and accessibility. The page supplies the title, description, labels, and confirm handler so member assignment warnings and tag usage warnings can preserve their existing business context.

Alternative considered: encode member/tag/project-specific messages inside the dialog component. That would couple shared UI to feature modules and make future task or settings confirmations harder to reuse.

4. Implement a lightweight in-app toast provider without a new dependency.

The provider should manage a small list of notifications, expose `useToast`, support success and error variants, auto-dismiss messages, and render accessible text. This keeps the bundle and dependency surface stable.

Alternative considered: adding a third-party toast package. The MVP already has enough local UI structure for a simple provider, and adding a package is not justified for the requested scope.

5. Use a consistent toast placement and lifetime.

Toast notifications should render in a fixed stack near the top-right of the application shell on desktop and adapt to a readable top or bottom placement on narrow screens. Success toasts should auto-dismiss after a short duration, around 3 to 5 seconds, while still allowing manual dismissal.

Error toasts may stay visible slightly longer or until manual dismissal if the implementation supports it without adding complexity.

Alternative considered: rendering toasts near the triggering button. This was rejected because a global stack is easier to reuse across future project, task, settings, import/export, and AI flows.

6. Keep feedback messages short and action-specific.

Toast messages should be concise and specific to the completed action.

Examples:
- "Project created."
- "Project updated."
- "Project deleted."
- "Member created."
- "Member updated."
- "Member deleted."
- "Tag created."
- "Tag updated."
- "Tag deleted."

Messages should not mention unrelated cascade behavior unless the user explicitly confirmed a destructive action that affects related records.

Alternative considered: verbose success messages with detailed explanations. This was rejected because success toasts should confirm the action without interrupting the workflow.

7. Keep mutation cleanup local to pages.

Pages should close edit/delete state around mutation success and enqueue toasts after successful `mutateAsync` calls. Existing TanStack Query invalidation remains owned by the Application hooks.

Alternative considered: global mutation listeners. That would require broad conventions for message derivation and risks duplicate notifications.

## Risks / Trade-offs

- [Risk] Toasts can become noisy if every background query or validation event emits one -> Mitigation: this change limits required toasts to successful create/update/delete/assignment actions and optional explicit error handling.
- [Risk] A modal dialog can feel heavier than inline confirmation for simple deletes -> Mitigation: use compact content, clear labels, and reserve dialogs only for decisions requiring user input.
- [Risk] Existing page state can leave edit and delete surfaces open together -> Mitigation: pages applying `ConfirmDialog` must close competing edit/create state before opening a destructive confirmation.
- [Risk] Tests for timed auto-dismiss can be brittle -> Mitigation: isolate provider behavior with fake timers or test manual dismissal if the current test utilities make timer assertions unreliable.

## Migration Plan

1. Add shared feedback primitives and tests.
2. Wrap the app shell or root provider tree with `ToastProvider`.
3. Replace project, member, and tag inline delete confirmations with `ConfirmDialog`.
4. Add success toast calls after project, member, and tag create/update/delete mutations.
5. Remove obsolete inline confirmation styling that is no longer used by these flows, if no other page depends on it.

Rollback is straightforward because no persisted data contracts change: restore the previous page-level confirmation rendering and remove the provider wiring.

## Open Questions

- None for the proposal. Exact visual spacing, animation, and placement can follow the current app shell styling during implementation.
