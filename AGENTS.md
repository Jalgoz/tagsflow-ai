# AGENTS.md

## Project
TagsFlow AI is a frontend-only AI-powered project management application built for:
- individual developers
- freelancers
- technical students
- small technical teams simulated locally

The app combines project management features with practical AI assistance:
- AI-generated project task planning
- AI-generated subtasks
- AI priority suggestions
- AI project summaries with risks and next steps

## Product scope
The MVP is frontend-only.
- No real backend
- No real authentication
- No real cloud sync
- No real multi-user collaboration
- All business data is stored locally in the browser
- Groq is the first real AI provider, using a user-provided API key stored locally

## Main modules
- Dashboard
- Projects
- Project detail
- Tasks global view
- Project Kanban
- Global Kanban read-only overview
- Members
- Settings
- AI Insights

## Core domain concepts
- Project
- Task
- Subtask
- Checklist item
- Member
- Tag
- App settings
- AI provider configuration

## Architecture
Use a modular frontend architecture with Ports and Adapters.

### Layers
1. Presentation Layer
   - pages
   - layouts
   - UI components
   - forms
   - tables
   - kanban components

2. Application Layer
   - use cases
   - orchestration logic
   - query hooks
   - mutation hooks

3. Domain Layer
   - entities
   - business rules
   - calculations
   - repository ports
   - AI provider port

4. Infrastructure Layer
   - Local Storage repositories
   - Groq AI provider
   - future HTTP repositories
   - future alternative AI providers

## Dependency rules
- Presentation may depend on Application, Domain, and Shared.
- Application may depend on Domain and ports.
- Infrastructure implements ports.
- Domain must not depend on React, TanStack Query, Local Storage, or external providers.
- UI components must not read or write Local Storage directly.
- UI components must not call Groq directly.

## Persistence strategy
Use repositories behind interfaces.

### MVP implementations
- LocalStorageProjectRepository
- LocalStorageTaskRepository
- LocalStorageSubtaskRepository
- LocalStorageMemberRepository
- LocalStorageTagRepository
- LocalStorageSettingsRepository

### Future implementations
- HttpProjectRepository
- HttpTaskRepository
- HttpSubtaskRepository
- HttpMemberRepository
- HttpTagRepository
- HttpSettingsRepository

Business logic should not change when swapping Local Storage repositories for HTTP repositories.

## AI provider strategy
Use an AIProvider interface.

### MVP implementation
- GroqAIProvider

### Supporting implementations
- MockAIProvider for development fallback and tests

### Future implementations
- OpenAIProvider
- AnthropicProvider
- BackendAIProvider

AI provider concerns must stay inside the Infrastructure Layer.

## Data storage design
Use one versioned Local Storage database key:

`tagsflow_ai_db_v1`

Persist:
- projects
- tasks
- subtasks
- members
- tags
- settings

Do not persist derived metrics such as project progress. Compute them from domain rules.

## Project rules
Projects contain:
- title
- description
- objective
- in-scope content
- out-of-scope content
- status: active, paused, completed
- start date
- due date
- assigned local members

## Task rules
Tasks contain:
- title
- description
- in-scope content
- out-of-scope content
- priority: low, medium, high, urgent
- status: backlog, todo, in_progress, blocked, review, done
- start date
- due date
- assignee
- tags
- checklist
- subtasks

Tasks can be marked as done with pending subtasks, but the UI must show a warning confirmation.

## Subtask rules
Subtasks are complete entities but only one level deep:
- task -> subtasks
- no nested subtasks

Subtasks contain:
- title
- description
- priority
- status
- start date
- due date
- assignee
- tags
- checklist

Subtasks do not appear as independent cards in Kanban. They are managed inside their parent task.

## Checklist rules
Checklist items only contain:
- text
- completed / not completed

If something needs a due date, priority, or assignee, it should be a subtask instead.

## Tags rules
Tags:
- can be created inline while editing tasks or subtasks
- are stored in a reusable global catalog
- can be used as filters in tables

## Members rules
Members are local simulated collaborators.
Fields:
- name
- email
- role
- avatar

Members can be assigned to:
- projects
- tasks
- subtasks

Deleting an assigned member requires a confirmation message.
After deletion:
- tasks and subtasks become unassigned
- projects remove that member reference

## Kanban rules
MVP columns are fixed:
- Backlog
- To Do
- In Progress
- Blocked
- Review
- Done

However, the design must be configuration-driven so columns can be expanded or changed later.

Project Kanban:
- interactive
- supports drag & drop
- allows task creation

Global Kanban:
- overview of all projects
- filterable by project
- no task creation in the MVP

## Progress calculation
Project progress must be derived from task progress.

- A task without subtasks is:
  - 0% if not done
  - 100% if done

- A task with subtasks:
  - progress = completed subtasks / total subtasks

- Project progress:
  - average progress of its top-level tasks

Do not store project progress directly.

## AI features

### AI Project Planner
Input:
- project title
- description
- objective
- in-scope content
- out-of-scope content
- project dates

Output:
- top-level task suggestions only
- suggested title
- short description
- suggested priority
- suggested start date
- suggested due date

This feature appears:
- after project creation as an optional next step
- in Project Detail > AI Insights

### AI Subtask Generator
Input:
- task title
- task description
- task scope
- task priority
- project context

Output:
- suggested subtasks

### AI Priority Suggestion
Input:
- task or subtask context
- dates
- scope
- project context

Output:
- priority suggestion
- concise reason

### AI Project Summary
Input:
- project data
- tasks
- subtasks
- due dates
- blocked work
- priorities
- computed progress

Output:
- project summary
- risks
- next steps

## AI response handling
- Prefer structured JSON responses from Groq.
- Validate AI responses with Zod before using them.
- Do not trust raw model output.
- Transform validated provider responses into internal domain-friendly DTOs.

## UI direction
The app should feel like a polished technical SaaS product inspired by Jira and Linear, without cloning them.

### Visual style
- light and dark theme
- clean minimal dashboard
- fixed sidebar
- strong information hierarchy
- compact but readable cards
- modern technical aesthetic

### Suggested palette direction
- primary: indigo / lavender
- neutral backgrounds
- success: green
- warning: amber
- danger: red
- blocked: orange-red

## UI feedback rules

- All destructive actions must use a reusable confirmation dialog before mutating data.
- Delete actions must clearly explain what will be removed or affected.
- Successful create, update, delete, assignment, import, export, and AI actions must show a toast notification.
- Success feedback should use non-blocking toast notifications, not modal dialogs.
- Modal dialogs should be reserved for confirmations, forms, or decisions requiring explicit user input.
- Future modules must reuse the shared feedback components instead of creating one-off confirmation or notification implementations.

## Form and inline editing UX rules

- Required fields must show a visible asterisk in the label.
- Required fields must show validation messages when invalid.
- Optional fields must not show an asterisk.
- When an entity is being edited inline or in an expanded edit surface, the same entity must not remain actionable underneath the edit form.
- Edit, delete confirmation, and create states must be mutually exclusive for the same entity type.
- Destructive actions must use the shared ConfirmDialog.
- Successful create, update, delete, assignment, and status-change actions should use the shared toast pattern.

## Main routes
- /dashboard
- /projects
- /projects/:projectId
- /tasks
- /kanban
- /members
- /settings

## Project detail tabs
- Overview
- Tasks
- Kanban
- AI Insights

## Global tasks page
The /tasks page:
- shows tasks from all projects
- supports search, filtering, sorting, and editing
- can expand tasks to show subtasks
- does not create new tasks in the MVP

## Settings
Settings include:
- light/dark theme
- Groq API key
- test connection button
- detected Groq models
- recommended Groq models
- selected model
- delete API key
- AI configured / not configured status
- export local data as JSON
- import local data from JSON

Do not export the Groq API key in backups.

## Demo data
At first launch, the user can:
- start empty
- load demo data

Demo data must behave like normal editable local data and may be deleted.

Recommended demo project:
- Development of a SaaS Frontend Platform

## Recommended technologies
- React
- TypeScript
- Vite
- React Router
- TanStack Query
- TanStack Table
- Zustand
- React Hook Form
- Zod
- dnd-kit
- Recharts
- Tailwind CSS

## State management boundaries
Use:
- TanStack Query for asynchronous business data orchestration and mutations
- Zustand only for global UI state, not business entities
- React local state for local component interactions

## Coding rules
- Use strict TypeScript.
- Avoid `any`.
- Prefer explicit, reusable types.
- Keep components small and focused.
- Avoid god components.
- Use Arrow Functions for components and hooks.
- Use descriptive names for variables, functions, and types.
- Use custom hooks for reusable logic.
- Document complex logic with comments.
- Document public interfaces of modules with JSDoc.
- Document AI response structures and expected formats.
- Be careful with code smells and technical debt. Address them early.
- Prefer feature-based modular organization.
- Keep domain rules outside React components.
- Do not duplicate business rules in multiple places.
- Do not add dependencies unless justified.
- Prefer readable code over clever abstractions.
- Preserve future backend migration paths.

## Testing expectations
- Domain rules should be easy to unit test.
- Repository adapters should be testable independently.
- AI response parsing and validation should be testable.
- Important use cases should be covered once the feature is implemented.

## Change workflow
Before implementing a significant feature:
1. Check existing OpenSpec specs.
2. Create or update an OpenSpec change.
3. Review proposal, specs, design, and tasks.
4. Implement only after approval of the change artifacts.

## Definition of done
A task is complete only if:
- it matches the approved spec
- it follows the architecture
- it does not bypass repositories/adapters
- it keeps UI and domain logic separated
- it does not break existing flows
- it compiles without TypeScript errors
- it is understandable for future maintenance

## Git workflow

Use a lightweight GitHub Flow style.

### Main branch
- `main` should always stay in a runnable and stable state.
- Do not commit incomplete or broken work directly to `main`.
- Significant features, architecture changes, and OpenSpec implementation work should be done in separate branches.

### Branch strategy
Create one branch per cohesive change.

Recommended naming:
- `feat/<short-feature-name>`
- `fix/<short-bug-name>`
- `refactor/<short-scope>`
- `docs/<short-topic>`
- `chore/<short-topic>`

When the work comes from an OpenSpec change, prefer matching the branch name to the change purpose.

Examples:
- `docs/define-tagsflow-ai-mvp`
- `feat/project-foundation`
- `feat/local-storage-repositories`
- `feat/project-kanban`
- `feat/ai-project-planner`
- `fix/project-progress-calculation`

### Commit style
Use Conventional Commits.

Format:
`<type>(<optional-scope>): <short description>`

Allowed commit types:
- `feat`: new user-facing capability
- `fix`: bug fix
- `refactor`: internal code improvement without changing behavior
- `docs`: documentation-only changes
- `test`: adding or updating tests
- `style`: formatting or styling-only code changes with no behavior change
- `chore`: maintenance work
- `build`: build tooling or dependency changes
- `ci`: CI/CD configuration changes
- `perf`: performance improvements

Examples:
- `docs(spec): define TagsFlow AI MVP architecture`
- `feat(projects): add project domain model`
- `feat(storage): implement local storage task repository`
- `feat(ai): add Groq project planner provider`
- `fix(progress): correct project progress with subtasks`
- `refactor(tasks): separate task form orchestration`
- `chore(deps): add tanstack query`

### Commit quality
- Keep commits small, focused, and logically coherent.
- Do not mix unrelated changes in the same commit.
- Prefer multiple clear commits over one large vague commit.
- Commit messages must describe what the change does, not vague phrases like:
  - `update stuff`
  - `changes`
  - `fix`
  - `wip`

### Before committing
Before creating a commit:
1. Review the diff.
2. Ensure the change matches the current task or OpenSpec scope.
3. Run relevant checks when they exist:
   - typecheck
   - lint
   - tests
   - build
4. Do not commit temporary debug code.
5. Do not commit commented-out dead code unless explicitly justified.

### Pull request mindset
Even when working solo, treat each significant branch as if it would become a pull request.

Before merging into `main`, verify:
- the branch solves one coherent goal
- the code follows the approved OpenSpec change
- architectural boundaries were respected
- commits are understandable
- the app remains runnable

### Secrets and sensitive local data
Never commit:
- API keys
- personal Groq keys
- `.env` files containing secrets
- exported backups containing real private information
- local browser data dumps

If environment files are added in the future:
- commit `.env.example`
- keep `.env`, `.env.local`, and secret-bearing variants ignored

### AI agent Git rules
When an AI coding agent suggests or prepares commits:
- it should propose a Conventional Commit message
- it should not create a commit that mixes unrelated changes
- it should not silently include generated or unrelated files
- it should summarize what changed before any commit
- it should prefer one commit per completed, reviewable unit of work