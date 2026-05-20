## 1. Domain Structure

- [x] 1.1 Inspect existing `src/domain` and shared constants to identify reusable status and priority values.
- [x] 1.2 Create the domain module structure for constants, entities, ports, AI DTOs, and rules.
- [x] 1.3 Add barrel exports so later application, infrastructure, and presentation modules can import domain contracts consistently.

## 2. Domain Constants and Entity Types

- [x] 2.1 Define project status constants and the `ProjectStatus` type.
- [x] 2.2 Define task status constants and the `TaskStatus` type for tasks and subtasks.
- [x] 2.3 Define priority constants and the `Priority` type.
- [x] 2.4 Define `ChecklistItem`, `Member`, and `Tag` entity types.
- [x] 2.5 Define `Project`, `Task`, and `Subtask` entity types using ID-based relationships.
- [x] 2.6 Define `AppSettings` and AI provider configuration domain types without exposing secrets in export-oriented shapes.

## 3. Repository and AI Ports

- [x] 3.1 Define `ProjectRepository` with project list, lookup, create, update, delete, and member-assignment contract methods.
- [x] 3.2 Define `TaskRepository` with task list, project-scoped lookup, create, update, delete, status, assignment, tag, and checklist contract methods.
- [x] 3.3 Define `SubtaskRepository` with parent-task-scoped list, create, update, delete, status, assignment, tag, and checklist contract methods.
- [x] 3.4 Define `MemberRepository`, `TagRepository`, and `SettingsRepository` interfaces using domain types only.
- [x] 3.5 Define provider-neutral AI request and result DTOs for project planning, subtask generation, priority suggestion, and project summary.
- [x] 3.6 Define the `AIProvider` interface with `listModels`, `testConnection`, `generateProjectPlan`, `generateSubtasks`, `suggestPriority`, and `summarizeProject`.

## 4. Pure Domain Rules

- [x] 4.1 Implement `calculateTaskProgress` for tasks with and without subtasks.
- [x] 4.2 Implement `calculateProjectProgress` as the average of top-level task progress.
- [x] 4.3 Implement overdue task and subtask detection using an explicit reference date.
- [x] 4.4 Implement upcoming task and subtask deadline detection using an explicit reference date and configurable window.
- [x] 4.5 Implement pending-subtask detection for task completion confirmation.
- [x] 4.6 Implement one-level subtask validation that rejects nested subtasks or parent-subtask relationships.
- [x] 4.7 Implement checklist item validation that accepts only text and completed state.

## 5. Domain Rule Tests

- [x] 5.1 Add a minimal Vitest setup and `test` script because the project currently has no unit test stack.
- [x] 5.2 Add focused tests for task progress with done, not-done, and subtask-derived cases.
- [x] 5.3 Add focused tests for project progress averaging and empty-project behavior.
- [x] 5.4 Add focused tests for overdue and upcoming deadline detection.
- [x] 5.5 Add focused tests for pending subtasks, one-level subtask validation, and checklist item validation.

## 6. Verification

- [x] 6.1 Run the domain rule test suite and fix any failing tests.
- [x] 6.2 Run lint and fix any new import, style, or TypeScript issues.
- [x] 6.3 Run the production build and fix any TypeScript errors introduced by the domain contracts.
- [x] 6.4 Review the diff to confirm no Local Storage repositories, HTTP repositories, Groq implementation, React UI, forms, CRUD screens, query hooks, dashboard UI, kanban drag and drop, import/export, or demo data were added.
