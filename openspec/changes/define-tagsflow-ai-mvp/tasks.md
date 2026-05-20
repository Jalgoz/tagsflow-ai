## 1. Project Foundation

- [ ] 1.1 Verify the React, TypeScript, Vite, Tailwind CSS, routing, query, table, form, validation, kanban, and chart dependencies are installed or add justified missing dependencies.
- [ ] 1.2 Create the feature-oriented source structure for presentation, application, domain, infrastructure, and shared modules.
- [ ] 1.3 Define shared route constants, kanban column configuration, status labels, priority labels, and Local Storage key constants.
- [ ] 1.4 Implement the app shell with fixed sidebar navigation, routed content area, and responsive layout behavior.

## 2. Domain Model and Rules

- [ ] 2.1 Define TypeScript domain types for projects, tasks, subtasks, checklist items, members, tags, settings, and AI DTOs.
- [ ] 2.2 Define repository port interfaces for projects, tasks, subtasks, members, tags, and settings.
- [ ] 2.3 Define the provider-neutral AIProvider interface for planning, subtask generation, priority suggestion, project summary, model detection, and connection testing.
- [ ] 2.4 Implement project progress and task progress calculation rules.
- [ ] 2.5 Implement domain rules for one-level subtasks, checklist shape, supported statuses, supported priorities, and task completion warnings.

## 3. Validation and Persistence

- [ ] 3.1 Implement Zod schemas for Local Storage database records and import payloads.
- [ ] 3.2 Implement the versioned `tagsflow_ai_db_v1` Local Storage database access layer.
- [ ] 3.3 Implement LocalStorageProjectRepository, LocalStorageTaskRepository, LocalStorageSubtaskRepository, LocalStorageMemberRepository, LocalStorageTagRepository, and LocalStorageSettingsRepository.
- [ ] 3.4 Implement JSON export with Groq API key exclusion.
- [ ] 3.5 Implement JSON import with full validation before replacing existing local data.

## 4. Application Use Cases

- [ ] 4.1 Implement project create, update, delete, list, and detail use cases.
- [ ] 4.2 Implement task create, update, delete, status update, tag assignment and checklist update use cases.
- [ ] 4.3 Implement subtask create, update, delete, status update, checklist update, and assignment use cases.
- [ ] 4.4 Implement task completion warning and confirmation flow when pending subtasks exist.
- [ ] 4.5 Implement member create, update, delete, assignment lookup, and confirmed deletion cleanup use cases.
- [ ] 4.6 Implement settings use cases for theme, Groq key management, selected model, connection testing, export, and import.
- [ ] 4.7 Implement dashboard, global tasks, project kanban, and global kanban query selectors.

## 5. AI Infrastructure and Workflows

- [ ] 5.1 Implement GroqAIProvider behind the AIProvider interface.
- [ ] 5.2 Implement MockAIProvider for development fallback and tests.
- [ ] 5.3 Implement AI response schemas for project planner, subtask generator, priority suggestion, and project summary responses.
- [ ] 5.4 Implement AI project planner use case that returns top-level task suggestions only.
- [ ] 5.5 Implement AI subtask generator use case for parent task context.
- [ ] 5.6 Implement AI priority suggestion use case with priority and concise reason.
- [ ] 5.7 Implement AI project summary use case with summary, risks, and next steps.

## 6. Presentation UI

- [ ] 6.1 Build shared UI primitives for buttons, inputs, forms, dialogs, tabs, tables, cards, badges, empty states, and loading states.
- [ ] 6.2 Build the dashboard page with derived metrics, status chart, priority chart, and upcoming deadlines.
- [ ] 6.3 Build the projects list and project create/edit flows.
- [ ] 6.4 Build the project detail page with Overview, Tasks, Kanban, and AI Insights tabs.
- [ ] 6.5 Build the AI Project Planner UI as:
  - an optional next step after creating a project
  - a section inside Project Detail > AI Insights
  - a review-and-accept flow for suggested top-level tasks.
- [ ] 6.6 Build the AI Subtask Generator UI inside task creation/editing flows, allowing users to review and accept suggested subtasks.
- [ ] 6.7 Build the AI Priority Suggestion UI for task and subtask forms, showing the suggested priority and concise reason before the user accepts it.
- [ ] 6.8 Build the AI Project Summary UI inside Project Detail > AI Insights, showing the generated summary, risks, and next steps.
- [ ] 6.9 Build the global tasks page with search, filtering, sorting, editing, and subtask expansion.
- [ ] 6.10 Build the interactive project kanban with drag and drop and task creation.
- [ ] 6.11 Build the read-only global kanban with project filtering.
- [ ] 6.12 Build the members page with assignment visibility and deletion confirmation.
- [ ] 6.13 Build the settings page with theme, Groq configuration, model selection, connection testing, export, and import controls.

## 7. Demo Data and Polish

- [ ] 7.1 Implement first-launch choice between empty state and demo data.
- [ ] 7.2 Seed the recommended demo project, Development of a SaaS Frontend Platform, through normal repository paths.
- [ ] 7.3 Ensure demo projects, tasks, subtasks, members, and tags can be edited and deleted like user-created data.
- [ ] 7.4 Apply light and dark theme styling with the approved SaaS visual direction.
- [ ] 7.5 Verify responsive behavior for dashboard, tables, project detail, kanban, members, and settings.

## 8. Tests and Verification

- [ ] 8.1 Add domain tests for progress calculation, task completion warnings, subtask depth, checklist shape, and member deletion cleanup.
- [ ] 8.2 Add repository tests for Local Storage serialization, hydration, import validation, and export API key exclusion.
- [ ] 8.3 Add AI validation tests for accepted and rejected provider responses.
- [ ] 8.4 Add focused UI or integration coverage for major project, task, kanban, member, settings, and AI flows where the test stack supports it.
- [ ] 8.5 Run type-check, lint, tests, and production build.
