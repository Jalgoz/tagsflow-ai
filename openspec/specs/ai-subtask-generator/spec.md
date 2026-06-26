# ai-subtask-generator Specification

## Purpose
TBD - created by archiving change add-ai-subtask-generator. Update Purpose after archive.
## Requirements
### Requirement: Task-scoped AI Subtask Generator entry point
The system MUST provide an AI Subtask Generator workflow for existing parent tasks from a task-focused project surface.

#### Scenario: Show generator for a selected parent task
- **WHEN** a user is working with an existing task in Project Detail > Tasks, a task detail surface, a task edit surface, or another existing task-focused project surface
- **THEN** the system exposes an AI Subtask Generator entry point scoped to that selected parent task
- **THEN** the workflow runs for one parent task at a time

#### Scenario: Preserve existing task workflows
- **WHEN** the AI Subtask Generator entry point is added
- **THEN** existing task create, edit, delete, status, checklist, tag, assignee, and manual subtask workflows remain available according to existing task and subtask behavior
- **THEN** the generator does not replace manual subtask creation or editing

#### Scenario: Keep subtasks within parent workflow
- **WHEN** generated proposals are reviewed or inserted
- **THEN** the proposals remain scoped to the selected parent task
- **THEN** generated subtasks are not shown as independent Kanban cards

### Requirement: AI configuration gating for subtask generation
The system MUST require configured AI provider settings before running AI subtask generation.

#### Scenario: Show not-configured state
- **WHEN** the current AI provider settings are missing a required API key or selected model
- **THEN** the subtask generator shows a clear not-configured state
- **THEN** the subtask generator provides navigation or a clear action toward Settings
- **THEN** no AI subtask generation request is sent

#### Scenario: Run through provider resolver
- **WHEN** AI settings are configured and the user starts subtask generation
- **THEN** the workflow resolves the provider through application-level AI provider resolution
- **THEN** Presentation components do not instantiate `GroqAIProvider` or call Groq directly

### Requirement: Additional subtask instructions
The system MUST allow users to provide optional single-turn additional instructions for AI subtask generation.

#### Scenario: Show additional instructions input
- **WHEN** the AI Subtask Generator surface is open for a selected parent task
- **THEN** it shows an optional textarea or equivalent input labeled `Additional instructions`
- **THEN** the input includes example placeholder text such as "Example: Divide this task into backend, frontend, validation, and testing work"

#### Scenario: Generate without instructions
- **WHEN** the `Additional instructions` input is empty
- **THEN** the user can run subtask generation using only the parent task and project context
- **THEN** no empty instruction value is sent to the AI provider

#### Scenario: Include trimmed non-empty instructions
- **WHEN** the user enters additional instructions with surrounding whitespace
- **THEN** the subtask generation input builder trims the instructions
- **THEN** the provider-neutral request includes the trimmed instructions

#### Scenario: Omit whitespace-only instructions
- **WHEN** the user enters only whitespace in `Additional instructions`
- **THEN** the input builder treats the instructions as empty
- **THEN** generation can continue without sending instruction context when AI is otherwise configured

#### Scenario: Keep instructions transient
- **WHEN** additional instructions are entered, used, retried, canceled, or cleared
- **THEN** the system does not persist the instruction text in project, task, subtask, settings, backup, import/export, or Local Storage data
- **THEN** the instruction remains a single-turn input and does not create conversation history

### Requirement: Subtask instruction length limit
The system MUST enforce a deterministic named maximum length for additional subtask instructions.

#### Scenario: Reuse named limit
- **WHEN** instruction validation or request construction needs the maximum instruction length
- **THEN** it uses `MAX_SUBTASK_INSTRUCTION_LENGTH = 1200`
- **THEN** Presentation components do not duplicate the limit as an unnamed magic number

#### Scenario: Prevent over-limit generation
- **WHEN** the trimmed additional instructions exceed `MAX_SUBTASK_INSTRUCTION_LENGTH`
- **THEN** generation is prevented
- **THEN** the UI shows clear validation feedback
- **THEN** no provider request receives over-limit instruction text

### Requirement: Subtask generation input construction
The system MUST build AI subtask generation input from existing project, parent task, and local context without requiring new persisted data.

#### Scenario: Include project context
- **WHEN** the user generates subtasks for a parent task
- **THEN** the request includes the current project title and description
- **THEN** available project objective, in-scope content, out-of-scope content, start date, due date, and status may be included as supporting context when already available

#### Scenario: Include parent task context
- **WHEN** the user generates subtasks for a parent task
- **THEN** the request includes the parent task title, description, in-scope content, out-of-scope content, priority, status, start date, and due date where available
- **THEN** missing optional task fields do not block generation

#### Scenario: Include existing subtasks for duplicate avoidance
- **WHEN** the selected parent task already has subtasks
- **THEN** the request includes a concise representation of existing subtasks for duplicate-avoidance context
- **THEN** existing subtasks are not treated as generation targets for nested subtasks

#### Scenario: Include tag and member context conservatively
- **WHEN** local tags or members exist
- **THEN** the request may include existing tag names and member names as conservative context
- **THEN** the request does not ask the model to create tags or assign members automatically

#### Scenario: Preserve safety rules over instructions
- **WHEN** additional instructions are included in the request
- **THEN** the prompt or request guidance tells the model to prioritize the user instructions within the selected task context
- **THEN** the same guidance states that user instructions cannot override one-level-subtask, output-contract, or review-before-insert rules

### Requirement: Subtask AI output contract
The system MUST define a strict AI output contract for subtask proposals only.

#### Scenario: Return subtask proposals only
- **WHEN** the AI provider returns a subtask generation response
- **THEN** the response contains proposed subtasks for the selected parent task only
- **THEN** the response does not contain top-level tasks, nested subtasks, projects, members, settings, Kanban changes, or persistence instructions

#### Scenario: Require supported proposal fields
- **WHEN** a subtask proposal is accepted from the AI response
- **THEN** it includes a subtask title, supported priority value, and supported status value
- **THEN** the status defaults to `todo` before review when it is absent unless provider-neutral validation accepts another safe supported status

#### Scenario: Accept supported optional fields
- **WHEN** the AI response includes optional proposal fields
- **THEN** description, due date, checklist items, and existing tag suggestions are accepted only when supported by the current subtask shape
- **THEN** tag suggestions are limited to existing local tag names

#### Scenario: Reject unsupported generated fields
- **WHEN** the AI response includes generated IDs, nested subtasks, new tag names, automatic member assignments, or unknown fields that imply unsupported persistence behavior
- **THEN** those values are not trusted
- **THEN** the response or affected proposal is rejected before insertion

#### Scenario: Preserve parent and subtask contracts
- **WHEN** subtask generation is implemented
- **THEN** it does not change the parent task contract
- **THEN** it does not change the subtask contract
- **THEN** it does not change repository contracts or the Local Storage database version

### Requirement: Subtask response validation
The system MUST parse and validate AI Subtask Generator responses with Zod before using them.

#### Scenario: Reject malformed JSON
- **WHEN** the provider returns malformed JSON for a subtask generation response
- **THEN** the generator rejects the response with a clear non-technical error state
- **THEN** no subtask create mutation is sent

#### Scenario: Reject schema-invalid output
- **WHEN** the provider returns parseable JSON that does not satisfy the subtask generation schema
- **THEN** the generator rejects the response with a clear non-technical error state
- **THEN** invalid output is not transformed into reviewable proposals

#### Scenario: Reject invalid proposal values
- **WHEN** the provider returns nested subtasks, unsupported priority values, unsupported status values, invalid dates, generated IDs, or unknown tag suggestions
- **THEN** the invalid response or affected proposal is rejected before review or insertion
- **THEN** invalid AI output is never inserted into local data

#### Scenario: Validate before review
- **WHEN** the provider returns a valid subtask generation response
- **THEN** the response is transformed into reviewable subtask proposal drafts
- **THEN** only validated proposal data is shown in the review panel

### Requirement: Subtask generation UX states
The system MUST provide clear generation, retry, cancel, empty-selection, and error states for the AI Subtask Generator.

#### Scenario: Show loading state
- **WHEN** subtask generation is in progress
- **THEN** the UI shows a loading or pending state
- **THEN** duplicate generation requests are disabled or otherwise prevented

#### Scenario: Show provider failure safely
- **WHEN** the AI provider request fails
- **THEN** the generator shows a clear visible error state
- **THEN** the error does not include the full API key, authorization header, or raw provider error dump

#### Scenario: Retry generation
- **WHEN** generation fails or the user wants a new result after a completed generation
- **THEN** the generator provides a retry or generate-again action
- **THEN** retrying preserves the current additional instructions while the generation surface remains open

#### Scenario: Cancel review without insertion
- **WHEN** the user closes or cancels the generated proposal review
- **THEN** no subtask create mutation is sent
- **THEN** the parent task and local data remain unchanged by the generated proposals

### Requirement: Review-before-insert for generated subtasks
The system MUST require user review before AI-generated subtask proposals are inserted into local data.

#### Scenario: Display proposals for review
- **WHEN** a valid subtask generation response is returned
- **THEN** the generator displays proposed subtasks in a review panel
- **THEN** no subtask create mutation is sent merely because the provider returned a response

#### Scenario: Select proposals
- **WHEN** multiple subtask proposals are available
- **THEN** the user can choose which proposals will be inserted
- **THEN** unselected proposals are not inserted

#### Scenario: Edit proposal fields
- **WHEN** the review panel is open
- **THEN** the user can edit title, description, priority, status, and due date before insertion where practical
- **THEN** edited proposal values are validated before insertion

#### Scenario: Block empty selection
- **WHEN** the user attempts to insert with no selected proposals
- **THEN** no subtask create mutation is sent
- **THEN** the UI explains that at least one proposal must be selected

### Requirement: Confirmed generated subtask insertion
The system MUST insert selected AI-generated proposals as normal subtasks only after explicit user confirmation.

#### Scenario: Insert selected subtasks
- **WHEN** the user confirms insertion with one or more valid selected proposals
- **THEN** the system creates subtasks through existing subtask creation use cases or hooks
- **THEN** each created subtask belongs to the selected parent task
- **THEN** created subtasks are normal editable, deletable, and exportable local subtasks

#### Scenario: Show insertion success
- **WHEN** selected generated subtasks are inserted successfully
- **THEN** the UI shows a non-blocking success toast
- **THEN** the review state is cleared or updated so the same proposals are not accidentally inserted twice

#### Scenario: Handle partial insertion failure
- **WHEN** at least one selected proposal is inserted and at least one selected proposal fails
- **THEN** successfully inserted proposals are not inserted again on retry
- **THEN** the UI shows safe feedback for failed proposals without exposing API keys or raw provider dumps

#### Scenario: Refresh affected views
- **WHEN** generated subtasks are inserted
- **THEN** Project Detail Tasks, task progress, Project Kanban metadata, Global Tasks, Global Kanban, and Dashboard data are refreshed through existing query invalidation behavior where those views depend on task or subtask data

### Requirement: AI Subtask Generator safety boundaries
The AI Subtask Generator MUST preserve approved product, data, and architecture boundaries.

#### Scenario: Do not implement unrelated AI workflows
- **WHEN** this change is implemented
- **THEN** it does not change AI Project Planner behavior
- **THEN** it does not implement AI Priority Suggestion, AI Project Summary, or a global AI chat interface

#### Scenario: Do not persist unsupported data
- **WHEN** subtask generation, review, retry, cancellation, or insertion occurs
- **THEN** the system does not persist generated proposals before confirmation
- **THEN** it does not persist additional instructions, conversation history, provider raw responses, or raw prompts

#### Scenario: Preserve storage and backup boundaries
- **WHEN** this change is implemented
- **THEN** it does not change the `tagsflow_ai_db_v1` key or database version
- **THEN** it does not redesign import/export or include API keys or transient instructions in backups

#### Scenario: Preserve task and Kanban boundaries
- **WHEN** this change is implemented
- **THEN** it does not generate top-level tasks
- **THEN** it does not change Kanban drag-and-drop behavior, Kanban columns, or global Kanban editing behavior

### Requirement: AI Subtask Generator test coverage
The system MUST include focused automated tests for the AI Subtask Generator where current test utilities support them.

#### Scenario: Test input builder
- **WHEN** subtask generation input builder tests run
- **THEN** they verify project context, parent task context, existing subtasks, conservative tag/member context, and optional fields are represented correctly

#### Scenario: Test instruction behavior
- **WHEN** instruction handling tests run
- **THEN** they verify non-empty instructions are trimmed and included in provider context
- **THEN** they verify empty and whitespace-only instructions are omitted
- **THEN** they verify `MAX_SUBTASK_INSTRUCTION_LENGTH` is enforced
- **THEN** they verify generation still works without instructions

#### Scenario: Test instruction safety
- **WHEN** provider prompt or request construction tests run with instructions requesting unsupported behavior
- **THEN** they verify instructions cannot override one-level-subtask and review-before-insert rules
- **THEN** they verify the request does not ask the model to generate top-level tasks, nested subtasks, member assignments, new tags, trusted IDs, or automatic insertion

#### Scenario: Test response validation
- **WHEN** response validation tests run
- **THEN** they cover valid output, malformed JSON, schema-invalid output, nested subtask rejection, generated ID rejection, unsupported priority/status rejection, invalid date rejection, and unknown tag suggestion rejection

#### Scenario: Test review and insertion behavior
- **WHEN** review and insertion tests run
- **THEN** they verify proposal selection, empty-selection handling, no insertion before explicit confirmation, insert selected subtasks behavior, duplicate-insert prevention after success, cancel-without-insert behavior, and success toast feedback

#### Scenario: Test AI configuration and mock provider
- **WHEN** generator tests render or run without configured AI
- **THEN** they verify the not-configured state and Settings navigation are visible
- **THEN** they verify no provider generation request is sent
- **WHEN** tests use `MockAIProvider`
- **THEN** the mock provider returns deterministic valid subtask proposals without network access

#### Scenario: Test persistence boundaries
- **WHEN** persistence or backup tests run after instructions are entered and generation is attempted
- **THEN** they verify additional instructions are not persisted in Local Storage or exported backups
- **THEN** inserted subtasks remain normal local subtasks created through existing subtask behavior

