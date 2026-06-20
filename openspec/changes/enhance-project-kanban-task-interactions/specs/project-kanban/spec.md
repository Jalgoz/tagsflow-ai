## ADDED Requirements

### Requirement: Project Kanban task detail surface
The system MUST allow users to inspect a Project Kanban task card in a focused detail popup or modal without leaving Project Detail > Kanban.

#### Scenario: Open task detail from card
- **WHEN** a user clicks a Project Kanban task card outside its explicit action buttons
- **THEN** the system opens a focused task detail surface for that task
- **THEN** the user remains on Project Detail > Kanban

#### Scenario: Show task detail metadata
- **WHEN** the task detail surface is open
- **THEN** it shows the task title, description, in-scope content, out-of-scope content, status, priority, start date, due date, assignee, tags, checklist summary, and subtask progress
- **THEN** missing optional fields render clear neutral values

#### Scenario: Close task detail without mutation
- **WHEN** the user closes or cancels the task detail surface
- **THEN** no task create, update, delete, status, assignee, tag, or checklist mutation is sent
- **THEN** the task remains in its query-backed Kanban column

#### Scenario: Detail surface excludes subtask CRUD
- **WHEN** the task detail surface is open
- **THEN** it does not show subtask create, edit, delete, or status mutation controls
- **THEN** subtasks remain visible only as compact metadata or progress summary

### Requirement: Project Kanban connected task card actions
The system MUST connect Project Kanban card actions for opening details, editing, and deleting tasks through the existing task UI patterns and mutation hooks.

#### Scenario: Edit action opens task edit form
- **WHEN** a user activates the edit action on a Project Kanban task card or detail surface
- **THEN** the system opens the existing task edit form in the current focused form surface pattern
- **THEN** the form is populated with the selected task's current values

#### Scenario: Delete action opens confirmation dialog
- **WHEN** a user activates the delete action on a Project Kanban task card or detail surface
- **THEN** the system opens the shared `ConfirmDialog`
- **THEN** no delete mutation is sent until the user confirms

#### Scenario: Confirm task deletion
- **WHEN** a user confirms Project Kanban task deletion
- **THEN** the system deletes the task through the existing delete task hook
- **THEN** repository-defined dependent subtask cleanup is used
- **THEN** the task is removed from the board after the query-backed data updates
- **THEN** the system shows a success toast notification

#### Scenario: Cancel task deletion
- **WHEN** a user cancels Project Kanban task deletion
- **THEN** no delete mutation is sent
- **THEN** the task remains visible in its current Kanban column

#### Scenario: Keep active task states mutually exclusive
- **WHEN** the user opens task detail, task edit, task delete confirmation, or pending-completion confirmation for a Project Kanban task
- **THEN** conflicting detail, edit, delete confirmation, and pending-completion confirmation states for that active task are closed
- **THEN** the active task is not left actionable underneath its edit surface

### Requirement: Project Kanban edit-driven status changes
The system MUST allow Project Kanban task edits to change task status through the same task update path used for other edited task fields.

#### Scenario: Save edit with changed status
- **WHEN** a user edits a Project Kanban task and saves valid form values with a different status
- **THEN** the system updates the task through the existing task update hook
- **THEN** the saved task appears in the configured Kanban column matching the updated status after the query-backed data updates
- **THEN** the system shows a success toast notification

#### Scenario: Save edit without changed status
- **WHEN** a user edits a Project Kanban task and saves valid form values without changing status
- **THEN** the system updates the task through the existing task update hook
- **THEN** the task remains in its current configured Kanban column after the query-backed data updates
- **THEN** the system shows a success toast notification

#### Scenario: Cancel task edit
- **WHEN** a user cancels the Project Kanban task edit form
- **THEN** unsaved form changes are discarded
- **THEN** no update mutation is sent
- **THEN** the task remains in the board according to its persisted status

### Requirement: Project Kanban completion safety from edit and drag
The system MUST require confirmation before a Project Kanban interaction marks a task `done` while the task has pending subtasks.

#### Scenario: Drag task to done with pending subtasks
- **WHEN** a user drags a Project Kanban task to the `done` column and at least one of its subtasks is not `done`
- **THEN** the system opens the shared `ConfirmDialog`
- **THEN** no status update mutation is sent until the user confirms

#### Scenario: Save task edit as done with pending subtasks
- **WHEN** a user saves a Project Kanban task edit that changes status to `done` and at least one of its subtasks is not `done`
- **THEN** the system opens the shared `ConfirmDialog`
- **THEN** no task update mutation is sent until the user confirms

#### Scenario: Cancel pending-subtask completion confirmation
- **WHEN** the pending-subtask completion confirmation is open and the user cancels
- **THEN** no task update or status update mutation is sent
- **THEN** the task remains in its previous query-backed Kanban column

#### Scenario: Confirm pending-subtask completion confirmation
- **WHEN** the pending-subtask completion confirmation is open and the user confirms
- **THEN** the system sends the original intended task update or status update through the existing task hook
- **THEN** the task appears in the `done` column after the query-backed data updates
- **THEN** the system shows a success toast notification

#### Scenario: Complete task without pending subtasks
- **WHEN** a user drags or edits a Project Kanban task to `done` and all subtasks are already `done` or no subtasks exist
- **THEN** the system sends the existing task status or task update mutation without opening the pending-subtask confirmation dialog
- **THEN** the system shows a success toast notification after the mutation succeeds

### Requirement: Project Kanban drag-and-drop preservation
The system MUST preserve existing Project Kanban drag-and-drop behavior while adding task detail and connected card actions.

#### Scenario: Drag task to another column
- **WHEN** a user drags a Project Kanban task card from one configured status column to a different configured status column
- **THEN** the system updates the task status through the existing task status mutation hook
- **THEN** the persisted task status changes to the destination column status after the mutation succeeds
- **THEN** the system shows a success toast notification

#### Scenario: Drop task in same column
- **WHEN** a user drops a Project Kanban task card into its original status column
- **THEN** no status update mutation is sent
- **THEN** the task remains in its original query-backed column

#### Scenario: Cancel or fail task movement
- **WHEN** a drag is canceled, has no valid destination, or the status mutation fails
- **THEN** the system does not commit an unrelated local status change
- **THEN** the board reflects the previous query-backed task state

#### Scenario: Preserve all configured columns
- **WHEN** the Project Kanban board renders after detail, edit, delete, or drag interactions
- **THEN** it shows every configured Kanban column from the shared column configuration
- **THEN** empty configured columns remain visible

### Requirement: Project Kanban boundaries remain project-scoped
The system MUST keep this enhancement limited to Project Detail > Kanban task interactions.

#### Scenario: Preserve global Kanban read-only behavior
- **WHEN** the global `/kanban` route renders
- **THEN** it does not expose Project Kanban task detail, edit, delete, creation, drag-and-drop, or status mutation behavior
- **THEN** global Kanban task cards remain read-only overview items

#### Scenario: Preserve contracts and persistence
- **WHEN** this change is implemented
- **THEN** it does not change task, subtask, project, member, or tag domain entity contracts
- **THEN** it does not change repository port contracts
- **THEN** it does not change the Local Storage database key, database version, or database shape

#### Scenario: Exclude unrelated modules
- **WHEN** this change is implemented
- **THEN** it does not add AI workflows, AI provider setup, dashboard changes, settings changes, import/export changes, demo data changes, or app shell redesign

### Requirement: Project Kanban enhanced interaction test coverage
The system MUST include focused tests for Project Kanban task detail, connected card actions, edit-driven status changes, drag-and-drop preservation, completion safety, and global Kanban boundaries.

#### Scenario: Test task detail behavior
- **WHEN** Project Kanban interaction tests run
- **THEN** they verify clicking a task card opens the detail surface
- **THEN** they verify closing the detail surface sends no mutation

#### Scenario: Test edit and delete actions
- **WHEN** Project Kanban interaction tests run
- **THEN** they verify the edit action opens the task edit form
- **THEN** they verify saving task edits updates the task and places it in the correct configured column
- **THEN** they verify the delete action opens `ConfirmDialog`
- **THEN** they verify confirming delete removes the task and canceling delete keeps the task

#### Scenario: Test drag-and-drop behavior
- **WHEN** current Project Kanban test utilities support reliable drag-and-drop simulation
- **THEN** tests verify dragging between columns updates task status
- **THEN** tests verify dragging or dropping to the same column sends no mutation

#### Scenario: Test completion safety
- **WHEN** Project Kanban interaction tests run
- **THEN** they verify dragging a task to `done` with pending subtasks opens confirmation before mutation
- **THEN** they verify saving a task edit as `done` with pending subtasks opens confirmation before mutation
- **THEN** they verify canceling confirmation sends no mutation and confirming sends the intended mutation

#### Scenario: Test global Kanban boundary
- **WHEN** global Kanban regression tests run
- **THEN** they verify no Project Kanban edit, delete, creation, drag-and-drop, status mutation, or task detail modal behavior is introduced on `/kanban`
