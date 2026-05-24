## MODIFIED Requirements

### Requirement: Project detail task management
The system MUST implement task management inside Project Detail > Tasks with project task listing, an empty state, create/edit/delete task actions, expandable task rows or cards showing subtasks, a compact subtask list inside or directly under the parent task area, focused create/edit subtask surfaces, and delete subtask actions within the parent task workflow.

#### Scenario: Show empty project task state
- **WHEN** the selected project has no tasks
- **THEN** the Tasks tab shows an empty state
- **THEN** the empty state provides a create task action

#### Scenario: Show project task list
- **WHEN** the selected project has one or more tasks
- **THEN** the Tasks tab shows each project task with enough details to identify title, status, priority, dates, assignee, tags, and checklist state
- **THEN** tasks from other projects are not shown

#### Scenario: Show readable task cards
- **WHEN** the project task list is rendered
- **THEN** each task card keeps task title, status, priority, dates, assignee, tags, checklist summary, scope, and actions visually grouped with clear spacing
- **THEN** task actions do not crowd or obscure task metadata

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
- **THEN** subtasks for that parent task are shown inside or directly under the parent task area
- **THEN** subtasks are rendered as a compact associated list
- **THEN** subtasks are not presented as independent kanban cards

#### Scenario: Keep subtask create action near parent task
- **WHEN** a task card or row is expanded to show subtasks
- **THEN** the parent task area shows a "New subtask" action near the subtask list
- **THEN** activating the action does not render the full subtask form inside the main task card content area

#### Scenario: Create subtask from focused surface
- **WHEN** a user starts creating a subtask from the parent task area
- **THEN** the UI opens a reusable modal, dialog, or focused overlay containing the subtask form
- **THEN** the task card layout remains stable while the form is open
- **THEN** valid save uses `useCreateSubtask`
- **THEN** the created subtask appears in the compact list for the parent task
- **THEN** the UI shows a success toast notification

#### Scenario: Edit subtask from focused surface
- **WHEN** a user starts editing a subtask from the parent task area
- **THEN** the UI opens a reusable modal, dialog, or focused overlay containing the subtask form
- **THEN** the full edit form is not rendered inline inside the main task card content area
- **THEN** valid save uses `useUpdateSubtask`
- **THEN** the updated subtask details are visible in the compact list for the parent task
- **THEN** the UI shows a success toast notification

#### Scenario: Delete subtask from parent task area
- **WHEN** a user starts deleting a subtask inside the parent task area
- **THEN** the UI opens the shared `ConfirmDialog`
- **THEN** no delete mutation is sent until the user confirms

#### Scenario: Confirm subtask deletion
- **WHEN** a user confirms subtask deletion
- **THEN** `useDeleteSubtask` deletes the subtask through the Application layer and repository adapter
- **THEN** the parent task area updates to remove the subtask from the compact list
- **THEN** the UI shows a success toast notification

#### Scenario: Preserve subtask form behavior in focused surface
- **WHEN** the focused subtask create or edit surface is shown
- **THEN** the form preserves required field asterisks, validation messages, assignee selection, tag selection, checklist editing, cancel behavior, and save behavior
- **THEN** invalid form data does not send a create or update mutation

#### Scenario: Manage subtasks inside parent task workflow
- **WHEN** a user creates, edits, or deletes a subtask from an expanded task
- **THEN** the action remains scoped to that parent task
- **THEN** the action uses the corresponding subtask hook
- **THEN** successful mutations update the visible parent task area and show success toast feedback

### Requirement: Task and subtask edit-mode exclusivity
The system MUST prevent an entity being edited from remaining actionable underneath the edit surface and MUST keep create, edit, and delete confirmation states mutually exclusive.

#### Scenario: Hide active task actions while editing task
- **WHEN** a task is being edited
- **THEN** that same task is not rendered as an active list or card item underneath the edit surface
- **THEN** users cannot click delete, edit, status, assignee, tag, or checklist actions on that same task until the edit form closes

#### Scenario: Hide active subtask actions while editing subtask
- **WHEN** a subtask is being edited in the focused subtask edit surface
- **THEN** that same subtask is not rendered as an active list or card item underneath the edit surface
- **THEN** users cannot click delete, edit, status, assignee, tag, or checklist actions on that same subtask until the edit form closes

#### Scenario: Prevent duplicate subtask create surfaces
- **WHEN** a subtask create surface is open for a parent task
- **THEN** opening another subtask create or edit action for that same parent task closes or replaces the previous subtask create surface
- **THEN** only one subtask form surface is active for that parent task

#### Scenario: Close conflicting task states
- **WHEN** a task create form, task edit form, task delete confirmation, or task completion confirmation is opened
- **THEN** conflicting task create, edit, and confirmation states are closed for that project task area

#### Scenario: Close conflicting subtask states
- **WHEN** a subtask create form, subtask edit form, or subtask delete confirmation is opened
- **THEN** conflicting subtask create, edit, and confirmation states are closed for that parent task area

#### Scenario: Cancel focused subtask form
- **WHEN** the user cancels a focused subtask create or edit surface
- **THEN** unsaved subtask form changes are discarded
- **THEN** no create or update mutation is sent
- **THEN** the compact subtask list remains visible in the parent task area

### Requirement: Task and subtask scope boundaries
The system MUST keep this Task and Subtask Management slice limited to project-scoped task workflows and MUST NOT implement explicitly excluded MVP modules.

#### Scenario: Exclude kanban and global task table
- **WHEN** this change is implemented
- **THEN** it does not add kanban drag and drop
- **THEN** it does not implement the global tasks table

#### Scenario: Preserve global tasks placeholder
- **WHEN** this change is implemented
- **THEN** the `/tasks` route remains a placeholder
- **THEN** it does not show a global task table, global task editor, global filters, global sorting, or global subtask expansion

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
The system MUST include focused automated tests for task and subtask use cases, validation schemas, completion warning logic, checklist mapping, query invalidation where supported, required field label rendering where supported, edit-mode behavior, focused subtask create/edit behavior, confirmation dialog usage, and toast feedback where supported.

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

#### Scenario: Test focused subtask create and edit behavior
- **WHEN** current UI test utilities support rendering the project task workflow
- **THEN** tests verify that starting subtask creation opens a modal, dialog, or focused overlay instead of rendering the full form inline in the task card
- **THEN** tests verify that starting subtask editing opens a modal, dialog, or focused overlay instead of leaving the edited subtask actionable in the compact list

#### Scenario: Test UI behavior where supported
- **WHEN** current UI test utilities support rendering the task workflow
- **THEN** tests verify required field labels, edit-mode exclusivity, delete confirmation usage, and success toast feedback after task and subtask mutations

#### Scenario: Test global tasks placeholder boundary
- **WHEN** route or page tests cover `/tasks`
- **THEN** tests verify that the global tasks page remains a placeholder and does not render the global tasks table in this change

#### Scenario: Test query invalidation where supported
- **WHEN** current hook test utilities support QueryClient inspection
- **THEN** tests verify relevant task and subtask queries are invalidated after supported mutations
