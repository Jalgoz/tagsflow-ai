# domain-model-and-rules Specification

## Purpose
TBD - created by archiving change add-domain-model-and-rules. Update Purpose after archive.
## Requirements
### Requirement: Domain entity types
The system MUST define strict TypeScript domain types for `Project`, `Task`, `Subtask`, `ChecklistItem`, `Member`, `Tag`, `AppSettings`, and AI-facing DTOs in the Domain layer.

#### Scenario: Import domain entities
- **WHEN** application or infrastructure code needs a TagsFlow AI business entity type
- **THEN** it can import the type from the Domain layer
- **THEN** the type does not require React, TanStack Query, Local Storage, browser APIs, or provider SDKs

#### Scenario: Represent project task relationships
- **WHEN** a task or subtask is represented by the domain model
- **THEN** the task has a project relationship
- **THEN** a subtask has a parent task relationship
- **THEN** a subtask does not contain nested subtasks

### Requirement: Domain status and priority constants
The system MUST define canonical domain constants and types for project statuses, task statuses, and priorities.

#### Scenario: Use project statuses
- **WHEN** domain code references project status values
- **THEN** the allowed statuses are `active`, `paused`, and `completed`

#### Scenario: Use task statuses
- **WHEN** domain code references task or subtask status values
- **THEN** the allowed statuses are `backlog`, `todo`, `in_progress`, `blocked`, `review`, and `done`

#### Scenario: Use priorities
- **WHEN** domain code references task, subtask, or AI planning priority values
- **THEN** the allowed priorities are `low`, `medium`, `high`, and `urgent`

### Requirement: Repository ports
The system MUST define repository port interfaces for `ProjectRepository`, `TaskRepository`, `SubtaskRepository`, `MemberRepository`, `TagRepository`, and `SettingsRepository`.

#### Scenario: Implement repository adapters
- **WHEN** infrastructure code implements Local Storage or future HTTP persistence
- **THEN** it can implement the repository ports without changing domain rules
- **THEN** the ports do not expose Local Storage, HTTP, or framework-specific implementation details

#### Scenario: Query and mutate aggregate data
- **WHEN** application use cases need to read or mutate projects, tasks, subtasks, members, tags, or settings
- **THEN** the repository ports provide explicit methods for those operations using domain types

### Requirement: Provider-neutral AI provider port
The system MUST define an `AIProvider` interface for `listModels`, `testConnection`, `generateProjectPlan`, `generateSubtasks`, `suggestPriority`, and `summarizeProject`.

#### Scenario: Implement Groq behind the AI provider port
- **WHEN** infrastructure implements `GroqAIProvider`
- **THEN** it can satisfy the provider-neutral `AIProvider` interface
- **THEN** application and domain code do not depend on Groq-specific request or response shapes

#### Scenario: Return domain-friendly AI DTOs
- **WHEN** an AI provider returns project plans, subtasks, priority suggestions, or project summaries
- **THEN** those results conform to documented domain-friendly DTOs
- **THEN** raw provider output is not exposed as a domain contract

### Requirement: Task progress calculation
The system MUST provide a pure `calculateTaskProgress` domain rule.

#### Scenario: Task without subtasks is done
- **WHEN** a task has no subtasks and its status is `done`
- **THEN** `calculateTaskProgress` returns `100`

#### Scenario: Task without subtasks is not done
- **WHEN** a task has no subtasks and its status is not `done`
- **THEN** `calculateTaskProgress` returns `0`

#### Scenario: Task with subtasks derives progress
- **WHEN** a task has subtasks
- **THEN** `calculateTaskProgress` returns the percentage of subtasks whose status is `done`

### Requirement: Project progress calculation
The system MUST provide a pure `calculateProjectProgress` domain rule that derives project progress from top-level task progress.

#### Scenario: Project with tasks derives average progress
- **WHEN** a project has top-level tasks
- **THEN** `calculateProjectProgress` returns the average of each top-level task progress

#### Scenario: Project without tasks has no progress
- **WHEN** a project has no top-level tasks
- **THEN** `calculateProjectProgress` returns `0`

### Requirement: Deadline detection rules
The system MUST provide pure domain rules to detect overdue tasks and subtasks and upcoming task and subtask deadlines.

#### Scenario: Detect overdue work
- **WHEN** a task or subtask has a due date before the reference date and is not `done`
- **THEN** the overdue detection rule includes that item

#### Scenario: Exclude completed overdue work
- **WHEN** a task or subtask has a due date before the reference date and its status is `done`
- **THEN** the overdue detection rule does not include that item

#### Scenario: Detect upcoming deadlines
- **WHEN** a task or subtask has a due date within the configured upcoming window and is not `done`
- **THEN** the upcoming deadline rule includes that item

### Requirement: Completion guard rules
The system MUST provide pure domain rules to detect pending subtasks before a task is marked done and to enforce one-level subtasks.

#### Scenario: Warn before completing task with pending subtasks
- **WHEN** a task has at least one subtask whose status is not `done`
- **THEN** the pending-subtask rule reports that confirmation is required before marking the task done

#### Scenario: Allow completing task with completed subtasks
- **WHEN** all subtasks for a task have status `done`
- **THEN** the pending-subtask rule reports that no pending-subtask confirmation is required

#### Scenario: Reject nested subtasks
- **WHEN** a subtask input includes nested subtasks or a parent subtask relationship
- **THEN** the one-level subtask rule returns a validation failure

### Requirement: Checklist item validation
The system MUST provide a pure domain rule that validates checklist items contain only checklist-specific data.

#### Scenario: Accept valid checklist item
- **WHEN** a checklist item contains text and a completed boolean
- **THEN** the checklist validation rule accepts the item

#### Scenario: Reject checklist item with task fields
- **WHEN** a checklist item contains due date, priority, assignee, status, or other task-like fields
- **THEN** the checklist validation rule returns a validation failure

### Requirement: Domain rule tests
The system MUST include focused unit test coverage for domain rules when a test stack exists, or include a justified test setup task when no test stack exists.

#### Scenario: Existing test stack is available
- **WHEN** the implementation project already has a unit test stack
- **THEN** the domain rule implementation includes focused unit tests for progress, deadline, completion guard, one-level subtask, and checklist validation behavior

#### Scenario: No test stack is available
- **WHEN** the implementation project does not have a unit test stack
- **THEN** the implementation plan includes a small, justified task to add a suitable unit test setup before writing domain rule tests

