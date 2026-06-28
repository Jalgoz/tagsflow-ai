## Context

TagsFlow AI already has frontend-only local project management, task/subtask management, settings-backed AI configuration, provider-neutral AI resolution, structured AI response helpers, AI Project Planner, and AI Subtask Generator. The next AI workflow should suggest a priority for one existing task using selected-task data and bounded project context, then let the user explicitly decide whether to apply the suggestion.

This change crosses Presentation, Application, Domain DTOs, and Infrastructure adapters, but it must not introduce a backend, authentication, cloud sync, new persistence keys, repository contract changes, or broader task/subtask domain changes. Priority remains an existing task field with approved values `low`, `medium`, `high`, and `urgent`.

## Goals / Non-Goals

**Goals:**
- Add a task-scoped AI Priority Suggestion workflow for existing top-level tasks.
- Keep the workflow project-aware by including bounded project context only for reasoning.
- Use the existing provider-neutral AI boundary and structured response validation before showing results.
- Require review-before-apply and update only the selected task's priority after explicit confirmation.
- Keep additional instructions transient, length-limited, and unable to override workflow boundaries.
- Preserve Local Storage, repository, project, task, subtask, member, tag, dashboard, Kanban, settings, import/export, and backup contracts.

**Non-Goals:**
- No AI priority suggestion for subtasks.
- No automatic priority application.
- No generated tasks, generated subtasks, tag creation, member assignment, or project mutation.
- No AI Project Planner, AI Subtask Generator, AI Project Summary, AI chat, or multi-turn conversation changes.
- No Kanban behavior changes, dashboard changes, settings redesign, import/export redesign, demo data changes, backend proxy, authentication, or cloud sync.

## Decisions

1. Add a dedicated priority-suggestion use case rather than embedding AI calls in UI components.

   Presentation should collect the selected task, optional instruction text, and user actions, then call Application-layer workflow code. The use case builds bounded input, resolves configured AI through existing provider resolution, receives provider-neutral output, and returns safe UI states. This keeps Groq and Local Storage concerns out of components.

   Alternative considered: call the provider directly from the task card or edit surface. That would be faster to wire, but it would violate the existing Ports and Adapters boundary and make validation, testing, and future provider swaps brittle.

2. Model priority suggestion as a workflow-specific AI contract behind the existing AI provider interface.

   The provider-neutral contract should accept a bounded `PrioritySuggestionInput` and return a validated `PrioritySuggestionResult` containing only `suggestedPriority` and `rationale`.

   Alternative considered: reuse planner or subtask generation contracts. Those contracts produce proposal lists and insertion workflows, so reusing them would blur output boundaries and increase the chance of generated work items appearing in this task-only workflow.

3. Build context deterministically with named limits.

   Request construction should use named constants for maximum project text length, task text length, sibling task count, checklist context count, and subtask progress/checklist context count. The selected task is the only mutation target; project fields, sibling tasks, subtasks, tags, members, checklist state, and assignee data are reasoning context only. Unbounded collections should be summarized or omitted deterministically.

   Alternative considered: send the whole project, all tasks, and all subtasks for better model awareness. That increases privacy exposure, token cost, nondeterminism, and accidental scope expansion without being necessary for one priority recommendation.

4. Treat additional instructions as transient workflow input.

   The UI should show an optional `Additional instructions` field where the task-focused surface can support it. The input builder trims whitespace, omits empty values, enforces `MAX_PRIORITY_INSTRUCTION_LENGTH = 800`, and never persists the text to entities, settings, backups, or Local Storage.

   Alternative considered: persist recent instructions for convenience. That conflicts with the single-turn workflow and increases backup/privacy surface area.

5. Validate AI output before review, and review before mutation.

   The provider response must be parsed through existing structured response helpers and Zod schemas. Invalid JSON, invalid shape, unsupported priorities, generated IDs, generated work items, project mutations, member/tag creation, or alternate formats are rejected before review. A valid response is shown in a review surface; only an explicit apply action can call existing task update behavior.

   Alternative considered: optimistically apply the suggestion and let the user undo. That would make AI output mutative before user review, which is outside the approved AI workflow pattern.

6. Use existing task update and query invalidation behavior.

   Applying a different suggested priority should update only the selected task priority field through existing task update hooks/use cases, using full task payload mapping only if the current update path requires it. Task-derived views such as Project Detail Tasks, Project Kanban metadata, Global Tasks, Global Kanban, and Dashboard should refresh through existing invalidation behavior. A same-priority suggestion should be a no-op, not a mutation.

   Alternative considered: add a priority-specific repository port. The existing task update path already owns task mutation and invalidation semantics, so a new repository contract would add migration cost without changing domain capability.

## Risks / Trade-offs

- [Risk] The model may return extra entities or mutation instructions despite prompt guidance -> Mitigation: reject unsupported fields and schema-invalid output before review or mutation.
- [Risk] Bounded context may omit information that would have affected the recommendation -> Mitigation: include the selected task, project summary, subtask progress, checklist/tag/assignee summaries, and conservative sibling-priority context with deterministic limits.
- [Risk] Adding entry points in dense task surfaces could crowd existing actions -> Mitigation: place the action in an existing task-focused detail/edit/action area and keep review UI compact.
- [Risk] Confidence scores can create false precision -> Mitigation: include confidence only if the provider contract validates it and the UI presents it as supporting context, not a rule.
- [Risk] Same-priority suggestions can feel like failed generation -> Mitigation: show the suggestion and rationale clearly, then disable or no-op apply with an explanation.

## Migration Plan

No data migration is required. The change reuses existing task priority values, existing task update behavior, and the existing `tagsflow_ai_db_v1` Local Storage key.

Implementation can be introduced behind the new workflow UI. Rollback is removal of the entry point and workflow wiring; persisted task data remains compatible because only the existing `priority` field may be updated after explicit apply.

## Resolved Follow-up Decisions

- The first implementation point is Project Detail > Tasks, from the existing task-focused action area or task detail surface where the selected task is unambiguous.
- Project Kanban task detail may reuse this workflow later, but it is out of scope for this slice.
- Optional confidence is omitted in the first pass. The provider contract and UI should return and display only `suggestedPriority` and `rationale`.
