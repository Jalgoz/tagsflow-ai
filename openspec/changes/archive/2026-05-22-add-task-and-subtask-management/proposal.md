## Why

TagsFlow AI already has the domain entities, local persistence, project workspace foundation, member/tag catalogs, and reusable feedback primitives needed for task work. The next required slice is to make Project Detail > Tasks functional so users can manage project execution without introducing kanban, global tasks, dashboard, or AI scope.

## What Changes

- Add Application-layer task use cases for listing, reading, creating, updating, deleting, status changes, assignee changes, tag changes, and checklist changes through the existing task repository port.
- Add Application-layer subtask use cases for listing, reading, creating, updating, deleting, status changes, assignee changes, tag changes, and checklist changes through the existing subtask repository port.
- Add TanStack Query hooks for task and subtask reads and mutations, including project-scoped task loading and parent-task-scoped subtask loading.
- Add Zod-backed task and subtask form schemas with required title, status, and priority fields, optional text fields, nullable dates, date-range validation, nullable assignee, optional tags, and checklist item validation.
- Add reusable task and subtask forms, a checklist editor, member selection, tag selection, validation messages, and cancel/save behavior.
- Replace the Project Detail > Tasks placeholder with project-scoped task management, including empty state, create/edit/delete actions, expandable task rows or cards, and nested subtask management inside each parent task area.
- Add a lightweight task detail/editing surface focused on project task workflows.
- Add a task completion warning that uses the shared confirmation dialog before marking a task done when pending subtasks exist.
- Reuse existing member and tag catalogs for assignment controls without adding inline member creation or complex inline tag creation in this slice.
- Reuse the existing toast and confirmation feedback patterns for successful mutations and destructive actions.
- Preserve edit-mode UX so the entity being edited is not simultaneously actionable underneath the form, and keep create, edit, and delete confirmation states mutually exclusive.
- Add focused tests for use cases, validation schemas, completion warning logic, checklist mapping, query invalidation where supported, required field rendering where supported, edit-mode behavior, confirmation dialog usage, and toast feedback where supported.

Explicitly excluded from this change:
- Kanban drag and drop.
- Global tasks table implementation.
- Dashboard metrics.
- AI subtask generation, AI priority suggestion, and AI project summary.
- Settings, import/export, and demo data.
- Creating new members inline from task forms.
- Creating new tags inline from task forms when that would complicate the task workflow.
- Changing persistence contracts or domain model contracts.
- Redesigning existing project, member, or tag forms beyond reusing established UX patterns.
- Creating a new notification or confirmation system.

## Capabilities

### New Capabilities
- `task-and-subtask-management`: Project-scoped task and subtask CRUD, forms, query hooks, validation, assignment/tag/checklist updates, completion warning, feedback usage, and focused tests.

### Modified Capabilities
- `project-management`: Project Detail > Tasks changes from a placeholder to the functional entry point for project-scoped task and subtask management.
- `member-management`: Existing members become assignable from task and subtask forms while member catalog management remains unchanged.
- `tag-management`: Existing tags become assignable from task and subtask forms while tag catalog management remains unchanged.

## Impact

- Affected Application code: new task and subtask use cases, query keys, repository providers/contexts if needed, TanStack Query hooks, and validation schemas.
- Affected Presentation code: Project Detail > Tasks UI, reusable task/subtask forms, checklist editor, member/tag selectors, confirmation dialog integration, and toast integration.
- Affected Domain usage: existing task/subtask repository ports, entity types, status/priority constants, checklist types, and completion guard rules are consumed without changing contracts.
- Affected tests: focused unit and component tests around task/subtask behavior, form validation, query invalidation, edit-mode exclusivity, confirmation dialogs, and success toasts where current utilities support them.
- No new backend, authentication, cloud synchronization, real collaboration, AI provider, persistence key, or repository contract is introduced.
