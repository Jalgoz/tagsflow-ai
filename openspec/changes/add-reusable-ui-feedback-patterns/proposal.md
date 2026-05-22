## Why

Project, member, tag, task, subtask, settings, and AI workflows need consistent feedback before more CRUD surfaces are added. Destructive actions currently rely on local inline confirmation patterns, and successful mutations do not share a reusable success notification contract.

## What Changes

- Add a reusable confirmation dialog pattern for destructive actions with title, description, cancel action, confirm action, destructive styling, and loading/disabled state.
- Add a reusable toast notification pattern for lightweight success feedback after create, update, delete, and assignment actions.
- Support success toast messages and allow error toast messages when useful for future flows.
- Apply the confirmation dialog to existing project deletion, member deletion, and tag deletion.
- Apply success toasts to existing project, member, and tag create/update/delete flows.
- Add a project-wide UX rule that future destructive actions use `ConfirmDialog`, and future successful create/update/delete/assignment actions use toast notifications rather than blocking success dialogs.
- Keep this change frontend-only and avoid adding real-time notifications, backend messaging, authentication, collaboration, task CRUD, subtask CRUD, settings implementation, import/export, or AI behavior.

## Capabilities

### New Capabilities
- `ui-feedback-patterns`: Defines reusable confirmation dialog and toast notification behavior for TagsFlow AI user feedback.

### Modified Capabilities
- `project-management`: Project create, update, and delete flows must use reusable toast feedback; project deletion must use the reusable confirmation dialog.
- `member-management`: Member create, update, and delete flows must use reusable toast feedback; member deletion must use the reusable confirmation dialog while preserving assignment warnings.
- `tag-management`: Tag create, update, and delete flows must use reusable toast feedback; tag deletion must use the reusable confirmation dialog while preserving usage warnings.

## Impact

- Presentation layer: shared `ConfirmDialog`, toast provider, toast hook, and wiring in app shell/pages.
- Existing pages: Projects, Project Detail, and Members/Tags management UI.
- Existing tests: focused component/provider tests for feedback primitives, plus flow-level test updates where current utilities support them.
- No persistence, repository, domain, backend, AI provider, or Local Storage behavior changes.
