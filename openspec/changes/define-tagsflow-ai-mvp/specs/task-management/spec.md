## ADDED Requirements

### Requirement: Task lifecycle
The system MUST allow users to create, edit, view, and delete tasks within a project. A task MUST include title, description, in-scope content, out-of-scope content, priority, status, start date, due date, assignee, tags, checklist items, and subtasks.

#### Scenario: Create a project task
- **WHEN** a user creates a task from a project context
- **THEN** the system stores the task under that project
- **THEN** the task appears in project task views

### Requirement: Task priority and status values
The system MUST support task priorities of low, medium, high, and urgent. The system MUST support task statuses of backlog, todo, in_progress, blocked, review, and done.

#### Scenario: Save supported values
- **WHEN** a user saves a task priority and status
- **THEN** the system accepts only supported priority and status values

### Requirement: One-level subtasks
The system MUST allow tasks to contain subtasks, and subtasks MUST NOT contain nested subtasks. Subtasks MUST include title, description, priority, status, start date, due date, assignee, tags, and checklist items.

#### Scenario: Manage a subtask inside a task
- **WHEN** a user adds a subtask to a task
- **THEN** the subtask is stored under the parent task
- **THEN** the subtask is not shown as an independent kanban card

#### Scenario: Reject nested subtasks
- **WHEN** a user attempts to add a subtask under another subtask
- **THEN** the system prevents nested subtask creation

### Requirement: Checklist item shape
The system MUST store checklist items with only text and completed state.

#### Scenario: Add checklist item
- **WHEN** a user adds a checklist item to a task or subtask
- **THEN** the system stores only the checklist text and completed state

### Requirement: Task completion warning
The system MUST warn users before marking a task done when the task has incomplete subtasks. The system MUST allow completion after explicit confirmation.

#### Scenario: Complete task with pending subtasks
- **WHEN** a user marks a task done while incomplete subtasks exist
- **THEN** the system shows a warning confirmation
- **THEN** the task is marked done only after the user confirms

### Requirement: Global task view
The system MUST provide a global tasks page that shows tasks from all projects and supports search, filtering, sorting, editing, and expanding tasks to show subtasks. The global tasks page MUST NOT create new tasks in the MVP.

#### Scenario: Filter global tasks
- **WHEN** a user applies filters on the global tasks page
- **THEN** the system shows matching tasks from all projects
- **THEN** the user can expand a task to inspect its subtasks

### Requirement: Reusable tags
The system MUST allow tags to be created inline while editing tasks or subtasks. Tags MUST be stored in a reusable global catalog and MUST be usable as filters in task tables.

#### Scenario: Create inline tag
- **WHEN** a user enters a new tag while editing a task or subtask
- **THEN** the system stores the tag in the global catalog
- **THEN** the tag can be reused and used in filters
