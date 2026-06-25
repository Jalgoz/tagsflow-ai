# local-storage-persistence Specification

## Purpose
TBD - created by archiving change add-local-storage-persistence. Update Purpose after archive.
## Requirements
### Requirement: Versioned local database key
The system MUST persist the MVP business database in Local Storage using the single key `tagsflow_ai_db_v1`.

#### Scenario: Persist database under approved key
- **WHEN** the local persistence layer saves application data
- **THEN** Local Storage contains the serialized database at `tagsflow_ai_db_v1`
- **THEN** the persistence layer does not create separate business-data keys for projects, tasks, subtasks, members, tags, or settings

### Requirement: Local database shape
The system MUST define a version-one local database shape containing `projects`, `tasks`, `subtasks`, `members`, `tags`, and `settings`.

#### Scenario: Initialize empty database
- **WHEN** no database exists in Local Storage
- **THEN** the persistence layer returns a valid empty database
- **THEN** `projects`, `tasks`, `subtasks`, `members`, and `tags` are empty arrays
- **THEN** `settings` contains default application settings

#### Scenario: Exclude derived metrics
- **WHEN** the local database is serialized
- **THEN** it does not persist project progress, task progress, dashboard metrics, overdue flags, or other derived values

### Requirement: Local database validation
The system MUST validate the local database shape with Zod before hydrated data is returned to repositories.

#### Scenario: Hydrate valid data
- **WHEN** Local Storage contains valid serialized version-one data
- **THEN** the persistence layer parses and validates the data
- **THEN** repositories receive entities that conform to the local database schema and domain types

#### Scenario: Reject invalid data shape
- **WHEN** Local Storage contains JSON that does not match the version-one database schema
- **THEN** the persistence layer does not expose the invalid data to repositories
- **THEN** the app can continue using a valid initialized database

### Requirement: Safe database access
The system MUST provide a Local Storage database access layer that can load, initialize, and save the complete local database without crashing on missing or corrupted data.

#### Scenario: Recover from missing data
- **WHEN** the database key is absent
- **THEN** loading the database returns an initialized empty database

#### Scenario: Recover from malformed JSON
- **WHEN** the database key contains malformed JSON
- **THEN** loading the database returns an initialized empty database
- **THEN** no exception escapes to application or presentation callers

#### Scenario: Save hydrated database
- **WHEN** the persistence layer saves a valid database
- **THEN** Local Storage stores a JSON representation that can be loaded back into the same data shape

### Requirement: Project repository adapter
The system MUST implement `LocalStorageProjectRepository` using the existing `ProjectRepository` port.

#### Scenario: Create and list projects
- **WHEN** a project is created through the local project repository
- **THEN** the repository returns a project with a generated ID
- **THEN** listing projects includes the created project after hydration from Local Storage

#### Scenario: Update project
- **WHEN** an existing project is updated through the local project repository
- **THEN** the repository saves the changed project fields
- **THEN** unchanged project fields remain intact

#### Scenario: Delete project
- **WHEN** an existing project is deleted through the local project repository
- **THEN** the project is removed from persisted projects
- **THEN** tasks for that project and subtasks for those tasks are removed from persisted data

### Requirement: Task repository adapter
The system MUST implement `LocalStorageTaskRepository` using the existing `TaskRepository` port.

#### Scenario: Create and list tasks
- **WHEN** a task is created through the local task repository
- **THEN** the repository returns a task with a generated ID
- **THEN** listing all tasks includes the created task
- **THEN** listing by project ID includes the task only for its project

#### Scenario: Update task fields
- **WHEN** an existing task is updated through the local task repository
- **THEN** the repository persists the changed task fields, status, assignee, tag IDs, checklist, and subtask IDs according to the invoked port method

#### Scenario: Delete task
- **WHEN** an existing task is deleted through the local task repository
- **THEN** the task is removed from persisted tasks
- **THEN** the task ID is removed from its project
- **THEN** subtasks for that task are removed from persisted data

### Requirement: Subtask repository adapter
The system MUST implement `LocalStorageSubtaskRepository` using the existing `SubtaskRepository` port.

#### Scenario: Create and list subtasks
- **WHEN** a subtask is created through the local subtask repository
- **THEN** the repository returns a subtask with a generated ID
- **THEN** listing by task ID includes the subtask only for its parent task

#### Scenario: Update subtask fields
- **WHEN** an existing subtask is updated through the local subtask repository
- **THEN** the repository persists the changed subtask fields, status, assignee, tag IDs, and checklist according to the invoked port method

#### Scenario: Delete subtask
- **WHEN** an existing subtask is deleted through the local subtask repository
- **THEN** the subtask is removed from persisted subtasks
- **THEN** the subtask ID is removed from its parent task

### Requirement: Member repository adapter
The system MUST implement `LocalStorageMemberRepository` using the existing `MemberRepository` port.

#### Scenario: Manage members
- **WHEN** a member is created, updated, listed, fetched by ID, or deleted through the local member repository
- **THEN** the repository persists the corresponding member catalog change

#### Scenario: Delete assigned member
- **WHEN** an assigned member is deleted through the local member repository
- **THEN** the member is removed from persisted members
- **THEN** projects remove that member ID
- **THEN** tasks and subtasks assigned to that member become unassigned

### Requirement: Tag repository adapter
The system MUST implement `LocalStorageTagRepository` using the existing `TagRepository` port.

#### Scenario: Manage tags
- **WHEN** a tag is created, updated, listed, fetched by ID, or deleted through the local tag repository
- **THEN** the repository persists the corresponding tag catalog change

#### Scenario: Delete used tag
- **WHEN** a tag used by tasks or subtasks is deleted through the local tag repository
- **THEN** the tag is removed from persisted tags
- **THEN** tasks and subtasks remove the deleted tag ID

### Requirement: Settings repository adapter
The system MUST implement `LocalStorageSettingsRepository` using the existing `SettingsRepository` port.

#### Scenario: Get default settings
- **WHEN** no settings have been persisted
- **THEN** the local settings repository returns default application settings

#### Scenario: Save and reset settings
- **WHEN** settings are saved through the local settings repository
- **THEN** the settings are persisted in the local database
- **WHEN** settings are reset through the local settings repository
- **THEN** default application settings are persisted and returned

### Requirement: Persistence test coverage
The system MUST include focused tests for the Local Storage persistence layer and repository adapters.

#### Scenario: Test database behavior
- **WHEN** persistence tests are run
- **THEN** they cover database initialization, serialization and hydration, and invalid local data recovery

#### Scenario: Test repository behavior
- **WHEN** repository adapter tests are run
- **THEN** they cover create, update, delete, list, and get-by-ID behavior for local repositories
- **THEN** they cover relationship cleanup where already defined by the domain repository contracts

### Requirement: Sanitized backup export
The local persistence layer MUST provide backup export behavior that serializes supported local data and sanitizes sensitive settings before the backup is downloaded.

#### Scenario: Generate backup data
- **WHEN** backup export behavior reads the current local database
- **THEN** it returns JSON-serializable data containing the supported database version
- **THEN** it includes projects, tasks, subtasks, members, tags, and settings
- **THEN** it does not include derived metrics such as project progress, task progress, dashboard metrics, overdue flags, or chart values

#### Scenario: Sanitize secret settings
- **WHEN** backup export behavior serializes settings
- **THEN** it omits or neutralizes Groq API key values
- **THEN** it omits or neutralizes future secret-bearing provider fields
- **THEN** it may include non-sensitive settings such as theme, provider identity, selected model metadata, and whether an API key exists

### Requirement: Strict backup import validation
The local persistence layer MUST validate imported backup data strictly before any replacement is allowed.

#### Scenario: Validate supported backup
- **WHEN** backup import behavior receives valid JSON matching the supported version-one local database shape
- **THEN** it returns a successful validation result with the parsed database
- **THEN** it does not mutate the current Local Storage database during validation

#### Scenario: Reject malformed backup JSON
- **WHEN** backup import behavior receives malformed JSON
- **THEN** it returns a failed validation result
- **THEN** it does not replace or recover the current Local Storage database as part of import validation

#### Scenario: Reject unsupported backup version
- **WHEN** backup import behavior receives parsed JSON with an unsupported database version
- **THEN** it returns a failed validation result
- **THEN** it does not replace the current Local Storage database

#### Scenario: Reject invalid backup shape
- **WHEN** backup import behavior receives parsed JSON that fails the supported local database schema
- **THEN** it returns a failed validation result
- **THEN** it reports enough error detail for the Settings page to show a clear validation message
- **THEN** it does not replace the current Local Storage database

### Requirement: Local database replacement and reset
The local persistence layer MUST support replacing the current local database with a validated backup and resetting it to a valid empty database.

#### Scenario: Replace local database
- **WHEN** application behavior submits a validated local database for replacement
- **THEN** the local persistence layer saves the complete database under `tagsflow_ai_db_v1`
- **THEN** later repository reads hydrate from the replaced database

#### Scenario: Reset local database
- **WHEN** application behavior requests a local data reset
- **THEN** the local persistence layer saves a valid empty database with default settings
- **THEN** later repository reads return empty projects, tasks, subtasks, members, and tags with default settings

### Requirement: AI settings persistence through local database
The local persistence layer MUST persist AI provider settings through the existing version-one local database settings shape.

#### Scenario: Persist AI provider settings
- **WHEN** AI provider settings are saved through `LocalStorageSettingsRepository`
- **THEN** Local Storage stores the updated settings under `tagsflow_ai_db_v1`
- **THEN** provider identity, API key, and selected model hydrate through the existing settings repository path

#### Scenario: Avoid separate AI secret storage key
- **WHEN** the MVP stores a user-provided Groq API key locally
- **THEN** the persistence layer does not create a separate Local Storage key for the key
- **THEN** reset, import, and backup behavior can reason over one versioned local database

#### Scenario: Avoid database version change when compatible
- **WHEN** current persisted settings already match the provider/model/key shape required by this change
- **THEN** the implementation keeps the existing Local Storage database version
- **THEN** existing valid local data continues to hydrate

### Requirement: Secret-safe AI backup export and import
The local backup persistence behavior MUST exclude secret-bearing AI settings from exports and MUST neutralize them during imports.

#### Scenario: Export sanitized AI settings
- **WHEN** backup export behavior serializes settings with a saved Groq API key
- **THEN** the exported settings include no secret API key value
- **THEN** the exported settings may include non-sensitive provider identity, selected model, and whether a key exists

#### Scenario: Import backup with API key field
- **WHEN** backup import validation receives otherwise valid backup JSON containing `settings.aiProvider.apiKey`
- **THEN** validation can succeed for supported backup compatibility
- **THEN** the validated replacement database has `settings.aiProvider.apiKey` set to `null`

#### Scenario: Import backup with future secret-bearing AI fields
- **WHEN** backup import validation receives future or extra secret-bearing AI provider fields in a supported settings object
- **THEN** those secret-bearing values are omitted or neutralized before replacement
- **THEN** no imported secret is persisted to Local Storage

### Requirement: AI persistence and backup test coverage
The system MUST include focused tests for AI settings persistence and backup sanitizer behavior.

#### Scenario: Test backup export excludes API key
- **WHEN** backup repository tests export a database containing a saved Groq API key
- **THEN** the exported JSON does not contain the full key
- **THEN** the exported settings do not expose an `apiKey` secret field

#### Scenario: Test backup import drops API key
- **WHEN** backup repository tests validate import JSON containing an AI provider API key
- **THEN** validation returns a replacement database with `apiKey` set to `null`
- **THEN** replacing local data does not persist the imported key

#### Scenario: Test settings repository AI fields
- **WHEN** settings repository tests save and hydrate AI provider settings
- **THEN** provider identity, selected model, and explicit key values are preserved in normal local settings persistence
- **THEN** backup export/import tests remain responsible for secret sanitization

