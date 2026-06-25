## 1. Planner Input Contract

- [ ] 1.1 Locate the existing AI Project Planner input builder, provider DTOs, and generation hook boundaries.
- [ ] 1.2 Add `MAX_PLANNER_INSTRUCTION_LENGTH = 1200` in the planner input or validation module and reuse it from UI validation and input building.
- [ ] 1.3 Extend the planner input type with an optional normalized planning instruction field without changing project, task, settings, repository, or Local Storage contracts.
- [ ] 1.4 Update the planner input builder to trim instructions, omit empty or whitespace-only instructions, and enforce the named length limit.
- [ ] 1.5 Add input builder tests for non-empty instructions, whitespace-only omission, trimming, limit enforcement, and existing no-instruction behavior.

## 2. Provider Prompt and Validation

- [ ] 2.1 Update Groq planner request construction to include valid instruction context when present.
- [ ] 2.2 Update planner prompt guidance to prioritize user instructions within project context while preserving top-level-only task proposal constraints.
- [ ] 2.3 Verify prompt/request guidance still excludes subtasks, automatic member assignment, automatic tag creation, and trusted model-generated IDs.
- [ ] 2.4 Add prompt/request coverage ensuring user instructions cannot override the planner output contract, review-before-insert boundary, or top-level-task-only constraint.
- [ ] 2.5 Update MockAIProvider fixtures or tests only as needed to keep deterministic planner behavior with and without instructions.
- [ ] 2.6 Add provider request tests for instruction inclusion and unchanged output-boundary guidance.

## 3. Project Detail AI Insights UI

- [ ] 3.1 Add an optional additional planning instructions textarea or equivalent input to the AI Project Planner in Project Detail > AI Insights.
- [ ] 3.2 Label the field clearly and add placeholder text: "Example: Plan authentication with roles, password recovery, and session validation".
- [ ] 3.3 Keep instruction text in transient page or planner hook state while the current AI Insights page remains open.
- [ ] 3.4 Show validation feedback when instructions exceed the named length limit, or apply existing safe truncation behavior if that is the established pattern.
- [ ] 3.5 Ensure Generate plan remains enabled when instructions are empty and AI configuration is otherwise valid.
- [ ] 3.6 Pass valid instructions into the existing planner generation flow without changing loading, error, retry, cancel, review, edit, selection, confirmation, or toast behavior.

## 4. Review and Persistence Boundaries

- [ ] 4.1 Verify generated proposals still appear in the existing review panel before insertion.
- [ ] 4.2 Verify users can still select proposals, edit supported fields, cancel review, retry generation, and explicitly confirm insertion.
- [ ] 4.3 Verify no task is inserted until explicit confirmation and inserted proposals use existing task creation behavior.
- [ ] 4.4 Verify instructions are not persisted to project, task, subtask, member, tag, settings, backup, import/export, or Local Storage data.
- [ ] 4.5 Verify the `tagsflow_ai_db_v1` key/version and repository port contracts remain unchanged.

## 5. Focused Tests and Checks

- [ ] 5.1 Add UI or hook tests for optional instruction entry, empty instruction generation, over-limit validation, and transient state behavior where current utilities support them.
- [ ] 5.2 Add regression tests or assertions that existing planner generation works without instructions.
- [ ] 5.3 Add regression tests or assertions that review-before-insert behavior remains unchanged.
- [ ] 5.4 Run focused planner, provider, and AI Insights tests.
- [ ] 5.5 Run the relevant project checks, including lint and build.
- [ ] 5.6 Review the final diff to confirm no out-of-scope AI workflows, Kanban, dashboard, Settings redesign, import/export, demo data, backend, auth, or cloud sync changes were introduced.
