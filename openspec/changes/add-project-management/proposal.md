## Why

TagsFlow AI now has the approved MVP definition, routed foundation, domain model, repository ports, and Local Storage adapters needed to build the first real business module. Project Management is the next dependency because tasks, kanban, dashboard metrics, and AI project planning all rely on users being able to create, view, edit, and delete projects.

## What Changes

- Add Application-layer project use cases for listing projects, fetching a project by ID, creating projects, updating projects, and deleting projects through the existing `ProjectRepository` port.
- Add TanStack Query project hooks for reads and mutations: `useProjects`, `useProject`, `useCreateProject`, `useUpdateProject`, and `useDeleteProject`.
- Add Zod-backed project form validation for title, description, objective, in-scope content, out-of-scope content, status, start date, and due date.
- Replace the Projects placeholder route with a functional Projects page containing a project list, empty state, create action, project card or table presentation, and navigation to project detail.
- Add reusable create/edit project UI through `ProjectForm`, including validation messages and cancel/save behavior.
- Replace the Project Detail placeholder with a foundation detail page that loads by project ID, handles not-found projects, shows an Overview tab with project fields, and keeps Tasks, Kanban, and AI Insights as placeholders only.
- Add user-facing project deletion confirmation and return users to `/projects` after deleting from the detail page.
- Add focused tests for project use cases, project hooks if the current test setup supports them, and the project form validation schema.
- Keep task CRUD, subtask CRUD, member/tag management UI, project member assignment, dashboard metrics, AI features, settings, import/export, demo data, and kanban drag and drop out of scope.

## Capabilities

### New Capabilities
- `project-management`: Application use cases, project query hooks, project validation, project list/create/edit/delete UI, and Project Detail Overview foundation for the MVP.

### Modified Capabilities
- `project-foundation`: Projects and Project Detail routes change from module placeholders to functional Project Management screens while non-project routes remain placeholders.

## Impact

This change affects the Application, Presentation, and app composition layers, plus tests. It uses the existing Domain project entity and repository port and the existing Infrastructure Local Storage repository implementation. It should not add backend behavior, authentication, real collaboration, AI provider calls, or new persistence mechanisms, and it preserves the future path for replacing Local Storage repositories with HTTP repositories behind the same ports.
