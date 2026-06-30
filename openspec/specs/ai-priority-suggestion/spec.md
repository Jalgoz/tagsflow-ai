# ai-priority-suggestion Specification

## Purpose
TBD - created by archiving change add-ai-priority-suggestion. Update Purpose after archive.
## Requirements
### Requirement: Task-scoped AI Priority Suggestion entry point
The system MUST provide an AI Priority Suggestion workflow for one existing top-level task at a time from a task-focused Project Detail surface.

#### Scenario: Show priority suggestion action for selected task
- **WHEN** a user works with an existing task in Project Detail > Tasks, a task detail surface, a task edit surface, or another existing task-focused project surface
- **THEN** the system exposes an AI Priority Suggestion entry point scoped to that selected task
- **THEN** the workflow runs for only one selected task at a time

#### Scenario: Preserve existing task workflows
- **WHEN** the AI Priority Suggestion entry point is added
- **THEN** existing task create, edit, delete, status, checklist, tag, assignee, subtask, Project Kanban, and Global Tasks workflows remain available according to their existing behavior
- **THEN** the priority suggestion workflow does not replace manual priority editing

#### Scenario: Keep selected task as only mutation target
- **WHEN** the priority suggestion workflow generates or applies a result
- **THEN** the selected task is the only entity that may be updated
- **THEN** project data, sibling tasks, subtasks, tags, members, dashboard data, Kanban configuration, settings, backups, and demo data are not directly mutated by the workflow

### Requirement: AI configuration gating for priority suggestion
The system MUST require configured AI provider settings before running AI Priority Suggestion.

#### Scenario: Show not-configured state
- **WHEN** the current AI provider settings are missing a required API key or selected model
- **THEN** the priority suggestion surface shows a clear not-configured state or Settings navigation
- **THEN** no AI priority suggestion request is sent

#### Scenario: Run through provider resolver
- **WHEN** AI settings are configured and the user starts priority suggestion
- **THEN** the workflow resolves the provider through application-level AI provider resolution
- **THEN** Presentation components do not instantiate `GroqAIProvider` or call Groq directly

### Requirement: Priority suggestion input construction
The system MUST build AI Priority Suggestion input from existing project, selected task, and local context without requiring new persisted data.

#### Scenario: Include bounded project context
- **WHEN** the user generates a priority suggestion for a selected task
- **THEN** the request includes the current project title and description
- **THEN** available project objective, in-scope content, out-of-scope content, start date, due date, and status are included only as bounded reasoning context when already available

#### Scenario: Include selected task context
- **WHEN** the user generates a priority suggestion for a selected task
- **THEN** the request includes the selected task title, description, in-scope content, out-of-scope content, status, current priority, start date, and due date where available
- **THEN** missing optional task fields do not block generation when enough selected-task context remains available

#### Scenario: Include task metadata summaries
- **WHEN** the selected task has checklist items, tags, an assignee, or subtasks
- **THEN** the request includes deterministic summaries of checklist state, tag names, assignee context, and subtask progress where available
- **THEN** subtasks are used only as reasoning context and are not treated as mutation targets

#### Scenario: Include sibling task priorities conservatively
- **WHEN** sibling tasks exist in the selected project
- **THEN** the request may include a bounded summary of sibling task priorities as context
- **THEN** sibling task titles, descriptions, subtasks, checklist details, and unrelated project data are not sent unbounded to the provider

#### Scenario: Exclude unrelated context
- **WHEN** priority suggestion input is built
- **THEN** unrelated projects and unrelated tasks are omitted from the provider request
- **THEN** raw Local Storage records and repository adapter details are not sent to the provider

### Requirement: Deterministic priority suggestion input limits
The system MUST enforce named deterministic limits for AI Priority Suggestion request construction.

#### Scenario: Use named request limits
- **WHEN** priority suggestion request construction bounds project text, task text, sibling task context, checklist context, or subtask context
- **THEN** it uses named constants for maximum project text length, maximum task text length, sibling task context count, checklist context count, and subtask progress or checklist context count
- **THEN** Presentation components do not duplicate those limits as unnamed magic numbers

#### Scenario: Prevent unbounded provider context
- **WHEN** project, task, subtask, checklist, tag, member, or sibling task data exceeds the named limits
- **THEN** the input builder truncates, summarizes, or omits excess context deterministically
- **THEN** the provider request does not receive unbounded local data

#### Scenario: Keep request construction testable
- **WHEN** priority suggestion input builder tests run with the same project and task data
- **THEN** the generated provider-neutral input is stable
- **THEN** context ordering and omissions are deterministic

### Requirement: Additional priority instructions
The system MUST allow users to provide optional single-turn additional instructions for AI Priority Suggestion.

#### Scenario: Show additional instructions input
- **WHEN** the AI Priority Suggestion surface is open for a selected task and the chosen surface has room for task-specific AI input
- **THEN** it shows an optional textarea or equivalent input labeled `Additional instructions`
- **THEN** the input includes example placeholder text such as "Example: Prioritize this based on urgency for the MVP launch"

#### Scenario: Generate without instructions
- **WHEN** the `Additional instructions` input is empty
- **THEN** the user can run priority suggestion using only the selected task and project context
- **THEN** no empty instruction value is sent to the AI provider

#### Scenario: Include trimmed non-empty instructions
- **WHEN** the user enters additional instructions with surrounding whitespace
- **THEN** the priority suggestion input builder trims the instructions
- **THEN** the provider-neutral request includes the trimmed instructions

#### Scenario: Omit whitespace-only instructions
- **WHEN** the user enters only whitespace in `Additional instructions`
- **THEN** the input builder treats the instructions as empty
- **THEN** generation can continue without sending instruction context when AI is otherwise configured

#### Scenario: Keep instructions transient
- **WHEN** additional instructions are entered, used, retried, canceled, cleared, or left on screen
- **THEN** the system does not persist the instruction text in project, task, subtask, member, tag, settings, backup, import/export, or Local Storage data
- **THEN** the workflow does not create conversation history

### Requirement: Priority instruction length limit
The system MUST enforce `MAX_PRIORITY_INSTRUCTION_LENGTH = 800` for additional priority instructions.

#### Scenario: Reuse named instruction limit
- **WHEN** instruction validation or request construction needs the maximum priority instruction length
- **THEN** it uses `MAX_PRIORITY_INSTRUCTION_LENGTH = 800`
- **THEN** Presentation components do not duplicate the limit as an unnamed magic number

#### Scenario: Prevent over-limit generation
- **WHEN** the trimmed additional instructions exceed `MAX_PRIORITY_INSTRUCTION_LENGTH`
- **THEN** generation is prevented
- **THEN** the UI shows clear validation feedback
- **THEN** no provider request receives over-limit instruction text

#### Scenario: Preserve workflow boundaries over instructions
- **WHEN** additional instructions ask for generated tasks, generated subtasks, automatic application, project updates, tag creation, member assignment, or a different output format
- **THEN** the provider prompt and validation preserve the approved priority-suggestion-only contract
- **THEN** unsupported requested behavior is not performed

### Requirement: Priority suggestion AI output contract
The system MUST define a strict AI output contract for a single task priority suggestion.

#### Scenario: Return only supported priority suggestion fields
- **WHEN** the AI provider returns a priority suggestion response
- **THEN** the response contains a suggested priority from `low`, `medium`, `high`, or `urgent`
- **THEN** the response contains a short rationale explaining why the priority was suggested
- **THEN** the response may contain confidence only when confidence is validated and useful

#### Scenario: Reject mutation instructions and generated entities
- **WHEN** the AI provider returns generated IDs, task mutation instructions, project mutation instructions, sibling task mutation instructions, subtask mutation instructions, generated tasks, generated subtasks, new tags, member assignments, or alternate output formats
- **THEN** those values are not trusted
- **THEN** the response is rejected before review or mutation when validation identifies unsupported payloads

#### Scenario: Keep provider output domain-friendly
- **WHEN** a valid priority suggestion response is accepted
- **THEN** the workflow transforms it into provider-neutral domain-friendly DTO data
- **THEN** raw provider-specific response shapes are not exposed to Presentation components

### Requirement: Priority suggestion response validation
The system MUST parse and validate AI Priority Suggestion responses with Zod before using them.

#### Scenario: Reject malformed JSON
- **WHEN** the provider returns malformed JSON for a priority suggestion response
- **THEN** the workflow rejects the response with a clear non-technical error state
- **THEN** no task update mutation is sent

#### Scenario: Reject schema-invalid output
- **WHEN** the provider returns parseable JSON that does not satisfy the priority suggestion schema
- **THEN** the workflow rejects the response with a clear non-technical error state
- **THEN** invalid output is not transformed into a reviewable suggestion

#### Scenario: Reject unsupported priority values
- **WHEN** the provider returns a suggested priority outside `low`, `medium`, `high`, or `urgent`
- **THEN** the workflow rejects the response before review
- **THEN** no task update mutation is sent

#### Scenario: Reject unsupported generated payloads
- **WHEN** the provider returns generated IDs, generated task or subtask payloads, project mutation payloads, member creation payloads, tag creation payloads, or raw mutation instructions
- **THEN** the workflow rejects the response before review
- **THEN** invalid AI output is never applied to local data

#### Scenario: Validate before review
- **WHEN** the provider returns a valid priority suggestion response
- **THEN** the response is transformed into a reviewable priority suggestion
- **THEN** only validated suggestion data is shown in the review surface

### Requirement: Priority suggestion generation UX states
The system MUST provide clear generation, retry, disabled, and safe error states for AI Priority Suggestion.

#### Scenario: Show loading state
- **WHEN** priority suggestion generation is in progress
- **THEN** the UI shows a loading or pending state
- **THEN** duplicate generation requests are disabled or otherwise prevented

#### Scenario: Show provider or validation failure safely
- **WHEN** the AI provider request fails or response validation fails
- **THEN** the workflow shows a clear visible error state
- **THEN** the error does not include the full API key, authorization header, raw provider error dump, raw prompt, or raw provider response

#### Scenario: Retry suggestion
- **WHEN** generation fails or the user wants a new suggestion after a completed generation
- **THEN** the workflow provides a retry or generate-again action
- **THEN** retrying sends a new provider request only when AI remains configured and current input validation passes

#### Scenario: Disable action when selected task context is missing
- **WHEN** the selected task or required project context cannot be resolved
- **THEN** the generation action is disabled or shows a safe missing-context state
- **THEN** no provider request is sent

### Requirement: Review-before-apply priority suggestion
The system MUST require user review before an AI-suggested priority is applied to local task data.

#### Scenario: Display suggestion for review
- **WHEN** a valid priority suggestion response is generated
- **THEN** the workflow displays the current priority and suggested priority in a review surface
- **THEN** the workflow displays the rationale and optional confidence when implemented and validated
- **THEN** no task update mutation is sent merely because the provider returned a response

#### Scenario: Cancel review without mutation
- **WHEN** the user closes or cancels the priority suggestion review surface
- **THEN** no task update mutation is sent
- **THEN** the selected task and local data remain unchanged by the generated suggestion

#### Scenario: Keep review task-scoped
- **WHEN** the priority suggestion review surface is open
- **THEN** the review applies only to the selected task
- **THEN** the UI does not present controls to update project fields, sibling tasks, subtasks, tags, members, dashboard data, or Kanban configuration from the suggestion

### Requirement: Confirmed priority application
The system MUST apply a suggested priority only after explicit user confirmation.

#### Scenario: Apply different suggested priority
- **WHEN** the user explicitly applies a valid suggested priority that differs from the selected task's current priority
- **THEN** the workflow updates only the selected task priority through existing task update hooks or use cases
- **THEN** project fields, sibling tasks, subtasks, tags, members, dashboard data, Kanban configuration, settings, backups, and demo data are not directly mutated

#### Scenario: Use existing task update mapping
- **WHEN** the current task update path requires a full task payload
- **THEN** the workflow maps the selected task's existing values and changes only the priority field
- **THEN** no unrelated task fields are intentionally changed by the priority apply action

#### Scenario: Show apply success feedback
- **WHEN** the selected task priority is updated successfully
- **THEN** the UI shows a non-blocking success toast notification
- **THEN** the review state is cleared or updated so the same suggestion is not accidentally applied twice

#### Scenario: Refresh task-derived views
- **WHEN** the selected task priority is updated successfully
- **THEN** Project Detail Tasks, Project Kanban metadata, Global Tasks, Global Kanban, and Dashboard data are refreshed through existing query invalidation behavior where those views depend on task data
- **THEN** no dashboard or Kanban data is directly persisted by the priority suggestion workflow

#### Scenario: Same-priority no-op
- **WHEN** the suggested priority is the same as the selected task's current priority
- **THEN** the review surface clearly explains that the task already has the suggested priority
- **THEN** no task update mutation is sent

#### Scenario: Prevent duplicate apply
- **WHEN** a priority apply action has succeeded or is currently pending
- **THEN** duplicate apply actions for the same generated suggestion are disabled or ignored safely
- **THEN** the same successful suggestion is not applied repeatedly

### Requirement: AI Priority Suggestion safety boundaries
The AI Priority Suggestion workflow MUST preserve approved product, data, and architecture boundaries.

#### Scenario: Do not implement unrelated AI workflows
- **WHEN** this change is implemented
- **THEN** it does not change AI Project Planner behavior
- **THEN** it does not change AI Subtask Generator behavior
- **THEN** it does not implement AI Project Summary, AI chat, or multi-turn conversation

#### Scenario: Do not implement subtask priority suggestion
- **WHEN** this change is implemented
- **THEN** it does not add AI priority suggestion for subtasks
- **THEN** selected task subtask progress is used only as reasoning context
- **THEN** subtask contracts and subtask update behavior remain unchanged

#### Scenario: Preserve contracts and storage boundaries
- **WHEN** this change is implemented
- **THEN** it does not change project, task, subtask, member, tag, settings, repository port, or Local Storage database contracts
- **THEN** it does not change the `tagsflow_ai_db_v1` key or database version

#### Scenario: Preserve module boundaries
- **WHEN** this change is implemented
- **THEN** it does not change dashboard behavior, Kanban behavior, settings design, import/export behavior, demo data behavior, backend behavior, authentication, or cloud sync
- **THEN** provider-specific request, response, and error normalization concerns remain outside Presentation components

#### Scenario: Do not persist transient AI data
- **WHEN** priority suggestion generation, review, retry, cancellation, or application occurs
- **THEN** the system does not persist generated suggestions before explicit apply
- **THEN** it does not persist additional instructions, conversation history, provider raw responses, raw prompts, or API keys in backups

### Requirement: AI Priority Suggestion test coverage
The system MUST include focused automated tests for AI Priority Suggestion where current test utilities support them.

#### Scenario: Test input builder behavior
- **WHEN** priority suggestion input builder tests run
- **THEN** they verify project context, selected task context, checklist summary, tag context, assignee context, subtask progress summary, conservative sibling priority context, and unrelated context omission
- **THEN** they verify deterministic request limits and stable ordering

#### Scenario: Test instruction behavior
- **WHEN** additional instruction tests run
- **THEN** they verify non-empty instructions are trimmed and included
- **THEN** they verify empty and whitespace-only instructions are omitted
- **THEN** they verify `MAX_PRIORITY_INSTRUCTION_LENGTH` is enforced
- **THEN** they verify instructions are not persisted in Local Storage or backups

#### Scenario: Test response validation
- **WHEN** priority suggestion response validation tests run
- **THEN** they cover valid output, malformed JSON, schema-invalid output, unsupported priority rejection, generated ID rejection, generated task or subtask payload rejection, project mutation payload rejection, and member or tag creation payload rejection

#### Scenario: Test review and apply behavior
- **WHEN** priority suggestion review and apply tests run
- **THEN** they verify no mutation before explicit apply, cancel-without-mutation behavior, selected-task-only priority update behavior, same-priority no-op behavior, duplicate apply prevention, and success toast feedback

#### Scenario: Test AI configuration and mock provider
- **WHEN** priority suggestion tests render or run without configured AI
- **THEN** they verify the not-configured state and Settings navigation are visible
- **THEN** they verify no provider request is sent
- **WHEN** tests use `MockAIProvider`
- **THEN** the mock provider returns deterministic valid priority suggestions without network access

#### Scenario: Test query invalidation
- **WHEN** current query test utilities support invalidation assertions
- **THEN** tests verify affected task-derived views are invalidated or refreshed after applying a changed priority
- **THEN** tests verify no invalidation is triggered by same-priority no-op behavior unless existing utilities require a harmless local UI refresh

