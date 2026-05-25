## MODIFIED Requirements

### Requirement: Project detail overview foundation
The system MUST provide a Project Detail page that loads a project by ID, shows a not-found state, renders Overview as a functional tab, renders Tasks as the functional project-scoped task management entry point, and renders Kanban as the functional project-scoped task board entry point.

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

#### Scenario: Show functional project Kanban tab
- **WHEN** a user views Project Detail and selects the Kanban tab
- **THEN** the Kanban tab provides project-scoped task board behavior according to the Project Kanban capability
- **THEN** task, subtask, member, and tag data needed by the board is loaded through Application-layer hooks rather than direct Local Storage access

#### Scenario: Show future AI Insights tab as placeholder
- **WHEN** a user views Project Detail
- **THEN** the AI Insights tab remains present only as a placeholder
- **THEN** it does not provide AI behavior in this slice
