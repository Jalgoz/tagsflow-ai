## Context

TagsFlow AI is a frontend-only AI-assisted project management app for individual developers, freelancers, technical students, and locally simulated small teams. The MVP must provide real product value through local project planning, task management, kanban workflows, member assignment, settings, and AI-assisted planning without introducing backend services.

The current change defines the product contract and architecture for implementation. The main technical constraint is that the app must remain local-first while preserving a clean migration path to future HTTP repositories and alternative AI providers.

## Goals / Non-Goals

**Goals:**
- Define a modular frontend architecture using Presentation, Application, Domain, and Infrastructure layers.
- Persist business data locally through repository ports and Local Storage adapters.
- Keep business rules in the domain layer and keep UI components free of direct Local Storage and Groq access.
- Support Groq through a provider-neutral AI interface, with structured validation before AI output is used.
- Compute progress, dashboard metrics, and other derived values from source entities.
- Provide a polished SaaS-style MVP across dashboard, projects, tasks, kanban, members, settings, and AI insights.

**Non-Goals:**
- Real backend APIs, real authentication, real cloud synchronization, or real multi-user collaboration.
- Real-time notifications or cross-device sync.
- Persisted derived metrics such as progress, dashboard counts, or chart aggregates.
- Direct provider-specific AI calls from UI components or domain logic.

## Decisions

### Layer responsibilities
Presentation will own pages, layouts, UI components, forms, tables, and kanban interactions. Application will own use cases, orchestration, query hooks, mutation hooks, and DTO mapping. Domain will own entities, rules, calculations, repository ports, and the AI provider port. Infrastructure will own Local Storage repositories, the Groq provider, the mock provider, and future adapter implementations.

Alternative considered: placing data access directly in React components. This was rejected because it would make business behavior harder to test and would block future backend migration.

### Repository ports for all business data
Projects, tasks, subtasks, members, tags, and settings will be accessed through repository interfaces. MVP adapters will read and write a single versioned Local Storage database key, `tagsflow_ai_db_v1`.

Alternative considered: independent Local Storage keys per entity. This was rejected because a single versioned database snapshot makes import, export, seeding, and migration simpler.

### Future HTTP repositories use the same contracts
Future `HttpProjectRepository`, `HttpTaskRepository`, `HttpSubtaskRepository`, `HttpMemberRepository`, `HttpTagRepository`, and `HttpSettingsRepository` implementations will implement the same ports as the Local Storage adapters. Application use cases must not know which adapter is active.

Alternative considered: designing the app around backend-shaped APIs now. This was rejected because the MVP has no real backend and should not add fake network complexity.

### AI provider neutrality
AI features will depend on an `AIProvider` interface. `GroqAIProvider` will implement the first real provider, while `MockAIProvider` will support development fallback and tests. Provider responses will be validated with schemas before being transformed into internal DTOs.

Alternative considered: passing raw model text directly into UI flows. This was rejected because model output is not reliable enough to mutate local business data without validation.

### AI suggestions require explicit user review

AI-generated project tasks and subtasks must never be inserted automatically into local data. The AI returns suggestions, and the user must review, select, edit if needed, and explicitly accept them before repository mutations occur.

Alternative considered: inserting AI output immediately to reduce friction. This was rejected because AI suggestions may be incomplete, incorrect, or misaligned with the user's project intent.

### Local Groq credential handling

The MVP will use a user-provided Groq API key stored locally in application settings so AI features can work without a backend. The settings flow must allow entering, testing, replacing, and deleting the key.

The stored Groq API key must not be included in exported JSON backups. If the project later introduces a backend or secure proxy, credential handling must move behind the AI provider boundary without changing product flows or domain rules.

Alternative considered: shipping a hardcoded shared API key or blocking real AI until backend implementation. This was rejected because hardcoded keys are unacceptable and the MVP should demonstrate real AI functionality through an explicit local-user-key model.

### Derived progress and metrics
Project progress will be computed from top-level task progress. A task without subtasks is 0 percent unless done, then 100 percent. A task with subtasks uses completed subtasks divided by total subtasks. Dashboard metrics and charts will also be recomputed from stored entities.

Alternative considered: storing progress on projects and tasks. This was rejected because derived state can become stale and adds unnecessary reconciliation work.

### Global kanban overview-only
Project kanban will support drag and drop and task creation because project context is explicit. Global kanban will aggregate tasks across projects and support filtering, but it will be read-only in the MVP. It will not create tasks, update task status through drag and drop, or serve as a primary task-editing surface. New task creation and interactive kanban workflow remain scoped to project context.

Alternative considered: allowing global task creation with a required project selector. This was deferred to keep MVP creation flows concentrated inside project context.

### Validation boundaries
AI JSON responses and imported backup files are trust boundaries. Both must be validated before the app accepts them. Invalid AI output must not mutate state, and invalid backup imports must not replace the current Local Storage database.

Alternative considered: best-effort parsing and partial import. This was rejected because local data corruption would be difficult for users to diagnose.

## Risks / Trade-offs

- [Local Storage capacity] -> Keep persisted data compact, avoid derived snapshots, and validate import payloads before writing.
- [AI provider failure] -> Surface failure states and keep `MockAIProvider` available for development and tests.
- [Malformed AI JSON] -> Validate responses with schemas and reject invalid payloads before mapping to domain DTOs.
- [Import corruption] -> Validate backup structure and only replace local data after the full payload is accepted.
- [Future backend mismatch] -> Keep repository ports stable and avoid leaking Local Storage-specific details into application or domain layers.
- [Global kanban ambiguity] -> Keep global kanban fully read-only in the MVP and require project context for interactive task creation and status changes.

## Migration Plan

1. Implement the MVP using Local Storage adapters under `tagsflow_ai_db_v1`.
2. Keep all business operations behind repository ports and application use cases.
3. Add HTTP repository adapters later by implementing the same ports.
4. Add alternative AI providers later by implementing the same `AIProvider` interface.
5. Version future local database shapes and migrate data at the infrastructure boundary.
6. Roll back adapter changes by switching dependency wiring back to the previous repository or provider implementation.

## Resolved Follow-up Decisions

- AI-generated project tasks and subtasks are always reviewed and explicitly accepted before insertion.
- Demo data is offered only during first launch when no local database exists. If selected, it seeds normal editable and deletable local data rather than protected demo records.
- Groq models should be detected dynamically from the provider when possible. The UI may highlight a small recommended subset, but the exact recommended model list is treated as implementation-time configuration because provider availability can change.