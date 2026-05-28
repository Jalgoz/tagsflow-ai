## Context

TagsFlow AI already has local project, task, subtask, member, tag, Kanban, dashboard, settings, backup, import, and reset workflows. The remaining MVP gap is first-use guidance: an empty local database gives users no quick way to explore dashboard metrics, global tasks, project Kanban, global Kanban, assignments, tags, subtasks, and checklist behavior.

The current domain settings contract is strict and contains only theme and AI provider configuration. This change must not alter domain entity contracts, repository port contracts, or the Local Storage database version unless unavoidable. Demo records must be normal business entities persisted in the existing `tagsflow_ai_db_v1` database, while onboarding completion can be local UI/application state because it is not business data.

## Goals / Non-Goals

**Goals:**

- Detect an empty first-launch state from existing business data: no projects, tasks, members, tags, and no meaningful user-created records.
- Present a clear onboarding surface that offers "Start empty" and "Load demo data".
- Generate deterministic demo data for "Development of a SaaS Frontend Platform" using existing project, task, subtask, member, tag, checklist, status, priority, date, assignee, and tag shapes.
- Persist demo data as ordinary local data through existing application/repository behavior so every existing module can consume it without demo-specific branches.
- Persist onboarding completion outside the strict domain `AppSettings` contract so the prompt does not repeat after a choice.
- Clear or reset onboarding completion only as part of local data reset when the app returns to the empty initial state.
- Add an optional Settings action to load demo data, guarded by confirmation when existing data would be affected.
- Reuse shared confirmation and toast feedback components.
- Add focused tests for detection, data shape, validation, persistence, and no-repeat behavior.

**Non-Goals:**

- Authentication, user accounts, cloud sync, backend seed data, or real collaboration.
- AI-generated demo content, Groq setup, provider calls, model detection, or AI workflows.
- Changes to approved domain entity contracts, repository port contracts, task status values, priority values, Kanban columns, or progress rules.
- A Local Storage database version bump unless implementation discovers an unavoidable compatibility issue.
- App-shell redesign or replacement of existing backup/import/reset behavior.
- Protected, undeletable, or special-case demo records.

## Decisions

### Keep demo data as normal business data

Demo projects, members, tags, tasks, and subtasks will be created with the same shapes as user-created records and saved through existing application/repository paths or an infrastructure-level whole-database replacement path that writes the same validated local database shape.

Alternative considered: mark demo records with `isDemo` metadata. This is rejected because it changes domain contracts and risks protected-record behavior. The requirement is that demo data be editable, deletable, exportable, and indistinguishable from normal local data.

### Store onboarding completion as local UI/application state

Onboarding completion will use a small onboarding state adapter outside `AppSettings`, for example a local UI-state key containing whether a choice was completed. Presentation code will access it through an application hook/use case, not by calling `localStorage` directly.

Alternative considered: add an `onboardingCompleted` field to `AppSettings`. This is rejected for this change because the current settings schema is strict and the request explicitly excludes domain model contract changes.

### Treat reset as the only supported way to re-enable onboarding after a choice

Choosing "Start empty" records onboarding completion even though the business database remains empty. The onboarding prompt must therefore not reappear just because the user started empty. The local data reset workflow may clear onboarding state when it replaces business data with the empty initial database, allowing onboarding to appear again for that reset-empty state.

Alternative considered: show onboarding whenever business data is empty. This is rejected because it would repeatedly prompt users who intentionally chose "Start empty".

### Generate demo dates relative to a reference date

The demo-data factory will accept a reference date. Production code can pass the current date, while tests can pass a fixed date. This keeps demo deadlines realistic when loaded in the future and keeps automated tests deterministic.

Alternative considered: hard-code calendar dates. This is rejected because stale demo dates would quickly make the first-run experience misleading and would make dashboard deadline behavior depend on historical data.

### Use existing validation boundaries

The demo-data factory should produce values that satisfy the current local database schemas and domain constants. Tests should validate the generated shape against the same schemas used for Local Storage hydration or backup import where those schemas are exposed.

Alternative considered: trust hand-written demo objects without schema validation. This is rejected because demo data touches every major module and malformed relationships would be difficult to debug from UI symptoms.

### Keep module visibility automatic

Dashboard, global tasks, project Kanban, global Kanban, project detail, members, tags, and backup export should not gain demo-specific code paths. Once demo data is persisted as normal entities, those modules should display it through existing query hooks, derived metrics, filters, Kanban grouping, and export behavior.

Alternative considered: inject demo-only display fixtures into each module. This is rejected because it would duplicate business rules and bypass the repository/adapters architecture.

### Guard Settings demo loading

If the optional Settings action is added, loading demo data into an empty database may proceed directly. If existing projects, tasks, members, or tags exist, the UI must use `ConfirmDialog` before replacing data or must offer an explicit append path that cannot silently overwrite existing records. The initial implementation should prefer the simplest safe option.

Alternative considered: always append demo data. This is rejected as the default because repeated clicks could create duplicate demo projects and tags. If append is implemented, it must be explicit and tested.

## Risks / Trade-offs

- [Risk] A separate onboarding state key introduces another Local Storage item. → Mitigation: keep it limited to non-business UI state, route access through an application/infrastructure adapter, and do not create separate keys for projects, tasks, members, tags, subtasks, or settings.
- [Risk] Demo data could drift from strict schema requirements as entities evolve. → Mitigation: add schema/shape tests that fail when demo objects no longer satisfy local database validation.
- [Risk] Reset behavior could leave onboarding suppressed after an empty reset. → Mitigation: include reset integration behavior in tasks and tests so reset clears onboarding completion when it returns to the empty initial database.
- [Risk] Settings demo loading could accidentally destroy user data. → Mitigation: require confirmation before replacement and keep destructive copy explicit.
- [Risk] Relative demo dates can make screenshots or tests variable. → Mitigation: isolate date generation behind a reference-date parameter and use fixed dates in tests.

## Migration Plan

1. Add onboarding state infrastructure without changing the version-one business database shape.
2. Add demo-data generation and validation tests.
3. Add application hooks/use cases for first-launch detection, starting empty, loading demo data, and resetting onboarding state after local data reset.
4. Add the first-launch onboarding presentation surface and wire toast feedback.
5. Add the optional guarded Settings action if it remains simple with existing reset/replace behavior.
6. Verify typecheck, lint, tests, and production build.

Rollback is straightforward because demo records are ordinary local data. Removing the onboarding UI leaves existing local records usable through current modules. Removing the onboarding state key does not corrupt the business database.

## Open Questions

- Should Settings initially support only "replace with demo data" for non-empty databases, or should it also support an explicit append option? The simplest MVP path is replacement with confirmation.
