## Context

TagsFlow AI already has a routed frontend foundation, domain entities, domain rules, and repository ports. The next implementation slice needs to add the Infrastructure-layer persistence adapter that stores MVP business data locally while keeping Presentation and Application code insulated from browser storage details.

The MVP is frontend-only, so Local Storage is the first persistence adapter. The design must still preserve the Ports and Adapters boundary: domain types and ports remain storage-agnostic, infrastructure owns Local Storage reads and writes, and future HTTP repositories can replace these adapters without changing domain rules or UI components.

## Goals / Non-Goals

**Goals:**
- Store all MVP business data under the single versioned key `tagsflow_ai_db_v1`.
- Define a local database shape containing `projects`, `tasks`, `subtasks`, `members`, `tags`, and `settings`.
- Validate persisted data with Zod before using it.
- Provide a Local Storage database access layer for load, initialize, save, and safe recovery.
- Implement Local Storage repository adapters for the existing project, task, subtask, member, tag, and settings repository ports.
- Keep repository behavior deterministic and testable with an injectable storage-like dependency.
- Add focused tests for initialization, hydration, invalid data handling, CRUD/list behavior, and defined relationship cleanup.

**Non-Goals:**
- React UI, forms, route screens, TanStack Query hooks, Zustand business state, or app composition wiring beyond exportable infrastructure modules.
- Project/task CRUD screens, kanban behavior, global task tables, dashboard metrics UI, demo data, JSON backup UI, or settings page UI.
- Groq, mock AI, OpenAI, Anthropic, or backend AI provider implementations.
- Import/export workflows. This slice validates the internal persisted database shape; later backup import work can reuse or extend validation without exporting the Groq API key.
- Database migrations beyond version-one initialization and safe fallback behavior.

## Decisions

### Use one versioned Local Storage database object

The implementation will persist a single JSON object under `tagsflow_ai_db_v1`. The object will contain a schema version marker and top-level arrays for projects, tasks, subtasks, members, and tags, plus one settings object.

Alternative considered: one Local Storage key per entity type. This was rejected because coordinated relationship cleanup and future backup/import validation are simpler when the MVP data lives behind one versioned database boundary.

### Keep Zod schemas in Infrastructure

Zod schemas for the persisted database shape will live with the Local Storage adapter code, not in Domain. The schemas validate serialized data at the browser boundary, while Domain continues to expose storage-independent TypeScript contracts and pure business rules.

Alternative considered: putting schemas next to domain entities. This was rejected because runtime persistence validation is an adapter concern, and the Domain layer must not grow dependencies on Local Storage or infrastructure conventions.

### Recover invalid data by returning a valid empty database

If the Local Storage key is missing, empty, malformed JSON, partially missing required collections, or fails schema validation, `load` will return an initialized empty database. Corrupted data must not crash the app. The implementation may overwrite the key with the empty database on initialization or first save, but it must never expose invalid data to repositories.

Alternative considered: throwing validation errors to callers. This was rejected because MVP UI and application flows should remain usable even if browser storage contains bad data from manual edits, old builds, or interrupted writes.

### Use a database gateway shared by all repositories

Repositories will delegate persistence to a small database access layer that knows how to read, validate, initialize, and write the full database. Each repository will modify its own collection through that gateway and save the resulting database snapshot.

Alternative considered: each repository reading and writing Local Storage directly. This was rejected because it would duplicate recovery logic and make serialization behavior harder to test consistently.

### Generate IDs in the infrastructure adapter

Repository `create` methods will generate stable string IDs when creating entities from domain input types. The generator should be injectable or wrapped so tests can assert deterministic behavior without relying on random IDs.

Alternative considered: requiring callers to provide IDs. This was rejected because the current domain create input types do not include IDs and repository ports model entity creation as an adapter responsibility.

### Preserve relationships as IDs and clean only defined dependents

The local database will store the domain entities directly with ID relationships. Repository delete behavior will clean relationships only where existing domain contracts define cleanup:
- deleting a project removes tasks whose `projectId` matches the deleted project and subtasks that belong to those tasks;
- deleting a task removes subtasks whose `parentTaskId` matches the deleted task;
- deleting a subtask removes only the subtask entity;
- deleting a member unassigns tasks and subtasks and removes the member ID from projects;
- deleting a tag removes the tag ID from tasks and subtasks.

Alternative considered: leaving relationship cleanup entirely to future use cases. This was rejected for relationships already defined by the repository/domain contracts because stale IDs would make later UI and application code unreliable. Broader workflow confirmations remain out of scope for this adapter slice.

### Keep derived metrics out of storage

The database will not contain project progress, dashboard metrics, overdue flags, or other derived values. Those remain pure domain/application calculations over persisted projects, tasks, and subtasks.

Alternative considered: storing progress snapshots for faster dashboard reads. This was rejected because the approved MVP requires progress to be derived from task and subtask state, and storing snapshots creates consistency risk.

### Leave AI and backup validation to their own adapter boundaries

This change does not implement AI response validation or backup import/export UI. Groq response validation will belong to AI provider adapters, and backup import validation will belong to a later data import/export slice. The Local Storage database schemas created here can inform those later validators, but they should not introduce AI or UI concerns into persistence repositories.

Alternative considered: combining settings backup import/export with Local Storage repositories. This was rejected because the user-facing backup workflow has different security requirements, especially excluding the Groq API key from exported backups.

## Risks / Trade-offs

- [Silent corruption recovery can hide user data loss] -> Tests must verify recovery behavior, and implementation should keep the recovery path narrow: only invalid or unreadable data is replaced with a valid empty database.
- [Repository cleanup could exceed domain contracts] -> Limit cleanup to relationships already represented by current entity IDs and repository behavior; do not add UI confirmations or undeclared cascade behavior.
- [Schema drift between Domain and Infrastructure] -> Build schemas from the same canonical status and priority constants where practical and cover serialization/hydration with tests.
- [Browser-only API makes tests brittle] -> Inject a storage-like adapter so tests can use an in-memory implementation without relying on real browser Local Storage.
- [Future migrations are not implemented yet] -> Keep the version field explicit and isolate load/initialize logic so later versions can add migration steps without rewriting repositories.

## Migration Plan

1. Add Infrastructure-layer Local Storage database types, default database factory, and Zod schemas for version one.
2. Implement a database access layer around `tagsflow_ai_db_v1` with injectable storage and safe recovery.
3. Implement repository adapters against the existing domain ports.
4. Add focused unit tests using an in-memory storage implementation.
5. Run test, lint, and build/typecheck commands.

Rollback is straightforward during the MVP: remove the adapter exports and database key writes. Existing user Local Storage data under `tagsflow_ai_db_v1` can remain unused until a later compatible adapter restores it.

## Open Questions

- None. The approved MVP, archived foundation, and archived domain model provide enough scope for this persistence slice.
