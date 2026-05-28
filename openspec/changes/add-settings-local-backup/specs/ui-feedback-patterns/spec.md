## ADDED Requirements

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
