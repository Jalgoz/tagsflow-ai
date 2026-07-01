## Why

TagsFlow AI has reached the MVP feature set, so the remaining risk is presentation readiness: inconsistent states, missed edge cases, weak regression coverage, or small implementation drift from the approved specs. This change defines a focused final hardening pass for portfolio-ready polish, test coverage, data safety, and OpenSpec alignment without adding new product features.

## What Changes

- Add a final MVP readiness hardening capability covering route/workflow review, UI state consistency, responsive behavior, edge-case safety, architecture-boundary checks, data-safety checks, developer readiness, and manual verification.
- Strengthen automated test expectations for domain rules, Local Storage repositories, settings backup/import/reset, task and subtask workflows, dashboard metrics, Kanban interactions, AI workflows, onboarding, and transient AI data.
- Align the global Kanban overview contract with the current MVP behavior: global tasks may move across status columns, changing their status through drag-and-drop, while task creation, direct editing, direct deletion, and subtask management remain out of scope for `/kanban`.
- Require global Kanban task clicks to open a read-only detail popup that shows task and project context.
- The read-only detail popup may include a navigation action such as `Open task` or `Edit in project` that takes the user to the existing project/task-focused surface where editing is supported.
- Keep polish work limited to consistency fixes, bug fixes, tests, and MVP readiness verification.
- Exclude broad redesigns, new AI workflows, backend work, authentication, cloud sync, collaboration, database-version changes without a proven bug, and repository/domain contract redesign.

## Capabilities

### New Capabilities

- `mvp-readiness-hardening`: Cross-cutting final MVP polish, responsive checks, edge-case hardening, architecture and data-safety verification, test strengthening, developer readiness, and manual release-readiness checklist.

### Modified Capabilities

- `global-kanban-overview`: Update the global Kanban contract from strictly read-only overview to status-only drag-and-drop plus read-only task detail popup, while preserving no task creation, no direct editing, no deletion, and no subtask management.

## Impact

This change affects presentation consistency, route-level regression checks, UI tests, domain and repository tests, AI validation tests, backup/import/reset tests, Kanban interaction tests, and project verification commands. It does not require new runtime dependencies, backend APIs, authentication, data model redesign, repository-port redesign, or a Local Storage database version change unless implementation discovers a proven compatibility bug that cannot be fixed within the current version-one shape.
