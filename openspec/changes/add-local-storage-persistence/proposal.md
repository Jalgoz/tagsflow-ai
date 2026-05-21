## Why

TagsFlow AI needs a reliable local persistence layer before project, task, member, settings, and AI workflows can store real user data. This change turns the approved frontend-only MVP and domain repository ports into a versioned Local Storage adapter layer without adding UI or backend concerns.

## What Changes

- Introduces the versioned Local Storage database key `tagsflow_ai_db_v1` as the single persisted database entry.
- Defines the local database shape for projects, tasks, subtasks, members, tags, and settings.
- Adds Zod validation for the stored database shape before hydrated data is used.
- Adds a Local Storage database access layer that loads, initializes, saves, and safely recovers local data.
- Handles missing, partial, invalid, or corrupted Local Storage data without crashing the application.
- Implements repository adapters for the existing domain ports:
  - `LocalStorageProjectRepository`
  - `LocalStorageTaskRepository`
  - `LocalStorageSubtaskRepository`
  - `LocalStorageMemberRepository`
  - `LocalStorageTagRepository`
  - `LocalStorageSettingsRepository`
- Adds focused tests for database initialization, serialization and hydration, invalid data handling, repository CRUD/list behavior, and relationship cleanup where the domain contracts already define it.
- Excludes React UI, forms, TanStack Query hooks, CRUD screens, kanban drag and drop, Groq/AI providers, demo data, export/import UI, and settings page UI.

## Capabilities

### New Capabilities

- `local-storage-persistence`: Versioned Local Storage database schema, validation, safe database access, and repository adapters for the existing domain repository ports.

### Modified Capabilities

- None.

## Impact

This change affects the Infrastructure layer, local persistence validation schemas, repository adapter implementations, and focused persistence tests. It depends on the existing Domain layer entity and repository port contracts, preserves the future HTTP repository migration path, and does not introduce backend APIs, authentication, cloud sync, UI workflows, or AI provider behavior.
