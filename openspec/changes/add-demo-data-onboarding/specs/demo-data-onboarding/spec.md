## ADDED Requirements

### Requirement: First-launch empty-state detection
The system MUST detect the onboarding-eligible state from current local business data and onboarding completion state.

#### Scenario: Detect eligible empty initial state
- **WHEN** local business data contains no projects, tasks, subtasks, members, or tags
- **AND** no onboarding choice has been completed
- **THEN** the system treats the app as eligible for first-launch onboarding

#### Scenario: Do not prompt when business data exists
- **WHEN** local business data contains at least one project, task, subtask, member, or tag
- **THEN** the system does not block the user with first-launch onboarding

#### Scenario: Do not prompt after start-empty choice
- **WHEN** the user has completed onboarding by choosing "Start empty"
- **AND** local business data remains empty
- **THEN** the system does not show first-launch onboarding again during normal app use

#### Scenario: Do not prompt after demo-data choice
- **WHEN** the user has completed onboarding by choosing "Load demo data"
- **THEN** the system does not show first-launch onboarding again during normal app use

### Requirement: First-launch onboarding experience
The system MUST provide a clear first-launch onboarding surface that lets users either start empty or load demo data without blocking users who already have data.

#### Scenario: Show onboarding choices
- **WHEN** the app is onboarding-eligible
- **THEN** the user sees a welcome screen or onboarding panel inside the app experience
- **THEN** the surface explains that the user can start with an empty workspace or load editable demo data
- **THEN** the surface provides "Start empty" and "Load demo data" actions

#### Scenario: Start empty
- **WHEN** the user chooses "Start empty"
- **THEN** no demo projects, tasks, subtasks, members, or tags are created
- **THEN** onboarding completion is persisted
- **THEN** the user can continue using existing empty-state workflows

#### Scenario: Load demo data from onboarding
- **WHEN** the user chooses "Load demo data" from onboarding
- **THEN** demo business data is created through approved local application or persistence paths
- **THEN** onboarding completion is persisted
- **THEN** the user can navigate to normal app modules without a demo-specific mode

#### Scenario: Existing data bypasses onboarding
- **WHEN** the app loads and existing local business data is present
- **THEN** the user lands in the normal routed app experience
- **THEN** the onboarding surface does not obscure dashboard, projects, tasks, Kanban, members, or settings routes

### Requirement: Demo data generation
The system MUST generate deterministic, realistic demo data for the project "Development of a SaaS Frontend Platform" using approved domain values and relationships.

#### Scenario: Generate demo project
- **WHEN** demo data is generated
- **THEN** it includes one project titled "Development of a SaaS Frontend Platform"
- **THEN** the project includes description, objective, in-scope content, out-of-scope content, status, start date, due date, assigned member IDs, and task IDs

#### Scenario: Generate demo members and tags
- **WHEN** demo data is generated
- **THEN** it includes realistic local members with names, emails, roles, and avatars
- **THEN** it includes reusable tags with names and optional colors
- **THEN** generated task and subtask references use those member and tag IDs consistently

#### Scenario: Generate demo tasks across workflow statuses
- **WHEN** demo data is generated
- **THEN** it includes multiple top-level tasks assigned to the demo project
- **THEN** tasks cover multiple approved statuses including backlog, todo, in_progress, blocked, review, and done where practical
- **THEN** tasks include approved priorities, descriptions, scope fields, dates, assignees, tags, checklist items, and subtask IDs where applicable

#### Scenario: Generate demo subtasks and checklist items
- **WHEN** demo data is generated
- **THEN** it includes subtasks linked to parent tasks only one level deep
- **THEN** subtasks include approved statuses, priorities, dates, assignees, tags, and checklist items
- **THEN** checklist items contain only text and completed state

#### Scenario: Generate realistic relative dates
- **WHEN** demo data is generated with a reference date
- **THEN** generated project, task, and subtask dates are derived from that reference date
- **THEN** tests can pass a fixed reference date for deterministic expectations

### Requirement: Demo data validity and normal behavior
Demo data MUST satisfy current local database validation and MUST behave as normal editable local data.

#### Scenario: Validate demo database shape
- **WHEN** generated demo data is assembled into a local database payload
- **THEN** it satisfies the current version-one local database schema
- **THEN** it uses approved project statuses, task statuses, priorities, relationship IDs, checklist shape, and settings shape

#### Scenario: Demo records are normal records
- **WHEN** demo records are loaded
- **THEN** the records contain no protected flag, read-only marker, or demo-only field that changes domain behavior
- **THEN** existing edit and delete workflows can mutate or remove the records like user-created records

#### Scenario: Demo data is exportable
- **WHEN** the user exports local data after loading demo data
- **THEN** the exported backup includes the demo projects, tasks, subtasks, members, tags, and non-sensitive settings through existing backup behavior
- **THEN** the export still excludes Groq API key values

#### Scenario: Demo data is visible in existing modules
- **WHEN** demo data has been loaded
- **THEN** the dashboard can derive metrics from it
- **THEN** the global tasks page can list its tasks and expandable subtasks
- **THEN** the project Kanban can show its project tasks by status
- **THEN** the global Kanban can show its tasks in overview mode
- **THEN** the project detail page can show the project, tasks, subtasks, members, tags, and derived progress through existing behavior

### Requirement: Onboarding choice persistence
The system MUST persist whether a first-launch choice has completed without changing approved domain model contracts.

#### Scenario: Persist start-empty completion
- **WHEN** the user chooses "Start empty"
- **THEN** the onboarding state records that onboarding has completed
- **THEN** reloading the app does not show onboarding again while that state remains completed

#### Scenario: Persist demo-load completion
- **WHEN** the user chooses "Load demo data"
- **THEN** the onboarding state records that onboarding has completed
- **THEN** reloading the app does not show onboarding again while that state remains completed

#### Scenario: Keep onboarding state outside business entities
- **WHEN** onboarding completion is persisted
- **THEN** project, task, subtask, member, tag, checklist, and AI provider domain contracts are unchanged
- **THEN** demo data loading does not require a Local Storage database version change unless implementation discovers an unavoidable compatibility issue

#### Scenario: Reset may re-enable onboarding
- **WHEN** the local data reset workflow replaces business data with the empty initial database
- **THEN** onboarding completion may be cleared
- **THEN** onboarding can appear again only if the resulting local business data is empty

### Requirement: Onboarding feedback and safety
The system MUST use existing feedback patterns for onboarding and demo-data actions.

#### Scenario: Show load-demo success feedback
- **WHEN** demo data is loaded successfully
- **THEN** the system shows a non-blocking success toast

#### Scenario: Show start-empty feedback when useful
- **WHEN** the user chooses "Start empty"
- **THEN** the system may show a non-blocking success toast
- **THEN** the action does not use a blocking modal merely to report success

#### Scenario: Avoid destructive confirmation for first empty load
- **WHEN** the app is onboarding-eligible and contains no local business data
- **THEN** loading demo data from onboarding does not require a destructive confirmation dialog

### Requirement: Demo onboarding test coverage
The system MUST include focused automated tests for onboarding detection, demo data generation, validation, persistence, and no-repeat behavior where current test utilities support them.

#### Scenario: Test first-launch detection
- **WHEN** onboarding detection tests run
- **THEN** they verify empty initial state eligibility
- **THEN** they verify existing projects, tasks, subtasks, members, or tags suppress first-launch onboarding
- **THEN** they verify completed onboarding suppresses repeat prompts

#### Scenario: Test demo data shape
- **WHEN** demo data tests run
- **THEN** they verify the demo project title, members, tags, tasks, subtasks, checklist items, statuses, priorities, dates, assignees, and relationships

#### Scenario: Test schema validation
- **WHEN** demo data validation tests run
- **THEN** they verify generated demo data satisfies the version-one local database schemas or equivalent validation helpers

#### Scenario: Test onboarding persistence
- **WHEN** onboarding persistence tests run
- **THEN** they verify "Start empty" and "Load demo data" both persist completion
- **THEN** they verify onboarding is not shown repeatedly after either choice

#### Scenario: Test UI visibility where supported
- **WHEN** current UI test utilities support routed rendering
- **THEN** tests verify the onboarding choices render for an eligible empty state
- **THEN** tests verify loaded demo data appears in at least one existing data-driven module without a demo-specific code path
