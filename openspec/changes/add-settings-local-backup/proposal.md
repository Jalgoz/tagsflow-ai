## Why

The `/settings` route is still a placeholder while the local-first project, task, member, tag, Kanban, global task, global Kanban, and dashboard workflows are already functional. The MVP needs a focused Settings module so users can control appearance and manage local data backups without introducing backend, cloud, authentication, or AI-provider work.

## What Changes

- Replace the `/settings` placeholder with a functional Settings page.
- Add theme settings for light and dark mode, persisted through the existing settings persistence path.
- Apply the selected theme consistently to the app shell and routed pages where the current styling supports it, without redesigning existing modules.
- Add local JSON export for projects, tasks, subtasks, members, tags, and non-sensitive settings, including database version metadata.
- Sanitize backup exports so Groq API keys and future provider secrets are omitted.
- Add local JSON import with file selection, JSON parsing, schema validation, unsupported-version rejection, invalid-shape rejection, clear validation errors, and confirmation before replacement.
- Add local data reset to restore a valid empty database with default settings through a destructive confirmation flow.
- Add Settings UI sections for Appearance, Local data backup, Import data, Danger zone, and an optional disabled AI settings placeholder.
- Reuse shared `ConfirmDialog` and toast feedback for import replacement, reset, export, import, theme update, and reset success.
- Add focused tests for backup sanitization, backup JSON shape, import validation success and failure, reset behavior, theme persistence, and Settings page rendering where the current test stack supports it.

Out of scope:

- Groq API connection, model detection, test connection, provider implementation, or AI workflows.
- Project, task, subtask, member, tag, Kanban, dashboard, or demo onboarding behavior changes.
- Authentication, backend sync, cloud backup, or real multi-user collaboration.
- Domain model contract changes.
- Repository port changes unless current settings and backup behavior cannot work without a minimal existing port addition.

## Capabilities

### New Capabilities

- `settings-local-backup`: Covers the functional Settings page, theme preference persistence, sanitized local backup export, validated local backup import, local data reset, and user feedback for settings/data-transfer actions.

### Modified Capabilities

- `local-storage-persistence`: Add explicit backup import/export and reset behavior around the existing versioned local database and settings persistence.
- `ui-feedback-patterns`: Require the Settings module to reuse shared confirmation and toast primitives for destructive and successful settings/data-transfer actions.

## Impact

- Affected routes: `/settings`.
- Affected layers: Presentation Settings page, Application use cases/hooks for settings and backup operations, Infrastructure Local Storage database/schema utilities, and existing shared feedback components.
- Affected persistence: the existing `tagsflow_ai_db_v1` Local Storage database key and current settings shape.
- Affected contracts: no planned domain model changes; any repository port additions must remain minimal and justified by backup/reset requirements.
- Dependencies: no new dependency is expected beyond existing React, TypeScript, TanStack Query, Zod, and UI feedback foundations.
