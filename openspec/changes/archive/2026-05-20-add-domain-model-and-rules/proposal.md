## Why

TagsFlow AI needs a stable domain layer before repositories, UI flows, and AI adapters can be implemented without duplicating business rules. This change defines the frontend-only domain model, repository ports, AI provider port, and pure rules that later slices will consume.

## What Changes

- Defines strict TypeScript domain types for projects, tasks, subtasks, checklist items, members, tags, app settings, and AI-facing DTOs.
- Defines canonical domain status and priority types for projects, tasks, subtasks, and planning outputs.
- Adds repository port interfaces for projects, tasks, subtasks, members, tags, and settings, without implementing Local Storage or HTTP adapters.
- Adds a provider-neutral `AIProvider` interface for model listing, connection testing, project planning, subtask generation, priority suggestion, and project summaries.
- Adds pure domain rules for task progress, project progress, overdue work, upcoming deadlines, pending-subtask warnings, one-level subtask enforcement, and checklist item validation.
- Adds or prepares focused unit tests for domain rules, depending on whether a test stack already exists in the project.
- Explicitly excludes persistence adapters, Groq integration, React UI, forms, CRUD screens, query hooks, dashboard UI, kanban drag and drop, import/export, and demo data.

## Capabilities

### New Capabilities

- `domain-model-and-rules`: Domain entities, repository ports, AI provider port, shared domain constants, and pure business rules for the TagsFlow AI MVP.

### Modified Capabilities

- None

## Impact

This change affects the `src/domain` layer and may add a minimal test setup only if needed to validate pure domain rules. It establishes stable contracts for future Local Storage repositories, future HTTP repositories, Groq and mock AI adapters, application use cases, and presentation modules while keeping the domain independent from React, TanStack Query, Local Storage, and provider SDKs.
