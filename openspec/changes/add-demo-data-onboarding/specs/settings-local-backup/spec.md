## ADDED Requirements

### Requirement: Settings demo data loading
The Settings module MUST provide a safe optional action for loading demo data without silently overwriting existing local business data.

#### Scenario: Show demo data action in Settings
- **WHEN** the user opens Settings
- **THEN** the page may show a demo data action in an appropriate local data or onboarding section
- **THEN** the action clearly explains that demo data is editable local data

#### Scenario: Load demo data into empty database from Settings
- **WHEN** the user activates the Settings demo data action and local business data is empty
- **THEN** the system can load demo data without a destructive confirmation dialog
- **THEN** affected business data queries are refreshed
- **THEN** the system shows a non-blocking success toast

#### Scenario: Confirm before replacing existing data
- **WHEN** the user activates the Settings demo data action and existing local business data is present
- **THEN** the system opens the shared `ConfirmDialog` before any replacement is performed
- **THEN** the dialog clearly explains that current local projects, tasks, subtasks, members, and tags will be replaced if replacement is confirmed

#### Scenario: Cancel replacing existing data
- **WHEN** the Settings demo replacement confirmation is open
- **AND** the user cancels
- **THEN** current local business data remains unchanged
- **THEN** no demo data replacement mutation is sent

#### Scenario: Confirm replacing existing data
- **WHEN** the Settings demo replacement confirmation is open
- **AND** the user confirms replacement
- **THEN** the system replaces current local business data with valid demo data through approved application or persistence behavior
- **THEN** affected business data queries are refreshed
- **THEN** the system shows a non-blocking success toast

#### Scenario: Preserve backup and import behavior
- **WHEN** the Settings demo data action is implemented
- **THEN** existing export, import, reset, theme, and backup API-key sanitization behavior remains unchanged
- **THEN** demo data loaded from Settings is included in later exports as normal local data

#### Scenario: Preserve Settings architecture boundaries
- **WHEN** Settings renders or performs the demo data action
- **THEN** Settings UI components do not read from or write to Local Storage directly
- **THEN** they call application-level behavior backed by existing repositories or infrastructure adapters
