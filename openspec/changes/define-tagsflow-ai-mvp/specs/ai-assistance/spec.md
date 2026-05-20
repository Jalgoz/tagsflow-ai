## ADDED Requirements

### Requirement: Provider-neutral AI access
The system MUST access AI features through an AI provider interface. The MVP MUST include GroqAIProvider and MockAIProvider implementations.

#### Scenario: Use configured AI provider
- **WHEN** an AI feature is requested
- **THEN** the application layer calls the configured AI provider through the provider interface
- **THEN** UI components do not call Groq directly

### Requirement: AI project planner
The system MUST provide an AI project planner that accepts project title, description, objective, in-scope content, out-of-scope content, and project dates. The output MUST contain top-level task suggestions only with title, short description, priority, start date, and due date.

#### Scenario: Generate top-level project tasks
- **WHEN** a user requests a project plan
- **THEN** the system returns validated top-level task suggestions
- **THEN** the output does not contain subtasks

### Requirement: AI subtask generator
The system MUST provide an AI subtask generator that accepts task title, task description, task scope, task priority, and project context. The output MUST contain suggested subtasks.

#### Scenario: Generate subtasks
- **WHEN** a user requests subtasks for a task
- **THEN** the system returns validated subtask suggestions for that parent task

### Requirement: AI priority suggestion
The system MUST provide AI priority suggestions for tasks and subtasks. The output MUST include one supported priority value and a concise reason.

#### Scenario: Suggest priority
- **WHEN** a user requests priority help for a task or subtask
- **THEN** the system returns a validated priority and reason

### Requirement: AI response validation
The system MUST prefer structured JSON responses and MUST validate AI responses before transforming them into internal domain-friendly DTOs.

#### Scenario: Reject invalid AI response
- **WHEN** the AI provider returns malformed or schema-invalid output
- **THEN** the system rejects the response
- **THEN** the invalid response does not create or update business data
