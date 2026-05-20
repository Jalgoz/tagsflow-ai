## ADDED Requirements

### Requirement: Theme setting
The system MUST allow users to choose light or dark theme from settings.

#### Scenario: Change theme
- **WHEN** a user changes the theme setting
- **THEN** the app applies the selected theme
- **THEN** the setting persists locally

### Requirement: Groq configuration
The system MUST allow users to store a Groq API key locally, test the connection, view detected Groq models, view recommended models, select a model, delete the API key, and see whether AI is configured.

#### Scenario: Configure Groq
- **WHEN** a user saves a Groq API key and selected model
- **THEN** the system persists the configuration locally
- **THEN** the settings UI indicates that AI is configured

### Requirement: JSON backup export
The system MUST allow users to export local data as JSON. Exported backups MUST NOT include the Groq API key.

#### Scenario: Export backup
- **WHEN** a user exports local data
- **THEN** the downloaded JSON includes business data
- **THEN** the downloaded JSON excludes the Groq API key

### Requirement: JSON backup import
The system MUST allow users to import local data from JSON only after validating the imported structure.

#### Scenario: Reject invalid import
- **WHEN** a user imports JSON that does not match the expected schema
- **THEN** the system rejects the import
- **THEN** existing local data remains unchanged

### Requirement: First launch demo data
The system MUST allow users to start empty or load demo data on first launch. Demo data MUST behave like normal editable and deletable local data.

#### Scenario: Load editable demo data
- **WHEN** a user chooses to load demo data
- **THEN** the system stores demo entities locally
- **THEN** the user can edit or delete those entities through normal app flows
