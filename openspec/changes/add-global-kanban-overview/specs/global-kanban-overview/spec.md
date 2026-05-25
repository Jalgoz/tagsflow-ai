## ADDED Requirements

### Requirement: Global Kanban route
The system SHALL replace the `/kanban` placeholder with a functional read-only global Kanban overview that loads repository-backed project, task, subtask, member, and tag data through Application-layer queries or use cases.

#### Scenario: Render global Kanban page
- **WHEN** a user navigates to `/kanban`
- **THEN** the system SHALL render the global Kanban overview instead of placeholder content

#### Scenario: Load supporting metadata
- **WHEN** the global Kanban overview is rendered
- **THEN** the system SHALL load projects, tasks, subtasks, members, and tags through Application-layer data access

#### Scenario: Show empty global Kanban state
- **WHEN** there are no tasks available after loading data
- **THEN** the system SHALL show an empty state that does not expose task or subtask creation controls

#### Scenario: Preserve architecture boundaries
- **WHEN** the global Kanban overview needs business data
- **THEN** the UI MUST NOT read Local Storage directly or bypass repository-backed Application access

### Requirement: Global Kanban columns and grouping
The system SHALL render all approved configured task status columns and group top-level tasks by their current status.

#### Scenario: Render configured columns
- **WHEN** the global Kanban overview is displayed
- **THEN** the system SHALL render columns for `backlog`, `todo`, `in_progress`, `blocked`, `review`, and `done` using shared task status or Kanban column configuration

#### Scenario: Group tasks by status
- **WHEN** tasks from multiple projects are loaded
- **THEN** each top-level task SHALL appear in the column matching its status

#### Scenario: Preserve empty configured columns
- **WHEN** no tasks match a configured status
- **THEN** the system SHALL still render that configured column with an empty-column state or zero count

#### Scenario: Exclude subtasks as cards
- **WHEN** subtasks exist for loaded tasks
- **THEN** subtasks MUST NOT appear as independent global Kanban cards

### Requirement: Global Kanban task cards
The system SHALL render compact read-only task cards with enough metadata to understand cross-project work without opening mutation controls.

#### Scenario: Show compact card metadata
- **WHEN** a task card is rendered
- **THEN** the card SHALL show task title, project name, priority, due date, assignee, tags, checklist summary, and subtask progress summary where available

#### Scenario: Resolve missing optional metadata
- **WHEN** a task has no assignee, tags, due date, checklist items, or subtasks
- **THEN** the card SHALL display clear neutral metadata or omit optional chips without showing broken references

#### Scenario: Show project context
- **WHEN** tasks from more than one project are visible
- **THEN** each task card SHALL identify the related project

#### Scenario: Keep cards compact
- **WHEN** cards contain several metadata values
- **THEN** the card layout SHALL remain scan-friendly and MUST NOT expand into a full task or subtask management surface

### Requirement: Global Kanban project filtering
The system SHALL allow users to view all projects by default or filter the global Kanban overview to a single project.

#### Scenario: Show all projects by default
- **WHEN** a user opens `/kanban` without choosing a project filter
- **THEN** the system SHALL include tasks from all projects

#### Scenario: Filter by project
- **WHEN** a user selects one project in the project filter
- **THEN** the system SHALL show only tasks that belong to that project while preserving all configured columns

#### Scenario: Clear project filter
- **WHEN** a user clears the selected project filter
- **THEN** the system SHALL return to showing tasks from all projects

#### Scenario: Preserve read-only behavior while filtered
- **WHEN** the global Kanban overview is filtered to a single project
- **THEN** the system MUST remain read-only and MUST NOT expose project-scoped creation, edit, delete, drag, or status mutation controls

### Requirement: Global Kanban lightweight filters
The system MAY include lightweight priority, assignee, and tag filters when they fit the existing UI without broadening the global Kanban scope beyond overview behavior.

#### Scenario: Filter by priority
- **WHEN** a priority filter is available and the user selects a priority
- **THEN** the system SHALL show only tasks matching that priority while preserving all configured columns

#### Scenario: Filter by assignee
- **WHEN** an assignee filter is available and the user selects a member
- **THEN** the system SHALL show only tasks assigned to that member while preserving all configured columns

#### Scenario: Filter by tag
- **WHEN** a tag filter is available and the user selects a tag
- **THEN** the system SHALL show only tasks containing that tag while preserving all configured columns

#### Scenario: Combine lightweight filters
- **WHEN** multiple available filters are active
- **THEN** the system SHALL show only tasks matching all active filter criteria

#### Scenario: Keep filters lightweight
- **WHEN** adding a filter would require search, sorting, row expansion, mutation workflows, or table-like behavior
- **THEN** that filter MUST be deferred rather than expanding the global Kanban overview scope

### Requirement: Global Kanban read-only boundaries
The system SHALL keep the global Kanban overview read-only and MUST NOT mutate task, subtask, project, member, tag, or persistence data from the `/kanban` board.

#### Scenario: No task creation action
- **WHEN** a user views the global Kanban overview
- **THEN** the system MUST NOT render a task creation button, task creation form, or column-level add-task action

#### Scenario: No task editing or deletion action
- **WHEN** a user views a global Kanban task card
- **THEN** the system MUST NOT render edit or delete controls for that task

#### Scenario: No drag and drop
- **WHEN** a user interacts with global Kanban cards or columns
- **THEN** the system MUST NOT provide drag handles, droppable columns, or drag-and-drop status movement

#### Scenario: No status mutation
- **WHEN** a user views or clicks a global Kanban task card
- **THEN** the system MUST NOT update task status or call status mutation hooks from the global board

#### Scenario: No subtask management
- **WHEN** a task has subtasks
- **THEN** the global Kanban overview MUST NOT expose subtask create, edit, delete, completion, or status controls

### Requirement: Global Kanban navigation
The system SHALL provide navigation from global Kanban cards or project links to the related project detail page where project-scoped management remains available.

#### Scenario: Navigate from task card
- **WHEN** a user activates a task card that has a valid project reference
- **THEN** the system SHALL navigate to `/projects/:projectId` for that task's project

#### Scenario: Navigate from project link
- **WHEN** a user activates a project name or project link on a task card
- **THEN** the system SHALL navigate to `/projects/:projectId` for that project

#### Scenario: Avoid opening mutation UI from global board
- **WHEN** navigation from the global Kanban overview completes
- **THEN** the system SHALL land in project detail rather than opening a global task edit, delete, status, or subtask management flow

### Requirement: Global Kanban configuration and derived data
The system SHALL use shared status configuration and derived metadata helpers rather than hardcoding workflow behavior or persisting computed values.

#### Scenario: Use shared column configuration
- **WHEN** columns are rendered or tasks are grouped
- **THEN** the system SHALL use shared task status or Kanban column constants rather than hardcoded column behavior inside card components

#### Scenario: Derive checklist summary
- **WHEN** a task card displays checklist information
- **THEN** the system SHALL derive the checklist summary from the task checklist items without persisting the summary

#### Scenario: Derive subtask progress summary
- **WHEN** a task card displays subtask progress
- **THEN** the system SHALL derive the summary from loaded subtasks without persisting the summary

#### Scenario: Preserve persistence contracts
- **WHEN** the global Kanban overview is implemented
- **THEN** the system MUST NOT change `tagsflow_ai_db_v1`, task persistence behavior, subtask persistence behavior, domain model contracts, or repository contracts

### Requirement: Global Kanban scope boundaries
The system SHALL keep unrelated MVP modules outside this change.

#### Scenario: Exclude Project Kanban mutation behavior
- **WHEN** implementing the global Kanban overview
- **THEN** the system MUST NOT alter Project Detail > Kanban drag-and-drop, task creation, task editing, or task deletion behavior except to reuse shared read-only display helpers safely

#### Scenario: Exclude global tasks table behavior
- **WHEN** implementing the global Kanban overview
- **THEN** the system MUST NOT replace or broaden the `/tasks` page search, sorting, editing, deletion, or subtask expansion behavior

#### Scenario: Keep AI providers out of global Kanban
- **WHEN** rendering or filtering the global Kanban overview
- **THEN** the system MUST NOT call GroqAIProvider, MockAIProvider, or any AI provider

#### Scenario: Exclude settings and data transfer
- **WHEN** implementing the global Kanban overview
- **THEN** the system MUST NOT implement settings, import, export, API key, demo data, or dashboard metric behavior

### Requirement: Global Kanban test coverage
The system SHALL include focused tests for global Kanban helper logic, rendering, read-only boundaries, navigation, and metadata display where current test utilities support those behaviors.

#### Scenario: Test grouping logic
- **WHEN** tasks with different statuses and projects are passed to the grouping helper
- **THEN** tests SHALL verify tasks are grouped into matching configured status columns and empty configured columns are preserved

#### Scenario: Test column rendering
- **WHEN** the global Kanban overview renders with data
- **THEN** tests SHALL verify all configured columns are visible

#### Scenario: Test project filtering
- **WHEN** the project filter is changed
- **THEN** tests SHALL verify only tasks from the selected project are displayed and all configured columns remain visible

#### Scenario: Test read-only boundaries
- **WHEN** the global Kanban overview is rendered
- **THEN** tests SHALL verify task creation, editing, deletion, drag-and-drop, status mutation, and subtask management controls are not available

#### Scenario: Test card navigation
- **WHEN** a user activates a task card or project link
- **THEN** tests SHALL verify navigation targets the related `/projects/:projectId` page where current test utilities support router assertions

#### Scenario: Test metadata rendering
- **WHEN** a task has project, priority, due date, assignee, tags, checklist, and subtasks
- **THEN** tests SHALL verify the card renders the expected compact metadata summaries
