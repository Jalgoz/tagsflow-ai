## Context

TagsFlow AI is already a frontend-only local app with strict modular boundaries, Local Storage repositories, settings persistence, backup import/export, reusable confirmation/toast feedback, and a domain `AIProvider` port. The current settings data shape already includes a Groq provider configuration with `apiKey` and `selectedModelId`, and backup export/import already contains sanitizer behavior that omits API keys and imports settings with `apiKey: null`.

The remaining gap is runtime AI provider infrastructure. Settings still renders AI provider setup as a disabled placeholder, and there is no visible infrastructure adapter, provider resolver, connection test flow, model listing flow, or structured AI response validation helper. This change activates the foundation only; workflow-specific AI features remain separate future changes.

Existing product boundaries still apply: this slice remains frontend-only, uses the existing `tagsflow_ai_db_v1` database key, keeps UI out of Local Storage and Groq calls, and leaves dashboard, Kanban, demo data, task generation, subtask generation, priority suggestions, and project summaries unchanged. Progress remains derived from domain rules and is not persisted.

## Goals / Non-Goals

**Goals:**
- Make Settings the user-facing place to configure the MVP AI provider, with Groq as the first real provider.
- Persist provider, selected model, and the Groq API key through the existing settings repository path.
- Never display the full saved API key after saving, and never expose it through backup JSON, import restoration, UI errors, logs, or tests.
- Add application-level AI provider access so UI components call hooks/use cases instead of constructing providers directly.
- Implement a provider resolver/factory that can create `GroqAIProvider` from current settings and can supply `MockAIProvider` for development and tests.
- Support Groq connection testing and model listing when available, while allowing manual model selection when model listing fails.
- Add shared safe JSON parsing and Zod validation helpers for future structured AI responses.
- Add focused tests around settings behavior, backup sanitizer behavior, provider resolution, mock provider behavior, Groq request construction, structured response helpers, and Settings UI behavior where the current test utilities support it.

**Non-Goals:**
- No AI Project Planner, AI Subtask Generator, AI Priority Suggestion, AI Project Summary, AI chat, or suggestion application.
- No task, subtask, project, member, tag, Kanban, dashboard, demo data, onboarding, or progress-rule behavior changes.
- No backend proxy, authentication, cloud sync, real multi-user collaboration, server-side secret storage, or non-Groq real provider implementation.
- No domain entity contract changes unless implementation discovers a strictly necessary compatibility issue.
- No Local Storage database version change unless implementation discovers an unavoidable schema incompatibility.
- No import/export redesign beyond preserving and strengthening existing secret sanitization.

## Decisions

### Keep the domain `AIProvider` port provider-neutral

The existing Domain layer already defines provider-neutral AI DTOs and the `AIProvider` interface. This change should not make Domain depend on Groq, `fetch`, React, TanStack Query, Local Storage, provider SDKs, or browser UI concerns. Infrastructure adapters implement the port; Application exposes orchestration and hooks; Presentation renders Settings controls and feedback.

Alternative considered: place Groq-specific request logic in Settings components because Settings is the only initial user-facing AI surface. This is rejected because it would violate the existing Ports and Adapters boundary and make later AI workflows harder to test and replace.

### Resolve providers through Application composition

Application should own a small AI provider access module, such as an AI provider context plus use cases/hooks for `getAIConfigurationState`, `saveAIConfiguration`, `clearAIKey`, `testAIConnection`, and `listAIModels`. The resolver/factory should receive current settings and construct the appropriate provider implementation without letting Presentation import infrastructure classes.

For the MVP, user settings only select `groq`. Test and development callers can explicitly inject `MockAIProvider` or a mock resolver through providers/test setup. Future providers can be added behind the same resolver without changing Settings UI orchestration or workflow use cases.

Alternative considered: store a provider instance in persisted settings. This is rejected because settings must remain JSON-serializable local data and must not contain runtime objects, functions, or provider-specific implementation details.

### Store the Groq key in the existing settings path

The Groq API key should persist in `AppSettings.aiProvider.apiKey` through `SettingsRepository` and the existing `tagsflow_ai_db_v1` database key. Adding a separate Local Storage key would conflict with the approved single versioned business database strategy and would make backup/reset/import behavior harder to reason about.

The UI should treat a saved key as write-only after save. It may show a configured state such as "API key saved" or a short masked indicator, but it must not render the full saved value. Clearing the key should set it to `null` through the same repository path.

Alternative considered: keep the API key only in React state and require re-entry on every reload. This is rejected because the approved MVP includes a user-provided Groq API key stored locally.

### Preserve backup security at import and export boundaries

Backup export should continue returning non-sensitive settings only: provider identity, selected model metadata, and whether a key exists are acceptable; the actual key value is not. Backup import should accept supported settings shape for compatibility but must sanitize secret-bearing fields before replacement, so imported backups cannot restore `apiKey` or future provider secrets.

This requirement belongs at the local persistence/backup boundary and is mirrored in Settings requirements because users experience import/export from Settings. Keeping the sanitizer in infrastructure/application code avoids relying on UI filtering for security.

Alternative considered: reject any backup containing an `apiKey` field. This is safer but less user-friendly for backups produced by older or hand-edited versions. Sanitizing to `null` preserves import compatibility while preventing secret restoration.

### Use safe, minimal Groq operations

`GroqAIProvider` should support connection testing with the least invasive provider request available in the selected implementation path. Model listing should use the provider-supported model listing mechanism when available. If model listing fails or is unavailable, the app should keep manual model selection usable and show a clear non-secret error state.

The provider should accept an injectable request function or transport abstraction so tests can validate request construction without real network calls. Errors returned to UI should be normalized and redacted; raw provider responses should not be dumped into UI, logs, or test snapshots when they may include request details.

Alternative considered: adding a Groq SDK dependency immediately. This is not required unless implementation shows that the existing `fetch` path is insufficient. Avoiding a dependency keeps the foundation smaller and easier to test.

For this slice, the preferred connection test should use Groq model listing through `GET /openai/v1/models` because it is a minimal non-generative request and also supports the model-listing UI. If the request succeeds, the provider can report both connection success and available model metadata. If it fails, the app should keep manual model entry available and show a redacted error.

### Separate connection/model foundation from AI workflows

This slice should not add prompts, workflow-specific Zod schemas, task creation, subtask creation, priority application, or summary rendering. If the current `AIProvider` interface requires workflow methods on concrete classes, the implementation may provide deterministic mock outputs for tests and explicit unsupported behavior for unapproved Groq workflow methods until future workflow changes add schemas and prompts.

Alternative considered: implement planner/subtask/priority/summary methods now because the domain port already names them. This is rejected because the request explicitly excludes those AI workflows and asks for no workflow-specific schemas yet.

### Add structured AI response helpers now

Future workflow providers need a shared way to parse JSON safely and validate it with Zod before returning domain-friendly DTOs. The helper should expose a typed success/failure result, avoid throwing for malformed model output, and avoid mutating business data. It can live in infrastructure AI utilities or a shared application/infrastructure boundary module, but not in Presentation.

Alternative considered: parse and validate inside each future AI workflow. This is rejected because it would duplicate trust-boundary logic and increase the chance that raw model output reaches application code.

## Risks / Trade-offs

- [Risk] Storing a user-provided API key in browser Local Storage is less secure than server-side secret storage. -> Mitigation: be explicit that this is MVP local-only behavior, never export/import the key, never display the full saved key, and avoid logging it.
- [Risk] Groq model listing or connection endpoints can change. -> Mitigation: isolate provider-specific requests in `GroqAIProvider`, normalize failures, and keep manual model selection available.
- [Risk] Settings could accidentally preserve a stale key when saving other AI fields. -> Mitigation: design save/clear use cases that intentionally merge settings and add tests for key save, key preservation, and key clearing.
- [Risk] Provider resolution may leak infrastructure imports into Presentation. -> Mitigation: expose Application hooks/use cases and test Settings UI imports/behavior through current patterns.
- [Risk] Structured response helpers could grow into workflow-specific parsing. -> Mitigation: keep this slice to generic parsing/validation helpers and leave planner/subtask/priority/summary schemas for future approved changes.

## Migration Plan

1. Extend or reuse current settings types and schemas without changing `tagsflow_ai_db_v1` unless tests reveal current persisted data cannot hydrate safely.
2. Add AI provider infrastructure modules and application hooks/use cases behind existing provider composition patterns.
3. Replace the Settings AI placeholder with functional controls while preserving existing appearance, backup, import, reset, and demo-data settings flows.
4. Add and run focused tests first around secret handling, provider resolution, and structured validation, then broaden UI tests where existing utilities support provider setup.
5. Rollback is straightforward during the MVP: restore the disabled Settings placeholder and remove the AI provider application/infrastructure modules. Persisted provider/model/key settings can remain compatible with the existing settings shape.

## Resolved Follow-up Decisions

- `MockAIProvider` may be available through explicit test/development composition only. It must not be persisted in user settings and must not appear as a normal user-selectable provider in production Settings UI.
- Recommended Groq model hints should be omitted in this slice. Settings should prefer model listing from Groq when available and preserve manual model entry/fallback when listing fails.
