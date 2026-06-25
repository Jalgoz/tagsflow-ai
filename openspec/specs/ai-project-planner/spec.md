# ai-project-planner Specification

## Purpose
TBD - created by archiving change add-ai-project-planner. Update Purpose after archive.
## Requirements
### Requirement: Project Detail AI planner entry point
The system MUST provide an AI Project Planner workflow for existing projects from Project Detail.

#### Scenario: Show planner in Project Detail
- **WHEN** a user opens Project Detail for an existing project
- **THEN** the Project Detail AI Insights tab or a focused AI planning section exposes an AI Project Planner entry point
- **THEN** the entry point is scoped to the currently viewed project

#### Scenario: Preserve project tabs
- **WHEN** the planner entry point is added
- **THEN** Overview, Tasks, Kanban, and AI Insights remain available according to the existing Project Detail behavior
- **THEN** the planner does not replace project task management or Project Kanban workflows

### Requirement: AI configuration gating
The system MUST require configured AI provider settings before running the AI Project Planner.

#### Scenario: Show not-configured state
- **WHEN** the current AI provider settings are missing required configuration
- **THEN** the planner shows a clear not-configured state
- **THEN** the planner provides navigation to Settings for AI configuration
- **THEN** no AI project planning request is sent

#### Scenario: Run with configured provider
- **WHEN** AI is configured with a selected provider and model requirements are satisfied
- **THEN** the planner runs through application-level AI provider resolution
- **THEN** Presentation components do not construct `GroqAIProvider` or call Groq directly

### Requirement: Planner input construction
The system MUST build AI Project Planner input from existing project data and approved local context.

#### Scenario: Build project context
- **WHEN** the user requests a plan for an existing project
- **THEN** the planner input includes project title, description, objective, in-scope content, out-of-scope content, start date, and due date where available
- **THEN** missing optional project fields are represented safely without blocking generation

#### Scenario: Include existing task summary
- **WHEN** the current project already has tasks
- **THEN** the planner input may include a concise summary of existing top-level tasks to reduce duplicate suggestions
- **THEN** the summary does not include subtasks as generation targets

#### Scenario: Include tag and member context conservatively
- **WHEN** local tags or members exist
- **THEN** the planner input may include existing tag names and member names as context
- **THEN** the planner input does not require the model to assign members or create tags

### Requirement: Planner AI output contract
The system MUST define a strict AI Project Planner output contract for top-level task proposals only.

#### Scenario: Return top-level task proposals
- **WHEN** the AI provider returns a planner response
- **THEN** the response contains proposed top-level tasks only
- **THEN** the response does not contain subtasks, nested task structures, checklists, or member assignments

#### Scenario: Require supported proposal fields
- **WHEN** a task proposal is accepted from the AI response
- **THEN** it includes a task title, task description, and supported priority value
- **THEN** it includes a supported task status or defaults to `todo` before review when the status is absent

#### Scenario: Accept optional due date only when valid
- **WHEN** the AI response includes a suggested due date
- **THEN** the due date is accepted only if it is valid for the existing task date format
- **THEN** invalid due dates cause the response or affected proposal to be rejected before insertion

#### Scenario: Restrict tag suggestions to existing tags
- **WHEN** the AI response includes tag suggestions
- **THEN** suggested tags are accepted only when they match existing local tag names
- **THEN** the planner does not create new tags from AI output

#### Scenario: Ignore generated identifiers
- **WHEN** the AI response includes IDs or other persistence identifiers
- **THEN** the system does not trust those identifiers
- **THEN** inserted tasks receive normal locally generated task IDs through existing task creation behavior

### Requirement: Planner response validation
The system MUST parse and validate AI Project Planner responses with Zod before using them.

#### Scenario: Reject malformed JSON
- **WHEN** the provider returns malformed JSON for a planner response
- **THEN** the planner rejects the response with a clear non-technical error state
- **THEN** no task create mutation is sent

#### Scenario: Reject schema-invalid output
- **WHEN** the provider returns parseable JSON that does not satisfy the planner schema
- **THEN** the planner rejects the response with a clear non-technical error state
- **THEN** invalid output is not transformed into task proposals

#### Scenario: Validate before review
- **WHEN** the provider returns a valid planner response
- **THEN** the response is transformed into reviewable task proposal drafts
- **THEN** only validated proposal data is shown in the review panel

### Requirement: Planner generation UX
The system MUST provide clear generation states for the AI Project Planner.

#### Scenario: Show loading state
- **WHEN** planner generation is in progress
- **THEN** the UI shows a loading or pending state
- **THEN** duplicate generation requests are disabled or otherwise prevented

#### Scenario: Show provider failure
- **WHEN** the AI provider request fails
- **THEN** the planner shows a clear visible error state
- **THEN** the error does not include the full API key, authorization header, or raw secret-bearing provider data

#### Scenario: Retry generation
- **WHEN** a planner request fails or the user wants a new result after a completed generation
- **THEN** the planner provides a retry or generate-again action
- **THEN** retrying sends a new provider request only when AI remains configured

### Requirement: Review-before-insert workflow
The system MUST require user review before AI-generated task proposals are inserted into local data.

#### Scenario: Display proposals for review
- **WHEN** a valid planner response is generated
- **THEN** the planner displays proposed tasks in a review panel
- **THEN** no task create mutation is sent merely because the provider returned a response

#### Scenario: Select proposals
- **WHEN** multiple task proposals are available
- **THEN** the user can choose which proposals will be inserted
- **THEN** unselected proposals are not inserted

#### Scenario: Edit proposal fields
- **WHEN** the review panel is open
- **THEN** the user can edit title, description, priority, status, and due date for each selected proposal where practical
- **THEN** edited proposal values are validated before insertion

#### Scenario: Cancel review
- **WHEN** the user closes or cancels the review panel
- **THEN** no task create mutation is sent
- **THEN** the project data remains unchanged by the generated proposals

### Requirement: Confirmed task insertion
The system MUST insert selected planner proposals as normal tasks only after explicit user confirmation.

#### Scenario: Insert selected tasks
- **WHEN** the user confirms insertion with one or more valid selected proposals
- **THEN** the system creates tasks through existing task creation use cases or hooks
- **THEN** each created task belongs to the current project
- **THEN** created tasks are normal editable, deletable, exportable local tasks

#### Scenario: Block empty selection
- **WHEN** the user attempts to insert with no selected proposals
- **THEN** no task create mutation is sent
- **THEN** the UI explains that at least one proposal must be selected

#### Scenario: Show insertion success
- **WHEN** selected proposals are inserted successfully
- **THEN** the UI shows a non-blocking success toast
- **THEN** the review state is cleared or updated so the same proposals are not accidentally inserted twice

#### Scenario: Refresh affected views
- **WHEN** planner-created tasks are inserted
- **THEN** Project Detail Tasks, Project Kanban, Global Tasks, Global Kanban, and Dashboard data are refreshed through existing query invalidation behavior

### Requirement: Planner safety boundaries
The AI Project Planner MUST preserve approved product and architecture boundaries.

#### Scenario: Do not mutate unsupported data
- **WHEN** the planner generates or inserts proposals
- **THEN** it does not create or update subtasks, members, tags, projects, settings, backups, demo data, dashboard records, or Kanban configuration

#### Scenario: Preserve persistence contracts
- **WHEN** this change is implemented
- **THEN** it does not change task, subtask, project, member, tag, repository, or Local Storage database contracts
- **THEN** it does not change the `tagsflow_ai_db_v1` database key or database version

#### Scenario: Keep provider concerns in infrastructure
- **WHEN** Groq-backed planning is implemented
- **THEN** provider-specific request, response, and error normalization concerns remain inside the Infrastructure layer
- **THEN** Application and Presentation receive provider-neutral planner data or safe failure states

#### Scenario: Exclude other AI workflows
- **WHEN** this change is implemented
- **THEN** AI Subtask Generator, AI Priority Suggestion, AI Project Summary, and global AI chat remain unimplemented unless approved separately

### Requirement: Planner test coverage
The system MUST include focused automated tests for the AI Project Planner where current test utilities support them.

#### Scenario: Test input builder
- **WHEN** planner input builder tests run
- **THEN** they verify project fields, optional fields, existing task summary, and conservative tag/member context are represented correctly

#### Scenario: Test response validation
- **WHEN** planner response schema tests run
- **THEN** they cover valid output, malformed JSON, schema-invalid output, invalid dates, unsupported priority or status values, generated IDs, subtasks, and unknown tag suggestions

#### Scenario: Test review behavior
- **WHEN** planner review UI or state tests run
- **THEN** they verify selection, editing, cancellation, retry availability, and no insertion before explicit confirmation

#### Scenario: Test insertion behavior
- **WHEN** planner insertion tests run
- **THEN** they verify selected proposals create normal project-scoped tasks through existing task creation behavior
- **THEN** they verify unselected proposals are not created
- **THEN** they verify affected query data is invalidated or refreshed

#### Scenario: Test not-configured state
- **WHEN** planner UI tests render without configured AI
- **THEN** they verify the not-configured state and Settings navigation are visible
- **THEN** they verify no provider generation request is sent

#### Scenario: Test MockAIProvider happy path
- **WHEN** planner tests use `MockAIProvider`
- **THEN** the mock provider returns deterministic valid planner proposals
- **THEN** the planner can generate reviewable proposals without network access

### Requirement: Optional planner instructions
The system MUST allow users to provide optional additional planning instructions for the AI Project Planner from Project Detail.

#### Scenario: Show additional planning instructions input
- **WHEN** a user opens Project Detail > AI Insights for an existing project
- **THEN** the AI Project Planner shows an optional textarea or equivalent input labeled as additional planning instructions
- **THEN** the input includes example placeholder text such as "Example: Plan authentication with roles, password recovery, and session validation"

#### Scenario: Run planner without instructions
- **WHEN** the additional planning instructions input is empty
- **THEN** the user can still run the AI Project Planner using the existing project context behavior
- **THEN** no empty instruction value is sent to the AI provider

#### Scenario: Preserve instructions while page remains open
- **WHEN** the user enters additional planning instructions and remains on the current AI Insights page
- **THEN** the entered text remains available for the current planner workflow state
- **THEN** the text is not persisted as project data, task data, settings data, or Local Storage data

### Requirement: Planner instruction input construction
The system MUST normalize and bound additional planning instructions before including them in AI Project Planner input.

#### Scenario: Include trimmed non-empty instructions
- **WHEN** the user provides additional planning instructions with surrounding whitespace
- **THEN** the planner input builder trims the instruction text
- **THEN** the planner input includes the trimmed instruction text
- **THEN** existing project context, existing task summaries, tag context, and member context remain available according to existing planner behavior

#### Scenario: Omit whitespace-only instructions
- **WHEN** the user provides only whitespace in the additional planning instructions input
- **THEN** the planner input builder treats the instructions as empty
- **THEN** the planner input omits the instruction field or instruction context
- **THEN** generation can continue with only existing project context when AI is otherwise configured

#### Scenario: Enforce named instruction length limit
- **WHEN** the additional planning instructions exceed the named planner instruction maximum length
- **THEN** the planner shows validation feedback or applies the established safe truncation behavior for comparable planner fields
- **THEN** the provider request does not receive unbounded instruction text
- **THEN** component code does not use an unnamed magic number for the limit

### Requirement: Planner prompt uses instructions safely
The system MUST include valid additional planning instructions in the provider-neutral planner request and prompt behavior without relaxing existing planner output constraints.

#### Scenario: Prioritize instruction context when present
- **WHEN** the planner sends a provider request with non-empty additional planning instructions
- **THEN** the request includes the instruction context through the existing AI Project Planner provider path
- **THEN** the prompt or request guidance tells the model to prioritize the user-provided planning instructions within the current project context

#### Scenario: Preserve top-level proposal constraints
- **WHEN** additional planning instructions are included in a planner request
- **THEN** the prompt or request guidance still requires top-level task proposals only
- **THEN** the model is not asked to generate subtasks, assign members automatically, create tags automatically, or provide trusted persistence IDs

#### Scenario: Preserve review-before-insert
- **WHEN** the provider returns proposals influenced by additional planning instructions
- **THEN** the proposals still appear in the existing review panel before insertion
- **THEN** no task is inserted until the user selects valid proposals and explicitly confirms insertion

### Requirement: Planner instruction scope boundaries
The AI Project Planner MUST preserve approved data and architecture boundaries when additional planning instructions are used.

#### Scenario: Do not persist planner instructions
- **WHEN** additional planning instructions are entered, used for generation, cleared, retried, or left on screen
- **THEN** the system does not store the instruction text in project, task, subtask, member, tag, settings, backup, import/export, or Local Storage data
- **THEN** the `tagsflow_ai_db_v1` database key and version remain unchanged

#### Scenario: Do not change domain or repository contracts
- **WHEN** this change is implemented
- **THEN** project, task, subtask, member, tag, settings, repository port, and Local Storage database contracts remain unchanged
- **THEN** inserted planner proposals remain normal local tasks created through existing task creation behavior

#### Scenario: Keep provider concerns outside Presentation
- **WHEN** additional planning instructions are sent to the AI Project Planner
- **THEN** Presentation components do not call Groq directly
- **THEN** provider-specific prompt construction remains inside the existing AI provider infrastructure or workflow-specific non-Presentation planner code

### Requirement: Planner instruction test coverage
The system MUST include focused automated tests for additional planning instructions where current test utilities support them.

#### Scenario: Test input builder instruction behavior
- **WHEN** planner input builder tests run
- **THEN** they verify non-empty instructions are included
- **THEN** they verify empty and whitespace-only instructions are omitted
- **THEN** they verify instruction text is trimmed
- **THEN** they verify the instruction length limit is enforced

#### Scenario: Test provider request instruction behavior
- **WHEN** provider prompt or request construction tests run
- **THEN** they verify valid instruction context is included in planner requests
- **THEN** they verify existing top-level-only, no-subtask, no-auto-assignment, no-auto-tag-creation, and no-trusted-ID guidance remains present

#### Scenario: Test unchanged planner behavior without instructions
- **WHEN** planner generation, review, and insertion tests run with no additional instructions
- **THEN** existing project-context-only generation still works
- **THEN** review-before-insert behavior remains unchanged
- **THEN** no project, task, settings, repository, backup, or Local Storage contract change is required

