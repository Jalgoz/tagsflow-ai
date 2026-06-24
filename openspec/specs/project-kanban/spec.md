# project-kanban Specification

## Purpose
TBD - created by archiving change add-project-kanban. Update Purpose after archive.
## Requirements
### Requirement: Project Kanban tab
The system MUST replace the Project Detail > Kanban placeholder with a functional project-scoped Kanban board that loads task-related business data through Application-layer hooks.

#### Scenario: Render project Kanban board
- **WHEN** a user opens Project Detail for an existing project and selects the Kanban tab
- **THEN** the page renders a functional Kanban board instead of placeholder copy
- **THEN** the board loads tasks for the selected project through existing task Application hooks
- **THEN** the board does not access Local Storage or repository adapters directly

#### Scenario: Load supporting metadata
- **WHEN** the project Kanban board renders
- **THEN** it loads subtasks, members, and tags through existing Application-layer hooks where needed for card metadata
- **THEN** loading and error states are shown without presenting stale placeholder content as complete functionality

#### Scenario: Show empty board state
- **WHEN** the selected project has no tasks
- **THEN** the board renders all approved Kanban columns
- **THEN** each column is empty
- **THEN** the board provides project-scoped task creation actions

### Requirement: Project Kanban columns and grouping
The system MUST render project tasks grouped by the approved task status columns: `backlog`, `todo`, `in_progress`, `blocked`, `review`, and `done`.

#### Scenario: Render approved columns
- **WHEN** the project Kanban board renders
- **THEN** it shows columns for `backlog`, `todo`, `in_progress`, `blocked`, `review`, and `done`
- **THEN** the columns follow the approved task status order

#### Scenario: Group tasks by status
- **WHEN** project tasks exist with different statuses
- **THEN** each task appears only in the column matching its current status
- **THEN** tasks from other projects are not shown

#### Scenario: Preserve empty configured columns
- **WHEN** no task exists for a configured status
- **THEN** the board still renders that status column
- **THEN** the empty column remains available for valid task movement and project-scoped task creation

### Requirement: Project Kanban task cards
The system MUST render each project task as a compact Kanban card with enough metadata to scan and manage the task.

#### Scenario: Show task card metadata
- **WHEN** a project task appears on the Kanban board
- **THEN** its card shows task title, priority, due date, assignee, tags, checklist summary, and subtask progress summary

#### Scenario: Resolve missing optional metadata
- **WHEN** a task has no assignee, no tags, no due date, no checklist items, or no subtasks
- **THEN** the card renders a clear neutral display value for the missing metadata
- **THEN** the absence of optional metadata does not hide the task from the board

#### Scenario: Keep cards compact
- **WHEN** a task card renders on the board
- **THEN** the card does not render the full task edit form inline
- **THEN** the card does not render full subtask management UI inline

### Requirement: Project Kanban drag and drop
The system MUST support moving project task cards between Kanban columns using the approved dnd-kit drag-and-drop dependency when it is already installed.

#### Scenario: Move task to another column
- **WHEN** a user drags a task card from one status column to a different status column
- **THEN** the board updates the task status through the existing task status mutation hook
- **THEN** the persisted task status changes to the destination column status after the mutation succeeds
- **THEN** the UI shows a success toast notification

#### Scenario: Drop task in original column
- **WHEN** a user drops a task card back into its original status column
- **THEN** no status update mutation is sent
- **THEN** the task remains in its original column

#### Scenario: Avoid alternate drag dependency
- **WHEN** drag-and-drop behavior is implemented for Project Kanban
- **THEN** the implementation uses dnd-kit if it is already installed
- **THEN** the implementation does not introduce a different drag-and-drop library

### Requirement: Project Kanban completion safety
The system MUST preserve the pending-subtask completion warning before moving a task to `done` from the project Kanban board.

#### Scenario: Move task to done without pending subtasks
- **WHEN** a user moves a task to `done` and the task has no pending subtasks
- **THEN** the status update mutation is sent without opening the pending-subtask confirmation dialog
- **THEN** the UI shows a success toast notification after the mutation succeeds

#### Scenario: Warn before moving task to done with pending subtasks
- **WHEN** a user moves a task to `done` and at least one subtask is not `done`
- **THEN** the board opens the shared `ConfirmDialog`
- **THEN** no status update mutation is sent until the user confirms

#### Scenario: Cancel moving task to done with pending subtasks
- **WHEN** the pending-subtask confirmation dialog is open and the user cancels
- **THEN** no status update mutation is sent
- **THEN** the task remains in its previous status column

#### Scenario: Confirm moving task to done with pending subtasks
- **WHEN** the pending-subtask confirmation dialog is open and the user confirms
- **THEN** the board updates the task status to `done` through the existing task status mutation hook
- **THEN** the UI shows a success toast notification after the mutation succeeds

### Requirement: Project Kanban task creation
The system MUST allow users to create project-scoped tasks from the project Kanban board using the existing `TaskForm`.

#### Scenario: Open task creation from column
- **WHEN** a user starts creating a task from a Kanban column
- **THEN** the board opens the existing task form in the current focused form surface pattern
- **THEN** the form defaults the new task status to the selected column status
- **THEN** the task is scoped to the current project

#### Scenario: Save task from column
- **WHEN** a user submits valid task form data from a Kanban column
- **THEN** the task is created through the existing create task mutation hook
- **THEN** the created task appears in the selected project board
- **THEN** the UI shows a success toast notification

#### Scenario: Preserve task form validation
- **WHEN** the task creation form is shown from the Kanban board
- **THEN** required field labels show visible asterisks
- **THEN** invalid submitted values show validation messages
- **THEN** no create mutation is sent for invalid form data

#### Scenario: Cancel task creation
- **WHEN** a user cancels Kanban task creation
- **THEN** unsaved form changes are discarded
- **THEN** no create mutation is sent
- **THEN** the board remains visible with the existing task cards

### Requirement: Project Kanban task editing
The system MUST allow users to edit existing task cards from the project Kanban board using the existing `TaskForm`.

#### Scenario: Open task edit from card
- **WHEN** a user starts editing a task from a Kanban card
- **THEN** the board opens the existing task form in the current focused form surface pattern
- **THEN** the edited task is not left actionable underneath the edit surface

#### Scenario: Save task edit from card
- **WHEN** a user submits valid changes for an existing task from the Kanban board
- **THEN** the task is updated through the existing update task mutation hook
- **THEN** the visible card reflects the saved task data after the mutation succeeds
- **THEN** the UI shows a success toast notification

#### Scenario: Preserve task edit form behavior
- **WHEN** the Kanban task edit form is shown
- **THEN** required field labels show visible asterisks
- **THEN** invalid submitted values show validation messages
- **THEN** assignee selection, tag selection, checklist editing, save, and cancel behavior match the reusable task form behavior

#### Scenario: Cancel task edit from card
- **WHEN** a user cancels the Kanban task edit form
- **THEN** unsaved changes are discarded
- **THEN** no update mutation is sent
- **THEN** the task remains in the board according to its persisted status

### Requirement: Project Kanban task deletion
The system MUST allow users to delete existing tasks from the project Kanban board using the shared confirmation dialog and existing repository cleanup behavior.

#### Scenario: Request task deletion from card
- **WHEN** a user starts deleting a task from a Kanban card
- **THEN** the board opens the shared `ConfirmDialog`
- **THEN** no delete mutation is sent until the user confirms

#### Scenario: Confirm task deletion from card
- **WHEN** a user confirms task deletion from the Kanban board
- **THEN** the board deletes the task through the existing delete task mutation hook
- **THEN** repository-defined dependent subtask cleanup is used
- **THEN** the UI shows a success toast notification

#### Scenario: Cancel task deletion from card
- **WHEN** a user cancels the deletion confirmation
- **THEN** no delete mutation is sent
- **THEN** the task remains visible in its current status column

#### Scenario: Show task deletion pending state
- **WHEN** a confirmed task deletion is in progress
- **THEN** the confirmation dialog disables conflicting actions or clearly communicates the pending state

### Requirement: Project Kanban subtask boundary
The system MUST keep subtasks visible only as compact task-card metadata on the project Kanban board.

#### Scenario: Show subtask progress summary
- **WHEN** a task has subtasks
- **THEN** the Kanban card shows a compact subtask count or progress summary
- **THEN** the card does not render subtasks as independent Kanban cards

#### Scenario: Exclude subtask creation
- **WHEN** the project Kanban board renders task cards
- **THEN** it does not show a subtask creation action
- **THEN** it does not render a subtask creation form

#### Scenario: Exclude subtask editing and deletion
- **WHEN** the project Kanban board renders task cards
- **THEN** it does not show subtask edit actions
- **THEN** it does not show subtask delete actions

### Requirement: Project Kanban configuration
The system MUST keep project Kanban behavior configuration-driven through shared task status or Kanban column constants.

#### Scenario: Use shared column configuration
- **WHEN** the project Kanban board renders columns
- **THEN** it derives the column list, labels, and order from shared task status or Kanban column configuration
- **THEN** card components do not hardcode task status behavior directly

#### Scenario: Reuse configuration in grouping
- **WHEN** project tasks are grouped for board rendering
- **THEN** grouping logic uses the shared column configuration
- **THEN** the grouping result includes every configured column even when no tasks match that status

### Requirement: Project Kanban scope boundaries
The system MUST keep the Project Kanban slice limited to project-scoped task board visualization and task CRUD entry points.

#### Scenario: Preserve persistence and contracts
- **WHEN** this change is implemented
- **THEN** it does not change task, subtask, project, member, or tag domain entity contracts
- **THEN** it does not change repository port contracts
- **THEN** it does not change the Local Storage database key or schema

#### Scenario: Exclude unrelated modules
- **WHEN** this change is implemented
- **THEN** it does not add global Kanban overview behavior, global tasks table changes, dashboard metrics, AI features, settings implementation, import/export, or demo data

#### Scenario: Keep AI providers out of Project Kanban
- **WHEN** the project Kanban board renders or mutates existing tasks
- **THEN** it does not call Groq, mock AI, or any AI provider

### Requirement: Project Kanban test coverage
The system MUST include focused automated tests for project Kanban logic and supported project Kanban UI behavior.

#### Scenario: Test grouping logic
- **WHEN** project Kanban helper tests run
- **THEN** they verify tasks are grouped by approved status columns
- **THEN** they verify empty configured columns are preserved

#### Scenario: Test column rendering
- **WHEN** project Kanban component tests render the board with supported providers
- **THEN** they verify all approved columns render
- **THEN** they verify task cards appear in their matching status columns

#### Scenario: Test task movement
- **WHEN** current UI test utilities support reliable drag-and-drop simulation
- **THEN** tests verify moving a task between columns sends the existing status mutation
- **THEN** tests verify dropping a task in its original column does not send a mutation

#### Scenario: Test pending-subtask warning
- **WHEN** project Kanban tests move a task with pending subtasks to `done`
- **THEN** they verify the shared confirmation dialog opens before the status mutation is sent
- **THEN** they verify cancellation avoids the mutation and confirmation sends the mutation

#### Scenario: Test create, edit, and delete behavior where supported
- **WHEN** current UI test utilities support the project Kanban providers and user interactions
- **THEN** tests verify creating from a selected column defaults the form status to that column
- **THEN** tests verify task edit submission uses the existing update behavior and shows a success toast
- **THEN** tests verify delete opens `ConfirmDialog`, waits for confirmation, deletes through existing behavior, and shows a success toast

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

