## 1. Application Project Module

- [ ] 1.1 Create an Application-layer project feature structure for use cases, query hooks, query keys, validation, and exports.
- [ ] 1.2 Implement `listProjects` using the `ProjectRepository` port.
- [ ] 1.3 Implement `getProjectById` using the `ProjectRepository` port and returning `Project | null`.
- [ ] 1.4 Implement `createProject` using the `ProjectRepository` port and domain create input.
- [ ] 1.5 Implement `updateProject` using the `ProjectRepository` port and domain update input.
- [ ] 1.6 Implement `deleteProject` using the `ProjectRepository` port without duplicating repository cascade cleanup.
- [ ] 1.7 Add focused project use case tests with a fake `ProjectRepository` covering list, get by ID, create, update, and delete.

## 2. App Composition and Query Hooks

- [ ] 2.1 Add a QueryClient provider to the app composition if it is not already present.
- [ ] 2.2 Add project repository composition so hooks receive a `ProjectRepository` without importing Local Storage adapters in pages.
- [ ] 2.3 Define centralized project query keys for list and detail queries.
- [ ] 2.4 Implement `useProjects` with loading, error, and project list data state.
- [ ] 2.5 Implement `useProject` with loading, error, and project-or-null data state.
- [ ] 2.6 Implement `useCreateProject` and invalidate project list queries after successful create.
- [ ] 2.7 Implement `useUpdateProject` and invalidate project list plus affected detail queries after successful update.
- [ ] 2.8 Implement `useDeleteProject` and invalidate project list plus affected detail queries after successful delete.
- [ ] 2.9 Add project hook tests if the existing test setup supports QueryClient and repository provider rendering without broad new test infrastructure.

## 3. Project Form Validation

- [ ] 3.1 Implement a Zod project form schema where title is required, status defaults to active, descriptive fields may be empty strings, and start/due dates may be null.
- [ ] 3.2 Add form-to-domain mapping helpers for project create and update payloads.
- [ ] 3.3 Ensure form-to-domain mapping defaults or preserves `memberIds` without exposing project member assignment UI in this slice.
- [ ] 3.4 Validate that due date cannot be earlier than start date when both dates are provided.
- [ ] 3.5 Add schema tests for valid input, missing title, invalid status, nullable dates, and invalid date range.

## 4. Reusable Project Form UI

- [ ] 4.1 Create a reusable `ProjectForm` component using React Hook Form and the project Zod schema.
- [ ] 4.2 Add form fields for title, description, objective, in-scope content, out-of-scope content, status, start date, and due date.
- [ ] 4.3 Show field-level validation messages and prevent create/update mutations when validation fails.
- [ ] 4.4 Implement save behavior for create and edit modes through submit callbacks.
- [ ] 4.5 Implement cancel behavior that discards unsaved form state without sending mutations.

## 5. Projects Page

- [ ] 5.1 Replace the Projects placeholder with a page that loads projects through `useProjects`.
- [ ] 5.2 Add loading and error states for project list loading.
- [ ] 5.3 Add an empty state with a create project action.
- [ ] 5.4 Add a compact card or simple table project list showing title, status, dates, and summary context.
- [ ] 5.5 Add navigation from each project item to `/projects/:projectId`.
- [ ] 5.6 Add create project UI from the Projects page and close or reset it after successful creation.
- [ ] 5.7 Add edit project UI from the Projects page or project item actions and refresh visible data after successful update.

## 6. Project Detail Page

- [ ] 6.1 Replace the Project Detail placeholder with a page that reads `projectId` and loads the project through `useProject`.
- [ ] 6.2 Add loading and error states for project detail loading.
- [ ] 6.3 Add a project not-found state with navigation back to `/projects`.
- [ ] 6.4 Render the Overview tab with title, description, objective, in-scope content, out-of-scope content, status, start date, and due date.
- [ ] 6.5 Render Tasks, Kanban, and AI Insights tabs as placeholders only.
- [ ] 6.6 Add edit project UI from the Project Detail page and update the overview after successful save.

## 7. Project Deletion

- [ ] 7.1 Add delete confirmation UI before sending any project delete mutation.
- [ ] 7.2 Wire confirmed deletion to `useDeleteProject`.
- [ ] 7.3 Keep cancel deletion behavior from sending a mutation.
- [ ] 7.4 Navigate back to `/projects` after successful deletion from Project Detail.
- [ ] 7.5 Ensure deletion UI copy does not claim task management functionality is implemented.

## 8. Scope and Verification

- [ ] 8.1 Verify no task CRUD, subtask CRUD, member management UI, tag management UI, project member assignment UI, AI features, settings implementation, import/export, demo data, or kanban drag and drop were added.
- [ ] 8.2 Verify project progress is omitted, neutral, or `0%` only and is not persisted.
- [ ] 8.3 Run `npm run test`.
- [ ] 8.4 Run `npm run lint`.
- [ ] 8.5 Run `npm run build`.
- [ ] 8.6 Review the diff for architecture boundaries and remove any temporary or unrelated changes.
