## ADDED Requirements

### Requirement: Local member catalog
The system MUST allow users to create, edit, view, and delete local members. A member MUST include name, email, role, and avatar.

#### Scenario: Create member
- **WHEN** a user creates a member
- **THEN** the member is stored locally
- **THEN** the member can be selected in assignment controls

### Requirement: Member assignments
The system MUST allow members to be assigned to projects, tasks, and subtasks.

#### Scenario: Assign member to work item
- **WHEN** a user assigns a member to a project, task, or subtask
- **THEN** the assignment is stored locally

### Requirement: Assigned member deletion
The system MUST require confirmation before deleting a member assigned to any project, task, or subtask. After confirmed deletion, the system MUST remove that member reference from projects and set affected tasks and subtasks to unassigned.

#### Scenario: Delete assigned member
- **WHEN** a user deletes a member with existing assignments
- **THEN** the system shows a confirmation message
- **THEN** confirmed deletion removes the member from all assignments
