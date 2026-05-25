## 1. Global Task Logic

- [x] 1.1 Create typed global task projection helpers that combine tasks with project, subtask, member, tag, checklist, and progress display data without changing domain or repository contracts.
- [x] 1.2 Add pure filter helpers for project, status, priority, assignee, tag, overdue, upcoming deadline, and combined-filter behavior.
- [x] 1.3 Define a named default upcoming deadline window constant of 7 days and use it in upcoming deadline filtering tests.
- [x] 1.4 Add pure search helpers for case-insensitive task title and task description matching.
- [x] 1.5 Add pure sort helpers for due date, priority, status, project, title, and direction handling.
- [x] 1.6 Add focused unit tests for projection, filtering, search, sorting, missing metadata, overdue, and upcoming deadline behavior.

## 2. Global Tasks Page Foundation

- [x] 2.1 Replace the `TasksPage` placeholder with a page that loads tasks, projects, subtasks, members, and tags through existing Application-layer hooks.
- [x] 2.2 Add loading, error, and empty states that do not expose task or subtask creation actions.
- [x] 2.3 Add page state for search text, filters, sort field, sort direction, expanded task IDs, edit state, delete state, and pending-completion confirmation state.
- [x] 2.4 Render the filtered and sorted global task list with task title, project name, status, priority, start date, due date, assignee, tags, checklist summary, and subtask summary.
- [x] 2.5 Add responsive styling for the global list, controls, metadata, badges, and empty states while preserving the existing app shell.

## 3. Controls and Expansion

- [x] 3.1 Add search and filter controls for project, status, priority, assignee, tag, overdue tasks, and upcoming deadlines.
- [x] 3.2 Add sort controls for due date, priority, status, project, and title, including sort direction changes.
- [x] 3.3 Add a clear-filters action that resets filters while preserving the current search and sort behavior.
- [x] 3.4 Add expandable task rows or cards that show compact subtask metadata under the parent task.
- [x] 3.5 Ensure expanded subtasks do not show create-subtask actions and do not render independent global task cards.
- [x] 3.6 Ensure expanded subtasks are read-only in the global tasks view and do not expose edit, delete, create, or status mutation actions.

## 4. Existing Task Actions

- [x] 4.1 Add an edit action that opens `TaskForm` in the existing focused form surface with current task values, members, and tags.
- [x] 4.2 Submit global task edits through `useUpdateTask` and show a success toast after successful updates.
- [x] 4.3 Preserve the pending-subtask completion confirmation when a global edit saves a task with status `done` and pending subtasks.
- [x] 4.4 Add a delete action that opens `ConfirmDialog` and waits for confirmation before calling `useDeleteTask`.
- [x] 4.5 Show delete pending state and a success toast after successful task deletion, relying on existing repository cleanup behavior.
- [x] 4.6 Ensure edit, delete, and completion-confirmation states are mutually exclusive for the active global task.

## 5. Creation Boundary

- [x] 5.1 Remove the old placeholder test expectations and add assertions that no global task creation button or task creation form is rendered.
- [x] 5.2 Add guidance or navigation from empty/help states that directs users to choose or open a project before creating tasks.
- [x] 5.3 Verify expanded subtasks do not expose subtask creation controls from the global page.

## 6. UI Tests and Verification

- [x] 6.1 Add page or component tests for global task row/card rendering with project, member, tag, checklist, and subtask summary data.
- [x] 6.2 Add UI tests for search, filters, sort controls, and clear-filter behavior where current test utilities support them.
- [x] 6.3 Add UI tests for subtask expansion and compact subtask metadata display.
- [x] 6.4 Add UI tests for edit success toast, delete confirmation plus success toast, and pending-subtask completion warning where current providers support those flows.
- [x] 6.5 Run `npm run lint`, `npm run test`, and `npm run build`.
- [x] 6.6 Verify `/tasks` manually in the browser at desktop and mobile widths for layout, control usability, expansion, edit, delete, and no-creation boundaries.
