# project-management Specification

## Purpose
TBD - created by archiving change add-project-management. Update Purpose after archive.
## Requirements
### Requirement: Project application use cases
The system MUST provide Application-layer use cases for listing projects, getting a project by ID, creating a project, updating a project, and deleting a project through the existing `ProjectRepository` port.

#### Scenario: List projects through application use case
- **WHEN** project list data is requested by the Presentation layer
- **THEN** the Application layer calls the configured `ProjectRepository`
- **THEN** the Presentation layer receives project domain entities without accessing Local Storage directly

#### Scenario: Get project by ID through application use case
- **WHEN** a project detail route requests a project by ID
- **THEN** the Application layer calls the configured `ProjectRepository`
- **THEN** it returns the matching project or `null` when no project exists for that ID

#### Scenario: Create project through application use case
- **WHEN** valid project create input is submitted
- **THEN** the Application layer calls the configured `ProjectRepository` create method
- **THEN** the created project is persisted by the repository adapter and returned to the caller

#### Scenario: Update project through application use case
- **WHEN** valid project update input is submitted for an existing project
- **THEN** the Application layer calls the configured `ProjectRepository` update method
- **THEN** the updated project is persisted by the repository adapter and returned to the caller

#### Scenario: Delete project through application use case
- **WHEN** project deletion is confirmed
- **THEN** the Application layer calls the configured `ProjectRepository` delete method
- **THEN** repository-defined deletion behavior is used without duplicating cascade cleanup in the UI

### Requirement: Project query hooks
The system MUST provide TanStack Query hooks named `useProjects`, `useProject`, `useCreateProject`, `useUpdateProject`, and `useDeleteProject` for project reads and mutations.

#### Scenario: Read projects with query hook
- **WHEN** the Projects page renders
- **THEN** it uses `useProjects` to load projects
- **THEN** the hook returns loading, error, and data state from TanStack Query

#### Scenario: Read project detail with query hook
- **WHEN** the Project Detail page renders with a project ID
- **THEN** it uses `useProject` to load that project by ID
- **THEN** the hook returns loading, error, and project-or-null state from TanStack Query

#### Scenario: Invalidate project queries after mutation
- **WHEN** a project is created, updated, or deleted through a project mutation hook
- **THEN** project list queries are invalidated
- **THEN** the affected project detail query is invalidated when the mutation targets a specific project ID

#### Scenario: Keep UI state outside project entities
- **WHEN** project hooks manage query and mutation state
- **THEN** they use TanStack Query rather than Zustand for persisted project entities
- **THEN** business data remains persisted through repositories

### Requirement: Project form validation
The system MUST provide a Zod-backed validation schema for project form data covering title, description, objective, in-scope content, out-of-scope content, status, start date, and due date.

#### Scenario: Accept valid project form data
- **WHEN** a project form contains a non-empty title, valid status, valid nullable dates, and valid text fields
- **THEN** the validation schema accepts the form data
- **THEN** the validated data can be transformed into domain project create or update input

#### Scenario: Reject missing project title
- **WHEN** a project form is submitted without a title
- **THEN** the validation schema rejects the form data
- **THEN** the UI can display a field-level validation message

#### Scenario: Reject invalid project status
- **WHEN** a project form contains a status outside `active`, `paused`, or `completed`
- **THEN** the validation schema rejects the form data

#### Scenario: Reject invalid date range
- **WHEN** both start date and due date are provided and the due date is earlier than the start date
- **THEN** the validation schema rejects the form data
- **THEN** the UI can display a validation message explaining the date ordering problem

### Requirement: Projects page
The system MUST replace the Projects placeholder with a functional Projects page that lists projects, displays an empty state, provides a create project action, and supports navigation to project detail.

#### Scenario: Show empty projects state
- **WHEN** the project repository contains no projects
- **THEN** the Projects page shows an empty state
- **THEN** the empty state provides a create project action

#### Scenario: Show project list
- **WHEN** the project repository contains one or more projects
- **THEN** the Projects page shows each project in a card or simple table presentation
- **THEN** each project item includes its title, status, date metadata, and enough context to identify the project

#### Scenario: Navigate to project detail
- **WHEN** a user selects a project from the Projects page
- **THEN** the app navigates to `/projects/:projectId` for that project

#### Scenario: Handle project loading and errors
- **WHEN** the Projects page query is loading or errors
- **THEN** the page shows an appropriate loading or error state
- **THEN** it does not present stale placeholder copy as complete functionality

### Requirement: Project create and edit UI
The system MUST provide reusable project create and edit UI through a `ProjectForm` that uses the project validation schema and supports cancel/save behavior.

#### Scenario: Create project from form
- **WHEN** a user enters valid project details and saves a create form
- **THEN** the project is created through `useCreateProject`
- **THEN** the UI closes or resets the create surface after successful save
- **THEN** the created project appears in the Projects page list

#### Scenario: Edit project from form
- **WHEN** a user edits an existing project with valid details and saves
- **THEN** the project is updated through `useUpdateProject`
- **THEN** the updated project details are visible after the mutation succeeds

#### Scenario: Show validation messages
- **WHEN** a user submits invalid project form data
- **THEN** the form displays field-level validation messages
- **THEN** no project create or update mutation is sent for invalid data

#### Scenario: Cancel project form
- **WHEN** a user cancels a create or edit project form
- **THEN** unsaved form changes are discarded
- **THEN** no project create or update mutation is sent

### Requirement: Project detail overview foundation
The system MUST replace the Project Detail placeholder with a detail foundation that loads a project by ID, shows a not-found state, and renders Overview as the only functional tab.

#### Scenario: Show project overview
- **WHEN** a user opens `/projects/:projectId` for an existing project
- **THEN** the Project Detail page shows the project title, description, objective, in-scope content, out-of-scope content, status, start date, and due date
- **THEN** the Overview tab is the active functional tab

#### Scenario: Show project not found
- **WHEN** a user opens `/projects/:projectId` for a missing project
- **THEN** the Project Detail page shows a project not found state
- **THEN** the page offers navigation back to Projects

#### Scenario: Show future project tabs as placeholders
- **WHEN** a user views Project Detail
- **THEN** the Tasks, Kanban, and AI Insights tabs are present only as placeholders
- **THEN** they do not provide task CRUD, kanban drag and drop, or AI behavior in this slice

### Requirement: Project deletion behavior
The system MUST require user confirmation before deleting a project and MUST navigate back to Projects after deletion from the Project Detail page.

#### Scenario: Cancel project deletion
- **WHEN** a user starts deleting a project and cancels the confirmation
- **THEN** no delete mutation is sent
- **THEN** the project remains visible

#### Scenario: Confirm project deletion from detail
- **WHEN** a user confirms deletion from the Project Detail page
- **THEN** `useDeleteProject` deletes the project through the Application layer and repository adapter
- **THEN** the app navigates back to `/projects` after successful deletion

#### Scenario: Use existing repository delete behavior
- **WHEN** a project is deleted
- **THEN** the system relies on the existing repository delete behavior for project removal and dependent task/subtask cleanup
- **THEN** the Presentation layer does not directly manipulate persisted task or subtask collections

### Requirement: Project management scope boundaries
The system MUST keep this Project Management slice limited to project use cases, project hooks, project form validation, Projects page UI, Project Detail Overview foundation, and project deletion behavior.

#### Scenario: Exclude task and subtask CRUD
- **WHEN** this change is implemented
- **THEN** it does not add task CRUD or subtask CRUD behavior

#### Scenario: Exclude member and tag management UI
- **WHEN** this change is implemented
- **THEN** it does not add member management UI, tag management UI, or project member assignment UI

#### Scenario: Exclude AI, dashboard, settings, and data transfer features
- **WHEN** this change is implemented
- **THEN** it does not add AI features, dashboard metrics, settings implementation, import/export, or demo data

#### Scenario: Keep progress derived or neutral
- **WHEN** project progress is referenced by the project UI
- **THEN** it is either omitted, shown as a neutral placeholder, or shown as `0%` until task data is implemented
- **THEN** project progress is not persisted

### Requirement: Project management test coverage
The system MUST include focused automated tests for project use cases and project form validation, and MUST add project hook tests when the current test setup supports provider-based hook rendering without broad new infrastructure.

#### Scenario: Test project use cases
- **WHEN** project use case tests run
- **THEN** they verify list, get by ID, create, update, and delete behavior against a fake `ProjectRepository`

#### Scenario: Test project form validation
- **WHEN** project form validation tests run
- **THEN** they verify valid data, missing title rejection, invalid status rejection, and invalid date range rejection

#### Scenario: Test project hooks when supported
- **WHEN** the current test setup can render hooks with a QueryClient and repository provider
- **THEN** hook tests verify project query and mutation behavior
- **THEN** if hook tests are not added, the implementation notes identify the unsupported setup or missing test utility reason

