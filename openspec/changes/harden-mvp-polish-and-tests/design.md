## Context

TagsFlow AI is already defined as a frontend-only, local-first MVP with repository-backed business data, provider-neutral AI workflows, and a polished SaaS UI direction. Recent archived changes cover the core product areas: project and task management, members and tags, dashboard metrics, settings and backups, onboarding/demo data, project/global Kanban, and AI workflows.

This change is a final readiness pass. It should inspect implemented behavior against the current specs, fix small UX and edge-case issues, harden tests, and verify that architecture and data-safety boundaries still hold. It must not become a second MVP definition, a redesign, or a new-feature umbrella.

One source-of-truth mismatch must be resolved during this pass: the current `global-kanban-overview` spec describes a strictly read-only board, while current project instructions define Global Kanban as allowing status-only drag-and-drop and read-only task inspection. The hardening pass should align the spec and implementation around the status-only interaction model.

## Goals / Non-Goals

**Goals:**

- Audit all MVP routes and workflows against the approved specs and AGENTS.md boundaries.
- Fix inconsistent empty, loading, error, form, dialog, toast, and destructive-action states without broad visual rewrites.
- Verify responsive behavior for desktop, tablet, and narrow/mobile layouts where the current app shell supports them.
- Harden edge cases around empty data, missing optional dates, deleted references, pending subtasks, invalid imports, AI provider failures, malformed AI output, reset, demo data, and mixed-project Kanban data.
- Strengthen automated coverage for domain rules, repositories, settings backup/import/reset, task and subtask workflows, Kanban interactions, dashboard metrics, AI workflows, onboarding, and transient AI data.
- Verify architecture boundaries: UI does not access Local Storage or Groq directly, domain remains framework/provider/browser independent, and infrastructure stays behind ports.
- Verify data safety: API keys, raw prompts, raw provider responses, additional AI instructions, and generated AI summaries are not exported or persisted outside their approved local/transient boundaries.
- Align Global Kanban with status-only drag-and-drop and read-only task details.

**Non-Goals:**

- New product features, new AI workflows, AI chat, backend proxy, real authentication, cloud sync, or real collaboration.
- App shell redesign, UI framework replacement, major visual redesign, or large dependency additions.
- Project, task, subtask, member, tag, repository-port, AI-provider-port, or Local Storage database contract redesign.
- Local Storage database version changes unless implementation finds a proven bug that cannot be safely fixed within the existing version-one shape.
- Persisting generated AI summaries, additional instructions, raw prompts, raw provider responses, or API keys in backups.

## Decisions

### Treat final polish as an audit-and-fix pass

The implementation should start with a route and workflow audit, then fix concrete gaps. This keeps the change anchored to observed MVP readiness issues instead of creating speculative UI work.

Alternative considered: predefining a large redesign task list. Rejected because the MVP needs final consistency and verification, not a new presentation direction.

### Preserve architecture while testing boundaries

Polish fixes must use existing Presentation, Application, Domain, and Infrastructure seams. UI components may call hooks and use cases, but they must not read/write Local Storage directly or construct provider adapters. Domain changes should remain pure TypeScript business logic without React, TanStack Query, browser APIs, Local Storage, or Groq dependencies.

Alternative considered: allowing direct component fixes for speed. Rejected because final hardening should increase confidence in maintainability and future backend/provider migration.

### Keep test additions gap-driven

The pass should strengthen tests where coverage gaps or bug fixes are found. Tests should prioritize behavior that protects MVP contracts: progress calculation, deletion cleanup, import validation, backup sanitization, transient AI data, malformed AI output, Kanban status changes, read-only boundaries, and onboarding/demo behavior.

Alternative considered: adding broad snapshot-style UI coverage. Rejected because it can make polish work brittle while missing business regressions.

### Align Global Kanban to status-only interaction with task-detail navigation

Global Kanban should allow moving existing tasks across configured status columns through the same application-level status update path used elsewhere. It should also allow opening a read-only detail popup for a task in the global context.

The detail popup should show task and project context, including available task metadata and compact subtask/checklist progress. It must not expose inline edit, delete, subtask CRUD, member mutation, tag mutation, AI actions, or arbitrary project reassignment.

The detail popup may include a navigation action such as `Open task`, `View in project`, or `Edit in project` that takes the user to the existing project/task-focused surface where full task editing is supported. This navigation must reuse existing routes or surfaces; it must not introduce a new standalone task route unless one already exists end-to-end.

Task creation remains out of scope for global `/kanban`; new task creation stays project-scoped. Global Kanban must also continue to prohibit subtask CRUD, AI actions from Kanban cards, direct task deletion, direct task editing, domain contract changes, repository contract changes, and Local Storage database version changes.

Alternative considered: making Global Kanban a fully editable task-management surface with inline edit and delete actions. This was rejected for the MVP because Global Kanban should remain a cross-project workflow board, while full task editing remains in the project/task-focused surfaces.

### Keep AI hardening transient and secret-safe

AI project planner, subtask generator, priority suggestion, and project summary hardening should verify configuration gating, provider failure states, malformed output validation, review-before-apply or read-only boundaries, and non-persistence of additional instructions/prompts/responses. Error display must not expose API keys, authorization headers, raw prompts, raw provider dumps, or raw provider responses.

Alternative considered: adding persistence for summaries or AI outputs to aid manual review. Rejected because existing AI specs define generated outputs and additional instructions as transient unless explicitly accepted through approved mutation workflows.

### Use existing scripts as final gates

The final readiness pass should run the project checks that exist, including lint, build/typecheck, tests, and strict OpenSpec validation with the target form accepted by this CLI, such as `openspec validate --all --strict`. If a script is missing or flaky for an environmental reason, the implementation should document the exact blocker and run the closest reliable targeted checks.

Alternative considered: relying on manual route review only. Rejected because the requested work is specifically polish and test hardening.

## Risks / Trade-offs

- [Scope creep] -> Keep every fix tied to a route audit finding, edge case, spec mismatch, test gap, or developer-readiness issue.
- [Brittle UI tests] -> Prefer behavior-level assertions and targeted integration tests over visual snapshots unless the existing stack already supports stable visual checks.
- [Kanban drag-and-drop test limits] -> Cover the status update path and drag intent with available test utilities; document any manual verification required for low-level drag events.
- [Responsive regressions] -> Check desktop, tablet, and narrow/mobile widths for major surfaces and fix layout overflow without redesigning the app shell.
- [Secret leakage] -> Add tests around export/import, AI errors, and settings display to prevent API keys, raw prompts, or raw provider data from appearing in persisted or user-visible unsafe contexts.
- [Hidden architecture drift] -> Use targeted searches and tests to confirm forbidden imports or direct adapter construction are not introduced in Presentation or Domain.

## Migration Plan

1. Audit current routes, workflows, specs, and npm scripts.
2. Fix concrete UI consistency, responsive, edge-case, and data-safety gaps within existing modules.
3. Add or update focused tests for each fixed behavior and major uncovered readiness boundary.
4. Align Global Kanban implementation and tests with the status-only interaction spec.
5. Run OpenSpec strict validation and available project checks.
6. Roll back by reverting the focused fixes and tests from this change; no data migration should be required unless a proven version-one compatibility bug is discovered and explicitly documented.

## Open Questions

- Which specific UI polish defects and test gaps will the route audit uncover during implementation?
- Are current test utilities sufficient for reliable Global Kanban drag-and-drop simulation, or should part of that interaction remain manually verified with targeted application-level tests?
