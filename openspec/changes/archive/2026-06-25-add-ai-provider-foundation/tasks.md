## 1. Settings and Persistence Guardrails

- [ ] 1.1 Review current `AppSettings`, settings schemas, defaults, and repository behavior to confirm provider/model/key fields can be reused without changing the Local Storage database version.
- [ ] 1.2 Add or update application settings use cases for saving AI provider settings, preserving an existing saved key when only non-secret fields change, clearing the saved key, and deriving configured/not configured state.
- [ ] 1.3 Add focused settings use-case or hook tests for API key save, selected model save, saved-key preservation, configured state, and API key clear behavior.
- [ ] 1.4 Extend local backup export tests to verify saved Groq API key values are excluded and no exported `apiKey` field contains a secret.
- [ ] 1.5 Extend local backup import tests to verify imported `settings.aiProvider.apiKey` values and future secret-bearing AI fields are neutralized before replacement.
- [ ] 1.6 Verify reset/import/export/theme/demo-data Settings behavior still uses the existing repository and backup paths after AI settings changes.

## 2. AI Provider Infrastructure

- [ ] 2.1 Create an infrastructure AI module for provider adapters, request transport injection, safe error normalization, and secret redaction helpers.
- [ ] 2.2 Use the existing browser `fetch` path or an injectable transport abstraction for Groq requests; do not add a Groq SDK dependency unless implementation proves the fetch path cannot satisfy connection testing and model listing.
- [ ] 2.3 Implement shared structured AI response helpers for safe JSON parsing, Zod validation, and typed success/failure results.
- [ ] 2.4 Add tests for structured response helpers covering valid JSON, malformed JSON, schema-invalid JSON, and safe validation error output.
- [ ] 2.5 Implement `MockAIProvider` with deterministic provider-neutral responses for development/tests and no network or Local Storage access.
- [ ] 2.6 Add `MockAIProvider` tests for model listing, connection testing, deterministic DTO shape, and absence of network calls.
- [ ] 2.7 Implement `GroqAIProvider` connection testing primarily through Groq model listing with `GET /openai/v1/models`, using injectable transport so tests do not call the real network.
- [ ] 2.8 Implement Groq model listing where supported by the chosen API/client path, returning provider-neutral model metadata.
- [ ] 2.9 Ensure Groq provider failures are normalized and redacted so full API keys, authorization headers, and raw secret-bearing request data are never exposed.
- [ ] 2.10 Add Groq provider tests for request construction, success handling, auth/network/failure handling, model listing behavior, and key redaction using fake transport.
- [ ] 2.11 Keep workflow-specific Groq methods out of user-facing flows in this slice; if interface methods must exist, make unapproved workflow behavior explicit, safe, and covered by tests.

## 3. Application AI Access

- [ ] 3.1 Add an application AI module that exposes provider resolver/factory types and keeps infrastructure provider classes out of Presentation imports.
- [ ] 3.2 Implement provider resolution from current settings so configured Groq settings resolve to `GroqAIProvider` and missing-key settings block real provider requests.
- [ ] 3.3 Add explicit test/development wiring support for `MockAIProvider` without persisting a mock provider value in user settings.
- [ ] 3.4 Add application use cases and hooks for AI configuration state, saving AI settings, clearing the API key, testing the connection, and listing models.
- [ ] 3.5 Wire the AI provider resolver into app composition following existing repository/provider patterns.
- [ ] 3.6 Add resolver, use-case, and hook tests for configured Groq, missing key, mock provider wiring, connection testing, model listing fallback, and query invalidation behavior.

## 4. Settings AI User Interface

- [ ] 4.1 Replace the disabled AI provider placeholder in `SettingsPage` with functional provider selection, configured/not configured state, API key input, selected model controls, connection test action, and key clear action.
- [ ] 4.2 Make the saved API key write-only after save: do not render the full saved key in inputs, labels, status text, errors, or test snapshots.
- [ ] 4.3 Save AI settings through application hooks and show a shared success toast after successful save.
- [ ] 4.4 Clear the saved API key through application hooks, update the configured state, and show a shared success toast.
- [ ] 4.5 Disable the connection test action when provider/key requirements are missing or a conflicting AI settings mutation is pending.
- [ ] 4.6 Run connection testing through application hooks and show shared success feedback on success plus visible non-secret failure feedback on failure.
- [ ] 4.7 Add model listing UI that uses detected Groq models when available and keeps manual model entry or fallback selection usable when listing fails.
- [ ] 4.8 Add simple static recommended model hints only if they improve Settings clarity without restricting manual model values.
- [ ] 4.9 Add Settings UI tests for functional AI section rendering, disabled test action without a key, save/clear interactions, connection feedback, and absence of full key exposure where current utilities support it.

## 5. Scope and Regression Verification

- [ ] 5.1 Verify no UI component directly reads/writes Local Storage or constructs/calls Groq provider adapters.
- [ ] 5.2 Verify backup import/export behavior remains compatible with existing local backup flows and does not redesign import/export UX.
- [ ] 5.3 Verify AI provider foundation work does not create or mutate projects, tasks, subtasks, members, tags, Kanban cards, dashboard metrics, or demo data from AI responses.
- [ ] 5.4 Verify AI Project Planner, AI Subtask Generator, AI Priority Suggestion, AI Project Summary, AI chat, backend proxying, authentication, cloud sync, and non-Groq real providers remain out of scope.
- [ ] 5.5 Run the relevant automated checks: typecheck/build, lint, tests, and any focused test files added for this change.
- [ ] 5.6 Review the final diff for secret exposure, unrelated file churn, dependency additions, and adherence to the approved OpenSpec scope before committing.
