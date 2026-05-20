## Context

TagsFlow AI now has a frontend foundation with a routed shell, layer folders, and shared constants. The next implementation slice should fill the Domain layer with business contracts before adding persistence adapters, application use cases, or UI workflows.

The domain model must stay frontend-only and provider-neutral. It should express the TagsFlow AI MVP concepts clearly while preserving future migration paths to HTTP repositories and alternative AI providers.

## Goals / Non-Goals

**Goals:**
- Define strict TypeScript domain entity types for projects, tasks, subtasks, checklist items, members, tags, settings, and AI DTOs.
- Define canonical project status, task status, and priority constants with reusable derived union types.
- Define repository ports that Local Storage adapters can implement now and HTTP adapters can implement later.
- Define a provider-neutral `AIProvider` port that Groq and mock providers can implement without leaking provider-specific shapes.
- Implement pure domain rules for progress, deadlines, completion guards, one-level subtasks, and checklist validation.
- Add focused unit tests for pure domain rules, adding a minimal test setup only because the current project has no test runner.

**Non-Goals:**
- Local Storage repository implementations.
- HTTP repository implementations.
- Groq, OpenAI, Anthropic, backend, or mock AI provider implementations.
- React UI, forms, CRUD screens, query hooks, kanban drag and drop, dashboard metrics UI, import/export, or demo data.
- Runtime validation of imported backup files or raw AI provider JSON. Those belong to infrastructure/application slices, though this change defines DTO contracts they will target.

## Decisions

### Keep domain code framework-free

Domain files will live under `src/domain` and export TypeScript types, constants, ports, and pure functions. They will not import React, TanStack Query, Local Storage, browser APIs, or provider SDKs.

Alternative considered: colocating entity types with future UI or repository modules. This was rejected because business rules would become duplicated or coupled to adapters and screens.

### Use string literal constants as the source of truth

Project statuses, task statuses, and priorities will be defined as readonly arrays or maps, with union types derived from those constants. This keeps runtime values and TypeScript types aligned.

Alternative considered: TypeScript enums. This was rejected because string literal unions are simpler to serialize, easier to validate, and match the Local Storage and AI JSON boundaries.

### Store relationships by IDs in core entities

Projects, tasks, subtasks, members, and tags will use stable string IDs for relationships. Tasks reference their project, subtasks reference their parent task, and assignments/tags are represented by IDs.

Alternative considered: embedding full related entities everywhere. This was rejected because it complicates persistence, creates duplication, and makes future repository adapters harder to swap.

### Separate entities, ports, AI DTOs, and rules

The Domain layer should be organized by concern:
- `entities` for business entity types.
- `constants` for canonical status and priority values.
- `ports` for repository and AI provider interfaces.
- `rules` for pure calculations and validation helpers.
- `ai` or equivalent module for provider-neutral AI request/result DTOs.

Alternative considered: one large domain file. This was rejected because the domain will become a shared contract for several later slices and needs reviewable boundaries.

### Repository ports model business operations, not storage mechanics

Repository interfaces should expose explicit methods such as list, get by ID, create, update, delete, and domain-specific lookup methods where useful. They should use domain entities and input types, not Local Storage records or HTTP payloads.

Alternative considered: defining generic CRUD interfaces only. This was rejected because each entity has different relationship and lookup needs, and overly generic ports hide important business intent.

### AIProvider returns validated domain-friendly DTOs

The `AIProvider` port will represent outputs after provider-level parsing and validation. Infrastructure adapters will later handle Groq prompts, JSON extraction, Zod validation, and transformation before returning DTOs through this port.

Alternative considered: returning raw provider strings or JSON blobs. This was rejected because application code should not trust model output or know provider-specific schemas.

### Progress and deadline rules are pure functions

Progress, overdue detection, upcoming deadlines, pending-subtask detection, subtask nesting checks, and checklist validation will be implemented as deterministic functions that accept domain data and reference dates or options as parameters.

Alternative considered: implementing these rules in components or future repositories. This was rejected because derived metrics must not be persisted and the same rules will be needed across dashboards, project detail, kanban, and AI summaries.

### Empty project progress behavior

A project with no top-level tasks must return `0` progress. The progress calculation must never return `NaN`, `Infinity`, or throw because of an empty task list.

Alternative considered: treating empty projects as 100% complete. This was rejected because an empty project has no completed work and should appear as not started in dashboard and project detail views.

### Add a minimal unit test setup if none exists

The current project has build and lint scripts but no test runner. Since this slice is centered on pure business rules, adding a small Vitest setup is justified if implementation confirms no test stack exists.

Alternative considered: skipping tests until later. This was rejected because the progress, deadline, and validation rules are easy to regress and should be locked down when introduced.

## Risks / Trade-offs

- [Port shape churn] -> Keep repository methods broad enough for MVP flows but avoid implementation-specific methods until repositories are built.
- [Over-modeling] -> Define only fields required by the approved MVP and AI DTOs, leaving advanced collaboration, audit history, and backend metadata out of scope.
- [Duplicate constants] -> Reuse or reconcile existing shared task/kanban constants during implementation so status values do not drift.
- [Ambiguous date handling] -> Represent dates consistently as ISO date strings in domain entities and require rule functions to receive an explicit reference date.
- [AI boundary confusion] -> Document that `AIProvider` outputs are already transformed DTOs, while raw provider validation remains an infrastructure concern.
- [Test dependency growth] -> Add only the minimal unit test dependency and scripts needed for domain rules if no test stack exists.

## Migration Plan

1. Inspect existing `src/domain` and shared constants to avoid duplicating status values unnecessarily.
2. Add domain constants, entity types, AI DTOs, repository ports, and provider port modules.
3. Add pure domain rule modules with focused exports.
4. Add or configure the minimal unit test stack if the project still lacks one.
5. Add focused tests for progress, deadline, completion guard, one-level subtask, and checklist validation behavior.
6. Run typecheck/build, lint, and the new test command if added.

## Open Questions

- None. The approved MVP provides enough scope for this domain slice.
