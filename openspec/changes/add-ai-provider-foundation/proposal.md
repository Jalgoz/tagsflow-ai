## Why

TagsFlow AI already has local-first project, task, Kanban, dashboard, settings, backup, onboarding, member, and tag workflows, but the AI features still lack an implemented provider foundation. This change adds the provider-neutral Groq setup, model handling, connection testing, secret-safe settings behavior, and structured response validation needed before AI planning, subtask generation, priority suggestions, or summaries are implemented.

## What Changes

- Activate the Settings AI provider section for provider selection, Groq API key entry, selected model management, configured/not configured state, connection testing, key clearing, and non-blocking success/error feedback.
- Persist provider, selected model, and Groq API key through the existing settings repository path while never displaying the full saved key after it is stored.
- Preserve local backup security by keeping API keys out of exports and preventing imports from restoring secret-bearing AI settings.
- Add provider-neutral application access to AI providers using the existing domain `AIProvider` port, a provider resolver/factory, a `GroqAIProvider`, and a `MockAIProvider`.
- Add Groq connection testing and model listing with safe minimal requests, clear failures, and no full API key exposure in UI, errors, logs, or test output.
- Add shared structured AI response helpers for safe JSON parsing, Zod validation, and typed success/failure results.
- Add focused tests for settings key behavior, backup sanitization/import behavior, provider resolution, mock provider behavior, testable Groq request construction, structured response helpers, and Settings UI rendering where current utilities support it.
- Do not implement AI Project Planner, AI Subtask Generator, AI Priority Suggestion, AI Project Summary, task/subtask generation, suggestion application, backend proxying, authentication, cloud sync, non-Groq real providers, AI chat, dashboard changes, Kanban changes, demo data changes, or import/export redesign.

## Capabilities

### New Capabilities
- `ai-provider-foundation`: Provider-neutral AI runtime foundation covering provider resolution, Groq and mock adapters, connection testing, model handling, and structured response validation helpers.

### Modified Capabilities
- `settings-local-backup`: Replace the disabled AI settings placeholder with functional AI provider settings while preserving local backup/import flows and secret handling.
- `local-storage-persistence`: Strengthen backup import/export requirements so secret-bearing AI settings are never exported or restored from backup JSON.
- `ui-feedback-patterns`: Extend Settings feedback integration to AI settings save, key clear, and connection-test outcomes.

## Impact

- Affects `src/domain/ai`, `src/domain/entities/settings.ts`, `src/application/settings`, a new or existing application AI provider access module, `src/infrastructure` AI provider adapters, local settings persistence schemas, backup sanitizer/import validation, and `src/presentation/pages/SettingsPage.tsx`.
- Uses the existing `tagsflow_ai_db_v1` Local Storage database key and should avoid a database version change unless implementation discovers an unavoidable schema incompatibility.
- Keeps Groq as the only real provider in this slice while preserving future adapter paths for OpenAI, Anthropic, and backend providers.
- UI remains frontend-only and uses user-provided local Groq credentials; no backend proxy, authentication, cloud sync, or server-side secret storage is introduced.
