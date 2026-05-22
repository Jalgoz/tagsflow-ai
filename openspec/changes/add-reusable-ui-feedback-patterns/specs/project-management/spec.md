## ADDED Requirements

### Requirement: Project management feedback
The system MUST use reusable UI feedback patterns for existing project create, update, and delete workflows.

#### Scenario: Confirm project deletion with reusable dialog
- **WHEN** a user starts deleting a project from Project Detail
- **THEN** the UI opens the shared `ConfirmDialog`
- **THEN** no delete mutation is sent until the user confirms the dialog

#### Scenario: Cancel project deletion dialog
- **WHEN** a user cancels the project deletion dialog
- **THEN** no delete mutation is sent
- **THEN** the project remains visible

#### Scenario: Show project deletion loading state
- **WHEN** a confirmed project deletion is in progress
- **THEN** the confirmation dialog disables conflicting actions
- **THEN** the destructive confirm action communicates the pending state

#### Scenario: Show project created toast
- **WHEN** a project is created successfully
- **THEN** the UI closes or resets the create surface
- **THEN** the UI shows a success toast notification

#### Scenario: Show project updated toast
- **WHEN** a project is updated successfully
- **THEN** the UI closes the edit surface
- **THEN** the UI shows a success toast notification

#### Scenario: Show project deleted toast
- **WHEN** a project is deleted successfully
- **THEN** the UI shows a success toast notification before or while returning the user to the Projects route
- **THEN** the notification does not require additional user confirmation
