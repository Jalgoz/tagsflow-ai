## 1. Readiness Audit

- [x] 1.1 Review current OpenSpec specs and archived context for Dashboard, Projects, Project Detail, Tasks, Kanban, Members/Tags, Settings, onboarding/demo data, and AI workflows.
- [x] 1.2 Audit implemented routes `/dashboard`, `/projects`, `/projects/:projectId`, `/tasks`, `/kanban`, `/members`, and `/settings` against the approved MVP behavior.
- [x] 1.3 Record concrete polish defects, edge-case failures, test gaps, and spec drift found during the audit before changing code.
- [x] 1.4 Confirm the implementation plan excludes new product features, broad redesigns, new AI workflows, backend work, authentication, cloud sync, collaboration, and large dependency additions.

## 2. UI Consistency and Responsiveness

- [x] 2.1 Normalize inconsistent empty, loading, error, and success states using existing shared UI and feedback patterns.
- [x] 2.2 Normalize destructive-action copy and ensure destructive actions use the shared confirmation dialog before mutation.
- [x] 2.3 Normalize required field markers and validation messaging across project, task, subtask, member, tag, settings, import, and AI instruction forms.
- [x] 2.4 Fix dialog and form sizing issues so create, edit, import, reset, confirmation, task detail, AI review, and AI result surfaces remain usable on smaller screens.
- [x] 2.5 Verify and fix desktop, tablet, and narrow/mobile behavior for Dashboard, Projects, Project Detail tabs, Global Tasks, Members/Tags, Settings, onboarding, and AI Insights.
- [x] 2.6 Verify and fix Project Kanban and Global Kanban responsive behavior so configured columns remain accessible through responsive sizing or horizontal scrolling.

## 3. Edge-Case and Data-Safety Fixes

- [x] 3.1 Harden no-project, no-task, no-subtask, no-member, and no-tag states across data-driven routes.
- [x] 3.2 Harden missing optional date, description, scope, assignee, tag, checklist, and subtask values in views, filters, sorting, metrics, Kanban cards, and AI input builders.
- [x] 3.3 Verify member deletion cleanup and deleted tag references render safely in projects, tasks, subtasks, filters, cards, detail views, and AI context.
- [x] 3.4 Verify pending-subtask completion confirmation works from task forms and Kanban status changes before any `done` mutation is sent.
- [x] 3.5 Harden reset local data and demo-data reload behavior so stale data, stale UI state, and stale import or AI errors are cleared correctly.
- [x] 3.6 Verify backup export excludes Groq API keys and backup import neutralizes API keys before replacing local data.
- [x] 3.7 Verify saved API keys are never displayed fully after saving and AI/provider errors do not expose API keys, authorization headers, raw prompts, raw provider dumps, or raw responses.

## 4. Global Kanban Alignment

- [x] 4.1 Align Global Kanban specs and implementation with the MVP behavior: status-only drag-and-drop plus read-only task detail inspection.
- [x] 4.2 Verify Global Kanban supports drag-and-drop status movement through the existing task status update path.
- [x] 4.3 Verify dragging a task to another configured column updates only the selected task status.
- [x] 4.4 Verify same-column, canceled, invalid, or failed drops do not create incorrect local state.
- [x] 4.5 Verify Global Kanban task cards can open a read-only task detail popup without navigating away.
- [x] 4.6 Verify the read-only detail popup displays task context, project context, status, priority, dates, assignee, tags, checklist summary, and subtask progress where available.
- [x] 4.7 Verify the read-only detail popup exposes no inline edit, delete, subtask CRUD, member mutation, tag mutation, AI action, or project reassignment controls.
- [x] 4.8 Add or verify a navigation action from the read-only detail popup to the existing project/task-focused surface where editing is supported, such as `Open task`, `View in project`, or `Edit in project`.
- [x] 4.9 Verify the navigation action uses existing routes or surfaces and does not introduce a new standalone task route unless one already exists end-to-end.
- [x] 4.10 Verify project filtering remains compatible with status movement and task detail inspection.
- [x] 4.11 Verify all configured columns remain visible and usable after filtering and status moves.
- [x] 4.12 Verify Global Kanban still exposes no task creation action.
- [x] 4.13 Verify Global Kanban exposes no subtask create, edit, delete, reorder, or independent Kanban-card behavior.
- [x] 4.14 Verify Global Kanban exposes no AI actions from cards or detail surfaces in this polish slice.
- [x] 4.15 Verify Project Detail Kanban behavior remains unchanged except for safe shared helper reuse.

## 5. AI Workflow Hardening

- [x] 5.1 Verify AI Project Planner, AI Subtask Generator, AI Priority Suggestion, and AI Project Summary all show not-configured states without sending provider requests.
- [x] 5.2 Harden provider failure and malformed-output handling for each AI workflow with clear non-technical errors and no unsafe data exposure.
- [x] 5.3 Verify AI Project Planner and AI Subtask Generator remain review-before-insert and do not mutate local data before explicit acceptance.
- [x] 5.4 Verify AI Priority Suggestion does not apply a suggested priority before explicit acceptance.
- [x] 5.5 Verify AI Project Summary remains read-only and never mutates project, task, subtask, member, tag, settings, dashboard, Kanban, backup, or Local Storage data.
- [x] 5.6 Verify additional instructions, prompts, responses, generated summaries, rejected outputs, and conversation-like state are not persisted to Local Storage or exported backups.

## 6. Architecture Boundary Verification

- [x] 6.1 Search Presentation code for direct Local Storage reads/writes and replace any violations with existing application or repository paths.
- [x] 6.2 Search Presentation code for direct `GroqAIProvider` construction or direct Groq calls and replace any violations with application-level AI provider resolution.
- [x] 6.3 Search Domain code for React, TanStack Query, Local Storage, Groq, browser API, or UI component dependencies and move any violations to the correct layer.
- [x] 6.4 Verify derived progress, dashboard metrics, AI instructions, AI summaries, raw prompts, raw responses, and provider errors are not persisted as business data.
- [x] 6.5 Keep fixes behind existing repository and provider interfaces without changing domain contracts, repository ports, provider ports, or the `tagsflow_ai_db_v1` database version unless a proven bug requires a documented compatible fix.

## 7. Test Hardening

- [x] 7.1 Add or update domain tests for project/task progress, task completion warnings, one-level subtasks, checklist shape, and member deletion cleanup.
- [x] 7.2 Add or update Local Storage, backup, import, reset, and demo-data tests for schema validation, API-key exclusion, API-key import neutralization, invalid import errors, and valid editable demo records.
- [x] 7.3 Add or update workflow tests for task/subtask CRUD, dashboard metric derivation, Global Tasks visibility/filtering, and important empty-state paths.
- [x] 7.4 Add or update Project Kanban tests for drag/status changes, task detail/edit/delete boundaries, pending-subtask completion confirmation, and responsive-safe rendering where supported.
- [x] 7.5 Add or update Global Kanban tests for status-only movement, same-column drops, failure rollback, read-only detail popup, detail-to-project/task navigation, no-inline-edit boundary, no-delete boundary, no-task-creation boundary, no-subtask-CRUD boundary, project filtering, and pending-subtask completion confirmation.
- [x] 7.6 Add or update AI tests for configuration gating, provider failures, malformed output validation, review-before-apply behavior, read-only summary behavior, and non-persistence of transient AI data.
- [x] 7.7 Add or update onboarding tests for first-launch empty-state detection, start-empty persistence, demo-data load, no-repeat behavior, and demo data visibility in at least one normal route.

## 8. Final Verification and Handoff

- [x] 8.1 Run `npm run lint` and fix or document any remaining issues.
- [x] 8.2 Run `npm run build` and fix or document any remaining TypeScript or production-build issues.
- [x] 8.3 Run `npm run test` and fix or document any remaining test failures.
- [x] 8.4 Run `openspec validate --all --strict` and fix any OpenSpec validation issues.
- [x] 8.5 Remove temporary debug logs, dead code from incomplete iterations, unused imports, unrelated generated files, and unjustified dependency changes.
- [x] 8.6 Complete a manual verification checklist for first launch, demo data, dashboard metrics, project/member/tag/task/subtask CRUD, Project Kanban, Global Kanban, Global Tasks, Settings theme, backup export/import validation, reset, Groq configuration, connection testing, AI Project Planner, AI Project Planner additional instructions, AI Subtask Generator additional instructions, AI Priority Suggestion, and AI Project Summary.
