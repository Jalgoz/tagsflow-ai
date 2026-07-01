## ADDED Requirements

### Requirement: MVP route and workflow readiness audit
The system MUST complete a final readiness audit of approved MVP routes and workflows before this change is considered implemented.

#### Scenario: Audit approved routes
- **WHEN** the readiness pass is performed
- **THEN** Dashboard, Projects, Project Detail, Project Detail > Tasks, Project Detail > Kanban, Project Detail > AI Insights, Global Tasks, Global Kanban, Members/Tags, Settings, and onboarding/demo data workflows are reviewed against current OpenSpec requirements
- **THEN** discovered implementation drift, regressions, and reviewable polish defects are either fixed or recorded with a clear reason when intentionally deferred

#### Scenario: Preserve existing MVP behavior
- **WHEN** route and workflow issues are fixed
- **THEN** the fixes do not add new product features, new AI workflows, backend behavior, authentication, cloud sync, or real collaboration
- **THEN** approved project, task, subtask, member, tag, settings, repository, and AI provider contracts remain unchanged unless a proven bug requires an explicitly documented compatible fix

### Requirement: Consistent MVP UI states
The system MUST provide consistent MVP UI feedback and form states across implemented routes.

#### Scenario: Verify common UI states
- **WHEN** a route or workflow has no data, pending data, invalid input, failed action, or successful mutation
- **THEN** the UI uses consistent empty, loading, error, validation, and success states aligned with existing shared UI patterns
- **THEN** successful create, update, delete, assignment, import, export, reset, status-change, and AI actions use non-blocking toast feedback where applicable

#### Scenario: Verify destructive and decision dialogs
- **WHEN** a destructive action or explicit user decision is required
- **THEN** the workflow uses the shared confirmation or dialog pattern
- **THEN** the copy clearly describes what will be removed, changed, or affected
- **THEN** successful completion is not reported through a blocking modal

#### Scenario: Verify form required markers
- **WHEN** forms for projects, tasks, subtasks, members, tags, settings, imports, or AI instructions render required fields
- **THEN** required fields show visible asterisks and validation messages when invalid
- **THEN** optional fields do not show required markers

### Requirement: Responsive MVP usability
The system MUST keep core MVP workflows usable on desktop, tablet, and supported narrow/mobile viewports.

#### Scenario: Verify major responsive surfaces
- **WHEN** Dashboard, Projects, Project Detail tabs, Global Tasks, Members/Tags, Settings, onboarding, and AI Insights are viewed at desktop, tablet, and narrow/mobile widths supported by the app shell
- **THEN** primary content remains readable and actionable
- **THEN** controls, forms, tables, cards, and dialogs do not overlap or clip important text

#### Scenario: Verify Kanban responsive behavior
- **WHEN** Project Kanban or Global Kanban is viewed on narrower widths
- **THEN** the board remains usable through responsive sizing or horizontal scrolling
- **THEN** configured columns remain accessible
- **THEN** task cards and board controls do not resize in a way that makes interaction unreliable

#### Scenario: Verify dialog and form usability
- **WHEN** create, edit, import, reset, confirmation, task detail, AI review, or AI result dialogs render on smaller screens
- **THEN** the dialog fits within the viewport with usable scrolling where needed
- **THEN** primary and cancel actions remain reachable

### Requirement: MVP edge-case hardening
The system MUST handle important empty, missing, invalid, and relationship-cleanup edge cases without breaking approved workflows.

#### Scenario: Handle empty local data
- **WHEN** there are no projects, tasks, subtasks, members, or tags
- **THEN** Dashboard, Projects, Global Tasks, Global Kanban, Members/Tags, Settings, and onboarding/demo data surfaces render clear empty states and do not crash

#### Scenario: Handle missing optional values
- **WHEN** projects, tasks, or subtasks have missing optional descriptions, scope fields, dates, assignees, tags, checklist items, or subtasks
- **THEN** affected routes render neutral display values where needed
- **THEN** derived metrics, filters, sorting, Kanban grouping, and AI input builders do not treat missing optional values as fatal errors

#### Scenario: Handle deleted references
- **WHEN** assigned members or referenced tags are deleted through approved workflows
- **THEN** projects, tasks, subtasks, tables, filters, cards, detail views, and AI context builders handle removed references without stale broken labels or crashes
- **THEN** cleanup follows existing domain and repository behavior

#### Scenario: Handle pending subtasks completion safety
- **WHEN** an interaction marks a task as `done` while at least one subtask remains not done
- **THEN** the system shows the approved warning confirmation before sending the mutation
- **THEN** canceling the confirmation leaves the task unchanged

#### Scenario: Handle reset and demo reload
- **WHEN** the user resets local data and then loads demo data again through approved flows
- **THEN** the app returns to a valid editable local state
- **THEN** stale projects, tasks, subtasks, members, tags, AI outputs, or previous backup/import errors do not remain visible as active data

### Requirement: AI workflow hardening
The system MUST harden all approved AI workflows without adding new AI features or mutating data outside approved review flows.

#### Scenario: Handle AI not configured
- **WHEN** AI Project Planner, AI Subtask Generator, AI Priority Suggestion, or AI Project Summary is opened without required AI provider settings
- **THEN** each workflow shows a clear not-configured state or Settings navigation
- **THEN** no provider request is sent

#### Scenario: Handle AI provider and validation failures
- **WHEN** the configured provider fails or returns malformed or schema-invalid output
- **THEN** the workflow shows a clear non-technical error state
- **THEN** no local data mutation is sent unless the workflow already has a validated, user-confirmed mutation path
- **THEN** the displayed error does not expose API keys, authorization headers, raw prompts, raw provider dumps, or raw provider responses

#### Scenario: Preserve AI mutation boundaries
- **WHEN** AI project planning or AI subtask generation returns validated suggestions
- **THEN** suggestions are not inserted until the user explicitly reviews and accepts them
- **WHEN** AI priority suggestion returns a validated priority
- **THEN** the priority is not applied until the user explicitly accepts it
- **WHEN** AI Project Summary returns a validated summary
- **THEN** the summary remains read-only and does not mutate project, task, subtask, member, tag, settings, dashboard, Kanban, backup, or Local Storage data

#### Scenario: Keep AI transient data out of persistence
- **WHEN** additional AI instructions, prompts, responses, generated summaries, or rejected AI outputs are created, retried, cleared, or left on screen
- **THEN** they are not persisted to projects, tasks, subtasks, members, tags, settings, Local Storage, backups, or imports
- **THEN** no conversation history is created

### Requirement: Data safety and architecture verification
The system MUST verify final MVP data-safety and architecture boundaries.

#### Scenario: Verify secret-safe settings and backups
- **WHEN** settings are saved, displayed, exported, imported, reset, or restored from demo data
- **THEN** the full Groq API key is never shown after saving
- **THEN** backup export does not include the API key
- **THEN** backup import does not restore API key values from imported JSON

#### Scenario: Verify persistence boundaries
- **WHEN** project progress, task progress, dashboard metrics, AI instructions, generated AI summaries, prompts, raw responses, or provider errors are produced
- **THEN** they are not persisted as derived or transient business data
- **THEN** persisted business data remains under the approved `tagsflow_ai_db_v1` database key unless a proven bug requires an explicitly documented compatible exception

#### Scenario: Verify layer boundaries
- **WHEN** final code is inspected or tested
- **THEN** Presentation does not read or write Local Storage directly
- **THEN** Presentation does not construct `GroqAIProvider` or call Groq directly
- **THEN** Domain does not depend on React, TanStack Query, Local Storage, Groq, browser APIs, or UI components
- **THEN** Infrastructure remains behind repository and provider interfaces

### Requirement: Final MVP test hardening
The system MUST strengthen automated coverage around discovered gaps and high-risk MVP boundaries.

#### Scenario: Test domain and persistence rules
- **WHEN** final hardening tests run
- **THEN** they cover project/task progress, task completion warnings, one-level subtasks, checklist shape, member deletion cleanup, Local Storage validation, backup export API-key exclusion, backup import API-key neutralization, import validation failures, reset behavior, and demo data validity where current test utilities support them

#### Scenario: Test product workflows
- **WHEN** final hardening tests run
- **THEN** they cover task/subtask workflows, dashboard metric derivation, Project Kanban interactions, Global Kanban interactions, Global Tasks visibility and filtering, onboarding/demo data behavior, settings behavior, and important empty-state paths where current test utilities support them

#### Scenario: Test AI workflow boundaries
- **WHEN** final hardening tests run
- **THEN** they cover AI provider configuration gating, provider failure handling, malformed output validation, AI Project Planner, AI Subtask Generator, AI Priority Suggestion, AI Project Summary, and regression checks that additional instructions, prompts, responses, summaries, and API keys are not unintentionally persisted or exported

### Requirement: Developer readiness verification
The system MUST finish the hardening pass with project and OpenSpec verification.

#### Scenario: Run available automated checks
- **WHEN** implementation work for this change is complete
- **THEN** available lint, typecheck or build, and test scripts are run
- **THEN** strict OpenSpec validation passes using the target form accepted by the CLI, such as `openspec validate --all --strict`
- **THEN** failures are fixed or documented with exact blockers when they cannot be resolved in the current environment

#### Scenario: Remove incomplete iteration artifacts
- **WHEN** the final readiness pass is complete
- **THEN** temporary debug logs, dead code from incomplete iterations, unused imports, unrelated generated files, and unjustified dependency additions are not left in the change

#### Scenario: Verify manual MVP checklist
- **WHEN** automated checks pass
- **THEN** the final handoff includes a manual verification checklist for first launch, demo data, dashboard metrics, project/member/tag/task/subtask CRUD, Project Kanban, Global Kanban, Global Tasks, Settings theme, backup export/import validation, reset, Groq configuration, connection testing, and all approved AI workflows
