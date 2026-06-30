## Context

TagsFlow AI already has the architecture this workflow should reuse: a provider-neutral `AIProvider` port with `summarizeProject`, `createAIProviderResolver`, Groq and mock provider implementations, structured-output helpers, Settings-backed AI configuration, Project Detail > AI Insights, project/task/subtask/member/tag query hooks, pure progress and deadline rules, and reusable safe feedback primitives.

The remaining gap is implementing a read-only project summary workflow. The workflow should turn one existing project's current local state into a concise AI-generated health summary, while keeping all source data and generated text transient. It must stay frontend-only, preserve `tagsflow_ai_db_v1`, preserve existing project/task/subtask/member/tag/settings/repository contracts, and avoid direct Groq or Local Storage access from Presentation components.

## Goals / Non-Goals

**Goals:**

- Add an AI Project Summary entry point to Project Detail > AI Insights for the currently viewed project.
- Reuse Settings AI configuration and provider resolution to decide whether summary generation can run.
- Build a deterministic, bounded summary request from the current project, derived progress, task/subtask/checklist summaries, blocked work, overdue work, upcoming deadlines, tags, and conservative member/assignee context.
- Support optional transient `Additional instructions` with `MAX_PROJECT_SUMMARY_INSTRUCTION_LENGTH = 1000`.
- Implement a strict project-summary response schema and safe parsing/validation path.
- Display summary results as read-only UI state with retry and clear/cancel behavior.
- Add focused tests for input building, instruction handling, provider validation, not-configured behavior, read-only behavior, and non-persistence boundaries.

**Non-Goals:**

- No AI Project Planner, AI Subtask Generator, AI Priority Suggestion, AI chat, or multi-turn conversation changes.
- No automatic project, task, subtask, priority, tag, member, Kanban, dashboard, settings, backup, or demo data mutation.
- No generated IDs, task/subtask proposal review, task insertion, priority application, tag creation, or member assignment from the summary result.
- No project, task, subtask, member, tag, settings, repository port, Local Storage database version, import/export, Settings redesign, dashboard, Kanban, backend proxy, authentication, or cloud sync changes.
- No persisted generated summaries, persisted prompts, persisted raw provider responses, or persisted additional instructions.

## Decisions

1. Implement AI Project Summary as a dedicated read-only workflow behind `AIProvider.summarizeProject`.

   The Domain AI DTOs should be narrowed from raw entity bags into provider-neutral summary request/result types that represent only bounded, summary-oriented context. Application code should call `summarizeProject` through provider resolution, and `GroqAIProvider` should implement the real structured request while `MockAIProvider` returns deterministic valid output.

   Alternative considered: reuse planner, subtask, or priority suggestion contracts. Those workflows produce proposal or mutation-oriented results, so reusing them would blur the summary contract and make it easier for AI output to imply data changes.

2. Keep request construction pure, deterministic, and outside Presentation.

   A project-summary input builder should live in Application or workflow-specific AI code. It should load source entities through existing query hooks/use cases, derive project progress through the approved domain progress rules, derive blocked/overdue/upcoming summaries through existing domain or dashboard helpers where practical, and apply named limits for all text and collection context. The builder should accept a reference date for testability.

   Alternative considered: build prompts directly in the AI Insights component. That would be harder to test, duplicate domain summaries in UI code, and risk bypassing deterministic limits.

3. Treat additional instructions as bounded single-turn context.

   The UI may show `Additional instructions` in the summary section. The builder trims whitespace, omits whitespace-only input, rejects generation when trimmed text exceeds `MAX_PROJECT_SUMMARY_INSTRUCTION_LENGTH = 1000`, and includes valid instructions only as context. Provider prompt guidance and validation must state that instructions cannot override the read-only summary output contract.

   Alternative considered: persist recent instructions or generated summaries for convenience. That would expand Local Storage and backup surfaces and conflict with the requested transient workflow.

4. Validate AI output before display and reject mutation-shaped payloads.

   Groq should be prompted for structured JSON and parsed with the shared structured-output helpers plus a project-summary Zod schema. The schema should allow only a concise summary paragraph, a health label such as `on_track`, `at_risk`, or `blocked`, key risks, blockers, recommended next steps, and optional notable completed work. Because the current task model does not provide completion timestamps, notable completed work must not claim recent completion timing unless the existing data model supports that information. If included, it may only summarize currently done tasks as completed work without implying when they were completed. Validation must reject malformed JSON, schema-invalid output, generated IDs, generated tasks/subtasks, project mutation instructions, member/tag creation payloads, and alternate formats before Presentation receives a result.

   Alternative considered: display raw provider text as a fallback. This is rejected because raw text can contain unsupported mutation instructions, secrets from prompt echoes, or an output format the UI cannot safely reason about.

5. Keep the UI read-only and local to AI Insights state.

   A generated summary should be shown in AI Insights with loading, not-configured, missing-context, provider error, validation error, retry, and clear/cancel states. Clearing a generated summary should remove only the current UI state. No repository mutation, query invalidation for business data, dashboard write, Kanban update, backup update, or Local Storage write should happen because a summary was generated. The summary workflow may update only its own transient UI/query state. It must not invalidate business-data queries such as projects, tasks, subtasks, tags, members, dashboard metrics, Project Kanban, or Global Kanban because no business data changed.

   Alternative considered: save the latest summary on the project. This would change persistence contracts and create stale derived AI data that must be exported/imported or migrated later.

6. Use safe non-secret error handling.

   Provider, validation, and application errors should be normalized before display. UI states and toasts must not expose full Groq API keys, authorization headers, raw prompts, raw provider errors, or raw provider responses.

   Alternative considered: expose raw prompt/response details for debugging. This is rejected because the app stores a user-provided key locally and the workflow handles local project data.

## Risks / Trade-offs

- [Risk] Groq may return malformed JSON or ignore summary-only guidance. -> Mitigation: use strict structured prompts, shared parsing helpers, Zod validation, and safe non-mutating error states.
- [Risk] Bounded context may omit details a user expected in the summary. -> Mitigation: include the strongest project-scoped signals first: project metadata, progress, status/priority counts, blockers, overdue/upcoming work, subtask/checklist summaries, tags, and member context within named limits.
- [Risk] Additional instructions could ask for tasks, assignments, tags, or project updates. -> Mitigation: keep instructions as context only and enforce the read-only output schema and prompt boundaries.
- [Risk] Generated summary can become stale immediately after local data changes. -> Mitigation: keep generated results transient and allow retry generation from current query data.
- [Risk] Duplicating dashboard summary logic could drift. -> Mitigation: reuse domain progress/deadline rules and dashboard helper patterns where practical, and test project summary input construction directly.

## Migration Plan

No data migration is required. The workflow reuses the existing AI provider port, existing local entities, existing query hooks, and the existing `tagsflow_ai_db_v1` Local Storage key.

Implementation can be introduced by adding project-summary DTOs and input builder code, implementing Groq and mock provider summary behavior, adding Application hooks/use cases, and rendering the AI Insights summary panel. Rollback is removal of the summary UI and provider implementation; persisted data remains compatible because no new persisted fields are introduced.
