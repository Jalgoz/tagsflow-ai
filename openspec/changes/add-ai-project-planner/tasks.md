## 1. Planner Contracts and Validation

- [ ] 1.1 Review current `AIProvider.generateProjectPlan` DTOs against the approved planner spec and add only the narrow planner fields needed for status and existing-tag suggestions.
- [ ] 1.2 Add planner response Zod schemas covering task title, description, priority, status/defaulting, optional due date, optional existing tag names, and forbidden generated IDs/subtasks.
- [ ] 1.3 Add tests for valid planner output, malformed JSON, schema-invalid output, invalid dates, unsupported priority/status values, generated IDs, subtasks, and ignored unknown tag suggestions.
- [ ] 1.4 Transform validated output into review drafts with local temporary IDs, resolved existing tag IDs, and unapplied-tag warnings.

## 2. Planner Input Builder

- [ ] 2.1 Add a pure planner input builder using only fields already present in the approved Project entity, omitting unavailable optional fields without changing the project contract.
- [ ] 2.2 Add concise existing-task summary support that includes top-level project tasks without making subtasks generation targets.
- [ ] 2.3 Add conservative existing tag/member context support without requiring member assignment or new tag creation.
- [ ] 2.4 Add deterministic field-length and existing-task-count limits so provider context cannot grow without bounds.
- [ ] 2.5 Add input builder tests for full context, missing optional fields, deterministic truncation, task limits, tags, and members.

## 3. Provider Implementation

- [ ] 3.1 Implement Groq project planner request construction behind `GroqAIProvider.generateProjectPlan` using the selected model and structured JSON instructions.
- [ ] 3.2 Parse and validate Groq planner output with the shared structured-output helpers and planner Zod schema before returning provider-neutral planner data.
- [ ] 3.3 Normalize Groq planner failures into safe non-secret errors without logging raw provider data or API keys.
- [ ] 3.4 Update `MockAIProvider.generateProjectPlan` fixtures so the planner happy path returns deterministic valid proposals for tests.
- [ ] 3.5 Add provider tests for Groq request construction, validation failure handling, secret redaction, and MockAIProvider planner output.

## 4. Application Workflow

- [ ] 4.1 Add application-level planner generation use case or hook that resolves the configured AI provider and blocks generation when AI is not configured.
- [ ] 4.2 Add project-scoped planner orchestration that loads the current project, project tasks, tags, and members through existing application data paths.
- [ ] 4.3 Add selected proposal insertion behavior that maps review drafts into existing task create inputs for the current project.
- [ ] 4.4 Ensure inserted planner tasks use existing task creation hooks/use cases and existing query invalidation for Project Detail Tasks, Project Kanban, Global Tasks, Global Kanban, and Dashboard data.
- [ ] 4.5 Handle partial insertion failures by preserving successful inserts, keeping failed proposals reviewable, reporting aggregate feedback, and preventing successful proposals from being inserted again during retry.
- [ ] 4.6 Add application/hook tests for not-configured state, generation success, provider failure, no insertion before confirmation, selected-only insertion, and query invalidation.

## 5. Project Detail UI

- [ ] 5.1 Add the AI Project Planner entry point to Project Detail AI Insights or a focused AI planning section without changing other Project Detail tabs.
- [ ] 5.2 Render the not-configured planner state with a clear Settings navigation action.
- [ ] 5.3 Render planner generation loading, retry, provider error, and validation error states without exposing API keys or raw provider payloads.
- [ ] 5.4 Render the proposal review panel with selectable proposals and cancel/close behavior that sends no task mutations.
- [ ] 5.5 Add practical editing for proposal title, description, priority, status, and due date before insertion, with validation feedback.
- [ ] 5.6 Add explicit confirm insertion behavior, empty-selection handling, success toast feedback, and duplicate-insert prevention after success.
- [ ] 5.7 Add UI tests where supported for configured/not-configured rendering, generation flow, review selection/editing, cancellation, insertion confirmation, and success feedback.

## 6. Regression Checks

- [ ] 6.1 Verify the planner does not create subtasks, assign members, create tags, modify projects/settings/backups/demo data, or change Kanban configuration.
- [ ] 6.2 Verify generated tasks appear as normal local tasks in Project Detail Tasks, Project Kanban, Global Tasks, Global Kanban, and Dashboard-derived metrics through existing data refresh behavior.
- [ ] 6.3 Run the focused planner tests plus existing task, AI provider, project detail, global tasks, global kanban, dashboard, lint, and build checks.
- [ ] 6.4 Review the final diff to confirm no task/project/repository contracts, Local Storage database version, settings redesign, import/export redesign, demo data, backend, auth, or cloud sync changes were introduced.
