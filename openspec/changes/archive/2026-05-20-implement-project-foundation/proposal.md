## Why

TagsFlow AI needs a stable frontend foundation before the product can add domain logic, persistence, and AI workflows. The current app is still close to the default Vite starter, so this change establishes the dependency baseline, modular source structure, shared constants, and routed shell needed for the first implementation slice.

## What Changes

- Adds the foundational frontend dependencies required by the MVP slice: Tailwind CSS, React Router, TanStack Query, TanStack Table, Zustand, React Hook Form, Zod, dnd-kit, and Recharts.
- Introduces the initial source structure for `app`, `presentation`, `application`, `domain`, `infrastructure`, and `shared`.
- Defines shared constants only for route paths, kanban column configuration, task status labels, task priority labels, and the Local Storage database key.
- Replaces the starter Vite screen with a minimal app shell that uses a fixed sidebar and routed content area.
- Adds placeholder pages for Dashboard, Projects, Project Detail, Tasks, Kanban, Members, and Settings so routing can be verified before business modules exist.
- Keeps styling light/dark-ready and operational, without final visual polish or business feature implementation.

## Capabilities

### New Capabilities
- `project-foundation`: Dependency baseline, modular source structure, shared constants, routed shell, and placeholder pages for the TagsFlow AI MVP foundation.

### Modified Capabilities

- None

## Impact

This change affects `package.json`, the Vite entry point, global styling, routing setup, and the source directory layout. It creates the foundation that later changes can build on for repositories, domain entities, forms, kanban interactions, dashboard metrics, and AI features without changing the shell or shared contracts.
