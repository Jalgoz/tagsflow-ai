# project-foundation Specification

## Purpose
TBD - created by archiving change implement-project-foundation. Update Purpose after archive.
## Requirements
### Requirement: Foundation dependency baseline
The system MUST include the frontend dependencies required for the TagsFlow AI foundation slice, including Tailwind CSS, React Router, TanStack Query, TanStack Table, Zustand, React Hook Form, Zod, dnd-kit, and Recharts.

#### Scenario: Build against the foundation stack
- **WHEN** the foundation slice is installed
- **THEN** the project can build using the agreed frontend dependency baseline

### Requirement: Layered source structure
The system MUST provide an initial source structure for `app`, `presentation`, `application`, `domain`, `infrastructure`, and `shared`.

#### Scenario: Locate architecture layers
- **WHEN** a developer inspects the source tree
- **THEN** the layer folders are present and visually reflect the intended architecture

### Requirement: Shared constants
The system MUST define shared constants for route paths, kanban column configuration, task status labels, task priority labels, and the Local Storage database key.

#### Scenario: Reuse shared contracts
- **WHEN** later modules need route paths or status labels
- **THEN** they can import them from shared constants instead of duplicating values

### Requirement: Routed application shell
The system MUST replace the default starter screen with a routed application shell that includes a fixed sidebar and a main routed content area.

#### Scenario: Open the app shell
- **WHEN** a user opens the application
- **THEN** the user sees the TagsFlow AI shell instead of the default Vite starter screen
- **THEN** the shell contains fixed navigation and a routed content region

### Requirement: Foundation routes
The system MUST provide routes for `/dashboard`, `/projects`, `/projects/:projectId`, `/tasks`, `/kanban`, `/members`, and `/settings`.

#### Scenario: Navigate to a foundation route
- **WHEN** a user opens one of the foundation routes
- **THEN** the route resolves inside the app shell

### Requirement: Placeholder pages
The system MUST render placeholder pages for Dashboard, Tasks, Global Kanban, and Settings until the corresponding business modules are implemented. The Projects route and Project Detail route MUST be owned by the Project Management module once that module is implemented. The Members route MUST be owned by the Member and Tag Management module once that module is implemented.

#### Scenario: View a remaining placeholder page
- **WHEN** a user opens Dashboard, Tasks, Global Kanban, or Settings before its business module is implemented
- **THEN** the app shows a minimal placeholder page for that section
- **THEN** the placeholder does not present unfinished business functionality as complete

#### Scenario: View project management routes after project module implementation
- **WHEN** a user opens `/projects` or `/projects/:projectId` after the Project Management module is implemented
- **THEN** the app renders the functional Project Management screens instead of the foundation placeholders

#### Scenario: View members route after member and tag module implementation
- **WHEN** a user opens `/members` after the Member and Tag Management module is implemented
- **THEN** the app renders the functional member and tag catalog screens instead of the foundation placeholder

### Requirement: Light and dark ready shell
The system MUST keep the app shell and placeholder pages structured so later work can apply light and dark themes without reworking the layout contract.

#### Scenario: Prepare for theming
- **WHEN** the shell is rendered
- **THEN** the layout remains stable enough to support later light and dark theme styling

