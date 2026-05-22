## Context

TagsFlow AI already has the approved MVP definition, routed shell, domain entity types, repository ports, Local Storage repository adapters, and a completed Project Management slice. The current Members route still renders a placeholder, while member and tag persistence already exists behind `MemberRepository` and `TagRepository`.

This change turns the local member and tag catalogs into functional product surfaces without adding task CRUD, subtask CRUD, project member assignment UI, or task/tag assignment forms. It must preserve the existing Ports and Adapters boundary: Presentation renders pages and forms, Application owns use cases and TanStack Query orchestration, Domain owns entities and repository contracts, and Infrastructure owns Local Storage persistence.

## Goals / Non-Goals

**Goals:**
- Add Application-layer member use cases using existing `MemberRepository`, plus assignment detection using existing project, task, and subtask repository ports.
- Add Application-layer tag use cases using existing `TagRepository`, plus used-tag detection using existing task and subtask repository ports.
- Add member and tag TanStack Query hooks with centralized query keys and mutation invalidation.
- Add Zod validation schemas and form-to-domain mapping helpers for member and tag forms.
- Replace the Members route placeholder with a functional catalog surface for members and tags.
- Warn before deleting assigned members or used tags, while leaving repository adapters responsible for cleanup after confirmed deletion.
- Keep implementation local-first and compatible with future HTTP repository adapters.

**Non-Goals:**
- Task CRUD, subtask CRUD, checklist editing, task assignment forms, subtask assignment forms, project member assignment UI, or tag assignment UI.
- Kanban drag and drop, dashboard metrics, AI workflows, settings, import/export, demo data, authentication, backend APIs, real collaboration, or real-time behavior.
- New persistence keys, database schema changes, or duplicated cleanup logic in Presentation/Application.
- New AI provider behavior; Groq remains out of scope for this slice and still belongs behind the provider-neutral `AIProvider` interface in later AI work.

## Decisions

### Keep member and tag orchestration in Application

Member and tag use cases will live in Application feature modules and accept repository port dependencies. Member assignment detection will inspect projects, tasks, and subtasks through their existing ports. Tag usage detection will inspect tasks and subtasks through their existing ports.

Alternative considered: detecting assignments directly inside UI components. This was rejected because it would leak business orchestration into Presentation and make future HTTP repository migration harder.

### Member form empty value mapping

The member form should allow an empty email field. Empty email input must be normalized consistently before reaching the domain create or update input.

For this MVP slice, empty email values should be mapped to an empty string, because the approved `Member` domain entity stores `email` as a string. Validation should only apply email format checks when the trimmed email value is not empty.

Role and avatar may also be empty strings. Member name must be trimmed and remain required.

Alternative considered: mapping empty email to `null`. This was rejected because the current domain member contract uses a string email field, and changing that contract is outside this slice.

### Reuse existing Local Storage repositories without changing persistence

The existing Local Storage adapters already support member CRUD, tag CRUD, member assignment cleanup, and tag usage cleanup. This change should compose those adapters at the app boundary and call them through Domain ports.

Alternative considered: adding new Local Storage helper functions for member/tag screens. This was rejected because the repository ports already express the needed persistence contract.

### Add explicit assignment and usage detection before destructive actions

Deleting a member should first expose whether the member is assigned to projects, tasks, or subtasks. Deleting a tag should first expose whether the tag is used by tasks or subtasks. The UI asks for confirmation when usage exists, then calls the delete mutation. Cleanup remains repository-defined: member deletion removes project references and unassigns tasks/subtasks; tag deletion removes tag IDs from tasks/subtasks.

Alternative considered: always showing a generic delete confirmation. This was rejected because assigned-member and used-tag deletion has visible downstream effects that the user should understand before confirming.

### Use TanStack Query for member and tag business data

`useMembers`, `useMember`, `useTags`, and `useTag` will own read state. Mutation hooks will call Application use cases and invalidate affected list/detail queries. Zustand remains reserved for global UI state and must not store persisted member or tag entities.

Alternative considered: placing member/tag arrays in Zustand for convenience. This was rejected because catalog entities are asynchronous business data and the approved boundary assigns that orchestration to TanStack Query.

### Keep validation near the Application feature

Member and tag form schemas will be Zod-backed and colocated with their Application feature modules. Member `name` is required, `email` is optional but must be a valid email when provided, and `role` and `avatar` may be empty strings. Tag `name` is required and `color` is optional.

Alternative considered: validating only through React Hook Form field rules. This was rejected because Zod schemas are reusable in tests and future import/API boundaries.

### Normalize find-or-create tag names

The tag find-or-create use case should trim input and compare existing tag names case-insensitively. If a matching tag exists, it returns the existing tag. If no matching tag exists, it creates a new tag through `TagRepository`.

Alternative considered: always creating tags from inline input. This was rejected because duplicate tags with only casing or whitespace differences would weaken filtering and catalog reuse.

### Tag color handling

Tag color is optional in this slice. If provided, it should be stored as a trimmed string and displayed as a simple visual hint by the tag badge. Empty color input should be normalized to `undefined` or omitted from the domain input, matching the existing optional color contract.

The UI should not enforce an advanced palette, color picker, or design token system in this slice. A simple text input or small predefined color selection is enough if the implementation needs a control.

Alternative considered: introducing a full tag color palette system. This was rejected because tag styling can evolve later and this slice should focus on catalog management.

### Place basic Tag Management in the Members module slice

The MVP route list has `/members` but no separate `/tags` route. This change should add a basic tag catalog area inside the Members page, using clear separation between the member catalog and tag catalog. Future task forms can reuse the tag Application feature without changing this page.

Alternative considered: adding a new `/tags` route. This was rejected because the approved route contract does not include it, and the user requested a focused Member and Tag Management module rather than navigation expansion.

### Keep UI operational but compact

The Members page should provide list, empty, loading, error, create, edit, and delete states for both members and tags. Tag badges should expose name and color simply, without introducing filtering or assignment controls that belong to later task slices.

Alternative considered: building full member assignment dashboards or tag analytics. This was rejected because those depend on later task/project assignment UIs and dashboard metrics.

## Risks / Trade-offs

- [Repository provider duplication] -> Prefer a small shared repository composition pattern or focused member/tag providers that keep Presentation importing Application hooks only.
- [Deletion warnings become stale between detection and deletion] -> Re-check or fetch usage close to the delete action and rely on repository cleanup as the final source of consistency.
- [Tag duplicates from inconsistent names] -> Normalize names in find-or-create and cover casing/whitespace behavior with tests.
- [Members page becomes too dense] -> Use two clearly separated sections or tabs within the route, keeping controls compact and predictable.
- [Hook invalidation misses dependent data] -> Centralize query keys and invalidate list/detail queries after member or tag create, update, and delete mutations.
- [Scope creep into assignment flows] -> Keep assignment controls out of this change and only display usage counts or warning context before deletion.

## Migration Plan

1. Add member and tag Application feature modules, use cases, validation schemas, query keys, hooks, repository providers, and exports.
2. Wire app composition so member and tag hooks receive repository ports without importing Local Storage adapters in pages.
3. Replace the Members placeholder with member and tag catalog UI.
4. Add focused tests for use cases, validation, assignment/usage detection, and find-or-create tag behavior.
5. Run `npm run test`, `npm run lint`, and `npm run build`.

Rollback is straightforward during the MVP: restore the Members placeholder and remove the new Application member/tag feature exports and providers. Existing Local Storage data can remain because this change uses the already approved `tagsflow_ai_db_v1` shape.

## Open Questions

- None. The approved MVP scope, existing domain entities, existing repository ports, and existing Local Storage adapters are sufficient for this slice.
