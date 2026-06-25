# ai-provider-foundation Specification

## Purpose
TBD - created by archiving change add-ai-provider-foundation. Update Purpose after archive.
## Requirements
### Requirement: Provider-neutral AI provider resolution
The system MUST provide application-level AI provider access that resolves provider implementations from current settings without requiring UI components to construct provider adapters.

#### Scenario: Resolve configured Groq provider
- **WHEN** current settings select the Groq provider and include a non-empty API key
- **THEN** the application-level resolver returns a Groq-backed provider configured with the saved key and selected model
- **THEN** Presentation components do not instantiate `GroqAIProvider` directly

#### Scenario: Block real provider actions when key is missing
- **WHEN** current settings select the Groq provider without a saved or entered API key
- **THEN** the application-level AI behavior reports that the provider is not configured
- **THEN** no Groq request is sent with an empty, null, or placeholder key

#### Scenario: Use mock provider through explicit development or test wiring
- **WHEN** tests or development composition explicitly request a mock AI provider
- **THEN** the resolver can return `MockAIProvider`
- **THEN** persisted user settings are not rewritten to a mock provider value

### Requirement: Groq provider adapter
The system MUST implement a `GroqAIProvider` infrastructure adapter behind the provider-neutral `AIProvider` interface for MVP real-provider access.

#### Scenario: Test Groq connection
- **WHEN** the application tests a Groq connection with a configured API key
- **THEN** `GroqAIProvider` sends a safe minimal provider request suitable for validating the key where possible
- **THEN** the result reports success or failure without exposing the full API key

#### Scenario: Normalize Groq failures
- **WHEN** Groq returns an authentication, network, unavailable, malformed, or unsupported response during foundation operations
- **THEN** the provider returns or throws a clear normalized failure for application code
- **THEN** the failure message does not include the full API key, authorization header, or raw secret-bearing request data

#### Scenario: Test Groq request construction without real network
- **WHEN** Groq provider tests run
- **THEN** they can inject a fake request transport
- **THEN** request construction can be verified without contacting Groq or storing a real API key

### Requirement: Groq model handling
The system MUST support selected model persistence and Groq model discovery where the available provider API or client supports it.

#### Scenario: List Groq models
- **WHEN** a configured user requests available Groq models from Settings
- **THEN** the application attempts to list models through `GroqAIProvider`
- **THEN** returned models are represented as provider-neutral model metadata

#### Scenario: Continue when model listing fails
- **WHEN** Groq model listing fails or is unavailable
- **THEN** Settings shows a clear non-secret error state
- **THEN** the user can still manually enter or select a fallback model value

#### Scenario: Store selected model
- **WHEN** the user saves a selected Groq model
- **THEN** the selected model is persisted through the existing settings path
- **THEN** later AI provider resolution receives that selected model

#### Scenario: Avoid brittle model hardcoding
- **WHEN** Groq model availability changes after the app is built
- **THEN** the app does not require code changes merely to allow the user to enter or retain a supported model identifier

### Requirement: Mock AI provider
The system MUST provide a `MockAIProvider` implementation for development fallback and tests.

#### Scenario: Mock provider does not call network
- **WHEN** `MockAIProvider` lists models, tests connection, or returns deterministic AI DTOs for tests
- **THEN** it does not send network requests
- **THEN** it does not read from or write to Local Storage

#### Scenario: Mock provider returns domain-friendly DTOs
- **WHEN** tests call supported `MockAIProvider` methods
- **THEN** returned values conform to the provider-neutral domain DTO contracts
- **THEN** raw provider-specific response shapes are not exposed

### Requirement: Structured AI response validation helpers
The system MUST provide shared helpers for safe structured AI response parsing and Zod validation.

#### Scenario: Parse malformed JSON safely
- **WHEN** a structured AI response helper receives malformed JSON text
- **THEN** it returns a typed failure result
- **THEN** it does not throw an uncaught exception to application or presentation callers

#### Scenario: Validate parsed JSON with Zod
- **WHEN** a structured AI response helper receives parseable JSON that does not satisfy the provided Zod schema
- **THEN** it returns a typed validation failure result with safe error details
- **THEN** the invalid response is not transformed into a domain DTO

#### Scenario: Return validated data
- **WHEN** a structured AI response helper receives parseable JSON that satisfies the provided Zod schema
- **THEN** it returns a typed success result containing validated data
- **THEN** callers do not need to trust raw model output

### Requirement: AI provider foundation scope boundaries
The AI provider foundation MUST NOT create or mutate project, task, subtask, member, tag, Kanban, dashboard, demo data, or backup records from AI responses.

#### Scenario: Do not apply AI suggestions
- **WHEN** provider connection, model listing, or structured response helper behavior runs
- **THEN** no projects, tasks, subtasks, members, tags, Kanban cards, dashboard metrics, or demo data are created or updated from AI output

#### Scenario: Leave workflow-specific AI features out
- **WHEN** this change is implemented
- **THEN** AI Project Planner, AI Subtask Generator, AI Priority Suggestion, and AI Project Summary user workflows remain unimplemented
- **THEN** no workflow-specific prompt or response schema is required except minimal test fixtures needed to validate generic helpers

### Requirement: AI provider foundation test coverage
The system MUST include focused automated tests for the provider foundation where the current test stack supports them.

#### Scenario: Test provider resolution
- **WHEN** provider resolver tests run
- **THEN** they verify configured Groq settings resolve to a Groq provider
- **THEN** they verify missing key settings prevent real provider requests
- **THEN** they verify explicit test wiring can use `MockAIProvider`

#### Scenario: Test structured response helpers
- **WHEN** structured AI helper tests run
- **THEN** they cover valid JSON, malformed JSON, and schema-invalid JSON
- **THEN** they verify failures use the shared typed failure shape

#### Scenario: Test secret redaction
- **WHEN** provider foundation tests inspect errors, UI messages, or test output helpers
- **THEN** they verify full API key values are not included

