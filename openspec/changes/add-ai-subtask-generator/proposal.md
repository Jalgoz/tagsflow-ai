## Why

TagsFlow AI can already generate reviewable top-level task proposals for a project, but users still need to manually break an existing task into actionable subtasks. Adding an AI Subtask Generator is the next focused AI workflow because it builds on the approved provider foundation, existing task/subtask model, and review-before-insert pattern without expanding MVP storage or collaboration scope.

## What Changes

- Add an AI Subtask Generator workflow for one selected existing parent task at a time from an existing task-focused surface such as Project Detail > Tasks or a task detail/edit surface.
- Require configured AI provider settings before generation and show a clear not-configured state with Settings navigation when AI is unavailable.
- Add an optional `Additional instructions` input for a single generation attempt, trim it before use, enforce `MAX_SUBTASK_INSTRUCTION_LENGTH = 1200`, and keep it only in transient UI state.
- Build provider-neutral subtask generation input from current project context, parent task context, existing subtasks for duplicate avoidance, and conservative existing tag/member context.
- Define and validate a strict AI output contract for subtask proposals only, rejecting malformed JSON, schema-invalid output, nested subtasks, unsupported priority/status values, invalid dates, and generated IDs.
- Show generated subtask proposals in a review panel before insertion, allowing selection and practical edits before the user explicitly confirms insertion.
- Insert selected proposals as normal subtasks through existing subtask creation hooks/use cases and refresh affected views through existing query invalidation.
- Add focused tests for input construction, instruction handling, response validation, review behavior, insertion behavior, not-configured AI state, mock provider behavior, and non-persistence of instructions.
- Keep out of scope: AI Project Planner changes, AI Priority Suggestion, AI Project Summary, AI chat, multi-turn history, automatic insertion, top-level task generation, nested subtasks, automatic member assignment, tag creation, domain/repository/storage version changes, dashboard/Kanban behavior changes, settings/import/export redesign, demo data changes, backend proxy, authentication, and cloud sync.

## Capabilities

### New Capabilities
- `ai-subtask-generator`: Defines the AI workflow for generating reviewable subtask proposals for a selected parent task, including optional single-turn instructions, provider-neutral request construction, strict response validation, review-before-insert, confirmed insertion, safety boundaries, and tests.

### Modified Capabilities
- None.

## Impact

- Affected areas: Domain AI DTOs, Application AI request builders/hooks/draft helpers, Infrastructure AI provider parsing/prompt construction for Groq and mock providers, task-focused Presentation surfaces, subtask creation hooks/use cases, and tests.
- No new runtime dependencies are expected.
- No repository port changes, Local Storage database key/version changes, backup format changes, real backend, authentication, cloud sync, or multi-user collaboration are introduced.
- Future provider migration remains behind the provider-neutral AI provider interface; alternative providers can implement the same subtask generation contract later.
