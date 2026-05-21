## MODIFIED Requirements

### Requirement: Placeholder pages
The system MUST render placeholder pages for Dashboard, Tasks, Global Kanban, Members, and Settings until the corresponding business modules are implemented. The Projects route and Project Detail route MUST be owned by the Project Management module once that module is implemented.

#### Scenario: View a remaining placeholder page
- **WHEN** a user opens Dashboard, Tasks, Global Kanban, Members, or Settings before its business module is implemented
- **THEN** the app shows a minimal placeholder page for that section
- **THEN** the placeholder does not present unfinished business functionality as complete

#### Scenario: View project management routes after project module implementation
- **WHEN** a user opens `/projects` or `/projects/:projectId` after the Project Management module is implemented
- **THEN** the app renders the functional Project Management screens instead of the foundation placeholders
