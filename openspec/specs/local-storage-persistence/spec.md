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

