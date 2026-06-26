## 1. Domain and Request Contracts

- [x] 1.1 Review the current `Subtask` and `CreateSubtaskInput` shapes, then update provider-neutral AI DTOs using only fields supported end-to-end without changing domain or repository contracts.
- [x] 1.2 Add `MAX_SUBTASK_INSTRUCTION_LENGTH = 1200` in a shared AI subtask generation module usable by UI validation and request construction.
- [x] 1.3 Implement a subtask generation input builder that trims instructions, omits empty or whitespace-only instructions, enforces the instruction limit, and builds context from project, parent task, existing subtasks, tags, and members.
- [x] 1.4 Define and enforce named limits for project/task text length and existing subtask, tag, and member context counts using deterministic truncation.
- [x] 1.5 Add unit tests for input construction, trimmed instruction inclusion, whitespace-only instruction omission, over-limit instruction blocking, generation without instructions, and conservative tag/member context.

## 2. Structured AI Validation and Provider Support

- [x] 2.1 Add a strict Zod schema containing only supported subtask fields and rejecting malformed JSON, unknown properties, nested subtasks, generated IDs, invalid dates, and unsupported enum values.
- [x] 2.2 Implement Groq subtask generation prompt/request construction behind `GroqAIProvider.generateSubtasks`, including one-level-subtask, review-before-insert, no trusted IDs, no tag creation, no member assignment, and no automatic insertion guidance.
- [x] 2.3 Normalize Groq subtask generation failures into safe provider errors that do not expose API keys, authorization headers, raw prompts, or raw provider dumps.
- [x] 2.4 Update `MockAIProvider.generateSubtasks` to return deterministic valid proposals that can exercise instruction-influenced happy paths without network access.
- [x] 2.5 Add provider and parser tests for valid Groq request construction, instruction safety guidance, structured response validation, failure normalization, and mock provider happy path.

## 3. Application Draft and Insertion Flow

- [x] 3.1 Add review draft helpers for selection and editing of only the fields supported by `CreateSubtaskInput`, then map valid selected drafts into normal subtask creation inputs.
- [x] 3.2 Add an application hook or workflow module that resolves AI configuration, loads project/task/subtask/tag/member context, runs generation, stores transient drafts/errors, supports retry, and preserves instructions while the surface remains open.
- [x] 3.3 Implement confirmed insertion through existing subtask creation hooks/use cases, including empty-selection handling, partial failure reporting, success draft marking, and duplicate-insert prevention.
- [x] 3.4 Ensure generated subtask insertion refreshes Project Detail Tasks, task progress, Project Kanban metadata, Global Tasks, Global Kanban, and Dashboard data through existing query invalidation paths.
- [x] 3.5 Add application tests for draft validation, no insertion before confirmation, selected-only insertion, empty selection, partial success handling, duplicate prevention after success, and query invalidation where current utilities support it.

## 4. Presentation Workflow

- [x] 4.1 Create `AISubtaskGeneratorDialog` in `src/presentation/components` using the same visual patterns (dialog, instructions input, cancel/generate actions, unconfigured block) as `AIProjectPlannerDialog`.
- [x] 4.2 Restrict instructions to `MAX_SUBTASK_INSTRUCTION_LENGTH`, showing character count limits exactly as established in the project planner.
- [x] 4.3 Show the configuration block with quick actions when AI is unconfigured or blocked by missing settings.
- [x] 4.4 When generation succeeds, hide the input section and render editable review drafts using existing form primitives for the supported fields.
- [x] 4.5 Add a "Generate subtasks" button to `TaskSubtaskArea` that appears next to "New subtask".
- [x] 4.6 Wire the button to open the `AISubtaskGeneratorDialog` and pass the active project ID and task ID.

## 5. Persistence and Boundary Verification

- [x] 5.1 Verify additional instructions are not stored in project, task, subtask, settings, backup, import/export, or Local Storage data.
- [x] 5.2 Verify inserted proposals become normal editable, deletable, and exportable local subtasks belonging to the selected parent task.
- [x] 5.3 Verify the change does not alter repository port contracts, the parent task contract, the subtask contract, the `tagsflow_ai_db_v1` key, or the Local Storage database version.
- [x] 5.4 Verify the change does not implement AI Priority Suggestion, AI Project Summary, AI chat, multi-turn conversation history, top-level task generation, nested subtasks, automatic member assignment, automatic tag creation, settings redesign, import/export redesign, demo data changes, backend proxy, authentication, or cloud sync.

## 6. Final Checks

- [x] 6.1 Add or update focused UI tests for the not-configured state, instruction validation, review selection behavior, cancel-without-insert behavior, no insertion before explicit confirmation, and success feedback where current test utilities support it.
- [x] 6.2 Run the relevant targeted tests for AI, subtask hooks, task surfaces, and backup/persistence boundaries.
- [x] 6.3 Run project-wide verification commands available in the repo, including lint and build.
- [x] 6.4 Review the final diff for scope creep, secret leakage, unrelated files, and adherence to the approved OpenSpec change before committing.
