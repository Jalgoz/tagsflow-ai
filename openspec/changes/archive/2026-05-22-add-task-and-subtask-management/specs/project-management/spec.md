## MODIFIED Requirements

### Requirement: Project detail overview foundation
The system MUST provide a Project Detail page that loads a project by ID, shows a not-found state, renders Overview as a functional tab, and renders Tasks as the functional project-scoped task management entry point.

#### Scenario: Show project overview
- **WHEN** a user opens `/projects/:projectId` for an existing project
- **THEN** the Project Detail page shows the project title, description, objective, in-scope content, out-of-scope content, status, start date, and due date
- **THEN** the Overview tab is a functional tab

#### Scenario: Show project not found
- **WHEN** a user opens `/projects/:projectId` for a missing project
- **THEN** the Project Detail page shows a project not found state
- **THEN** the page offers navigation back to Projects

#### Scenario: Show functional project tasks tab
- **WHEN** a user views Project Detail and selects the Tasks tab
- **THEN** the Tasks tab provides project-scoped task and subtask management according to the Task and Subtask Management capability
- **THEN** task and subtask data is loaded through Application-layer hooks rather than direct Local Storage access

#### Scenario: Show future non-task tabs as placeholders
- **WHEN** a user views Project Detail
- **THEN** the Kanban and AI Insights tabs are present only as placeholders
- **THEN** they do not provide kanban drag and drop or AI behavior in this slice

### Requirement: Project management scope boundaries
The system MUST keep the Project Management foundation limited to project use cases, project hooks, project form validation, Projects page UI, Project Detail Overview, project deletion behavior, and integration points for separately approved project tabs.

#### Scenario: Allow task and subtask CRUD through approved task capability
- **WHEN** the Task and Subtask Management capability is implemented
- **THEN** Project Detail > Tasks may provide task CRUD and subtask CRUD behavior
- **THEN** the task behavior remains implemented through the task capability's Application, Domain, and Presentation boundaries

#### Scenario: Exclude member and tag management UI
- **WHEN** this change is implemented
- **THEN** it does not add member catalog management UI, tag catalog management UI, or project member assignment UI

#### Scenario: Exclude AI, dashboard, settings, and data transfer features
- **WHEN** this change is implemented
- **THEN** it does not add AI features, dashboard metrics, settings implementation, import/export, or demo data

#### Scenario: Keep progress derived or neutral
- **WHEN** project progress is referenced by the project UI
- **THEN** it is either omitted, shown as a neutral placeholder, or derived from task and subtask status through approved domain rules
- **THEN** project progress is not persisted
