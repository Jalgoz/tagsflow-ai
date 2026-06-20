## 1. Implementation Prep

- [x] 1.1 Review existing project, task, subtask, member, tag, settings, backup, reset, dashboard, global tasks, project Kanban, and global Kanban hooks to identify reusable application paths.
- [x] 1.2 Confirm current Local Storage schemas and domain entity shapes needed by demo data.
- [x] 1.3 Identify the safest existing whole-database write path for loading demo data, or document the minimal application use case needed if no suitable path exists.

## 2. Demo Data Factory

- [x] 2.1 Create a demo data module that builds the "Development of a SaaS Frontend Platform" project from a reference date.
- [x] 2.2 Add realistic demo members with stable IDs, names, emails, roles, and avatars.
- [x] 2.3 Add reusable demo tags with stable IDs, names, and colors where supported.
- [x] 2.4 Add top-level demo tasks across approved statuses with priorities, scope fields, dates, assignees, tags, checklist items, and subtask IDs.
- [x] 2.5 Add demo subtasks linked one level deep to parent tasks with priorities, statuses, dates, assignees, tags, and checklist items.
- [x] 2.6 Assemble generated demo records into the current valid local database shape without adding demo-only entity fields.

## 3. Onboarding State Infrastructure

- [x] 3.1 Define a small onboarding state type and constants for local UI/application state persistence.
- [x] 3.2 Implement an onboarding state adapter that can read, save, and clear onboarding completion without touching business entity arrays.
- [x] 3.3 Add tests for onboarding state default behavior, completion persistence, reload behavior, and clear behavior.

## 4. Application Orchestration

- [x] 4.1 Add pure first-launch detection logic for empty local business data plus onboarding completion state.
- [x] 4.2 Add an application use case or hook for reading whether onboarding should be shown.
- [x] 4.3 Add an application use case or hook for "Start empty" that persists onboarding completion and refreshes relevant state.
- [x] 4.4 Add an application use case or hook for "Load demo data" that validates or writes generated demo data through approved persistence/application paths.
- [x] 4.5 Ensure demo-data loading invalidates or refreshes affected project, task, subtask, member, tag, dashboard, Kanban, and settings-related queries where applicable.
- [x] 4.6 Integrate onboarding-state clearing with the local data reset flow only when reset returns the app to the empty initial state.

## 5. First-Launch UI

- [x] 5.1 Add a focused onboarding panel or welcome screen using the existing app shell visual language.
- [x] 5.2 Render the onboarding surface only when the application onboarding hook reports eligibility.
- [x] 5.3 Wire "Start empty" to the start-empty application action and show non-blocking success feedback where useful.
- [x] 5.4 Wire "Load demo data" to the demo-loading action and show a non-blocking success toast after success.
- [x] 5.5 Ensure users with existing local business data can access normal routes without onboarding blocking the app.
- [x] 5.6 Verify the onboarding UI works in light and dark themes and on desktop and mobile layouts supported by the app shell.

## 6. Settings Integration

- [x] 6.1 Add an optional Settings demo-data action in an appropriate local data or onboarding section.
- [x] 6.2 Allow Settings to load demo data directly when local business data is empty.
- [x] 6.3 Use the shared `ConfirmDialog` before replacing existing local business data with demo data.
- [x] 6.4 Ensure canceling the confirmation leaves current local data unchanged.
- [x] 6.5 Ensure confirming replacement writes valid demo data, refreshes affected queries, and shows a success toast.
- [x] 6.6 Confirm existing export, import, reset, theme, and backup API-key sanitization behavior remains unchanged.

## 7. Focused Tests

- [x] 7.1 Add tests for first-launch detection with empty data, existing projects, existing tasks, existing subtasks, existing members, existing tags, and completed onboarding state.
- [x] 7.2 Add tests for demo data shape, including project title, members, tags, tasks, subtasks, checklist items, statuses, priorities, dates, assignments, and relationship IDs.
- [x] 7.3 Add tests that generated demo data satisfies current local database validation or equivalent schema helpers.
- [x] 7.4 Add tests that "Start empty" and "Load demo data" persist onboarding completion and prevent repeated onboarding.
- [x] 7.5 Add tests that reset can clear onboarding completion when it returns local business data to the empty initial state.
- [x] 7.6 Add Settings tests for empty demo loading, confirmation before replacement, cancel behavior, replacement behavior, and toast feedback where current UI test utilities support them.
- [x] 7.7 Add a routed UI test for the onboarding choices and one demo-data visibility assertion in an existing data-driven module where current test utilities support it.

## 8. Verification

- [x] 8.1 Run the focused test suite for onboarding, demo data, settings, and affected local persistence behavior.
- [x] 8.2 Run lint and fix any new issues.
- [x] 8.3 Run the TypeScript typecheck or production build and fix any errors.
- [ ] 8.4 Manually verify first launch, start empty, load demo data, settings demo load, reset, export, dashboard, global tasks, project Kanban, and global Kanban flows in the local app.
- [x] 8.5 Review the diff to confirm no domain entity contracts, repository port contracts, AI workflows, Groq setup, backend behavior, protected demo flags, or Local Storage database version changes were introduced unless explicitly justified.
