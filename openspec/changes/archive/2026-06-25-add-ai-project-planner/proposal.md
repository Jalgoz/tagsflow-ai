## Why

TagsFlow AI now has the provider-neutral AI foundation needed to run real Groq-backed workflows safely, but users still have no AI-assisted way to turn an existing project into actionable tasks. The first user-facing AI workflow should generate draft top-level task proposals from project context while keeping the user in control before anything is saved.

## What Changes

- Add an AI Project Planner workflow for existing projects from Project Detail, preferably in the existing AI Insights tab or a focused AI planning section.
- Use the selected provider and model from the AI provider foundation, and show a clear not-configured state with navigation to Settings when AI is unavailable.
- Build planner input from the current project, including title, description, objective, scope fields, dates, and a concise existing-task summary where useful.
- Define and validate a strict structured response contract for proposed top-level tasks only.
- Show generated proposals in a review surface where users can select proposals, make practical edits, cancel, retry, or explicitly confirm insertion.
- Insert selected proposals as normal project tasks through existing task creation behavior only after confirmation.
- Refresh existing task, Kanban, global task, global Kanban, and dashboard views through existing query invalidation after insertion.
- Add focused tests for prompt/input building, response validation, malformed/schema-invalid output handling, review selection, insertion behavior, not-configured state, no-insert-before-confirmation behavior, and MockAIProvider happy path.

Explicitly excluded:
- AI Subtask Generator, AI Priority Suggestion, AI Project Summary, and global AI chat.
- Applying AI output directly without review.
- Generating subtasks, assigning members automatically, or creating tags automatically.
- Changing task, subtask, project, AI provider, repository, or Local Storage database contracts.
- Changing AI provider foundation behavior beyond using it.
- Backend proxy, authentication, cloud sync, Kanban behavior changes, dashboard behavior changes, Settings redesign, import/export redesign, and demo data changes.

## Capabilities

### New Capabilities

- `ai-project-planner`: Generates, validates, reviews, edits, and explicitly inserts AI-proposed top-level tasks for an existing project.

### Modified Capabilities

- None.

## Impact

- Affected application code: AI workflow use cases/hooks, project-scoped task creation orchestration, query invalidation, and project detail AI Insights UI.
- Affected domain/infrastructure code: planner-specific prompt/input builder, strict Zod response schema, provider call mapping, and MockAIProvider support for this workflow.
- Affected tests: schema/parser tests, planner use case tests, Project Detail AI planner UI tests where supported, and task insertion/invalidation tests.
- No new dependency is expected; Zod, TanStack Query, React, and the existing AI provider foundation should be reused.
