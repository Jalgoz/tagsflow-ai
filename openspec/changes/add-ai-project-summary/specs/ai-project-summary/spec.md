## ADDED Requirements

### Requirement: Project Detail AI summary entry point
The system MUST provide an AI Project Summary workflow for one existing project at a time from Project Detail > AI Insights.

#### Scenario: Show summary workflow for current project
- **WHEN** a user opens Project Detail > AI Insights for an existing project
- **THEN** the AI Insights area exposes an AI Project Summary entry point scoped to the currently viewed project
- **THEN** the workflow does not require selecting or sending unrelated projects

#### Scenario: Preserve existing project detail tabs
- **WHEN** the AI Project Summary entry point is added
- **THEN** Overview, Tasks, Kanban, and AI Insights remain available according to existing Project Detail behavior
- **THEN** the summary workflow does not replace project planning, task management, or Project Kanban workflows

#### Scenario: Remain read-only
- **WHEN** a user generates, retries, clears, or cancels an AI Project Summary
- **THEN** no project, task, subtask, tag, member, settings, dashboard, Kanban, backup, demo data, or Local Storage mutation is sent

### Requirement: AI configuration gating for project summaries
The system MUST require configured AI provider settings before running AI Project Summary.

#### Scenario: Show not-configured state
- **WHEN** current AI provider settings are missing required configuration
- **THEN** the summary workflow shows a clear not-configured state or Settings navigation
- **THEN** no AI project summary request is sent

#### Scenario: Run through provider resolver
- **WHEN** AI settings are configured and the user starts summary generation
- **THEN** the workflow resolves the provider through application-level AI provider resolution
- **THEN** Presentation components do not instantiate `GroqAIProvider` or call Groq directly

### Requirement: Additional summary instructions
The system MUST allow users to provide optional single-turn additional instructions for AI Project Summary.

#### Scenario: Show additional instructions input
- **WHEN** a user opens the AI Project Summary section in Project Detail > AI Insights
- **THEN** it shows an optional textarea or equivalent input labeled `Additional instructions`
- **THEN** the input includes example placeholder text such as "Example: Summarize this project for a weekly stakeholder update"

#### Scenario: Generate without instructions
- **WHEN** the `Additional instructions` input is empty
- **THEN** the user can run summary generation using only current project context
- **THEN** no empty instruction value is sent to the AI provider

#### Scenario: Include trimmed non-empty instructions
- **WHEN** the user enters additional instructions with surrounding whitespace
- **THEN** the summary input builder trims the instructions
- **THEN** the provider-neutral request includes the trimmed instructions

#### Scenario: Omit whitespace-only instructions
- **WHEN** the user enters only whitespace in `Additional instructions`
- **THEN** the input builder treats the instructions as empty
- **THEN** generation can continue without sending instruction context when AI is otherwise configured

#### Scenario: Keep instructions transient
- **WHEN** additional instructions are entered, used, retried, cleared, canceled, or left on screen
- **THEN** the system does not persist the instruction text in project, task, subtask, member, tag, settings, backup, import/export, or Local Storage data
- **THEN** the workflow does not create conversation history

### Requirement: Summary instruction length limit
The system MUST enforce `MAX_PROJECT_SUMMARY_INSTRUCTION_LENGTH = 1000` for additional summary instructions.

#### Scenario: Reuse named instruction limit
- **WHEN** instruction validation or request construction needs the maximum project-summary instruction length
- **THEN** it uses `MAX_PROJECT_SUMMARY_INSTRUCTION_LENGTH = 1000`
- **THEN** Presentation components do not duplicate the limit as an unnamed magic number

#### Scenario: Prevent over-limit generation
- **WHEN** the trimmed additional instructions exceed `MAX_PROJECT_SUMMARY_INSTRUCTION_LENGTH`
- **THEN** generation is prevented
- **THEN** the UI shows clear validation feedback
- **THEN** no provider request receives over-limit instruction text

#### Scenario: Preserve workflow boundaries over instructions
- **WHEN** additional instructions ask for generated tasks, generated subtasks, automatic mutation, project updates, tag creation, member assignment, priority changes, or a different output format
- **THEN** the provider prompt and validation preserve the approved read-only project-summary contract
- **THEN** unsupported requested behavior is not performed

### Requirement: Project summary input construction
The system MUST build AI Project Summary input from existing current-project data and derived rules without requiring new persisted data.

#### Scenario: Include project context
- **WHEN** the user generates a summary for an existing project
- **THEN** the request includes project title, description, objective, in-scope content, out-of-scope content, status, start date, and due date where available
- **THEN** missing optional project fields do not block generation when the project can still be resolved

#### Scenario: Include derived project progress
- **WHEN** project summary input is built
- **THEN** it includes project progress derived from top-level task progress using approved domain progress rules
- **THEN** it does not read or persist a stored project progress value

#### Scenario: Include project-scoped task summaries
- **WHEN** project summary input is built
- **THEN** it includes deterministic summaries of top-level project tasks by status and priority
- **THEN** tasks from unrelated projects are omitted

#### Scenario: Include blocked and deadline context
- **WHEN** project summary input is built
- **THEN** it includes bounded project-scoped summaries of blocked tasks, overdue tasks, and upcoming deadline tasks where supported by existing task data
- **THEN** completed tasks are not treated as overdue or upcoming deadline work

#### Scenario: Include completed work conservatively
- **WHEN** project summary input includes completed work context
- **THEN** it uses existing task status and available data only
- **THEN** it does not infer exact completion timing from unrelated fields such as due date or start date

#### Scenario: Include subtask and checklist summaries
- **WHEN** project summary input is built
- **THEN** it includes bounded subtask progress and checklist completion summaries where supported by existing project tasks and subtasks
- **THEN** subtasks remain reasoning context and are not treated as independent Kanban cards or mutation targets

#### Scenario: Include tag and member context conservatively
- **WHEN** local tags or members are relevant to the selected project
- **THEN** the request may include existing tag names and member or assignee names as conservative display context
- **THEN** the request does not ask the model to create tags or assign members

#### Scenario: Exclude unrelated and raw context
- **WHEN** project summary input is built
- **THEN** unrelated projects, unrelated tasks, raw Local Storage records, repository adapter details, full settings records, and API key values are omitted from the provider request

### Requirement: Deterministic project summary input limits
The system MUST enforce named deterministic limits for AI Project Summary request construction.

#### Scenario: Use named request limits
- **WHEN** summary request construction bounds project text, task text, task count, subtask count, checklist count, tag count, or member count
- **THEN** it uses named constants for each limit
- **THEN** Presentation components do not duplicate those limits as unnamed magic numbers

#### Scenario: Prevent unbounded provider context
- **WHEN** project, task, subtask, checklist, tag, or member data exceeds the named limits
- **THEN** the input builder truncates, summarizes, or omits excess context deterministically
- **THEN** the provider request does not receive unbounded local data

#### Scenario: Keep request construction testable
- **WHEN** project summary input builder tests run with the same source data and reference date
- **THEN** the generated provider-neutral input is stable
- **THEN** context ordering and omissions are deterministic

### Requirement: Project summary AI output contract
The system MUST define a strict AI Project Summary output contract for read-only project summary data.

#### Scenario: Return supported summary fields
- **WHEN** the AI provider returns a project summary response
- **THEN** the response contains a concise summary paragraph
- **THEN** the response contains a project health label from a validated limited set such as `on_track`, `at_risk`, or `blocked`
- **THEN** the response contains key risks, blockers, and recommended next steps lists
- **THEN** the response may contain notable completed work only when it satisfies the validated schema

#### Scenario: Reject mutation instructions and generated entities
- **WHEN** the AI provider returns generated IDs, generated task payloads, generated subtask payloads, task mutation instructions, project mutation instructions, priority mutation instructions, tag creation payloads, member assignment payloads, member creation payloads, or alternate output formats
- **THEN** those values are not trusted
- **THEN** the response is rejected before display when validation identifies unsupported payloads

#### Scenario: Keep provider output domain-friendly
- **WHEN** a valid project summary response is accepted
- **THEN** the workflow transforms it into provider-neutral domain-friendly summary data
- **THEN** raw provider-specific response shapes are not exposed to Presentation components

### Requirement: Project summary response validation
The system MUST parse and validate AI Project Summary responses with Zod before displaying them.

#### Scenario: Reject malformed JSON
- **WHEN** the provider returns malformed JSON for a project summary response
- **THEN** the workflow rejects the response with a clear non-technical error state
- **THEN** no local data mutation is sent

#### Scenario: Reject schema-invalid output
- **WHEN** the provider returns parseable JSON that does not satisfy the project summary schema
- **THEN** the workflow rejects the response with a clear non-technical error state
- **THEN** invalid output is not transformed into a displayable summary

#### Scenario: Reject unsupported health labels
- **WHEN** the provider returns a health label outside the validated limited set
- **THEN** the workflow rejects the response before display
- **THEN** no local data mutation is sent

#### Scenario: Reject unsupported generated payloads
- **WHEN** the provider returns generated IDs, generated task or subtask payloads, project mutation payloads, member creation payloads, tag creation payloads, or raw mutation instructions
- **THEN** the workflow rejects the response before display
- **THEN** invalid AI output is never applied to local data

#### Scenario: Validate before display
- **WHEN** the provider returns a valid project summary response
- **THEN** the response is transformed into read-only summary display data
- **THEN** only validated summary data is shown in AI Insights

### Requirement: Project summary generation UX states
The system MUST provide clear generation, retry, disabled, clear, and safe error states for AI Project Summary.

#### Scenario: Show loading state
- **WHEN** project summary generation is in progress
- **THEN** the UI shows a loading or pending state
- **THEN** duplicate generation requests are disabled or otherwise prevented

#### Scenario: Show provider or validation failure safely
- **WHEN** the AI provider request fails or response validation fails
- **THEN** the workflow shows a clear visible error state
- **THEN** the error does not include the full API key, authorization header, raw provider error dump, raw prompt, or raw provider response

#### Scenario: Retry summary generation
- **WHEN** generation fails or the user wants a new summary after a completed generation
- **THEN** the workflow provides a retry or generate-again action
- **THEN** retrying sends a new provider request only when AI remains configured and current input validation passes

#### Scenario: Disable action when project context is missing
- **WHEN** the selected project or required project context cannot be resolved
- **THEN** the generation action is disabled or shows a safe missing-context state
- **THEN** no provider request is sent

#### Scenario: Clear generated summary from UI state
- **WHEN** a generated summary is visible and the user clears or cancels it
- **THEN** the summary is removed from current UI state
- **THEN** no persisted project, task, subtask, settings, backup, or Local Storage data is changed

### Requirement: Project summary display behavior
The system MUST display validated AI Project Summary results as read-only information in Project Detail > AI Insights.

#### Scenario: Display summary result
- **WHEN** a valid project summary response is generated
- **THEN** AI Insights displays the summary paragraph, health label, key risks, blockers, and recommended next steps
- **THEN** notable completed work is shown only when implemented and validated

#### Scenario: Avoid mutation controls
- **WHEN** a generated summary is displayed
- **THEN** the display does not show controls to create tasks, create subtasks, apply priorities, mutate project fields, create tags, assign members, or update Kanban columns from the summary
- **THEN** the summary remains informational

#### Scenario: Keep summary transient
- **WHEN** a valid summary is generated, retried, cleared, or left on screen
- **THEN** the generated summary is not persisted in project data, task data, subtask data, settings data, backup exports, import data, or Local Storage

### Requirement: AI Project Summary safety boundaries
The AI Project Summary workflow MUST preserve approved product, data, and architecture boundaries.

#### Scenario: Do not implement unrelated AI workflows
- **WHEN** this change is implemented
- **THEN** it does not change AI Project Planner behavior
- **THEN** it does not change AI Subtask Generator behavior
- **THEN** it does not change AI Priority Suggestion behavior
- **THEN** it does not implement AI chat or multi-turn conversation

#### Scenario: Preserve contracts and storage boundaries
- **WHEN** this change is implemented
- **THEN** it does not change project, task, subtask, member, tag, settings, repository port, or Local Storage database contracts
- **THEN** it does not change the `tagsflow_ai_db_v1` key or database version

#### Scenario: Preserve module boundaries
- **WHEN** this change is implemented
- **THEN** it does not change dashboard behavior, Kanban behavior, global tasks behavior, settings design, import/export behavior, demo data behavior, backend behavior, authentication, or cloud sync
- **THEN** provider-specific request, response, and error normalization concerns remain outside Presentation components

#### Scenario: Do not persist transient AI data
- **WHEN** project summary generation, retry, clearing, cancellation, or display occurs
- **THEN** the system does not persist generated summaries, additional instructions, conversation history, provider raw responses, raw prompts, or API keys in backups

### Requirement: AI Project Summary test coverage
The system MUST include focused automated tests for AI Project Summary where current test utilities support them.

#### Scenario: Test input builder behavior
- **WHEN** project summary input builder tests run
- **THEN** they verify project context, derived progress, task status counts, priority counts, blocked task summaries, overdue task summaries, upcoming deadline summaries, completed task summaries, subtask progress summaries, checklist summaries, tag context, member context, unrelated context omission, and deterministic limits

#### Scenario: Test instruction behavior
- **WHEN** additional instruction tests run
- **THEN** they verify non-empty instructions are trimmed and included
- **THEN** they verify empty and whitespace-only instructions are omitted
- **THEN** they verify `MAX_PROJECT_SUMMARY_INSTRUCTION_LENGTH` is enforced
- **THEN** they verify instructions are not persisted in Local Storage or backups

#### Scenario: Test response validation
- **WHEN** project summary response validation tests run
- **THEN** they cover valid output, malformed JSON, schema-invalid output, unsupported health label rejection, generated ID rejection, generated task or subtask payload rejection, project mutation payload rejection, and member or tag creation payload rejection

#### Scenario: Test read-only behavior
- **WHEN** project summary generation and display tests run
- **THEN** they verify no mutation occurs before, during, or after summary generation
- **THEN** they verify clearing a generated summary removes only transient UI state

#### Scenario: Test AI configuration and mock provider
- **WHEN** project summary tests render or run without configured AI
- **THEN** they verify the not-configured state and Settings navigation are visible
- **THEN** they verify no provider request is sent
- **WHEN** tests use `MockAIProvider`
- **THEN** the mock provider returns deterministic valid project summaries without network access

#### Scenario: Test persistence boundaries
- **WHEN** persistence or backup tests run after instructions are entered and summary generation is attempted
- **THEN** they verify additional instructions, generated summaries, raw prompts, raw responses, and API keys are not persisted in Local Storage or exported backups
- **THEN** the Local Storage database version and stored entity shapes remain unchanged
