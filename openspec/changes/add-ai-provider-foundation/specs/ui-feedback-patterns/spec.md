## ADDED Requirements

### Requirement: Settings AI feedback integration
The Settings module MUST reuse shared feedback primitives for AI settings save, key clearing, and connection testing.

#### Scenario: Show AI settings save success toast
- **WHEN** AI provider settings are saved successfully
- **THEN** the Settings module shows success feedback through the shared toast pattern
- **THEN** the success feedback does not block the current workflow

#### Scenario: Show API key clear success toast
- **WHEN** the saved Groq API key is cleared successfully
- **THEN** the Settings module shows success feedback through the shared toast pattern
- **THEN** the success feedback does not reveal the cleared key

#### Scenario: Show connection test success toast
- **WHEN** a Groq connection test succeeds
- **THEN** the Settings module shows success feedback through the shared toast pattern
- **THEN** previous connection error state is cleared where present

#### Scenario: Show connection test failure feedback
- **WHEN** a Groq connection test fails
- **THEN** the Settings module shows a clear visible error state or error toast
- **THEN** the feedback does not include the full API key, authorization header, or raw secret-bearing request data

#### Scenario: Disable unavailable AI actions
- **WHEN** required provider configuration is missing or an AI settings mutation is pending
- **THEN** unavailable AI actions are disabled or show a clear pending state
- **THEN** duplicate provider requests are not sent from repeated clicks

### Requirement: Settings AI feedback test coverage
The system MUST include focused tests for AI settings feedback behavior where current UI test utilities support it.

#### Scenario: Test AI settings feedback
- **WHEN** Settings page UI tests exercise AI settings save, key clear, or connection test behavior
- **THEN** they verify the shared toast pattern is used for successful actions
- **THEN** they verify failed connection feedback is visible without exposing the full key

#### Scenario: Test disabled connection action
- **WHEN** Settings page UI tests render AI settings without a saved or entered API key
- **THEN** they verify the connection test action is disabled
- **THEN** they verify no connection test mutation is sent
