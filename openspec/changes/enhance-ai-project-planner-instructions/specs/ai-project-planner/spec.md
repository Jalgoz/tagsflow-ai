## ADDED Requirements

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
