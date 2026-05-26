## 1. Dashboard Metrics Helpers

- [ ] 1.1 Create a dashboard Application-layer module for pure metric helpers and exported dashboard metric types.
- [ ] 1.2 Implement project status count helpers for active, paused, and completed projects.
- [ ] 1.3 Implement task count helpers for total, pending, completed, and blocked tasks using approved task statuses.
- [ ] 1.4 Implement overdue and upcoming deadline task helpers using the existing domain deadline rules, a fixed reference date for tests, and a named default upcoming deadline window of 7 days.
- [ ] 1.5 Implement average project progress aggregation using existing domain project/task progress rules.
- [ ] 1.6 Implement task status distribution and priority distribution helpers using approved status and priority constants.
- [ ] 1.7 Implement completed-this-week availability handling without inferring completion timestamps from unsupported fields.
- [ ] 1.8 Add helper outputs for upcoming deadline tasks, blocked tasks, project health rows, and recently completed work only where supported by available data.

## 2. Dashboard Page Data Integration

- [ ] 2.1 Replace the dashboard placeholder with a page that loads projects, tasks, subtasks, members, and tags through existing Application-layer hooks.
- [ ] 2.2 Combine query loading and error states into dashboard-level loading and error UI.
- [ ] 2.3 Memoize dashboard metric calculation from hook data and a stable current reference date.
- [ ] 2.4 Add empty dashboard state when no projects exist, guiding users to the existing project workflow without creating projects inline.
- [ ] 2.5 Ensure the dashboard page does not read Local Storage, instantiate repositories, call AI providers, or create dashboard-specific mutations.

## 3. Dashboard Presentation

- [ ] 3.1 Add summary metric cards for project counts, task counts, overdue tasks, upcoming deadlines, average project progress, and completed-this-week availability/value.
- [ ] 3.2 Add project health overview showing project title, status, due date, and derived progress with neutral values for missing optional data.
- [ ] 3.3 Add Recharts task status chart with a no-data state when all status values are empty.
- [ ] 3.4 Add Recharts priority distribution chart with a no-data state when all priority values are empty.
- [ ] 3.5 Add upcoming deadlines list with task title, project context, status, priority, due date, assignee, and tags where available.
- [ ] 3.6 Add blocked work list with task title, project context, priority, due date, assignee, and tags where available.
- [ ] 3.7 Add recently completed work no-data or supported-data section that does not claim exact completion dates without completion timestamp data.
- [ ] 3.8 Keep dashboard layout consistent with the existing app shell and established compact SaaS styling.

## 4. Navigation Boundaries

- [ ] 4.1 Wire project dashboard items to navigate to `/projects/:projectId`.
- [ ] 4.2 Wire aggregate task metric cards to `/tasks` and task-specific list items to the related `/projects/:projectId` route, using existing routes only.
- [ ] 4.3 Verify dashboard interactions do not expose task edit, task delete, status mutation, subtask management, or Kanban drag-and-drop controls.

## 5. Tests

- [ ] 5.1 Add metric helper tests for project status counts and task status counts.
- [ ] 5.2 Add metric helper tests for overdue and upcoming deadline counts using a fixed reference date.
- [ ] 5.3 Add metric helper tests for average project progress with tasks and subtasks.
- [ ] 5.4 Add metric helper tests for status distribution, priority distribution, and empty data behavior.
- [ ] 5.5 Add metric helper tests for completed-this-week unavailable behavior under the current domain model.
- [ ] 5.6 Add dashboard rendering tests for non-placeholder content, summary cards, chart/no-data sections, upcoming deadlines, blocked work, and empty dashboard behavior where current UI test utilities support providers.
- [ ] 5.7 Add navigation tests for project and task dashboard item routing where current UI test utilities support navigation assertions.

## 6. Verification

- [ ] 6.1 Run the dashboard-related test files.
- [ ] 6.2 Run the full test suite.
- [ ] 6.3 Run typecheck or build to verify strict TypeScript compilation.
- [ ] 6.4 Review the diff to confirm no persistence schema, domain entity, repository port, AI provider, global tasks, project Kanban, or global Kanban behavior changed.
