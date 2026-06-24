## MODIFIED Requirements

### Requirement: Functional Settings page
The system MUST render a functional `/settings` page for appearance preferences, AI provider configuration, and local data management.

#### Scenario: User opens settings
- **WHEN** a user opens `/settings`
- **THEN** the app renders a Settings page inside the existing app shell
- **THEN** the page includes sections for Appearance, AI provider settings, Local data backup, Import data, Demo workspace data, and Danger zone
- **THEN** the page no longer presents Settings as a future placeholder

#### Scenario: AI settings are functional
- **WHEN** the Settings page includes an AI settings section
- **THEN** the section allows provider selection, Groq API key management, selected model management, configured/not configured state, model handling, and connection testing through application-level behavior
- **THEN** the section does not run AI project planning, subtask generation, priority suggestion, project summary, AI chat, or data mutation workflows

## ADDED Requirements

### Requirement: AI provider settings management
The Settings module MUST allow users to configure the MVP AI provider using the existing settings persistence path.

#### Scenario: Show current AI configuration
- **WHEN** the Settings page loads
- **THEN** it reads AI provider settings through application settings behavior
- **THEN** it shows Groq as the available real provider for the MVP
- **THEN** it shows whether AI is configured based on the presence of a saved non-empty API key

#### Scenario: Save Groq API key
- **WHEN** a user enters a Groq API key and saves AI settings
- **THEN** the system persists the key through `SettingsRepository`
- **THEN** the full saved key is not rendered back into the API key input or elsewhere in the UI after save
- **THEN** a non-blocking success toast is shown

#### Scenario: Preserve saved key when changing non-secret AI fields
- **WHEN** a user changes the selected model without entering a replacement API key
- **THEN** the existing saved API key remains stored unless the user explicitly clears it
- **THEN** the selected model change is saved through the existing settings path

#### Scenario: Clear Groq API key
- **WHEN** a user activates the clear API key action
- **THEN** the system removes the saved API key by persisting `null` through `SettingsRepository`
- **THEN** the UI updates to a not configured state
- **THEN** a non-blocking success toast is shown

#### Scenario: Avoid full key exposure
- **WHEN** Settings displays saved AI provider state, connection errors, validation messages, or test output
- **THEN** the full saved Groq API key is not displayed
- **THEN** authorization header values and raw secret-bearing request data are not displayed

### Requirement: AI connection testing in Settings
The Settings module MUST allow users to test the configured Groq connection when provider requirements are present.

#### Scenario: Disable test action without required configuration
- **WHEN** Groq is selected and no saved or entered API key is available
- **THEN** the connection test action is disabled
- **THEN** no Groq connection request is sent

#### Scenario: Successful connection test
- **WHEN** a user tests a configured Groq connection and the provider reports success
- **THEN** Settings shows a success toast
- **THEN** any previous connection error state is cleared

#### Scenario: Failed connection test
- **WHEN** a user tests a configured Groq connection and the provider reports failure
- **THEN** Settings shows a clear visible error state or error toast
- **THEN** the error does not include the full API key or raw secret-bearing request data

### Requirement: AI model selection in Settings
The Settings module MUST allow users to manage the selected Groq model without relying exclusively on hardcoded model availability.

#### Scenario: Display selected model
- **WHEN** Settings loads with a saved selected model
- **THEN** the AI settings section displays that model value as the current selection

#### Scenario: Save selected model
- **WHEN** a user selects or manually enters a model value and saves AI settings
- **THEN** the selected model is persisted through `SettingsRepository`
- **THEN** the selected model remains available after reload

#### Scenario: Model listing fallback
- **WHEN** model listing succeeds
- **THEN** Settings can present detected Groq models as provider-neutral options
- **WHEN** model listing fails or is unsupported
- **THEN** Settings still allows manual fallback model selection

#### Scenario: Recommended model hints
- **WHEN** the AI settings section shows recommended model hints
- **THEN** the hints are simple static guidance
- **THEN** the hints do not prevent users from entering a different model supported by their Groq account

### Requirement: AI settings backup security
Settings import/export behavior MUST preserve secret-safe AI configuration handling.

#### Scenario: Export excludes Groq API key
- **WHEN** a user exports local data while a Groq API key is stored locally
- **THEN** the exported JSON does not include the Groq API key value
- **THEN** the exported JSON does not include an `apiKey` field containing a secret

#### Scenario: Import does not restore Groq API key
- **WHEN** a user imports backup JSON that contains an AI provider `apiKey` value
- **THEN** the imported local settings store `apiKey` as `null`
- **THEN** the UI shows AI as not configured until the user enters a key again

#### Scenario: Preserve non-secret AI settings on import
- **WHEN** a valid backup contains non-sensitive AI settings such as provider identity or selected model
- **THEN** supported non-sensitive AI settings can be imported
- **THEN** secret-bearing AI settings are still omitted or neutralized

### Requirement: Settings AI architecture boundaries
The Settings module MUST preserve the modular frontend architecture for AI configuration.

#### Scenario: Settings UI avoids direct Groq access
- **WHEN** Settings renders AI provider controls, saves AI settings, clears the key, lists models, or tests a connection
- **THEN** Settings UI components call application-level hooks or use cases
- **THEN** Settings UI components do not construct `GroqAIProvider`, call Groq directly, or access Local Storage directly

#### Scenario: AI provider concerns stay out of backup UI logic
- **WHEN** backup export or import runs from Settings
- **THEN** Settings delegates sanitization and validation to application or infrastructure behavior
- **THEN** Settings does not manually remove secrets from raw backup data in presentation code

### Requirement: Settings AI test coverage
The system MUST include focused tests for AI settings behavior where the current test utilities support them.

#### Scenario: Test API key save and clear behavior
- **WHEN** AI settings tests run
- **THEN** they verify saving a key persists it through settings behavior
- **THEN** they verify clearing a key persists `null`
- **THEN** they verify the full saved key is not rendered after save

#### Scenario: Test Settings AI rendering
- **WHEN** Settings page UI tests run with the current providers and utilities
- **THEN** they verify the AI settings section renders as functional controls instead of a disabled placeholder
- **THEN** they verify the connection test action is disabled when provider requirements are missing
