## Context

TagsFlow AI already has an approved MVP definition, but the codebase is still close to the default Vite React starter. The first implementation slice should establish the app shell and architectural boundary so later work can add business modules without refactoring the top-level structure.

This change is intentionally narrow: it creates the foundation required by later project, task, kanban, member, settings, and AI work, but it does not implement those features yet.

## Goals / Non-Goals

**Goals:**
- Establish the dependency baseline needed by the MVP foundation.
- Create the top-level source structure for `app`, `presentation`, `application`, `domain`, `infrastructure`, and `shared`.
- Define shared constants once so later modules do not duplicate route paths, kanban configuration, or status and priority labels.
- Replace the default Vite starter view with a routed shell and placeholder screens.
- Keep the shell minimal, readable, and ready for later light/dark theming.

**Non-Goals:**
- Local Storage repositories or persistence behavior.
- Domain entities, repository ports, AI provider adapters, or form logic.
- Dashboard metrics, project CRUD, task CRUD, kanban drag and drop, or any AI workflow.
- Final visual polish beyond a clean operational shell.

## Decisions

### Use a minimal dependency baseline
The foundation slice will add only the libraries needed by the approved MVP path: Tailwind CSS for styling, React Router for navigation, TanStack Query and TanStack Table for later data flows, Zustand for lightweight UI state, React Hook Form and Zod for later forms and validation, dnd-kit for later kanban interactions, and Recharts for later dashboard charts.

Alternative considered: delaying dependency installation until feature work starts. This was rejected because the shell, folder structure, and shared contracts should be built against the real stack that later modules will use.

### Mirror the architecture in the source tree
The source tree will expose the intended boundaries from the start. `presentation` owns the UI shell and placeholder pages, `application` is reserved for future orchestration, `domain` for rules and ports, `infrastructure` for adapters, `shared` for reusable constants and types, and `app` for composition and bootstrapping.

Alternative considered: keeping a flat `src` tree until later refactors. This was rejected because the product explicitly relies on Ports and Adapters, and the first slice should make that boundary visible.

### Centralize route and UI constants
Route paths, kanban columns, task statuses, task priorities, and the Local Storage database key will be defined once in shared modules. Later slices must import them rather than re-declare them.

Alternative considered: defining constants next to the first consumer. This was rejected because the foundation slice is the best point to establish the cross-cutting contracts.

### Build a routed shell, not a landing page
The top-level experience will be a fixed-sidebar application shell with routed content and placeholder pages. The shell should look like a usable product surface, not a marketing page.

Alternative considered: keeping the starter screen and adding navigation later. This was rejected because navigation is part of the foundation contract and later modules will depend on the route layout.

### Keep placeholders thin
Placeholder pages will exist only to validate routing and layout. They should not imply that business workflows are complete.

Alternative considered: stubbing fake dashboard cards or sample data. This was rejected because it would blur the boundary between foundation and feature implementation.

## Risks / Trade-offs

- [Dependency churn] -> Install only the agreed foundation libraries and avoid unrelated packages.
- [Over-scoping the shell] -> Keep placeholder pages thin and defer business logic to later changes.
- [Routing duplication] -> Use shared route constants for both navigation and route registration.
- [Theming drift] -> Set up light/dark-ready structure now, but defer final styling to feature work.
- [Boundary confusion] -> Keep application, domain, and infrastructure folders present even if they only contain placeholders at first.

## Migration Plan

1. Install the foundation dependencies required by the MVP slice.
2. Introduce the layer-oriented source structure and shared constants.
3. Replace the starter app screen with the routed shell and placeholder pages.
4. Verify navigation and build health before adding business modules.
5. Later slices can fill in domain entities, repositories, forms, kanban behavior, dashboards, and AI features without changing the shell contract.

## Resolved Follow-up Decisions

- The foundation slice will not implement a functional light/dark theme toggle. It will only prepare the layout and styling structure for future theme support.
- The root route `/` will redirect to `/dashboard` so the app always opens in the main dashboard placeholder.