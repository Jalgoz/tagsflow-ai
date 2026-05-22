## ADDED Requirements

### Requirement: Member management feedback
The system MUST use reusable UI feedback patterns for existing member create, update, and delete workflows while preserving assigned-member warning context.

#### Scenario: Confirm unassigned member deletion with reusable dialog
- **WHEN** a user starts deleting a member with no project, task, or subtask assignments
- **THEN** the UI opens the shared `ConfirmDialog`
- **THEN** no delete mutation is sent until the user confirms the dialog

#### Scenario: Confirm assigned member deletion with reusable dialog
- **WHEN** a user starts deleting a member assigned to one or more projects, tasks, or subtasks
- **THEN** the UI opens the shared `ConfirmDialog`
- **THEN** the dialog description includes assignment context
- **THEN** no delete mutation is sent until the user confirms the dialog

#### Scenario: Cancel member deletion dialog
- **WHEN** a user cancels the member deletion dialog
- **THEN** no delete mutation is sent
- **THEN** the member remains visible

#### Scenario: Show member deletion loading state
- **WHEN** a confirmed member deletion is in progress
- **THEN** the confirmation dialog disables conflicting actions
- **THEN** the destructive confirm action communicates the pending state

#### Scenario: Show member created toast
- **WHEN** a member is created successfully
- **THEN** the UI closes or resets the create surface
- **THEN** the UI shows a success toast notification

#### Scenario: Show member updated toast
- **WHEN** a member is updated successfully
- **THEN** the UI closes the edit surface
- **THEN** the UI shows a success toast notification

#### Scenario: Show member deleted toast
- **WHEN** a member is deleted successfully
- **THEN** the UI shows a success toast notification
- **THEN** the notification does not require additional user confirmation
