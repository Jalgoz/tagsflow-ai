## ADDED Requirements

### Requirement: Versioned local database
The system MUST persist projects, tasks, subtasks, members, tags, and settings in one versioned Local Storage database key named `tagsflow_ai_db_v1`.

#### Scenario: Persist and reload business data
- **WHEN** a user creates or updates business data and reloads the app
- **THEN** the system restores that data from `tagsflow_ai_db_v1`

### Requirement: Repository-backed persistence
The system MUST read and write business data through repository interfaces. UI components MUST NOT read or write Local Storage directly.

#### Scenario: Save data through repository
- **WHEN** a user action changes business data
- **THEN** the application layer persists the change through a repository port
- **THEN** the UI component does not access Local Storage directly

### Requirement: Derived metrics are not persisted
The system MUST NOT persist derived metrics such as project progress, dashboard counts, chart data, or kanban summaries.

#### Scenario: Recompute derived values
- **WHEN** the app needs project progress or dashboard metrics
- **THEN** the system computes those values from stored entities
- **THEN** no derived metric record is written to Local Storage

### Requirement: Future repository migration
The system MUST keep Local Storage repository implementations replaceable by future HTTP repositories that implement the same ports.

#### Scenario: Replace local repository with HTTP repository
- **WHEN** a future HTTP repository implements the same port as the Local Storage repository
- **THEN** application use cases can use the replacement without changing domain rules
