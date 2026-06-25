## Context

TagsFlow AI already has the pieces this workflow should build on: a provider-neutral `AIProvider` port, `createAIProviderResolver`, Groq and mock provider implementations, structured-output helpers, Settings-based AI configuration, project/task application hooks, reusable toast and confirmation primitives, and Project Detail tabs including AI Insights.

The remaining gap is the first real AI workflow. Project planning should use the selected provider/model to generate draft top-level tasks for an existing project, validate the AI response strictly, let the user review and edit proposals, and insert only selected proposals as normal local tasks after explicit confirmation.

This change must stay frontend-only, preserve `tagsflow_ai_db_v1`, preserve task/project/subtask/repository contracts, and avoid any direct Groq or Local Storage access from Presentation components.

## Goals / Non-Goals

**Goals:**

- Add an AI Project Planner entry point from Project Detail, preferably in AI Insights.
- Reuse Settings AI configuration and provider resolution to decide whether planning can run.
- Build planner input from the current project plus helpful existing-task, member, and tag context.
- Implement a strict planner response schema and safe parsing/validation path.
- Generate proposed top-level tasks only, with no subtasks or trusted model-generated IDs.
- Let users select, edit, cancel, retry, and explicitly confirm before inserting proposals.
- Insert selected proposals through existing task creation use cases/hooks so created tasks are normal local tasks.
- Refresh existing task, Kanban, global task, global Kanban, and dashboard views through existing query invalidation.
- Add focused tests for input building, schema validation, malformed output, review behavior, insertion behavior, not-configured behavior, and MockAIProvider.

**Non-Goals:**

- No AI Subtask Generator, AI Priority Suggestion, AI Project Summary, or global AI chat.
- No automatic insertion of AI output.
- No generated subtasks, automatic member assignment, or automatic tag creation.
- No task, subtask, project, repository, Local Storage database version, import/export, settings redesign, Kanban behavior, dashboard behavior, demo data, backend proxy, authentication, or cloud sync changes.
- No exposure of API keys in UI, errors, logs, or test snapshots.

## Decisions

### Reuse the existing AI provider seam for project planning

The workflow should call `AIProvider.generateProjectPlan` through Application-layer orchestration. `GroqAIProvider` should replace its current unsupported planner behavior with a real planner request, while `MockAIProvider` should continue returning deterministic planner output for development and tests.

If the current project-plan DTO cannot represent required review fields such as status or existing-tag suggestions, the planner DTO may be extended narrowly for this workflow. That is an AI workflow contract adjustment, not a task/project/repository contract change. Presentation must still receive domain-friendly proposals rather than raw Groq response shapes.

Alternative considered: call Groq directly from the AI Insights tab. This is rejected because it bypasses the provider-neutral AI foundation and makes later provider replacement harder.

Selected proposals must be inserted sequentially through the existing task creation path. If only some insertions succeed, successful proposals must be marked as inserted and excluded from retries, while failed proposals remain reviewable. The UI must report the partial result clearly and must never recreate tasks that already succeeded.

### Keep prompt/input building in Application or workflow-specific AI code

Planner input should be assembled from existing query-backed project data: project title, description, objective, scope fields, dates, and a concise summary of existing tasks. Existing members and tags may be passed as context, but the model must not be required to assign members or create tags.

The input builder should be a pure, testable function so prompt content and context trimming can be verified without rendering UI or calling a provider. Presentation should trigger the workflow and display state; it should not hand-build provider prompts.

Alternative considered: embed prompt strings directly in the component. This is rejected because it is difficult to test and risks duplicating business context rules in UI code.

The input builder must apply deterministic limits to project text and existing-task context through documented constants for maximum field length and maximum task count. It must not send unbounded task, checklist, or subtask data to the provider.

### Validate the raw provider response before creating review drafts

Groq output should be requested as structured JSON and parsed with the shared structured-output helpers plus a planner-specific Zod schema. Validation should reject malformed JSON, schema-invalid output, unsupported priorities/statuses, invalid dates, unknown tag suggestions where tag matching is enforced, subtasks, generated IDs, and any shape that cannot be safely reviewed.

The validated provider response should be transformed into planner review drafts. Drafts may receive local temporary UI IDs for selection/editing, but those IDs must not come from or be trusted from the model.

Alternative considered: accept partial model output and silently drop invalid fields. This is rejected for the trust boundary; invalid AI output must not be inserted into local data.

### Make review-before-insert the core UX boundary

Generation and insertion are separate user actions. A successful provider response opens a review panel with selected-by-default or clearly selectable task proposals, basic editing where practical, cancel/close behavior that sends no mutation, and retry generation.

Insertion must require an explicit confirmation action after review. It should create only selected valid proposals, scoped to the current project, through existing task creation behavior. If no proposal is selected or edited proposal validation fails, no insertion mutation is sent.

Alternative considered: immediately insert generated tasks and let users clean them up. This is rejected because the change explicitly keeps users in control before local data is mutated.

### Reuse existing task creation and query invalidation

Inserted proposals should flow through the same Application-layer task creation path used by Project Detail task creation. Tasks created by the planner become normal editable, deletable, exportable local tasks.

The workflow should rely on existing task mutation invalidation where possible. If batch insertion is added for ergonomics, its invalidation must still refresh project task lists, task details as applicable, project detail, global tasks, global Kanban, Project Kanban, and dashboard metrics through existing query keys or the existing broad invalidation pattern.

Alternative considered: write tasks directly to Local Storage for batch creation. This is rejected because it violates repository and application boundaries.

### Keep tag and member behavior conservative

The model may receive current tag names and member names as context. It may suggest tags by existing tag name only if practical. The workflow must map accepted tag names to existing tag IDs before task creation and must not create new tags. Member assignment remains user-controlled and out of scope for generated output.

Alternative considered: let the model create tags and assign members. This is rejected because the request explicitly excludes automatic tag creation and member assignment.

### Use safe, non-secret errors

Provider failures, validation failures, and insertion failures should render clear non-technical UI states and/or toasts. Error text must not include the full API key, authorization headers, raw secret-bearing request data, or raw provider dumps. Raw provider errors should be normalized/redacted before reaching Presentation.

Alternative considered: show raw provider responses to aid debugging. This is rejected because user-entered provider credentials live locally and must not leak through error surfaces.

## Risks / Trade-offs

- [Risk] Groq may ignore JSON instructions or return malformed content. -> Mitigation: use strict JSON instructions, shared parsing helpers, Zod validation, and non-mutating error states.
- [Risk] Generated tasks may duplicate existing tasks. -> Mitigation: include a concise existing-task summary in the input and keep review/edit/selection before insertion.
- [Risk] Batch insertion can partially fail. -> Mitigation: either insert sequentially with clear aggregate feedback or use an application-level helper that reports failures without pretending all selected tasks were created.
- [Risk] Planner DTO changes could blur foundation boundaries. -> Mitigation: keep changes limited to the project planner workflow response and do not alter provider resolution, settings, or repository behavior.
- [Risk] UI tests for drag-derived downstream views are unnecessary and brittle. -> Mitigation: verify insertion invalidates task/project/dashboard query surfaces rather than retesting Kanban and dashboard rendering in this change.

## Migration Plan

1. Add planner workflow DTO/schema/input-builder code without changing persisted data.
2. Implement Groq planner generation behind `GroqAIProvider.generateProjectPlan` and keep MockAIProvider deterministic.
3. Add Application hooks/use cases for planner generation and selected proposal insertion.
4. Add Project Detail AI Insights UI for configured, not-configured, loading, error, review, retry, cancel, edit, and confirm states.
5. Add focused unit/hook/UI tests where current utilities support them.
6. Rollback can remove the planner UI and provider planner implementation; no data migration is required because inserted tasks use the existing task model.
