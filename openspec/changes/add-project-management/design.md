## Context

TagsFlow AI already has a routed application shell, strict domain project types, a `ProjectRepository` port, and a `LocalStorageProjectRepository` adapter backed by the versioned `tagsflow_ai_db_v1` database. The Projects and Project Detail routes currently render placeholders, so the next implementation slice can add the first real business workflow without changing the Domain or Infrastructure contracts.

This change must preserve the Ports and Adapters boundary: Presentation renders pages and forms, Application owns use cases and TanStack Query hooks, Domain owns entity and repository contracts, and Infrastructure owns Local Storage persistence. Project Management must not introduce backend calls, authentication, AI calls, task CRUD, member assignment UI, or direct Local Storage access from UI components.

## Goals / Non-Goals

**Goals:**
- Implement project CRUD orchestration in the Application layer using the existing `ProjectRepository` port.
- Add project query and mutation hooks that isolate TanStack Query keys, invalidation, and repository calls from Presentation components.
- Add a reusable Zod validation schema for project form input and transform valid form data into domain-friendly project create/update inputs.
- Build a functional Projects page with empty and populated states, create action, project list presentation, and navigation to project detail.
- Build reusable create/edit project UI with clear validation messages and cancel/save behavior.
- Build the Project Detail Overview foundation, including load-by-ID, not-found state, overview content, placeholder tabs for future Tasks/Kanban/AI work, and delete navigation back to Projects.
- Add focused unit tests for use cases and validation, plus hook tests only if the current React hook test setup can support them without adding broad test infrastructure.

**Non-Goals:**
- Task CRUD, subtask CRUD, checklist editing, tag editing, member management UI, or project member assignment UI.
- Dashboard metrics, project progress calculation UI beyond a placeholder or `0%` display, kanban drag and drop, global task tables, demo data, settings, import/export, or AI features.
- New persistence adapters, repository port changes, backend migration implementation, authentication, real collaboration, or real-time updates.
- Groq, OpenAI, Anthropic, or backend AI provider work. AI provider response validation remains an Infrastructure concern for later AI slices.

## Decisions

### Keep project business orchestration in Application

Project use cases will live in an Application feature area and accept a `ProjectRepository` dependency. They will expose small functions for list, get by ID, create, update, and delete. The functions should pass through domain inputs and outputs, normalize not-found behavior where needed, and avoid browser or React dependencies.

Alternative considered: calling `LocalStorageProjectRepository` directly from pages. This was rejected because it would bypass the architecture boundary and make future HTTP repository migration require UI rewrites.

### Compose repositories at the app boundary

The app composition layer should create or provide the MVP repository implementation and TanStack Query client. Hooks can use a small project repository provider/context or a shared application composition module so Presentation imports hooks, not infrastructure classes. This keeps Local Storage replaceable by a future HTTP repository behind the same `ProjectRepository` contract.

Alternative considered: constructing a new repository inside every hook. This was rejected because shared composition is easier to test, avoids repeated setup, and keeps adapter selection centralized.

### Use TanStack Query only for orchestration, not business state

`useProjects` and `useProject` will own query keys for project list and project detail reads. Mutations will call Application use cases and invalidate affected project queries after create, update, and delete. Business entities remain persisted through repositories; Zustand is not used for project entities.

Alternative considered: storing projects in Zustand. This was rejected because the project data is asynchronous business data and the approved state boundary assigns that responsibility to TanStack Query.

### Put form validation near the project feature, backed by Zod

Project form validation will use Zod for required fields, allowed statuses, string trimming, nullable date handling, and date ordering. The schema should validate title, description, objective, in-scope content, out-of-scope content, status, start date, and due date. Member IDs and task IDs remain hidden from this UI slice and default through repository behavior.

Alternative considered: validating only in React Hook Form rules. This was rejected because Zod schemas are reusable in tests and future import/API boundaries, and they create a single validation contract for create/edit forms.

### Keep the Projects UI compact and operational

The Projects page will render a compact SaaS-style list using either cards or a simple table. It must show an empty state when no projects exist, a clear create action, status and date metadata when projects exist, and links/actions that navigate to `/projects/:projectId`. Create/edit can be dialog-based or page-level as long as cancel/save behavior is explicit.

Alternative considered: building a full workspace with filters, progress charts, members, and dashboard-like metrics. This was rejected because those features depend on later task/member/dashboard slices and would exceed the current scope.

### Treat Project Detail as an overview foundation

Project Detail will load the selected project through `useProject`, show a not-found state when the repository returns `null`, and render Overview as the only functional tab. Tasks, Kanban, and AI Insights tabs stay visible as placeholders to preserve the route contract without pretending those modules are implemented.

Alternative considered: hiding future tabs until implemented. This was rejected because the approved MVP defines the tabs, and placeholders give users a stable detail layout while maintaining clear scope boundaries.

### Deletion confirmation belongs in Presentation, cascade behavior belongs in Repository

The UI will ask for confirmation before delete. Once confirmed, the delete mutation will call the existing repository delete behavior, which removes the project and dependent project tasks/subtasks as defined by the persistence spec. Deleting from detail navigates back to `/projects` after success.

Alternative considered: duplicating cascade cleanup in the use case or UI. This was rejected because the repository adapter already owns persistence relationship cleanup, and duplicating it would create consistency risk.

### Keep progress, AI, and backup validation out of this slice

Project progress must continue to be derived from domain rules over tasks and subtasks, not persisted. Because task CRUD is out of scope, the UI can omit progress or show a neutral placeholder/`0%`. AI JSON validation and imported backup validation remain future adapter-bound validation points: Groq provider responses should be validated in AI Infrastructure, and backup imports should validate imported data without exporting the Groq API key.

Alternative considered: adding preliminary AI or import/export hooks to project screens. This was rejected because it would cross into separate MVP modules and weaken this change's reviewability.

## Risks / Trade-offs

- [Repository composition leaks into Presentation] -> Keep pages importing Application hooks and form helpers, with infrastructure selected only in app composition or a small provider.
- [Mutation invalidation misses stale detail/list data] -> Centralize query keys and invalidate both project list and affected project detail keys after writes.
- [Form schema drifts from domain types] -> Derive allowed status values from domain constants and test validation for accepted and rejected inputs.
- [Project deletion feels destructive because repository cascades tasks/subtasks] -> Show confirmation text before deleting; deeper task warning copy can be refined when task UI exists.
- [Hook tests require extra setup] -> Add hook tests only if existing test utilities can support QueryClient/provider rendering without expanding the test stack beyond this focused slice.

## Migration Plan

1. Add Application project use cases and focused unit tests using a fake `ProjectRepository`.
2. Add project query keys and TanStack Query hooks, then wire QueryClient and repository composition at the app boundary.
3. Add the project form schema, form value mapping helpers, and schema tests.
4. Replace the Projects placeholder with the functional list/create/edit UI.
5. Replace the Project Detail placeholder with the Overview foundation and deletion flow.
6. Run `npm run test`, `npm run lint`, and `npm run build`.

Rollback is straightforward during the MVP: restore the placeholder Projects and Project Detail pages and remove the new Application project feature exports/hooks. Persisted Local Storage data can remain because it uses the existing approved database shape.

## Open Questions

- None. The approved MVP scope, current domain model, and existing Local Storage repository behavior are sufficient for this project management slice.
