# global-tasks-view Specification

## Purpose
TBD - created by archiving change add-global-tasks-view. Update Purpose after archive.
## Requirements
### Requirement: Global tasks route
The system MUST replace the `/tasks` placeholder with a functional global tasks page that loads existing task-related business data through Application-layer hooks.

#### Scenario: Render global tasks page
- **WHEN** a user navigates to `/tasks`
- **THEN** the page renders a functional global tasks view instead of placeholder copy
- **THEN** the page loads tasks through the existing task Application hooks
- **THEN** the page does not access Local Storage or repository adapters directly

#### Scenario: Load supporting catalogs
- **WHEN** the global tasks page renders
- **THEN** the page loads projects, subtasks, members, and tags through existing Application-layer hooks where those catalogs are needed for display, filtering, editing, or expansion
- **THEN** loading and error states are shown without presenting stale placeholder content as complete functionality

#### Scenario: Show empty global tasks state
- **WHEN** no tasks exist in local business data
- **THEN** the page shows an empty state for the global task list
- **THEN** the empty state does not show a global task creation action
- **THEN** the empty state guides the user to choose or open a project before creating tasks

### Requirement: Cross-project task display
The system MUST display existing tasks from all projects with enough metadata to review work across the local workspace.

#### Scenario: Show task metadata
- **WHEN** tasks exist across one or more projects
- **THEN** each task item shows the task title, project name, status, priority, start date, due date, assignee, tags, checklist summary, and subtask count or subtask progress summary

#### Scenario: Resolve missing optional metadata
- **WHEN** a task has no assignee, no tags, no dates, or no checklist items
- **THEN** the task item renders a clear empty or neutral display value for that metadata
- **THEN** the absence of optional metadata does not hide the task from the global list

#### Scenario: Preserve project context
- **WHEN** tasks from multiple projects are displayed
- **THEN** each task item identifies its project by name
- **THEN** the user can distinguish tasks with similar titles that belong to different projects

### Requirement: Global task filtering
The system MUST allow users to filter the global task list by project, status, priority, assignee, tag, overdue state, and upcoming deadline state.

#### Scenario: Filter by project
- **WHEN** a user selects a project filter
- **THEN** the list shows only tasks that belong to the selected project

#### Scenario: Filter by status
- **WHEN** a user selects a task status filter
- **THEN** the list shows only tasks with the selected status

#### Scenario: Filter by priority
- **WHEN** a user selects a priority filter
- **THEN** the list shows only tasks with the selected priority

#### Scenario: Filter by assignee
- **WHEN** a user selects an assignee filter
- **THEN** the list shows only tasks assigned to the selected member

#### Scenario: Filter by tag
- **WHEN** a user selects a tag filter
- **THEN** the list shows only tasks containing the selected tag

#### Scenario: Filter overdue tasks
- **WHEN** a user enables the overdue filter
- **THEN** the list shows only open tasks with due dates earlier than the current reference date
- **THEN** done tasks are not treated as overdue

#### Scenario: Filter upcoming deadlines
- **WHEN** a user enables the upcoming deadline filter
- **THEN** the list shows only open tasks with due dates within the configured upcoming deadline window
- **THEN** done tasks are not treated as upcoming deadline work

#### Scenario: Combine filters
- **WHEN** multiple global task filters are active
- **THEN** the list shows only tasks matching all active filters

#### Scenario: Clear filters
- **WHEN** a user clears active filters
- **THEN** the list returns to showing all tasks that match the current search and sort state

### Requirement: Global task search
The system MUST allow users to search global tasks by task title and task description where task descriptions are available.

#### Scenario: Search by title
- **WHEN** a user enters search text matching a task title
- **THEN** the list includes matching tasks regardless of case

#### Scenario: Search by description
- **WHEN** a user enters search text matching a task description
- **THEN** the list includes matching tasks regardless of case

#### Scenario: Search with filters
- **WHEN** search text and filters are both active
- **THEN** the list shows only tasks matching the search text and all active filters

#### Scenario: Empty search
- **WHEN** the search input is empty
- **THEN** search does not remove tasks from the list

### Requirement: Global task sorting
The system MUST allow users to sort the global task list by due date, priority, status, project, and title.

#### Scenario: Sort by due date
- **WHEN** a user sorts by due date
- **THEN** tasks are ordered by due date with tasks lacking due dates placed consistently at the end

#### Scenario: Sort by priority
- **WHEN** a user sorts by priority
- **THEN** tasks are ordered by the approved priority order

#### Scenario: Sort by status
- **WHEN** a user sorts by status
- **THEN** tasks are ordered by the approved task status order

#### Scenario: Sort by project
- **WHEN** a user sorts by project
- **THEN** tasks are ordered by project name with a deterministic fallback for missing project references

#### Scenario: Sort by title
- **WHEN** a user sorts by title
- **THEN** tasks are ordered alphabetically by task title

#### Scenario: Toggle sort direction
- **WHEN** a supported sort control changes direction
- **THEN** the list order updates between ascending and descending order for the selected sort field

### Requirement: Global task subtask expansion
The system MUST support expanding a global task item to show its subtasks in a compact associated display under the parent task.

#### Scenario: Expand task subtasks
- **WHEN** a user expands a task with subtasks
- **THEN** the page shows that task's subtasks under or inside the parent task item
- **THEN** subtasks are rendered as compact associated rows or cards
- **THEN** subtasks are not displayed as independent global task cards

#### Scenario: Show compact subtask metadata
- **WHEN** subtasks are expanded
- **THEN** each subtask item shows title, status, priority, assignee, tags, and due date

#### Scenario: Expand task without subtasks
- **WHEN** a user expands a task without subtasks
- **THEN** the page shows a compact empty subtask state for that parent task
- **THEN** the page does not show a create subtask action

#### Scenario: Collapse task subtasks
- **WHEN** a user collapses an expanded task
- **THEN** the compact subtask display is hidden for that task
- **THEN** the parent task remains visible in the global list

### Requirement: Global existing-task editing
The system MUST allow users to edit existing tasks from the global task view by reusing the existing task form, validation, update hook, and feedback behavior.

#### Scenario: Open task edit surface
- **WHEN** a user starts editing a task from the global tasks page
- **THEN** the page opens a focused edit surface containing the reusable `TaskForm`
- **THEN** the edited task is not left actionable underneath the edit surface

#### Scenario: Preserve task form behavior
- **WHEN** the global task edit form is shown
- **THEN** required field labels show visible asterisks
- **THEN** invalid submitted values show validation messages
- **THEN** assignee selection, tag selection, checklist editing, save, and cancel behavior match the reusable task form behavior

#### Scenario: Save task edit
- **WHEN** a user submits valid changes for an existing task
- **THEN** the page updates the task through the existing update task hook
- **THEN** the visible global task data reflects the saved changes after the mutation succeeds
- **THEN** the page shows a success toast notification

#### Scenario: Cancel task edit
- **WHEN** a user cancels the global task edit form
- **THEN** unsaved changes are discarded
- **THEN** no update mutation is sent
- **THEN** the task remains in the global list according to the active filters, search, and sort state

### Requirement: Global task deletion
The system MUST allow users to delete existing tasks from the global task view using the shared confirmation dialog and existing repository cleanup behavior.

#### Scenario: Request task deletion
- **WHEN** a user starts deleting a task from the global tasks page
- **THEN** the page opens the shared `ConfirmDialog`
- **THEN** no delete mutation is sent until the user confirms

#### Scenario: Confirm task deletion
- **WHEN** a user confirms task deletion
- **THEN** the page deletes the task through the existing delete task hook
- **THEN** repository-defined dependent subtask cleanup is used
- **THEN** the page shows a success toast notification

#### Scenario: Cancel task deletion
- **WHEN** a user cancels the deletion confirmation
- **THEN** no delete mutation is sent
- **THEN** the task remains visible when it matches the active filters, search, and sort state

#### Scenario: Show deletion pending state
- **WHEN** a confirmed task deletion is in progress
- **THEN** the confirmation dialog disables conflicting actions or clearly communicates the pending state

### Requirement: Global task creation boundary
The system MUST NOT allow creating tasks or subtasks from the global `/tasks` page.

#### Scenario: No global task creation action
- **WHEN** the global tasks page renders
- **THEN** it does not show a global new task action
- **THEN** it does not render a task creation form

#### Scenario: No global subtask creation action
- **WHEN** a task item is expanded on the global tasks page
- **THEN** the expanded subtask area does not show a new subtask action
- **THEN** it does not render a subtask creation form

#### Scenario: Guide task creation through projects
- **WHEN** the global tasks page needs to guide users toward task creation
- **THEN** it directs users to choose or open a project first
- **THEN** task creation remains available only through approved project-scoped task workflows

### Requirement: Global task completion safety
The system MUST preserve the pending-subtask completion warning when a task is marked done from the global tasks page.

#### Scenario: Save done status without pending subtasks
- **WHEN** a user saves a global task edit that changes status to `done` and the task has no pending subtasks
- **THEN** the update mutation is sent without opening the pending-subtask confirmation dialog

#### Scenario: Warn before saving done status with pending subtasks
- **WHEN** a user saves a global task edit that changes status to `done` and at least one subtask is not `done`
- **THEN** the page opens the shared confirmation dialog
- **THEN** no update mutation is sent until the user confirms

#### Scenario: Cancel done status warning
- **WHEN** the pending-subtask completion confirmation is open and the user cancels
- **THEN** no update mutation is sent
- **THEN** the task remains at its previous status

#### Scenario: Confirm done status warning
- **WHEN** the pending-subtask completion confirmation is open and the user confirms
- **THEN** the task update to `done` is sent through the existing update task hook
- **THEN** the page shows a success toast notification after the mutation succeeds

### Requirement: Global tasks scope boundaries
The system MUST keep the Global Tasks View limited to existing-task review, filtering, sorting, expansion, editing, and deletion.

#### Scenario: Preserve persistence and domain contracts
- **WHEN** this change is implemented
- **THEN** it does not change task, subtask, project, member, or tag domain entity contracts
- **THEN** it does not change repository port contracts
- **THEN** it does not change the Local Storage database key or schema

#### Scenario: Exclude unrelated modules
- **WHEN** this change is implemented
- **THEN** it does not add kanban drag and drop, global Kanban behavior, dashboard metrics, AI features, settings implementation, import/export, or demo data

#### Scenario: Keep AI providers out of global tasks
- **WHEN** the global tasks page renders or mutates existing tasks
- **THEN** it does not call Groq, mock AI, or any AI provider

### Requirement: Global tasks test coverage
The system MUST include focused automated tests for global task logic and supported global task UI behavior.

#### Scenario: Test filter logic
- **WHEN** global task filter tests run
- **THEN** they verify project, status, priority, assignee, tag, overdue, upcoming deadline, combined filters, and clear-filter behavior

#### Scenario: Test search logic
- **WHEN** global task search tests run
- **THEN** they verify case-insensitive title and description search behavior

#### Scenario: Test sort logic
- **WHEN** global task sort tests run
- **THEN** they verify due date, priority, status, project, title, and direction behavior

#### Scenario: Test global task rendering
- **WHEN** global task page or component tests render tasks with supporting catalogs
- **THEN** they verify task title, project name, status, priority, dates, assignee, tags, checklist summary, and subtask summary display

#### Scenario: Test subtask expansion
- **WHEN** global task page or component tests expand a task
- **THEN** they verify compact subtask metadata is shown
- **THEN** they verify no subtask creation action is present

#### Scenario: Test no creation action
- **WHEN** global task page tests render `/tasks`
- **THEN** they verify no task creation action or task creation form is available

#### Scenario: Test edit and delete behavior where supported
- **WHEN** current UI test utilities support the global task page providers and user interactions
- **THEN** tests verify task edit submission uses existing update behavior and shows a success toast
- **THEN** tests verify delete opens `ConfirmDialog`, waits for confirmation, deletes through existing behavior, and shows a success toast
- **THEN** tests verify the pending-subtask completion warning applies when saving a task as done with pending subtasks

