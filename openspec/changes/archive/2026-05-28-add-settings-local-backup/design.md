## Context

The app already has a routed shell, Local Storage repositories, Zod-backed local database validation, default settings, shared feedback primitives, and functional project/task/member/tag/Kanban/dashboard workflows. `/settings` currently renders a placeholder even though the MVP requires theme preferences and local JSON backup/import behavior.

The existing local database uses the single `tagsflow_ai_db_v1` key and a version-one shape containing projects, tasks, subtasks, members, tags, and settings. `AppSettings` already contains a `theme` field and a Groq provider configuration with an `apiKey`; this change must persist theme updates but must never export the API key or any future secret-bearing provider value.

## Goals / Non-Goals

**Goals:**

- Replace the Settings placeholder with a focused, usable Settings page.
- Persist light/dark theme through the existing settings persistence path and apply it to the shell and routed pages where current styling supports it.
- Export a versioned JSON backup containing business entities and sanitized settings.
- Import a JSON backup only after parsing and validating the complete replacement database.
- Reset local data to a valid empty database and default settings.
- Keep parsing, validation, sanitization, replacement, and reset orchestration out of presentation-only code.
- Reuse the existing `ConfirmDialog` and toast feedback patterns.
- Preserve frontend-only, local-first architecture and future repository migration paths.

**Non-Goals:**

- Implement Groq connection, model detection, model recommendations, test connection, AI provider behavior, or AI workflows.
- Add backend sync, cloud backup, authentication, real collaboration, or notifications.
- Redesign the full app theme or restyle every existing module beyond the simple theme support needed for current surfaces.
- Change project, task, subtask, member, tag, Kanban, dashboard, progress, or demo onboarding behavior.
- Store derived metrics in backups.

## Decisions

### Keep backup operations in Application/Infrastructure, not Presentation

Settings UI components will call application-level hooks/use cases for settings reads/writes, export generation, import validation/replacement, and reset. Infrastructure will own Local Storage database parsing, schema validation, version checks, sanitization, serialization, and complete database replacement.

Rationale: Presentation can manage file input state and confirmation state, but it must not directly read/write Local Storage or duplicate database schemas. This keeps the same Ports and Adapters boundary used by projects, tasks, members, tags, and dashboard metrics.

Alternative considered: parse the uploaded JSON directly in `SettingsPage`. This is faster to wire but would bypass architecture rules and make validation harder to test.

### Reuse and extend the existing local database schema

Backup import validation will reuse the version-one local database schema where practical, adding a backup-facing parser that can report actionable validation failures instead of silently recovering to an empty database. Export will serialize the current local database shape with version metadata and sanitized settings.

Rationale: The Local Storage schema is already the source of truth for entity shapes. Import needs stricter behavior than normal app hydration: malformed backups must be rejected, while corrupted live storage can still recover safely.

Alternative considered: create a separate backup DTO schema. That could be useful for future backup formats, but it risks drifting from the persisted database shape during the MVP unless there is a clear versioning need.

### Sanitize settings before export

Exported settings will include non-sensitive preferences such as theme and provider/model metadata, but will omit or neutralize `aiProvider.apiKey` and any future secret-bearing fields. The export sanitizer should be a named, tested helper rather than inline object spreading in the page.

Rationale: Secrets are already expected to live locally, and backup files are user-movable artifacts. A dedicated sanitizer makes the security boundary visible and testable.

Alternative considered: omit all AI settings from backups. This is safer but less useful because non-secret selected model/provider metadata can be restored without exposing credentials.

### Preserve and reject secret-bearing import fields

Backup import must not restore or accept secret-bearing fields such as `aiProvider.apiKey`. If an imported backup includes secret fields, the import parser must ignore or strip those fields before replacement rather than writing them to Local Storage.

When replacing local data from a valid backup, imported non-sensitive settings may be restored, but existing local secret values should not be overwritten by backup content. Reset local data may clear secret values because reset is an explicit destructive action.

Alternative considered: allowing backups to restore API keys. This was rejected because backup files are portable user artifacts and must not become a secret transport mechanism.

### Treat import and reset as full database replacement operations

Import replacement will validate a complete database snapshot and then replace the current local database only after explicit confirmation. Reset will save `createEmptyLocalDatabase()` so the app remains in a valid initialized state with default settings.

Rationale: The MVP backup is local and database-shaped, so partial merge semantics would add relationship conflict handling without clear user value. Full replacement is predictable and easier to validate.

Alternative considered: merge imported entities into the current database. That would require ID conflict rules, relationship reconciliation, and duplicate handling, which are outside this focused module.

### Keep export non-blocking

Export is a non-destructive action and should not require `ConfirmDialog`. The Settings page should generate and download the sanitized JSON backup directly after the user clicks export, then show a success toast or an error message if export fails.

Import replacement and local reset remain destructive actions and must use `ConfirmDialog`.

Alternative considered: asking for confirmation before export. This was rejected because export does not mutate local data and extra confirmation would add unnecessary friction.

### Apply theme through an app-level theme owner

The app should read the persisted theme near the shell/provider boundary and apply a stable theme marker, such as a root class or data attribute, that existing and new CSS can target. The Settings page updates settings through the repository path and invalidates/refetches settings state as needed.

Rationale: Theme is a global UI preference. Owning the applied theme at the shell/app boundary avoids each routed page deciding independently.

Alternative considered: keep theme local to `SettingsPage`. That would persist the preference but would not satisfy consistent app-level application.

### Keep AI settings visibly out of scope

The Settings page may include a disabled or placeholder AI settings section if it helps communicate that AI configuration is not part of this change. It must not save API keys, call Groq, detect models, or test connections.

Rationale: Settings will later host AI provider configuration, but this slice is intentionally about appearance and local backup behavior.

Alternative considered: implement Groq API key storage now. That would expand the slice into AI provider work and violate the explicit scope.

## Risks / Trade-offs

- [Risk] Import validation could silently recover invalid data if it reuses the existing hydration parser directly. -> Mitigation: add a strict backup parser that returns validation success/failure and does not replace current data on failure.
- [Risk] Export sanitization could miss future secret fields. -> Mitigation: export through an allowlist or explicit sanitizer for settings/provider fields, with tests that fail if sensitive keys appear.
- [Risk] Theme application may be incomplete in older CSS surfaces. -> Mitigation: apply a root-level marker and update only current shell/page styles needed for coherent light/dark support, avoiding a full redesign.
- [Risk] Full replacement import can remove current work. -> Mitigation: show `ConfirmDialog` with clear replacement language before saving imported data.
- [Risk] Reset can leave stale cached query data after Local Storage is replaced. -> Mitigation: invalidate or reset relevant TanStack Query caches after import and reset.
- [Risk] Download behavior is browser-specific and awkward in unit tests. -> Mitigation: keep JSON generation and filename logic testable separately from the DOM download trigger.
