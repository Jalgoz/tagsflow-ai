## Context

TagsFlow AI already has the core pieces needed for a focused AI Subtask Generator: task and subtask entities, subtask repository/use-case/query hook behavior, provider-neutral AI resolution, Groq and mock provider adapters, structured AI response helpers, and an AI Project Planner workflow that uses review-before-insert. The current AI port already exposes `generateSubtasks`, but Groq still treats it as unsupported and the existing subtask generation DTO is too narrow for the requested workflow because it does not carry existing-subtask duplicate context, conservative tag/member context, status/checklist/tag proposal fields, or optional user instructions.

This change should therefore activate a workflow-specific AI feature without creating a new storage model. The generated data remains proposed subtask draft data until the user explicitly confirms insertion through existing subtask creation behavior.

## Goals / Non-Goals

**Goals:**

- Add a task-scoped AI Subtask Generator that works for one selected parent task at a time.
- Keep Presentation free of Groq calls and Local Storage access by using Application hooks and the provider-neutral `AIProvider` interface.
- Build deterministic provider input from existing project, parent task, existing subtasks, tags, members, and optional single-turn user instructions.
- Reuse a named `MAX_SUBTASK_INSTRUCTION_LENGTH = 1200` constant in validation and request construction.
- Validate provider output with Zod before showing proposals or creating subtasks.
- Require user review, selection, practical edits, and explicit confirmation before local data is mutated.
- Insert selected proposals as normal subtasks through existing subtask creation use cases and query invalidation.
- Keep user instructions transient and out of project, task, subtask, settings, backup, and Local Storage data.

**Non-Goals:**

- No AI chat, multi-turn conversation, or conversation history.
- No automatic insertion when the provider returns a response.
- No top-level task generation, nested subtasks, automatic member assignment, or tag creation.
- No domain entity contract, repository port, Local Storage key/version, backup format, settings redesign, dashboard behavior, Kanban behavior, demo data, backend proxy, authentication, or cloud sync changes.
- No changes to AI Project Planner, AI Priority Suggestion, or AI Project Summary beyond sharing existing AI patterns where useful.

## Decisions

1. Keep the workflow in a new `ai-subtask-generator` capability.
   - Rationale: The feature is a distinct AI workflow with its own request construction, output contract, review state, and insertion behavior.
   - Alternative considered: Modify `task-and-subtask-management`. That would blur normal subtask CRUD with AI proposal behavior and make the existing task/subtask spec carry provider concerns.

2. Refine provider-neutral subtask DTOs instead of changing repository ports.
   - Rationale: The AI provider contract needs enough context and output fields to support the workflow, while subtask persistence can continue through existing `CreateSubtaskInput` and `SubtaskRepository` behavior.
   - Alternative considered: Add a dedicated AI subtask repository or storage table. That would persist transient AI proposals and conflict with review-before-insert.
   - Before extending the AI DTO, inspect the approved `Subtask` entity and `CreateSubtaskInput`. The AI response schema, review fields, and insertion mapping must include only fields supported end-to-end by the current subtask contract. Unsupported description, priority, status, due-date, checklist, or tag fields must be omitted instead of changing the entity or silently discarding generated data.

3. Put request construction and instruction normalization in Application-layer helpers.
   - Rationale: Input assembly uses business data from multiple read hooks and must be testable without React rendering or Groq requests. Presentation should only own local form state and user actions.
   - Alternative considered: Build the prompt directly in the component. That would duplicate limits and make provider safety harder to test.
   - Request construction must also apply named deterministic limits to project/task text, existing subtasks, tags, and members. It must not send unbounded collections or text to the provider. Truncation and item selection must be stable and covered by input-builder tests.

4. Keep provider-specific prompt construction and response parsing in Infrastructure.
   - Rationale: Groq request shape, `response_format`, prompt wording, error normalization, and model JSON parsing are provider-adapter concerns. Application should receive validated provider-neutral DTOs or safe failure states.
   - Alternative considered: Parse raw Groq responses in the hook. That would leak provider details into Application and Presentation.

5. Use review drafts for generated proposals before calling subtask mutations.
   - Rationale: Drafts allow selection, basic editing, validation, retry, cancellation, and duplicate-insert prevention while keeping local data unchanged until confirmation.
   - Alternative considered: Immediately create all returned subtasks. That is explicitly out of scope and would make invalid or low-quality AI output harder to control.

6. Treat additional instructions as a single-turn transient field.
   - Rationale: The user needs task-specific steering, but storing instructions would introduce conversation/history semantics and backup/privacy concerns outside the MVP.
   - Alternative considered: Save instructions on the task or in settings. That would change persistence contracts and create long-lived data with unclear ownership.

7. Place the generator in a focused dialog opened from an explicit `Generate subtasks` action on an existing parent task in Project Detail > Tasks.
   - The selected parent task remains fixed while the dialog is open.
   - The dialog contains the optional instructions, generation state, proposal review, and insertion confirmation.
   - Do not embed the generator inside the normal task edit form or modify Global Tasks/Kanban surfaces in this change.

## Risks / Trade-offs

- Risk: AI output may include unsupported fields, IDs, nested subtasks, invalid dates, or unsafe statuses. Mitigation: Use strict Zod schemas and reject invalid responses before drafts or insertion.
- Risk: Users may expect instructions to override workflow limits. Mitigation: Prompt guidance and validation must state that instructions are subordinate to one-level-subtask and review-before-insert rules.
- Risk: Duplicate suggestions may still occur. Mitigation: Include existing subtasks as duplicate-avoidance context and keep user review/select/edit before insertion.
- Risk: A long instruction can bloat provider prompts or UI state. Mitigation: Enforce `MAX_SUBTASK_INSTRUCTION_LENGTH = 1200` before generation and reuse the same constant in UI validation and request building.
- Risk: Partial insertion can happen if one selected proposal fails after earlier ones succeed. Mitigation: Insert through normal subtask mutations, mark successful drafts as inserted, report failures safely, and prevent duplicate insertion of successful drafts.
- Risk: Query refresh may miss a derived view. Mitigation: Reuse or extend existing subtask mutation invalidation so Project Detail Tasks, task progress, Project Kanban metadata, Global Tasks, Global Kanban, and Dashboard data refresh through shared query keys.
