# task-and-subtask-management Specification

## Purpose
TBD - created by archiving change add-task-and-subtask-management. Update Purpose after archive.
## Requirements
### Requirement: Task application use cases
The system MUST provide Application-layer task use cases for listing tasks, listing tasks by project, getting a task by ID, creating a task, updating a task, deleting a task, updating task status, updating task assignee, updating task tags, and updating task checklist through the existing `TaskRepository` port.

#### Scenario: List all tasks through application use case
- **WHEN** task list data is requested by an application or presentation workflow
- **THEN** the Application layer calls the configured `TaskRepository`
- **THEN** the caller receives task domain entities without accessing Local Storage directly

#### Scenario: List project tasks through application use case
- **WHEN** tasks are requested for a project ID
- **THEN** the Application layer calls the configured `TaskRepository` project-scoped list operation
- **THEN** only tasks belonging to that project are returned

#### Scenario: Get task by ID through application use case
- **WHEN** a task edit or detail surface requests a task by ID
- **THEN** the Application layer calls the configured `TaskRepository`
- **THEN** it returns the matching task or `null` when no task exists for that ID

#### Scenario: Create task through application use case
- **WHEN** valid task create input is submitted
- **THEN** the Application layer calls the configured `TaskRepository` create method
- **THEN** the created task is persisted by the repository adapter and returned to the caller

#### Scenario: Update task through application use case
- **WHEN** valid task update input is submitted for an existing task
- **THEN** the Application layer calls the configured `TaskRepository` update method
- **THEN** the updated task is persisted by the repository adapter and returned to the caller

#### Scenario: Delete task through application use case
- **WHEN** task deletion is confirmed
- **THEN** the Application layer calls the configured `TaskRepository` delete method
- **THEN** repository-defined task and subtask cleanup is used without duplicating cascade cleanup in the UI

#### Scenario: Update task field groups through application use case
- **WHEN** task status, assignee, tags, or checklist are changed
- **THEN** the Application layer calls the matching `TaskRepository` operation
- **THEN** the updated task is returned to the caller

### Requirement: Subtask application use cases
The system MUST provide Application-layer subtask use cases for listing subtasks, listing subtasks by parent task, getting a subtask by ID, creating a subtask, updating a subtask, deleting a subtask, updating subtask status, updating subtask assignee, updating subtask tags, and updating subtask checklist through the existing `SubtaskRepository` port.

#### Scenario: List all subtasks through application use case
- **WHEN** subtask list data is requested by an application or presentation workflow
- **THEN** the Application layer calls the configured `SubtaskRepository`
- **THEN** the caller receives subtask domain entities without accessing Local Storage directly

#### Scenario: List subtasks by parent task through application use case
- **WHEN** subtasks are requested for a parent task ID
- **THEN** the Application layer calls the configured `SubtaskRepository` task-scoped list operation
- **THEN** only subtasks belonging to that parent task are returned

#### Scenario: Get subtask by ID through application use case
- **WHEN** a subtask edit surface requests a subtask by ID
- **THEN** the Application layer calls the configured `SubtaskRepository`
- **THEN** it returns the matching subtask or `null` when no subtask exists for that ID

#### Scenario: Create subtask through application use case
- **WHEN** valid subtask create input is submitted for a parent task
- **THEN** the Application layer calls the configured `SubtaskRepository` create method
- **THEN** the created subtask is persisted by the repository adapter and returned to the caller

#### Scenario: Update subtask through application use case
- **WHEN** valid subtask update input is submitted for an existing subtask
- **THEN** the Application layer calls the configured `SubtaskRepository` update method
- **THEN** the updated subtask is persisted by the repository adapter and returned to the caller

#### Scenario: Delete subtask through application use case
- **WHEN** subtask deletion is confirmed
- **THEN** the Application layer calls the configured `SubtaskRepository` delete method
- **THEN** repository-defined parent task cleanup is used without duplicating cleanup in the UI

#### Scenario: Update subtask field groups through application use case
- **WHEN** subtask status, assignee, tags, or checklist are changed
- **THEN** the Application layer calls the matching `SubtaskRepository` operation
- **THEN** the updated subtask is returned to the caller

### Requirement: Task and subtask query hooks
The system MUST provide TanStack Query hooks named `useTasks`, `useTasksByProject`, `useTask`, `useCreateTask`, `useUpdateTask`, `useDeleteTask`, `useUpdateTaskStatus`, `useSubtasksByTask`, `useCreateSubtask`, `useUpdateSubtask`, and `useDeleteSubtask`.

#### Scenario: Read tasks with query hooks
- **WHEN** project task UI renders
- **THEN** it uses task query hooks to load all tasks, project tasks, or a single task as needed
- **THEN** the hooks return loading, error, and data state from TanStack Query

#### Scenario: Read subtasks with query hooks
- **WHEN** a task row or card expands to show subtasks
- **THEN** it uses `useSubtasksByTask` for the parent task ID
- **THEN** the hook returns loading, error, and subtask data from TanStack Query

#### Scenario: Invalidate task queries after task mutation
- **WHEN** a task is created, updated, deleted, or has status, assignee, tags, or checklist changed through a task mutation hook
- **THEN** task list queries are invalidated
- **THEN** project-scoped task queries for the affected project are invalidated
- **THEN** the affected task detail query is invalidated when the mutation targets a specific task ID

#### Scenario: Invalidate subtask and task queries after subtask mutation
- **WHEN** a subtask is created, updated, or deleted through a subtask mutation hook
- **THEN** subtask queries for the affected parent task are invalidated
- **THEN** the parent task query and relevant project task query are invalidated when enough IDs are available

#### Scenario: Keep task business data outside Zustand
- **WHEN** task and subtask hooks manage query and mutation state
- **THEN** they use TanStack Query rather than Zustand for persisted task entities
- **THEN** business data remains persisted through repositories

### Requirement: Task and subtask form validation
The system MUST provide Zod-backed validation schemas for task and subtask form data covering title, description, in-scope content, out-of-scope content, status, priority, start date, due date, assignee, tags, and checklist items.

#### Scenario: Accept valid task form data
- **WHEN** a task form contains a non-empty title, valid status, valid priority, valid nullable dates, optional text fields, nullable assignee, optional tags, and valid checklist items
- **THEN** the task validation schema accepts the form data
- **THEN** the validated data can be transformed into task create or update input

#### Scenario: Accept valid subtask form data
- **WHEN** a subtask form contains a non-empty title, valid status, valid priority, valid nullable dates, optional text fields, nullable assignee, optional tags, and valid checklist items
- **THEN** the subtask validation schema accepts the form data
- **THEN** the validated data can be transformed into subtask create or update input

#### Scenario: Reject missing required task fields
- **WHEN** a task form is submitted without a title, status, or priority
- **THEN** the validation schema rejects the form data
- **THEN** the UI can display field-level validation messages

#### Scenario: Reject missing required subtask fields
- **WHEN** a subtask form is submitted without a title, status, or priority
- **THEN** the validation schema rejects the form data
- **THEN** the UI can display field-level validation messages

#### Scenario: Reject invalid date range
- **WHEN** both start date and due date are provided and the due date is earlier than the start date
- **THEN** the validation schema rejects the form data
- **THEN** the UI can display a validation message explaining the date ordering problem

#### Scenario: Validate checklist item shape
- **WHEN** a checklist item is submitted from a task or subtask form
- **THEN** the validation schema requires text and completed state
- **THEN** the validation schema does not accept task-like checklist fields such as due date, priority, status, or assignee

### Requirement: Reusable task and subtask form UI
The system MUST provide reusable `TaskForm` and `SubtaskForm` components with checklist editing, member selection, tag selection, validation messages, and cancel/save behavior.

#### Scenario: Render required field indicators
- **WHEN** a task or subtask form is rendered
- **THEN** title, status, and priority labels show a visible asterisk
- **THEN** optional fields do not show a required asterisk

#### Scenario: Show validation messages
- **WHEN** a user submits invalid task or subtask form data
- **THEN** the form displays field-level validation messages
- **THEN** no create or update mutation is sent for invalid data

#### Scenario: Edit checklist items
- **WHEN** a user adds or edits checklist entries in a task or subtask form
- **THEN** the checklist editor captures text and completed state only
- **THEN** the saved form maps checklist values to domain checklist items

#### Scenario: Select existing assignee
- **WHEN** members exist in the local member catalog
- **THEN** task and subtask forms allow selecting one existing member or no assignee
- **THEN** the form saves the selected member ID or `null`

#### Scenario: Select existing tags
- **WHEN** tags exist in the local tag catalog
- **THEN** task and subtask forms allow selecting existing tags
- **THEN** the form saves selected tag IDs

#### Scenario: Cancel form
- **WHEN** a user cancels a task or subtask create or edit form
- **THEN** unsaved form changes are discarded
- **THEN** no create or update mutation is sent

### Requirement: Project detail task management
The system MUST implement task management inside Project Detail > Tasks with project task listing, an empty state, create/edit/delete task actions, expandable task rows or cards showing subtasks, and create/edit/delete subtask actions within the parent task area.

#### Scenario: Show empty project task state
- **WHEN** the selected project has no tasks
- **THEN** the Tasks tab shows an empty state
- **THEN** the empty state provides a create task action

#### Scenario: Show project task list
- **WHEN** the selected project has one or more tasks
- **THEN** the Tasks tab shows each project task with enough details to identify title, status, priority, dates, assignee, tags, and checklist state
- **THEN** tasks from other projects are not shown

#### Scenario: Create task from project detail
- **WHEN** a user enters valid task details and saves a create form
- **THEN** the task is created through `useCreateTask`
- **THEN** the task appears in the project task list
- **THEN** the UI shows a success toast notification

#### Scenario: Edit task from project detail
- **WHEN** a user edits an existing task with valid details and saves
- **THEN** the task is updated through `useUpdateTask`
- **THEN** the updated task details are visible after the mutation succeeds
- **THEN** the UI shows a success toast notification

#### Scenario: Delete task from project detail
- **WHEN** a user starts deleting a task
- **THEN** the UI opens the shared `ConfirmDialog`
- **THEN** no delete mutation is sent until the user confirms

#### Scenario: Confirm task deletion
- **WHEN** a user confirms task deletion
- **THEN** `useDeleteTask` deletes the task through the Application layer and repository adapter
- **THEN** repository-defined dependent subtask cleanup is used
- **THEN** the UI shows a success toast notification

#### Scenario: Expand task subtasks
- **WHEN** a user expands a task row or card
- **THEN** subtasks for that parent task are shown inside the parent task area
- **THEN** subtasks are not presented as independent kanban cards

#### Scenario: Manage subtasks inside parent task area
- **WHEN** a user creates, edits, or deletes a subtask inside an expanded task
- **THEN** the action uses the corresponding subtask hook
- **THEN** successful mutations update the visible parent task area and show success toast feedback

### Requirement: Lightweight task detail and editing surface
The system MUST provide a lightweight task detail or edit surface for project task workflows that shows title, description, scope, status, priority, dates, assignee, tags, checklist, and subtasks.

#### Scenario: Inspect task details
- **WHEN** a user opens or expands a task detail surface
- **THEN** the UI shows title, description, in-scope content, out-of-scope content, status, priority, start date, due date, assignee, tags, checklist, and subtasks

#### Scenario: Keep task detail scoped to project workflow
- **WHEN** the task detail surface is implemented
- **THEN** it remains within the Project Detail task workflow
- **THEN** it does not require a new global task route in this slice

### Requirement: Task completion warning
The system MUST show a confirmation dialog before marking a task done when pending subtasks exist, and MUST allow the user to cancel or confirm completion.

#### Scenario: Complete task without pending subtasks
- **WHEN** a user changes a task status to `done` and the task has no pending subtasks
- **THEN** the status update mutation is sent without showing the pending-subtask confirmation dialog

#### Scenario: Warn before completing task with pending subtasks
- **WHEN** a user changes a task status to `done` and at least one subtask is not `done`
- **THEN** the UI opens the shared `ConfirmDialog`
- **THEN** no status update mutation is sent until the user confirms

#### Scenario: Cancel completing task with pending subtasks
- **WHEN** the pending-subtask confirmation dialog is open and the user cancels
- **THEN** no task status update mutation is sent
- **THEN** the task remains at its previous status

#### Scenario: Confirm completing task with pending subtasks
- **WHEN** the pending-subtask confirmation dialog is open and the user confirms
- **THEN** `useUpdateTaskStatus` marks the task as `done`
- **THEN** the UI shows a success toast notification

### Requirement: Task and subtask edit-mode exclusivity
The system MUST prevent an entity being edited from remaining actionable underneath the edit surface and MUST keep create, edit, and delete confirmation states mutually exclusive.

#### Scenario: Hide active task actions while editing task
- **WHEN** a task is being edited
- **THEN** that same task is not rendered as an active list or card item underneath the edit surface
- **THEN** users cannot click delete, edit, status, assignee, tag, or checklist actions on that same task until the edit form closes

#### Scenario: Hide active subtask actions while editing subtask
- **WHEN** a subtask is being edited
- **THEN** that same subtask is not rendered as an active list or card item underneath the edit surface
- **THEN** users cannot click delete, edit, status, assignee, tag, or checklist actions on that same subtask until the edit form closes

#### Scenario: Close conflicting task states
- **WHEN** a task create form, task edit form, task delete confirmation, or task completion confirmation is opened
- **THEN** conflicting task create, edit, and confirmation states are closed for that project task area

#### Scenario: Close conflicting subtask states
- **WHEN** a subtask create form, subtask edit form, or subtask delete confirmation is opened
- **THEN** conflicting subtask create, edit, and confirmation states are closed for that parent task area

### Requirement: Task and subtask feedback
The system MUST use reusable UI feedback patterns for task and subtask create, update, delete, status change, assignee change, tag change, and checklist update workflows.

#### Scenario: Confirm destructive task and subtask deletion
- **WHEN** a user starts deleting a task or subtask
- **THEN** the UI uses the shared `ConfirmDialog`
- **THEN** no delete mutation is sent until the user confirms

#### Scenario: Cancel deletion dialog
- **WHEN** a user cancels a task or subtask deletion dialog
- **THEN** no delete mutation is sent
- **THEN** the task or subtask remains visible

#### Scenario: Show deletion loading state
- **WHEN** a confirmed task or subtask deletion is in progress
- **THEN** the confirmation dialog disables conflicting actions
- **THEN** the destructive confirm action communicates the pending state

#### Scenario: Show task success toast
- **WHEN** a task create, update, delete, status change, assignee change, tag change, or checklist update succeeds
- **THEN** the UI shows a non-blocking success toast notification when useful for the completed user action

#### Scenario: Show subtask success toast
- **WHEN** a subtask create, update, delete, status change, assignee change, tag change, or checklist update succeeds
- **THEN** the UI shows a non-blocking success toast notification when useful for the completed user action

### Requirement: Task and subtask scope boundaries
The system MUST keep this Task and Subtask Management slice limited to project-scoped task workflows and MUST NOT implement explicitly excluded MVP modules.

#### Scenario: Exclude kanban and global task table
- **WHEN** this change is implemented
- **THEN** it does not add kanban drag and drop
- **THEN** it does not implement the global tasks table

#### Scenario: Exclude AI and dashboard features
- **WHEN** this change is implemented
- **THEN** it does not add AI subtask generation, AI priority suggestion, AI project summary, or dashboard metrics

#### Scenario: Exclude settings and data transfer features
- **WHEN** this change is implemented
- **THEN** it does not add settings implementation, import/export, or demo data

#### Scenario: Preserve persistence and domain contracts
- **WHEN** this change is implemented
- **THEN** it does not change the local persistence key
- **THEN** it does not change approved domain entity or repository port contracts

### Requirement: Task and subtask test coverage
The system MUST include focused automated tests for task and subtask use cases, validation schemas, completion warning logic, checklist mapping, query invalidation where supported, required field label rendering where supported, edit-mode behavior, confirmation dialog usage, and toast feedback where supported.

#### Scenario: Test task and subtask use cases
- **WHEN** task and subtask use case tests run
- **THEN** they verify list, scoped list, get by ID, create, update, delete, status, assignee, tag, and checklist behavior against fake repository ports

#### Scenario: Test form validation schemas
- **WHEN** task and subtask validation tests run
- **THEN** they verify valid data, missing required fields, invalid status, invalid priority, invalid date ranges, nullable assignee, optional tags, and checklist item shape

#### Scenario: Test completion warning logic
- **WHEN** completion warning tests run
- **THEN** they verify that tasks with pending subtasks require confirmation before status changes to `done`
- **THEN** they verify cancellation avoids the mutation and confirmation sends the mutation

#### Scenario: Test checklist mapping
- **WHEN** checklist mapping tests run
- **THEN** they verify form checklist values map to domain checklist items with only text and completed state

#### Scenario: Test UI behavior where supported
- **WHEN** current UI test utilities support rendering the task workflow
- **THEN** tests verify required field labels, edit-mode exclusivity, delete confirmation usage, and success toast feedback after task and subtask mutations

#### Scenario: Test query invalidation where supported
- **WHEN** current hook test utilities support QueryClient inspection
- **THEN** tests verify relevant task and subtask queries are invalidated after supported mutations

