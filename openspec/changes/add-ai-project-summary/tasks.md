## 1. Domain and AI Contracts

- [ ] 1.1 Review the existing `ProjectSummaryRequest` and `ProjectSummaryResult` DTOs against the approved summary spec and replace raw entity-bag request fields with bounded provider-neutral summary context fields.
- [ ] 1.2 Add project-summary health label types using a validated limited set such as `on_track`, `at_risk`, and `blocked`.
- [ ] 1.3 Keep `AIProvider.summarizeProject` as the workflow method without changing repository ports or persisted entity contracts.
- [ ] 1.4 Update `MockAIProvider.summarizeProject` to return deterministic valid summary output for tests and development fallback.

## 2. Input Construction

- [ ] 2.1 Create project-summary input builder constants, including `MAX_PROJECT_SUMMARY_INSTRUCTION_LENGTH = 1000` and named project text, task text, task count, subtask count, checklist count, tag count, and member count limits.
- [ ] 2.2 Implement a pure project-summary input builder that includes current project metadata, derived project progress, task status counts, task priority counts, blocked task summaries, overdue task summaries, upcoming deadline summaries, and completed-task summaries only as currently done tasks without implying completion timing.
- [ ] 2.3 Add bounded subtask progress and checklist completion summaries using existing task/subtask relationships without treating subtasks as independent Kanban cards or mutation targets.
- [ ] 2.4 Add conservative project-scoped tag and member/assignee context without requiring tag creation or member assignment.
- [ ] 2.5 Ensure the builder trims non-empty additional instructions, omits empty or whitespace-only instructions, blocks over-limit instructions, and never returns unrelated project or task context.
- [ ] 2.6 Add input builder tests for full project context, missing optional fields, derived progress, blocked/overdue/upcoming summaries, completed work limitations, subtask/checklist summaries, tag/member context, deterministic limits, instruction handling, and unrelated context omission.

## 3. Provider and Validation

- [ ] 3.1 Add a Zod schema and parser for AI Project Summary responses using the existing structured AI response helpers.
- [ ] 3.2 Test response validation for valid output, malformed JSON, schema-invalid output, unsupported health labels, generated IDs, generated task/subtask payloads, project mutation payloads, priority mutation instructions, and member/tag creation payloads.
- [ ] 3.3 Implement Groq project summary request and prompt construction inside `GroqAIProvider.summarizeProject` using the selected model and strict read-only structured JSON instructions.
- [ ] 3.4 Ensure Groq summary errors are normalized into safe non-secret failures without exposing API keys, authorization headers, raw prompts, raw provider errors, or raw provider responses.
- [ ] 3.5 Add provider tests for Groq request construction, instruction safety, response validation failure handling, secret redaction, and `MockAIProvider` project summary output.

## 4. Application Workflow

- [ ] 4.1 Add an Application-layer project summary use case that resolves configured AI, builds bounded input, calls `provider.summarizeProject`, normalizes safe errors, and returns read-only summary data.
- [ ] 4.2 Add a project-summary hook that loads the current project, project tasks, subtasks, tags, members, and settings through existing Application-layer data paths.
- [ ] 4.3 Add loading, retry, not-configured, missing-context, validation error, provider error, and clear/cancel state handling without sending business-data mutations.
- [ ] 4.4 Ensure summary generation, retry, and clear/cancel update only summary workflow state and do not invalidate projects, tasks, subtasks, tags, members, dashboard, Project Kanban, or Global Kanban queries.
- [ ] 4.5 Test not-configured behavior, missing-context behavior, generation success, provider failure, validation failure, retry behavior, clear/cancel behavior, and no mutation before/during/after summary generation.

## 5. Presentation Integration

- [ ] 5.1 Add a compact AI Project Summary panel to Project Detail > AI Insights alongside existing AI workflow content without replacing the AI Project Planner.
- [ ] 5.2 Render the not-configured summary state with a clear Settings navigation action.
- [ ] 5.3 Add the optional `Additional instructions` input with the approved label, placeholder, transient state, and over-limit validation feedback.
- [ ] 5.4 Render summary generation loading, retry, provider error, validation error, missing-context, clear/cancel, and generated-result states without exposing API keys or raw provider payloads.
- [ ] 5.5 Display validated summary paragraph, health label, key risks, blockers, recommended next steps, and notable completed work only when validated and without implying completion dates that the current data model does not support.
- [ ] 5.6 Ensure the generated summary UI does not include controls to create tasks, create subtasks, apply priority changes, mutate projects, create tags, assign members, update Kanban columns, or save summaries.
- [ ] 5.7 Add UI tests where supported for configured/not-configured rendering, instruction validation, generation flow, retry, clear/cancel behavior, read-only result display, and safe error messaging.

## 6. Boundary and Persistence Checks

- [ ] 6.1 Add regression tests or assertions that the workflow does not mutate projects, tasks, subtasks, tags, members, settings, dashboard data, Kanban configuration, backups, demo data, or Local Storage data.
- [ ] 6.2 Add persistence or backup-focused coverage confirming additional instructions, generated summaries, raw prompts, raw responses, and API keys are not persisted or exported.
- [ ] 6.3 Confirm AI Project Planner, AI Subtask Generator, AI Priority Suggestion, project/task/subtask/domain contracts, repository contracts, Local Storage database version, dashboard behavior, Kanban behavior, Settings design, import/export behavior, and demo data behavior remain unchanged.

## 7. Verification

- [ ] 7.1 Run the focused project summary tests added in this change.
- [ ] 7.2 Run existing AI provider, structured output, project detail, task/subtask, settings backup, dashboard metric, and touched presentation tests.
- [ ] 7.3 Run repository-wide lint and build checks.
- [ ] 7.4 Review the final diff for scope boundaries, secret-safety, absence of debug code, and Conventional Commit readiness.
