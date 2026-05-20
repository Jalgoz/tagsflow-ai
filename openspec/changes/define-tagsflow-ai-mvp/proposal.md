## Why

TagsFlow AI needs an explicit MVP definition so implementation can proceed against a stable product contract instead of accumulating disconnected screens and business rules. This change defines the local-first project management product, its AI boundaries, and the architecture constraints needed for future backend and provider migration.

## What Changes

- Defines the MVP as a frontend-only project management application with Local Storage persistence.
- Establishes the main product areas: dashboard, projects, project detail, global tasks, project kanban, global kanban, members, settings, and AI insights.
- Defines the core business entities: projects, tasks, subtasks, checklist items, members, tags, settings, and AI provider configuration.
- Captures domain rules for progress calculation, task completion warnings, one-level subtasks, checklist limits, member deletion cleanup, and reusable tags.
- Defines the AI feature set: project planning, subtask generation, priority suggestion, and project summaries.
- Requires provider-neutral AI integration with Groq as the first real provider and a mock provider for development and tests.
- Requires repository-backed Local Storage persistence under `tagsflow_ai_db_v1`, with derived metrics computed from stored entities.
- Excludes real backend services, real authentication, real cloud sync, real multi-user collaboration, and real-time notifications from the MVP.
- Defines local backup export/import behavior, excluding the stored Groq API key from exported JSON backups.

## Capabilities

### New Capabilities
- `project-management`: Project lifecycle, project detail tabs, project metadata, status, dates, scope, and assigned local members.
- `task-management`: Task, subtask, checklist, tag, priority, status, assignee, filtering, and completion-warning behavior. New tasks are created from project detail views, while the global tasks page and global kanban remain management and overview surfaces rather than task creation entry points.
- `kanban-experience`: Configuration-driven MVP columns, interactive project kanban, and read-only global kanban overview.
- `member-management`: Local member catalog, assignment support, deletion confirmation, and assignment cleanup.
- `dashboard-and-insights`: Derived dashboard metrics, status and priority charts, upcoming deadlines, and project progress signals.
- `settings-and-local-data`: Theme settings, Groq configuration, model selection, demo data, JSON export, and validated import.
- `ai-assistance`: Provider-neutral AI project planner, subtask generator, priority suggestion, and project summary workflows.
- `local-storage-foundation`: Versioned Local Storage database, repository ports, local adapters, and future HTTP migration path.

### Modified Capabilities

- None

## Impact

This change affects the planned frontend routes, domain model, application use cases, repository ports, Local Storage adapters, AI provider adapter, validation schemas, and user-facing product modules. It does not introduce backend APIs or authentication, but it defines interfaces that allow future HTTP repositories and alternative AI providers to replace the MVP adapters without rewriting domain rules.
