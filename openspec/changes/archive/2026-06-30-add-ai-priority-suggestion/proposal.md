## Why

TagsFlow AI can already generate project-level task proposals and task-level subtask proposals, but users still have to decide task priority manually. Adding a focused AI Priority Suggestion workflow helps users evaluate urgency from existing project and task context while keeping final control with the user before any local data changes.

## What Changes

- Add a task-scoped, project-aware AI Priority Suggestion workflow for existing tasks.
- Let users run the workflow from a task-focused Project Detail surface where the selected task is clear.
- Require configured AI settings before generation and show a safe not-configured state with Settings navigation when AI is unavailable.
- Build bounded, deterministic provider input from the selected task, current project context, optional checklist/tag/assignee context, subtask progress, and conservative sibling-priority context.
- Add a transient `Additional instructions` input with `MAX_PRIORITY_INSTRUCTION_LENGTH = 800`; trim and omit empty instructions, block over-limit generation, and never persist instructions.
- Define a strict AI output contract containing only a supported suggested priority and a short rationale.
- Validate provider output with Zod and reject malformed JSON, schema-invalid output, unsupported priority values, generated IDs, generated task/subtask payloads, project mutation payloads, and member/tag creation payloads.
- Display a review-before-apply surface that shows current priority, suggested priority, rationale, and optional confidence before any mutation.
- Apply only the selected task priority after explicit user confirmation through existing task update behavior, show success toast feedback, and refresh affected task-derived views through existing query invalidation.
- Treat same-priority suggestions as a safe no-op with clear user feedback.
- Keep the slice task-only: no subtask priority suggestion, project summary, planner changes, subtask generator changes, AI chat, automatic application, generated work items, storage version changes, repository contract changes, Kanban behavior changes, dashboard changes, settings redesign, import/export redesign, backend proxy, authentication, or cloud sync.

## Capabilities

### New Capabilities
- `ai-priority-suggestion`: Suggest a priority for one existing task at a time using bounded project-aware context, strict AI validation, and explicit review-before-apply behavior.

### Modified Capabilities
- None.

## Impact

- Adds a new OpenSpec capability under `openspec/changes/add-ai-priority-suggestion/specs/ai-priority-suggestion/spec.md`.
- Future implementation will touch AI application orchestration, provider-neutral AI DTOs, Groq/Mock provider support for this workflow, task-focused Project Detail UI, and focused tests.
- Uses existing task update hooks/use cases, query invalidation, shared toast feedback, AI configuration gating, structured response helpers, and Local Storage persistence boundaries.
- Does not add dependencies, backend services, authentication, cloud sync, new persistence keys, or changes to project/task/subtask/member/tag repository contracts.
