# ui-feedback-patterns Specification

## Purpose
TBD - created by archiving change add-reusable-ui-feedback-patterns. Update Purpose after archive.
## Requirements
### Requirement: Reusable destructive confirmation dialog
The system MUST provide a reusable `ConfirmDialog` component for destructive actions that require user confirmation.

#### Scenario: Render destructive confirmation dialog
- **WHEN** a feature opens a destructive confirmation
- **THEN** the dialog shows caller-provided title text
- **THEN** the dialog shows caller-provided description text
- **THEN** the dialog shows a cancel action
- **THEN** the dialog shows a destructive confirm action

#### Scenario: Cancel destructive confirmation
- **WHEN** the user activates the dialog cancel action
- **THEN** the dialog calls the caller-provided cancel handler
- **THEN** no destructive mutation is sent by the dialog itself

#### Scenario: Confirm destructive action
- **WHEN** the user activates the dialog confirm action
- **THEN** the dialog calls the caller-provided confirm handler
- **THEN** the dialog does not directly access repositories, Local Storage, or business entities

#### Scenario: Show destructive action loading state
- **WHEN** a destructive action is in progress
- **THEN** the confirm action is disabled
- **THEN** the cancel action is disabled or otherwise prevented from causing conflicting state
- **THEN** the dialog presents caller-provided loading text or a clear disabled state

### Requirement: Reusable toast notification provider
The system MUST provide a reusable toast notification provider and hook for lightweight user feedback.

#### Scenario: Show success toast
- **WHEN** a feature enqueues a success notification through the toast hook
- **THEN** the toast provider renders accessible success text content
- **THEN** the notification does not block the current workflow

#### Scenario: Show error toast
- **WHEN** a feature enqueues an error notification through the toast hook
- **THEN** the toast provider renders accessible error text content
- **THEN** the notification does not replace field-level validation messages or loading/error query states

#### Scenario: Auto-dismiss toast
- **WHEN** a toast notification has been visible for its configured duration
- **THEN** the toast provider removes it without requiring user input

#### Scenario: Dismiss toast manually
- **WHEN** the user activates a toast dismiss action
- **THEN** the toast provider removes that notification
- **THEN** other active notifications remain visible until dismissed or expired

### Requirement: Project-wide feedback rule
The system MUST use consistent feedback rules for current and future user workflows.

#### Scenario: Require confirmation for destructive actions
- **WHEN** a current or future workflow deletes data or performs another destructive action
- **THEN** the workflow uses `ConfirmDialog` before sending the destructive mutation

#### Scenario: Require toast for successful mutations
- **WHEN** a current or future workflow successfully creates, updates, deletes, or assigns business data
- **THEN** the workflow shows a toast notification for success feedback

#### Scenario: Reserve blocking dialogs for decisions
- **WHEN** a workflow only needs to inform the user that an action succeeded
- **THEN** the workflow uses toast feedback instead of a blocking modal dialog
- **THEN** blocking dialogs are reserved for confirmations or decisions requiring user input

### Requirement: UI feedback test coverage
The system MUST include focused tests for reusable feedback primitives where the current test stack supports them.

#### Scenario: Test confirmation dialog behavior
- **WHEN** confirmation dialog tests run
- **THEN** they verify title and description rendering
- **THEN** they verify cancel and confirm handler behavior
- **THEN** they verify disabled or loading behavior for an in-progress destructive action

#### Scenario: Test toast provider behavior
- **WHEN** toast provider tests run
- **THEN** they verify success notification rendering
- **THEN** they verify error notification rendering when implemented
- **THEN** they verify dismiss or auto-dismiss behavior using the current test utilities

### Requirement: Settings feedback integration
The Settings module MUST reuse shared feedback primitives for local backup, import, reset, and theme actions.

#### Scenario: Confirm import replacement
- **WHEN** a valid backup is ready to replace current local data
- **THEN** the Settings module uses the shared `ConfirmDialog`
- **THEN** the dialog clearly explains that current local data will be replaced

#### Scenario: Confirm local data reset
- **WHEN** a user requests local data reset
- **THEN** the Settings module uses the shared `ConfirmDialog`
- **THEN** the dialog clearly explains the destructive effect before mutation

#### Scenario: Show settings success toasts
- **WHEN** export, import, reset, or theme update succeeds
- **THEN** the Settings module shows success feedback through the shared toast pattern
- **THEN** success feedback does not block the current workflow

#### Scenario: Show import validation errors
- **WHEN** backup import validation fails
- **THEN** the Settings module shows a clear non-crashing error message
- **THEN** the error message does not replace the destructive confirmation dialog because no destructive mutation is allowed

