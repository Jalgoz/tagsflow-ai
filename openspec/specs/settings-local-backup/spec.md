# settings-local-backup Specification

## Purpose
TBD - created by archiving change add-settings-local-backup. Update Purpose after archive.
## Requirements
### Requirement: Functional Settings page
The system MUST replace the `/settings` placeholder with a functional Settings page for appearance preferences and local data management.

#### Scenario: User opens settings
- **WHEN** a user opens `/settings`
- **THEN** the app renders a Settings page inside the existing app shell
- **THEN** the page includes sections for Appearance, Local data backup, Import data, and Danger zone
- **THEN** the page no longer presents Settings as a future placeholder

#### Scenario: AI settings remain out of scope
- **WHEN** the Settings page includes an AI settings section
- **THEN** the section is clearly disabled or placeholder-only
- **THEN** the section does not save API keys, call Groq, detect models, test connections, or run AI workflows

### Requirement: Theme preference management
The system MUST allow users to choose light or dark theme from Settings and persist the selected theme through the existing settings persistence path.

#### Scenario: Display current theme
- **WHEN** the Settings page loads
- **THEN** it reads the current settings through application settings behavior
- **THEN** it shows the persisted theme as the selected appearance option

#### Scenario: Change theme
- **WHEN** a user selects a different theme
- **THEN** the system saves the updated theme through the existing SettingsRepository path
- **THEN** the app applies the selected theme to the app shell and routed pages where current styling supports it
- **THEN** the selected theme remains selected after the page is reloaded

#### Scenario: Theme update feedback
- **WHEN** a theme update succeeds
- **THEN** the system shows a non-blocking success toast where useful

### Requirement: Local backup export from Settings
The system MUST allow users to export local app data from Settings as a JSON file.

#### Scenario: Export local backup
- **WHEN** a user activates the export action
- **THEN** the system generates a JSON backup containing database version metadata
- **THEN** the backup contains projects, tasks, subtasks, members, tags, and non-sensitive settings
- **THEN** the browser downloads the backup as a JSON file

#### Scenario: Export success feedback
- **WHEN** the backup file is generated for download
- **THEN** the system shows a non-blocking success toast

### Requirement: Sensitive settings exclusion
The system MUST exclude sensitive provider data from exported backups.

#### Scenario: Exclude Groq API key
- **WHEN** a user exports local data while a Groq API key is stored locally
- **THEN** the exported JSON does not include the Groq API key value
- **THEN** the exported JSON does not include an `apiKey` field containing a secret

#### Scenario: Exclude future provider secrets
- **WHEN** future provider configuration adds secret-bearing fields
- **THEN** the backup export sanitizer omits or neutralizes those fields before JSON is downloaded

### Requirement: Local backup import from Settings
The system MUST allow users to import a local backup JSON file only after the file is parsed, validated, and explicitly confirmed for replacement.

#### Scenario: Select valid backup
- **WHEN** a user selects a valid supported backup JSON file
- **THEN** the system parses and validates the backup
- **THEN** the system presents a confirmation dialog before replacing current local data
- **THEN** current local data remains unchanged while confirmation is pending

#### Scenario: Confirm valid import
- **WHEN** a user confirms replacement for a valid imported backup
- **THEN** the system replaces the current local database with the imported data
- **THEN** the app refreshes affected business data views or cached queries
- **THEN** the system shows a non-blocking success toast

#### Scenario: Cancel valid import
- **WHEN** a user cancels the import replacement confirmation
- **THEN** the system does not replace current local data
- **THEN** the user remains on the Settings page

#### Scenario: Reject malformed JSON import
- **WHEN** a user selects a file that is not valid JSON
- **THEN** the system rejects the import
- **THEN** the system shows a clear validation error without crashing the app
- **THEN** current local data remains unchanged

#### Scenario: Reject unsupported database version
- **WHEN** a user selects JSON with an unsupported database version
- **THEN** the system rejects the import
- **THEN** the system shows a clear validation error without replacing current local data

#### Scenario: Reject invalid entity shape
- **WHEN** a user selects JSON with projects, tasks, subtasks, members, tags, or settings that do not match the supported local database schema
- **THEN** the system rejects the import
- **THEN** the system shows a clear validation error without replacing current local data

### Requirement: Local data reset from Settings
The system MUST allow users to clear local app data from Settings through a destructive confirmation flow.

#### Scenario: Request local data reset
- **WHEN** a user activates the reset local data action
- **THEN** the system opens a destructive confirmation dialog
- **THEN** the dialog explains that projects, tasks, subtasks, members, tags, and settings will be reset locally

#### Scenario: Confirm local data reset
- **WHEN** a user confirms the reset action
- **THEN** the system replaces local data with a valid empty database and default settings
- **THEN** the app refreshes affected business data views or cached queries
- **THEN** the system shows a non-blocking success toast

#### Scenario: Cancel local data reset
- **WHEN** a user cancels the reset confirmation
- **THEN** the system does not clear or replace local data

### Requirement: Settings architecture boundaries
The Settings module MUST preserve the existing modular frontend architecture and repository/adapters boundaries.

#### Scenario: Settings UI avoids direct Local Storage access
- **WHEN** Settings UI components render export, import, reset, or theme controls
- **THEN** they do not read from or write to Local Storage directly
- **THEN** they call application-level behavior backed by repositories or infrastructure adapters

#### Scenario: Import validation stays outside presentation-only code
- **WHEN** backup JSON is parsed and validated
- **THEN** validation logic lives in Infrastructure or Application code
- **THEN** Presentation receives success or failure state suitable for rendering

### Requirement: Settings and backup test coverage
The system MUST include focused tests for Settings and local backup behavior where the current test stack supports them.

#### Scenario: Test backup behavior
- **WHEN** backup tests run
- **THEN** they verify exported settings exclude API keys
- **THEN** they verify the backup JSON shape includes supported entities and database version metadata
- **THEN** they verify valid import validation succeeds
- **THEN** they verify malformed, unsupported-version, and invalid-shape imports fail without replacement

#### Scenario: Test reset and theme behavior
- **WHEN** settings tests run
- **THEN** they verify reset produces a valid empty database and default settings
- **THEN** they verify theme setting persistence

#### Scenario: Test Settings page rendering
- **WHEN** Settings page UI tests run with the current test utilities
- **THEN** they verify the Appearance, Local data backup, Import data, and Danger zone sections render
- **THEN** they verify confirmation and validation messaging behavior where supported

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

