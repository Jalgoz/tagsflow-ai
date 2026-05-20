## 1. Dependency Baseline

- [x] 1.1 Review the current Vite React dependencies against the foundation slice requirements.
- [x] 1.2 Install Tailwind CSS and its Vite integration, plus React Router, TanStack Query, TanStack Table, Zustand, React Hook Form, Zod, dnd-kit, and Recharts.
- [x] 1.3 Verify the package lockfile reflects the installed dependency baseline.

## 2. Source Structure

- [x] 2.1 Create top-level source folders for `app`, `presentation`, `application`, `domain`, `infrastructure`, and `shared`.
- [x] 2.2 Add minimal placeholder or index files only where needed to preserve the intended folder structure.
- [x] 2.3 Move the starter app composition into the new `app` area if needed for clearer bootstrapping.

## 3. Shared Contracts

- [x] 3.1 Define centralized route constants for dashboard, projects, project detail, tasks, kanban, members, and settings.
- [x] 3.2 Define shared kanban column configuration for the MVP status set.
- [x] 3.3 Define shared task status labels and task priority labels.
- [x] 3.4 Define the shared Local Storage database key constant `tagsflow_ai_db_v1`.

## 4. App Shell and Routing

- [x] 4.1 Replace the default Vite `App.tsx` screen with the TagsFlow AI application shell.
- [x] 4.2 Implement a fixed sidebar layout that uses the shared route constants.
- [x] 4.3 Add the route definitions for `/dashboard`, `/projects`, `/projects/:projectId`, `/tasks`, `/kanban`, `/members`, and `/settings`.
- [x] 4.4 Add minimal placeholder pages for each foundation route.
- [x] 4.5 Configure the root route to open the dashboard view.
- [x] 4.6 Add a simple not-found fallback inside the app shell.

## 5. Styling and Layout

- [x] 5.1 Replace the starter CSS with foundation shell styles and layout tokens.
- [x] 5.2 Keep the layout minimal, readable, and ready for future light and dark themes.
- [x] 5.3 Remove or stop relying on the default Vite starter visual assets in the application shell.

## 6. Verification

- [x] 6.1 Run the build and fix TypeScript or routing issues introduced by the foundation work.
- [x] 6.2 Run lint and fix any new style or import problems.
- [x] 6.3 Verify each foundation route renders the expected placeholder content within the shell.
