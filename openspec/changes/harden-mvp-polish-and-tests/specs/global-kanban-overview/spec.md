## MODIFIED Requirements

### Requirement: Read-only global Kanban overview

The system SHALL provide a global Kanban overview at `/kanban` that displays tasks across projects grouped by the configured task status columns while allowing only status changes through drag-and-drop.

#### Scenario: User opens the global Kanban page
- **GIVEN** tasks exist across one or more projects
- **WHEN** the user opens `/kanban`
- **THEN** the system displays the configured Kanban columns
- **AND** tasks are grouped by their current status
- **AND** the board does not expose task creation, full task editing, task deletion, member assignment, tag mutation, or subtask management controls

### Requirement: Navigation to project detail

The global Kanban overview SHALL let users inspect a task without leaving the global board and SHALL keep project navigation explicit.

#### Scenario: User clicks a global Kanban task card
- **GIVEN** a task card is displayed on the global Kanban board
- **WHEN** the user clicks the task card outside explicit project navigation controls
- **THEN** the system opens a read-only task detail popup for that task
- **AND** the global board does not open edit, delete, create, assignee, tag, status form, or subtask management surfaces

#### Scenario: User activates project navigation
- **GIVEN** a task card or detail popup identifies the related project
- **WHEN** the user activates an explicit project navigation control
- **THEN** the system navigates to `/projects/:projectId` for the related project
- **AND** the navigation does not mutate task, project, subtask, member, tag, or settings data

### Requirement: Read-only boundaries

The global Kanban overview SHALL remain read-only except for approved status-only drag-and-drop.

#### Scenario: User views the global Kanban board
- **GIVEN** the user is on `/kanban`
- **WHEN** the board renders
- **THEN** there are no task creation buttons
- **AND** there are no full task edit actions
- **AND** there are no task delete actions
- **AND** there are no member assignment controls
- **AND** there are no tag creation or mutation controls
- **AND** there are no subtask management controls
- **AND** the only task mutation control exposed by the board is moving an existing task between configured status columns

## ADDED Requirements

### Requirement: Global Kanban status-only drag-and-drop
The global Kanban overview MUST allow users to update an existing task's status by dragging it between configured status columns.

#### Scenario: Drag task to another global Kanban column
- **WHEN** a user drags a task card from one configured status column to a different configured status column on `/kanban`
- **THEN** the system updates only that task's status through the existing application-level task status update path
- **THEN** the task appears in the configured destination column after query-backed data updates
- **THEN** the system shows a non-blocking success toast

#### Scenario: Drop task in same global Kanban column
- **WHEN** a user drops a task card into its original status column on `/kanban`
- **THEN** no status update mutation is sent
- **THEN** the task remains in its original query-backed column

#### Scenario: Cancel or fail global task movement
- **WHEN** a global Kanban drag is canceled, has no valid destination, or the status update fails
- **THEN** the system does not commit an unrelated local status change
- **THEN** the board reflects the previous query-backed task state
- **THEN** failure feedback does not expose repository internals or unrelated local data

#### Scenario: Drag task to done with pending subtasks
- **WHEN** a user drags a global Kanban task to the `done` column and at least one of its subtasks is not `done`
- **THEN** the system opens the shared pending-subtask confirmation dialog
- **THEN** no status update mutation is sent until the user confirms

#### Scenario: Confirm or cancel pending-subtask status change
- **WHEN** the pending-subtask confirmation is shown from a global Kanban drag
- **THEN** confirming sends the intended status update through the existing task status update path
- **THEN** canceling sends no mutation and leaves the task in its previous query-backed column

### Requirement: Global Kanban read-only task detail popup
The global Kanban overview MUST display task details in a read-only popup when users inspect a task card.

#### Scenario: Open read-only task detail popup
- **WHEN** a user clicks a task card on the global Kanban board
- **THEN** the system opens a read-only popup for that task without leaving `/kanban`
- **THEN** the popup shows the task title, project name, description, in-scope content, out-of-scope content, status, priority, start date, due date, assignee, tags, checklist summary, and subtask progress summary where available

#### Scenario: Handle missing task detail values
- **WHEN** the global Kanban task detail popup displays a task with missing optional fields
- **THEN** it renders clear neutral values
- **THEN** missing optional fields do not block the popup from opening

#### Scenario: Close read-only task detail popup
- **WHEN** the user closes the global Kanban task detail popup
- **THEN** no task, project, subtask, member, tag, settings, or Local Storage mutation is sent
- **THEN** the task remains visible according to its query-backed status and active project filter

### Requirement: Global Kanban mixed-project safety
The global Kanban overview MUST preserve cross-project context and filtering while status-only interactions are enabled.

#### Scenario: Move task while all projects are visible
- **WHEN** tasks from multiple projects are visible on the global Kanban board
- **AND** the user moves one task to another status column
- **THEN** only the moved task's status changes
- **THEN** tasks from other projects remain unchanged
- **THEN** project labels remain visible on task cards and read-only detail popups

#### Scenario: Move task while filtered by project
- **WHEN** the global Kanban board is filtered to one project
- **AND** the user moves a visible task to another status column
- **THEN** only that task's status changes
- **THEN** all configured columns remain visible within the active project filter
- **THEN** tasks from unrelated projects remain omitted from the filtered view

### Requirement: Global Kanban interaction test coverage
The system MUST include focused tests for global Kanban status-only drag-and-drop, read-only task details, project filtering, and no-edit boundaries where current test utilities support them.

#### Scenario: Test status-only movement
- **WHEN** global Kanban interaction tests run
- **THEN** they verify moving a task between configured columns updates only task status
- **THEN** they verify dropping in the same column sends no mutation
- **THEN** they verify failed movement leaves query-backed state unchanged

#### Scenario: Test read-only detail behavior
- **WHEN** global Kanban detail tests run
- **THEN** they verify clicking a task opens a read-only detail popup
- **THEN** they verify closing the popup sends no mutation
- **THEN** they verify missing optional fields render neutral values

#### Scenario: Test no-edit boundaries
- **WHEN** global Kanban boundary tests run
- **THEN** they verify `/kanban` exposes no task creation, full editing, deletion, member assignment, tag mutation, or subtask management controls
- **THEN** they verify the only allowed mutation from `/kanban` is status-only task movement

#### Scenario: Test project filtering with movement
- **WHEN** global Kanban filter tests run
- **THEN** they verify project filtering keeps all configured columns visible
- **THEN** they verify moving a filtered task does not reveal or mutate unrelated project tasks
