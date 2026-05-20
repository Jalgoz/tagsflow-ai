## ADDED Requirements

### Requirement: Project lifecycle
The system MUST allow users to create, edit, view, and delete projects. A project MUST include title, description, objective, in-scope content, out-of-scope content, status, start date, due date, and assigned local members.

#### Scenario: Create a project
- **WHEN** a user submits valid project details
- **THEN** the system stores the project locally
- **THEN** the project appears in the projects area

#### Scenario: Edit a project
- **WHEN** a user updates an existing project's details
- **THEN** the system persists the updated project locally
- **THEN** the updated values are shown when the project is reopened

### Requirement: Project statuses
The system MUST support project statuses of active, paused, and completed.

#### Scenario: Change project status
- **WHEN** a user changes a project's status
- **THEN** the project is saved with one of the supported statuses

### Requirement: Project detail tabs
The system MUST provide Overview, Tasks, Kanban, and AI Insights tabs in the project detail route.

#### Scenario: Navigate project detail tabs
- **WHEN** a user opens a project detail page
- **THEN** the user can switch between Overview, Tasks, Kanban, and AI Insights without losing project context
