## ADDED Requirements

### Requirement: Tag management feedback
The system MUST use reusable UI feedback patterns for existing tag create, update, and delete workflows while preserving used-tag warning context.

#### Scenario: Confirm unused tag deletion with reusable dialog
- **WHEN** a user starts deleting a tag with no task or subtask usage
- **THEN** the UI opens the shared `ConfirmDialog`
- **THEN** no delete mutation is sent until the user confirms the dialog

#### Scenario: Confirm used tag deletion with reusable dialog
- **WHEN** a user starts deleting a tag used by one or more tasks or subtasks
- **THEN** the UI opens the shared `ConfirmDialog`
- **THEN** the dialog description includes tag usage context
- **THEN** no delete mutation is sent until the user confirms the dialog

#### Scenario: Cancel tag deletion dialog
- **WHEN** a user cancels the tag deletion dialog
- **THEN** no delete mutation is sent
- **THEN** the tag remains visible

#### Scenario: Show tag deletion loading state
- **WHEN** a confirmed tag deletion is in progress
- **THEN** the confirmation dialog disables conflicting actions
- **THEN** the destructive confirm action communicates the pending state

#### Scenario: Show tag created toast
- **WHEN** a tag is created successfully
- **THEN** the UI closes or resets the create surface
- **THEN** the UI shows a success toast notification

#### Scenario: Show tag updated toast
- **WHEN** a tag is updated successfully
- **THEN** the UI closes the edit surface
- **THEN** the UI shows a success toast notification

#### Scenario: Show tag deleted toast
- **WHEN** a tag is deleted successfully
- **THEN** the UI shows a success toast notification
- **THEN** the notification does not require additional user confirmation
