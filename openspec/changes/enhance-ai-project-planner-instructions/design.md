## Context

The AI Project Planner already lives behind the provider-neutral AI provider seam and generates reviewable top-level task proposals for the current project. It builds input from project context, existing top-level tasks, tags, and members; validates provider output before review; and inserts selected proposals only through existing task creation behavior after explicit user confirmation.

The current limitation is that generation is driven only by existing project context. Users need a lightweight way to describe a specific feature, goal, or workstream to plan without turning the planner into chat, changing persisted project/task data, or widening the AI workflow beyond top-level task proposals.

## Goals / Non-Goals

**Goals:**

- Add an optional additional planning instructions field to Project Detail > AI Insights.
- Keep the field transient while the current AI Insights page remains open.
- Trim the field, omit it when empty, and enforce a named deterministic maximum length.
- Include non-empty instructions in the planner input builder and provider prompt/request.
- Tell the model to prioritize the user instruction when present while still honoring project scope and existing planner output constraints.
- Preserve existing loading, error, retry, cancel, validation, review, editing, selection, confirmation, insertion, and toast behavior.
- Add focused tests for instruction handling and for unchanged behavior when no instruction is provided.

**Non-Goals:**

- No AI chat or multi-turn memory.
- No persistence of the instruction in projects, tasks, settings, backups, or Local Storage.
- No changes to project, task, subtask, repository, Local Storage database, or settings contracts.
- No generated subtasks, automatic member assignment, automatic tag creation, or automatic insertion.
- No changes to dashboard, Kanban, Settings redesign, import/export, demo data, backend, authentication, or cloud sync behavior.

## Decisions

### Store planning instructions as transient planner UI state

The textarea value should live in the planner UI or its local workflow hook while Project Detail > AI Insights remains mounted. It should not be written to repositories, Zustand business state, Local Storage, settings, task drafts, project data, or backup data.

Alternative considered: persist the last instruction per project for convenience. This is rejected because the request explicitly keeps instructions non-persistent and because persisted free text would expand the project/local database contract without need.

### Enforce a named instruction length limit before generation

The planner should define a named constant for maximum instruction length in the planner input or validation module, then reuse it in UI validation and input building. The UI should show validation feedback and prevent generation while the instruction exceeds the limit unless the existing form convention for comparable planner fields already uses safe truncation. Components should not contain magic numbers.

Alternative considered: send the full textarea value and rely on provider token limits. This is rejected because user free text must be bounded deterministically before provider requests.

The planner should use `MAX_PLANNER_INSTRUCTION_LENGTH = 1200` characters as the initial MVP limit. The UI must prevent generation when the trimmed instruction exceeds this limit and show validation feedback. The input builder must also enforce the same limit as a defensive boundary.

### Extend the existing planner input object narrowly

The planner input builder should accept an optional raw instruction string, trim it, omit it when blank, and include the normalized value only when valid. Existing project context, top-level task summaries, tags, and members remain as they are today.

This is a planner workflow DTO/input change, not a project/task/domain persistence change. Domain entities, repository ports, and Local Storage schemas should remain unchanged.

Alternative considered: have the component manually concatenate instructions into a Groq prompt. This is rejected because Presentation must not construct provider prompts or call provider-specific adapters directly.

### Prioritize instructions in provider prompt behavior without relaxing output constraints

`GroqAIProvider.generateProjectPlan` should include the instruction context in the structured planner request when present and tell the model to prioritize that instruction within the current project scope. The prompt must still require top-level task proposals only, no subtasks, no automatic member assignment, no automatic tag creation, no trusted model IDs, and review-before-insert.

`MockAIProvider` can use the instruction only as deterministic test context if helpful; it must remain network-free and provider-neutral.

Alternative considered: let instructions change the output shape or create supporting entities. This is rejected because it would violate the approved planner contract and the explicit exclusions.

User-provided instructions are planning context, not authority to change the planner contract. If the instruction asks for subtasks, automatic member assignment, tag creation, direct insertion, IDs, or a different output format, the provider prompt and validation must preserve the approved top-level-task-only response contract.

### Preserve review-before-insert as the data mutation boundary

Generated proposals should continue to appear in the existing review panel. Users should continue to select proposals, edit supported fields, cancel, retry, and confirm insertion explicitly. The instruction should influence generation only; it must not auto-insert tasks or bypass validation.

After a successful generation, the simplest current UX pattern should decide whether the transient textarea remains populated or clears. Either behavior is acceptable only if it is local to the open page and does not persist to storage.

Alternative considered: clear instructions as part of insertion state saved with generated proposals. This is rejected if it couples ephemeral prompt text to persisted task data or makes retry/review behavior harder to reason about.

## Risks / Trade-offs

- [Risk] Overly broad user instructions could conflict with project scope. -> Mitigation: prompt the model to prioritize instructions within project scope and preserve review/edit before insertion.
- [Risk] A textarea can send excessive text to Groq. -> Mitigation: enforce a named maximum length before provider requests.
- [Risk] Instruction handling could accidentally become persisted state. -> Mitigation: add tests or contract checks proving no project, task, settings, repository, or Local Storage schema changes are introduced.
- [Risk] Prompt changes could weaken existing output boundaries. -> Mitigation: keep existing structured response validation and add provider request tests that assert top-level-only constraints remain present.
- [Risk] UI validation could block generation unnecessarily when the field is empty. -> Mitigation: treat the field as optional and permit generation from project context alone.

## Migration Plan

1. Add the instruction limit constant and normalized optional instruction handling to planner input construction.
2. Add Project Detail > AI Insights textarea state and validation feedback.
3. Pass valid instructions through the planner generation use case into provider-neutral input.
4. Update Groq planner prompt/request construction and MockAIProvider tests/fixtures where needed.
5. Add focused tests for instruction inclusion, omission, trimming, limit enforcement, provider prompt/request inclusion, and unchanged no-instruction behavior.
6. Rollback can remove the UI field and optional input property; no data migration is required because no persisted schema changes are introduced.

## Open Questions

- None. The instruction field may be cleared or preserved after successful generation according to the simplest existing local UI pattern, provided it is never persisted.
