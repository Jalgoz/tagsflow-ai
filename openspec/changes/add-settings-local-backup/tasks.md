## 1. Persistence and Backup Utilities

- [x] 1.1 Add strict backup import parsing that distinguishes malformed JSON, unsupported database version, and invalid entity/settings shapes without mutating current Local Storage data.
- [x] 1.2 Add a backup export builder that reads the current local database and emits the supported versioned backup shape with projects, tasks, subtasks, members, tags, and sanitized settings.
- [x] 1.3 Add an explicit settings sanitizer that excludes Groq API keys and future secret-bearing provider fields while preserving non-sensitive settings.
- [x] 1.4 Ensure backup import ignores or strips secret-bearing fields such as `aiProvider.apiKey` and does not restore API keys from imported JSON.
- [x] 1.5 Add local database replacement behavior for already-validated backup data under `tagsflow_ai_db_v1`.
- [x] 1.6 Add local database reset behavior that saves a valid empty database with default settings.
- [x] 1.7 Cover backup export shape, secret sanitization, import validation success/failure, replacement, and reset behavior with focused infrastructure tests.

## 2. Settings Application Layer

- [x] 2.1 Add settings repository context/provider wiring so Settings UI and app-level theme code can access the existing `SettingsRepository`.
- [x] 2.2 Add settings query and mutation hooks for reading settings, saving theme changes, and resetting settings-compatible state.
- [x] 2.3 Add application-level backup export, import validation, import replacement, and local reset use cases or hooks.
- [x] 2.4 Ensure import replacement and reset invalidate or reset affected TanStack Query caches for projects, tasks, subtasks, members, tags, settings, dashboard, and Kanban-derived views.
- [x] 2.5 Cover settings hooks/use cases for theme persistence, backup validation flow, replacement, reset, and cache handling where current test utilities support it.

## 3. Theme Integration

- [x] 3.1 Load persisted settings near the app shell/provider boundary and apply a stable root theme marker for light and dark modes.
- [x] 3.2 Update shell and current shared page styling to respond coherently to the theme marker without a full visual redesign.
- [x] 3.3 Ensure theme changes from `/settings` update the active UI theme and remain persisted after reload.
- [x] 3.4 Add focused tests for theme persistence and theme marker application where practical.

## 4. Settings Page UI

- [x] 4.1 Replace `SettingsPage` placeholder content with a functional page using sections for Appearance, Local data backup, Import data, and Danger zone.
- [x] 4.2 Implement light/dark appearance controls backed by the settings mutation hook and success toast feedback.
- [x] 4.3 Implement JSON export action that downloads the sanitized backup and shows a success toast.
- [x] 4.4 Implement JSON file selection for import, including visible validation errors for malformed JSON, unsupported versions, and invalid shapes.
- [x] 4.5 Add import replacement confirmation with shared `ConfirmDialog`; replace data only after confirmation and show success toast.
- [x] 4.6 Add reset local data confirmation with shared `ConfirmDialog`; reset only after confirmation and show success toast.
- [x] 4.7 Add an optional disabled AI settings placeholder only if it helps the page layout, without implementing Groq connection behavior.
- [x] 4.8 Cover Settings page rendering, import validation messaging, confirmation behavior, and successful action feedback with UI tests where supported.

## 5. Verification and Review

- [x] 5.1 Run the relevant Settings, backup, persistence, and feedback tests.
- [x] 5.2 Run the project typecheck/build command.
- [x] 5.3 Run lint if the current codebase lint configuration is expected to pass.
- [x] 5.4 Review the diff for scope creep into AI, project CRUD, task CRUD, Kanban, dashboard, demo data, authentication, backend sync, or cloud backup.
