## Why

TagsFlow AI has the core local project-management workflows in place, but a first-time user still lands in an empty product with no guided path to understand the app. The MVP needs a focused first-launch onboarding flow that lets users either start clean or load realistic editable demo data.

## What Changes

- Add first-launch or empty-database detection based on the absence of projects, tasks, members, tags, and existing user data.
- Add a first-launch onboarding experience with clear "Start empty" and "Load demo data" choices.
- Add deterministic demo data for "Development of a SaaS Frontend Platform" with realistic members, tags, tasks across approved statuses, subtasks, checklist items, priorities, dates, assignees, and tag assignments.
- Ensure demo records are normal local records: editable, deletable, exportable, resettable, and visible through dashboard, global tasks, project Kanban, global Kanban, and project detail views.
- Persist onboarding completion so the first-launch prompt does not repeatedly appear after either choice.
- Allow onboarding to appear again after a local data reset only when the app returns to the empty initial state.
- Add an optional Settings action for loading demo data, guarded so existing data is not silently overwritten.
- Reuse shared `ConfirmDialog` and toast feedback patterns for destructive or successful onboarding and demo-data actions.
- Add focused tests for first-launch detection, demo data shape and validation, onboarding choice persistence, and no-repeat onboarding behavior.
- Exclude authentication, user accounts, backend seed data, cloud sync, AI-generated demo data, Groq setup, AI workflows, domain model contract changes, repository port contract changes, Local Storage database version changes unless unavoidable, app-shell redesign, and replacement of existing backup/import behavior.

## Capabilities

### New Capabilities

- `demo-data-onboarding`: First-launch detection, onboarding choices, deterministic demo data generation, onboarding state persistence, and normal-data behavior for seeded records.

### Modified Capabilities

- `settings-local-backup`: Add a guarded Settings entry point for loading demo data without silently replacing existing local data, while preserving existing backup, import, reset, and feedback behavior.

## Impact

This change affects onboarding UI, application-level onboarding/demo-data orchestration, deterministic seed-data construction, local UI/app-state persistence for the onboarding choice, and optional Settings controls. It must continue using existing repository/application paths for projects, tasks, subtasks, members, tags, settings, backup, and reset behavior; it must not introduce backend dependencies, AI provider calls, or protected demo-record semantics.
