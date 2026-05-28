## ADDED Requirements

### Requirement: Sanitized backup export
The local persistence layer MUST provide backup export behavior that serializes supported local data and sanitizes sensitive settings before the backup is downloaded.

#### Scenario: Generate backup data
- **WHEN** backup export behavior reads the current local database
- **THEN** it returns JSON-serializable data containing the supported database version
- **THEN** it includes projects, tasks, subtasks, members, tags, and settings
- **THEN** it does not include derived metrics such as project progress, task progress, dashboard metrics, overdue flags, or chart values

#### Scenario: Sanitize secret settings
- **WHEN** backup export behavior serializes settings
- **THEN** it omits or neutralizes Groq API key values
- **THEN** it omits or neutralizes future secret-bearing provider fields
- **THEN** it may include non-sensitive settings such as theme, provider identity, selected model metadata, and whether an API key exists

### Requirement: Strict backup import validation
The local persistence layer MUST validate imported backup data strictly before any replacement is allowed.

#### Scenario: Validate supported backup
- **WHEN** backup import behavior receives valid JSON matching the supported version-one local database shape
- **THEN** it returns a successful validation result with the parsed database
- **THEN** it does not mutate the current Local Storage database during validation

#### Scenario: Reject malformed backup JSON
- **WHEN** backup import behavior receives malformed JSON
- **THEN** it returns a failed validation result
- **THEN** it does not replace or recover the current Local Storage database as part of import validation

#### Scenario: Reject unsupported backup version
- **WHEN** backup import behavior receives parsed JSON with an unsupported database version
- **THEN** it returns a failed validation result
- **THEN** it does not replace the current Local Storage database

#### Scenario: Reject invalid backup shape
- **WHEN** backup import behavior receives parsed JSON that fails the supported local database schema
- **THEN** it returns a failed validation result
- **THEN** it reports enough error detail for the Settings page to show a clear validation message
- **THEN** it does not replace the current Local Storage database

### Requirement: Local database replacement and reset
The local persistence layer MUST support replacing the current local database with a validated backup and resetting it to a valid empty database.

#### Scenario: Replace local database
- **WHEN** application behavior submits a validated local database for replacement
- **THEN** the local persistence layer saves the complete database under `tagsflow_ai_db_v1`
- **THEN** later repository reads hydrate from the replaced database

#### Scenario: Reset local database
- **WHEN** application behavior requests a local data reset
- **THEN** the local persistence layer saves a valid empty database with default settings
- **THEN** later repository reads return empty projects, tasks, subtasks, members, and tags with default settings
