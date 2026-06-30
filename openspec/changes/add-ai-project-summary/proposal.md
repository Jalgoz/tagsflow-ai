## Why

TagsFlow AI can already use AI to generate project plans, subtasks, and task priority suggestions, but users still need a project-scoped way to understand current project health from existing local data. Adding a read-only AI Project Summary workflow helps users review progress, risks, blockers, and next steps without allowing AI output to mutate projects, tasks, subtasks, tags, members, settings, dashboard data, Kanban configuration, or Local Storage.

## What Changes

- Add an AI Project Summary workflow in Project Detail > AI Insights for one existing project at a time.
- Require configured AI settings before summary generation, with a clear not-configured state and Settings navigation when AI is unavailable.
- Build bounded project-summary input from the current project, derived progress, project-scoped task/subtask/checklist context, blocked and deadline summaries, tag context, and conservative member/assignee context.
- Add optional transient `Additional instructions` input with `MAX_PROJECT_SUMMARY_INSTRUCTION_LENGTH = 1000`; trim non-empty input, omit empty input, block over-limit generation, and never persist instructions.
- Define named deterministic limits for project text, task text, task counts, subtask counts, checklist counts, tag counts, and member counts so provider context is stable and never unbounded.
- Define a strict structured AI output contract containing a concise summary paragraph, validated project health label, key risks, blockers, recommended next steps, and optional notable completed work where supported by existing data.
- Parse and validate provider output with Zod and shared structured AI response helpers before displaying it.
- Reject malformed JSON, schema-invalid output, generated IDs, generated task/subtask payloads, project mutation payloads, member/tag creation payloads, and alternate output shapes that violate the read-only summary contract.
- Display the generated summary, health label, risks, blockers, recommended next steps, and optional notable completed work in AI Insights, with retry and clear/cancel behavior for current UI state only.
- Add loading, retry, disabled, missing-context, provider failure, and validation failure states that do not expose API keys, raw prompts, raw provider errors, or raw provider responses.
- Add focused tests for input construction, deterministic limits, progress/deadline/blocker summaries, instruction handling, response validation, read-only UI behavior, not-configured state, MockAIProvider happy path, and persistence boundaries.

Explicitly excluded:
- AI Project Planner, AI Subtask Generator, AI Priority Suggestion, AI chat, and multi-turn conversation changes.
- Automatic task creation, subtask creation, priority application, project mutation, tag creation, member assignment, or any mutation from generated summary output.
- Project, task, subtask, member, tag, settings, repository port, AI provider foundation, Local Storage database version, dashboard, Kanban, Settings redesign, import/export redesign, demo data, backend proxy, authentication, or cloud sync changes.

## Capabilities

### New Capabilities

- `ai-project-summary`: Generates, validates, and displays read-only AI project summaries for an existing project from bounded local project context.

### Modified Capabilities

- None.

## Impact

- Affected application code: project-scoped AI summary use case/hooks, AI provider resolution usage, project-summary input builder, and Project Detail AI Insights UI.
- Affected domain/infrastructure code: provider-neutral project summary DTOs, strict Zod response schema, Groq summary request/response mapping, safe error normalization, and MockAIProvider support for this workflow.
- Affected tests: input builder tests, response parser/schema tests, provider request tests, application workflow tests, AI Insights UI tests where supported, and persistence/backup boundary tests.
- No new dependency is expected; the change should reuse React, TypeScript, TanStack Query, Zod, existing structured AI helpers, existing repository/query hooks, and existing feedback patterns.
