## ADDED Requirements

### Requirement: AI settings persistence through local database
The local persistence layer MUST persist AI provider settings through the existing version-one local database settings shape.

#### Scenario: Persist AI provider settings
- **WHEN** AI provider settings are saved through `LocalStorageSettingsRepository`
- **THEN** Local Storage stores the updated settings under `tagsflow_ai_db_v1`
- **THEN** provider identity, API key, and selected model hydrate through the existing settings repository path

#### Scenario: Avoid separate AI secret storage key
- **WHEN** the MVP stores a user-provided Groq API key locally
- **THEN** the persistence layer does not create a separate Local Storage key for the key
- **THEN** reset, import, and backup behavior can reason over one versioned local database

#### Scenario: Avoid database version change when compatible
- **WHEN** current persisted settings already match the provider/model/key shape required by this change
- **THEN** the implementation keeps the existing Local Storage database version
- **THEN** existing valid local data continues to hydrate

### Requirement: Secret-safe AI backup export and import
The local backup persistence behavior MUST exclude secret-bearing AI settings from exports and MUST neutralize them during imports.

#### Scenario: Export sanitized AI settings
- **WHEN** backup export behavior serializes settings with a saved Groq API key
- **THEN** the exported settings include no secret API key value
- **THEN** the exported settings may include non-sensitive provider identity, selected model, and whether a key exists

#### Scenario: Import backup with API key field
- **WHEN** backup import validation receives otherwise valid backup JSON containing `settings.aiProvider.apiKey`
- **THEN** validation can succeed for supported backup compatibility
- **THEN** the validated replacement database has `settings.aiProvider.apiKey` set to `null`

#### Scenario: Import backup with future secret-bearing AI fields
- **WHEN** backup import validation receives future or extra secret-bearing AI provider fields in a supported settings object
- **THEN** those secret-bearing values are omitted or neutralized before replacement
- **THEN** no imported secret is persisted to Local Storage

### Requirement: AI persistence and backup test coverage
The system MUST include focused tests for AI settings persistence and backup sanitizer behavior.

#### Scenario: Test backup export excludes API key
- **WHEN** backup repository tests export a database containing a saved Groq API key
- **THEN** the exported JSON does not contain the full key
- **THEN** the exported settings do not expose an `apiKey` secret field

#### Scenario: Test backup import drops API key
- **WHEN** backup repository tests validate import JSON containing an AI provider API key
- **THEN** validation returns a replacement database with `apiKey` set to `null`
- **THEN** replacing local data does not persist the imported key

#### Scenario: Test settings repository AI fields
- **WHEN** settings repository tests save and hydrate AI provider settings
- **THEN** provider identity, selected model, and explicit key values are preserved in normal local settings persistence
- **THEN** backup export/import tests remain responsible for secret sanitization
