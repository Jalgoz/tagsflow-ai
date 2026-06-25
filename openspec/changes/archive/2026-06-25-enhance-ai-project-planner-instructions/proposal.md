## Why

The AI Project Planner can generate top-level task proposals from project context, but users cannot currently tell it which specific feature, goal, or workstream they want planned. Adding optional bounded planning instructions lets the planner produce more relevant proposals while preserving the existing review-before-insert workflow and frontend-only MVP boundaries.

## What Changes

- Add an optional "additional planning instructions" textarea or equivalent input in Project Detail > AI Insights for the AI Project Planner.
- Allow generation with only project context when the instruction field is empty.
- Include trimmed non-empty instructions in the planner input sent through the existing provider-neutral AI workflow.
- Define a named maximum instruction length and enforce it before provider requests are sent.
- Update the planner prompt/request behavior so user instructions are prioritized when present.
- Preserve existing planner output boundaries: top-level task proposals only, no subtasks, no automatic member assignment, no automatic tag creation, and no trusted model-generated IDs.
- Keep the existing review-before-insert flow unchanged: generated proposals are reviewed, selected, optionally edited, and inserted only after explicit confirmation.
- Keep instruction text transient to the open AI Insights page and do not persist it as project, task, settings, or Local Storage data.
- Add focused tests for instruction input building, trimming, empty omission, limit enforcement, prompt/request inclusion, no-instruction behavior, unchanged review-before-insert behavior, and unchanged persistence contracts.

Explicitly excluded:
- AI chat, multi-turn conversation, AI Subtask Generator, AI Priority Suggestion, and AI Project Summary.
- Automatic task insertion, generated subtasks, generated tags, or automatic member assignment.
- Changes to project, task, subtask, repository, Local Storage database, settings, dashboard, Kanban, import/export, demo data, backend, authentication, or cloud sync behavior.

## Capabilities

### New Capabilities

- None.

### Modified Capabilities

- `ai-project-planner`: Adds optional bounded user planning instructions to planner UI, input construction, provider prompt/request behavior, and validation/test expectations.

## Impact

- Affected application code: Project Detail AI Insights planner UI state, planner input builder/use case, planner generation validation, and tests.
- Affected provider code: Groq planner prompt/request construction and MockAIProvider test fixtures where needed to reflect optional instructions.
- Affected specs: `ai-project-planner` only.
- No new dependency is expected.
- No persisted data shape, repository port, Local Storage key/version, settings backup/import/export contract, or task/project/subtask domain contract change is expected.
