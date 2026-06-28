## 1. Domain and AI Contracts

- [ ] 1.1 Add provider-neutral AI priority suggestion DTOs for input, response, rationale, and supported priority values.
- [ ] 1.2 Extend the existing `AIProvider` port with a priority suggestion method without changing repository ports or persisted entity contracts.
- [ ] 1.3 Add `MockAIProvider` priority suggestion support with deterministic valid output for tests and development fallback.

## 2. Input Construction

- [ ] 2.1 Create priority suggestion input builder constants, including `MAX_PRIORITY_INSTRUCTION_LENGTH = 800` and named project, task, sibling, checklist, and subtask context limits.
- [ ] 2.2 Implement a deterministic input builder that includes bounded project context, selected task context, checklist summary, tag context, assignee context, subtask progress summary, and conservative sibling priority context.
- [ ] 2.3 Ensure the input builder trims non-empty additional instructions, omits empty or whitespace-only instructions, blocks over-limit instructions, and never returns unrelated project or task context.
- [ ] 2.4 Add input builder tests for selected-task scoping, project-aware context, deterministic limits, instruction trimming, over-limit handling, and unrelated context omission.

## 3. Provider and Validation

- [ ] 3.1 Add a Zod schema and parser for AI Priority Suggestion responses using the existing structured AI response helpers.
- [ ] 3.2 Test response validation for valid output, malformed JSON, schema-invalid output, unsupported priorities, generated IDs, generated task/subtask payloads, project mutation payloads, and member/tag creation payloads.
- [ ] 3.3 Implement Groq priority suggestion request and prompt construction inside the Infrastructure AI adapter with the strict priority-only output contract and safe error handling.
- [ ] 3.4 Test Groq request construction without real network access, including instruction safety and rejection of prompt paths that ask for generated work items or mutations.

## 4. Application Workflow

- [ ] 4.1 Add an Application-layer priority suggestion use case that resolves configured AI, builds bounded input, calls the provider, normalizes safe errors, and returns a reviewable suggestion.
- [ ] 4.2 Add a query or mutation hook for generating priority suggestions with loading, retry, not-configured, validation error, and missing-context states.
- [ ] 4.3 Add an apply workflow that updates only the selected task priority through existing task update behavior and treats same-priority suggestions as a no-op.
- [ ] 4.4 Test no mutation before explicit apply, selected-task-only mutation, same-priority no-op behavior, duplicate apply prevention, and supported query invalidation after apply.

## 5. Presentation Integration

- [ ] 5.1 Add a compact AI Priority Suggestion entry point to the chosen task-focused Project Detail surface without crowding existing task actions.
- [ ] 5.2 Add the optional `Additional instructions` input with the approved label, placeholder, transient state, and over-limit validation feedback.
- [ ] 5.3 Add the review surface showing current priority, suggested priority, rationale, cancel, retry, and explicit apply actions.
- [ ] 5.4 Show AI not-configured, loading, provider failure, validation failure, missing-context, same-priority, success, and duplicate-apply states without exposing API keys or raw provider dumps.
- [ ] 5.5 Use the shared toast pattern after a successful priority update and avoid modal success dialogs.

## 6. Boundary and Regression Tests

- [ ] 6.1 Add UI or component tests for not-configured state, generation action disabling, review-before-apply behavior, cancel-without-mutation behavior, and apply success feedback where current utilities support them.
- [ ] 6.2 Add regression tests or assertions that the workflow does not mutate projects, sibling tasks, subtasks, tags, members, settings, backups, dashboard data, or Kanban configuration.
- [ ] 6.3 Add persistence or backup-focused coverage confirming additional instructions, raw prompts, raw responses, generated suggestions, and API keys are not persisted or exported.
- [ ] 6.4 Add regression coverage that AI Project Planner, AI Subtask Generator, subtask contracts, task/domain contracts, repository contracts, Local Storage database version, dashboard behavior, Kanban behavior, and import/export behavior remain unchanged.

## 7. Verification

- [ ] 7.1 Run the focused priority suggestion tests added in this change.
- [ ] 7.2 Run existing AI provider, structured output, task hook/use case, and touched presentation tests.
- [ ] 7.3 Run repository-wide lint and build checks.
- [ ] 7.4 Review the final diff for scope boundaries, secret-safety, absence of debug code, and Conventional Commit readiness.
