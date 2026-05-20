## ADDED Requirements

### Requirement: Configured MVP columns
The system MUST render kanban columns for backlog, todo, in_progress, blocked, review, and done. The column definitions MUST be configuration-driven so future column changes do not require rewriting board logic.

#### Scenario: Render kanban columns
- **WHEN** a user opens a kanban view
- **THEN** the system renders the configured MVP columns in order

### Requirement: Interactive project kanban
The system MUST provide an interactive project kanban that supports drag and drop status changes and task creation within the active project.

#### Scenario: Drag task between project columns
- **WHEN** a user drags a task to a different project kanban column
- **THEN** the task status updates to the destination column status
- **THEN** the change persists locally

#### Scenario: Create task from project kanban
- **WHEN** a user creates a task from the project kanban
- **THEN** the task is created in the active project

### Requirement: Global kanban overview
The system MUST provide a global kanban overview of tasks across all projects. The global kanban MUST be filterable by project and MUST NOT allow task creation in the MVP.

#### Scenario: Filter global kanban by project
- **WHEN** a user selects a project filter in the global kanban
- **THEN** the board shows tasks for the selected project
- **THEN** the board does not expose task creation
