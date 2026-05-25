# global-kanban-overview Specification

## Purpose
TBD - created by archiving change add-global-kanban-overview. Update Purpose after archive.
## Requirements
### Requirement: Read-only global Kanban overview

The system SHALL provide a global Kanban overview at `/kanban` that displays tasks across projects grouped by the configured task status columns.

#### Scenario: User opens the global Kanban page
- **GIVEN** tasks exist across one or more projects
- **WHEN** the user opens `/kanban`
- **THEN** the system displays the configured Kanban columns
- **AND** tasks are grouped by their current status
- **AND** the board does not expose task creation, editing, deletion, drag-and-drop, status mutation, or subtask management controls

### Requirement: Configured Kanban columns

The global Kanban overview SHALL render all approved task status columns using shared task status or Kanban column configuration.

#### Scenario: Some columns have no tasks
- **GIVEN** no tasks exist for one or more configured statuses
- **WHEN** the user views the global Kanban board
- **THEN** the system still displays those empty columns
- **AND** the workflow structure remains visible

### Requirement: Compact global task cards

The global Kanban overview SHALL display compact read-only task cards with cross-project context.

#### Scenario: Task card is displayed
- **GIVEN** a task exists in a project
- **WHEN** the task appears on the global Kanban board
- **THEN** the card displays the task title, project name, priority, due date, assignee, tags, checklist summary, and subtask progress summary when available

### Requirement: Project filtering

The global Kanban overview SHALL support filtering tasks by project while showing all projects by default.

#### Scenario: User filters by project
- **GIVEN** tasks exist across multiple projects
- **WHEN** the user selects a specific project filter
- **THEN** the board displays only tasks from that project
- **AND** all configured Kanban columns remain visible

### Requirement: Navigation to project detail

The global Kanban overview SHALL navigate users to the related project detail page when they click a task card or project link.

#### Scenario: User clicks a global Kanban task card
- **GIVEN** a task card is displayed on the global Kanban board
- **WHEN** the user clicks the task card or its project link
- **THEN** the system navigates to `/projects/:projectId` for the related project
- **AND** the global board does not open edit, delete, status, or subtask management surfaces

### Requirement: Read-only boundaries

The global Kanban overview SHALL remain strictly read-only.

#### Scenario: User views the global Kanban board
- **GIVEN** the user is on `/kanban`
- **WHEN** the board renders
- **THEN** there are no task creation buttons
- **AND** there are no task edit actions
- **AND** there are no task delete actions
- **AND** there are no drag handles or droppable behaviors
- **AND** there are no status mutation controls
- **AND** there are no subtask management controls

