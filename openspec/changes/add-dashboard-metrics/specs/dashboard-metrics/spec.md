## ADDED Requirements

### Requirement: Dashboard route
The system MUST replace the `/dashboard` placeholder with a functional dashboard page that summarizes existing local project and task health.

#### Scenario: User opens dashboard
- **WHEN** a user navigates to `/dashboard`
- **THEN** the page renders dashboard content instead of placeholder copy
- **THEN** the content summarizes current projects, tasks, subtasks, members, and tags from local business data

#### Scenario: Dashboard avoids CRUD workflows
- **WHEN** the dashboard renders
- **THEN** it does not show project creation, task creation, task editing, task deletion, subtask creation, subtask editing, subtask deletion, or Kanban drag-and-drop controls
- **THEN** existing CRUD workflows remain available only from their approved project, task, or Kanban surfaces

### Requirement: Dashboard source data loading
The dashboard MUST load projects, tasks, subtasks, members, and tags through existing Application-layer hooks.

#### Scenario: Load dashboard data through hooks
- **WHEN** the dashboard page renders
- **THEN** it uses existing Application-layer query hooks for projects, tasks, subtasks, members, and tags
- **THEN** it does not read Local Storage, instantiate repository adapters, or call repository ports directly from Presentation code

#### Scenario: Preserve adapter migration path
- **WHEN** future HTTP repository adapters replace Local Storage adapters behind existing ports
- **THEN** dashboard source data continues to come through the same Application-layer hooks
- **THEN** dashboard metric helpers do not require infrastructure-specific changes

### Requirement: Dashboard metric helpers
The system MUST provide pure dashboard metric helpers that derive dashboard values from supplied domain entities and a reference date.

#### Scenario: Derive project status counts
- **WHEN** dashboard metric helpers receive projects
- **THEN** they return active project count, paused project count, and completed project count using approved project status values

#### Scenario: Derive task status counts
- **WHEN** dashboard metric helpers receive tasks
- **THEN** they return total task count, pending task count, completed task count, and blocked task count using approved task status values
- **THEN** pending tasks exclude tasks whose status is `done`

#### Scenario: Derive deadline counts
- **WHEN** dashboard metric helpers receive tasks and a reference date
- **THEN** they return overdue task count using the approved overdue detection rule
- **THEN** they return upcoming deadline task count using the approved upcoming deadline detection rule and the configured upcoming window
- **THEN** completed tasks are not counted as overdue or upcoming deadline work

#### Scenario: Derive average project progress
- **WHEN** dashboard metric helpers receive projects, tasks, and subtasks
- **THEN** they return average project progress by deriving each project's progress through approved project and task progress rules
- **THEN** no project progress value is read from persistence

#### Scenario: Derive task distributions
- **WHEN** dashboard metric helpers receive tasks
- **THEN** they return task distribution by status for every approved task status
- **THEN** they return task distribution by priority for every approved priority
- **THEN** statuses or priorities with zero tasks remain represented with a zero count where useful for chart consistency

#### Scenario: Handle completed-this-week limitations
- **WHEN** dashboard metric helpers calculate completed-this-week data
- **THEN** they use explicit completion-date data only if that data already exists in the approved domain model
- **THEN** they do not infer exact completion timing from unrelated fields such as due date, start date, task order, or status alone
- **THEN** if exact completion timing is unsupported by the approved model, the helper exposes that the exact metric is unavailable

### Requirement: Dashboard persistence boundary
The system MUST keep dashboard metrics derived and MUST NOT persist dashboard metric snapshots.

#### Scenario: Serialize local database
- **WHEN** the local database is saved
- **THEN** it does not include dashboard metric cards, chart data, project health summaries, overdue flags, upcoming flags, average progress snapshots, or completed-this-week snapshots

#### Scenario: Recompute after source data changes
- **WHEN** projects, tasks, or subtasks change through existing workflows
- **THEN** the dashboard recomputes metrics from the latest hook data
- **THEN** it does not require a dashboard-specific persistence mutation

### Requirement: Dashboard summary and project health UI
The dashboard MUST show summary metric cards and a project health overview using derived metrics.

#### Scenario: Show summary cards
- **WHEN** dashboard source data has loaded
- **THEN** the dashboard shows summary cards for active projects, paused projects, completed projects, total tasks, pending tasks, completed tasks, blocked tasks, overdue tasks, upcoming deadline tasks, average project progress, and completed-this-week availability or value

#### Scenario: Show project health overview
- **WHEN** projects exist
- **THEN** the dashboard shows project health information that includes project title, status, due date when available, and derived progress
- **THEN** project health information is computed from tasks and subtasks instead of persisted progress values

#### Scenario: Resolve optional project metadata
- **WHEN** a project has no due date or no tasks
- **THEN** the project health overview renders a clear neutral value
- **THEN** the project remains visible in the dashboard overview

### Requirement: Dashboard charts
The dashboard MUST render task status and priority distribution charts using Recharts when chart data exists.

#### Scenario: Render status chart
- **WHEN** tasks exist and status distribution data has at least one non-zero value
- **THEN** the dashboard renders a Recharts-based task status chart
- **THEN** the chart reflects approved task status labels and counts

#### Scenario: Render priority chart
- **WHEN** tasks exist and priority distribution data has at least one non-zero value
- **THEN** the dashboard renders a Recharts-based priority distribution chart
- **THEN** the chart reflects approved priority labels and counts

#### Scenario: Render chart empty states
- **WHEN** no chart data exists for a chart section
- **THEN** the dashboard renders a clean empty state for that section
- **THEN** it does not render a broken, blank, or misleading chart

### Requirement: Dashboard work lists
The dashboard MUST show actionable overview lists for upcoming deadlines, blocked work, and recently completed work where supported by available data.

#### Scenario: Show upcoming deadlines
- **WHEN** open tasks have due dates within the configured upcoming window
- **THEN** the dashboard lists upcoming deadline tasks with title, related project, status, priority, due date, assignee when available, and tags when available

#### Scenario: Show blocked work
- **WHEN** tasks have status `blocked`
- **THEN** the dashboard lists blocked tasks with title, related project, priority, due date when available, assignee when available, and tags when available

#### Scenario: Show recently completed work when supported
- **WHEN** the approved domain model contains explicit completion-date data for completed tasks
- **THEN** the dashboard lists recently completed tasks using that completion-date data
- **THEN** the list does not include tasks that are not completed

#### Scenario: Show completed work no-data state
- **WHEN** the approved domain model does not contain explicit completion-date data
- **THEN** the recently completed work section shows a clear no-data state or omits the exact list
- **THEN** it does not present due dates or task status alone as exact completion dates

### Requirement: Dashboard navigation
Dashboard items MUST navigate users to existing project or task-oriented routes without introducing dashboard-specific editing surfaces.

#### Scenario: Navigate from project item
- **WHEN** a user selects a project-related dashboard item
- **THEN** the app navigates to `/projects/:projectId` for the related project

#### Scenario: Navigate from task item
- **WHEN** a user selects a task-related dashboard item
- **THEN** the app navigates to `/tasks` or to the related project detail route when that provides better project context
- **THEN** the dashboard does not open task edit, delete, status mutation, or subtask management controls

### Requirement: Dashboard states
The dashboard MUST provide loading, error, empty, and no-data states for source data and derived visualizations.

#### Scenario: Show loading state
- **WHEN** one or more dashboard source data queries are loading and no complete data set is available
- **THEN** the dashboard shows an appropriate loading state
- **THEN** it does not show stale placeholder copy as complete dashboard functionality

#### Scenario: Show error state
- **WHEN** one or more dashboard source data queries fail
- **THEN** the dashboard shows an error state that identifies dashboard data could not be loaded
- **THEN** it does not render misleading metrics from incomplete failed data as complete

#### Scenario: Show empty dashboard state
- **WHEN** no projects exist
- **THEN** the dashboard shows an empty state that guides users to the existing project creation workflow
- **THEN** it does not create a project directly from the dashboard unless an existing navigation action is reused

#### Scenario: Show no-data section states
- **WHEN** projects exist but a dashboard section has no applicable records
- **THEN** the section renders a clean no-data state
- **THEN** the rest of the dashboard remains usable

### Requirement: Dashboard scope boundaries
The dashboard MUST preserve existing module behavior and architecture boundaries.

#### Scenario: Preserve persistence and contracts
- **WHEN** this change is implemented
- **THEN** it does not change project, task, subtask, member, tag, settings, repository, AI provider, or Local Storage contracts
- **THEN** it does not change the Local Storage database key or stored database shape

#### Scenario: Exclude unrelated modules
- **WHEN** this change is implemented
- **THEN** it does not change global tasks behavior, project Kanban behavior, global Kanban behavior, members behavior, tags behavior, settings behavior, import/export behavior, or demo data behavior

#### Scenario: Keep AI providers out of dashboard metrics
- **WHEN** the dashboard renders or recomputes metrics
- **THEN** it does not call Groq, mock AI, or any AI provider

### Requirement: Dashboard test coverage
The system MUST include focused automated tests for dashboard metric helpers and supported dashboard UI behavior.

#### Scenario: Test metric helpers
- **WHEN** dashboard metric helper tests run
- **THEN** they verify project status counts, task status counts, blocked count, pending count, completed count, overdue count, upcoming deadline count, average project progress, status distribution, priority distribution, empty data behavior, and completed-this-week availability behavior

#### Scenario: Test project progress aggregation
- **WHEN** dashboard progress tests run with projects, tasks, and subtasks
- **THEN** they verify average project progress uses approved task and project progress rules

#### Scenario: Test dashboard rendering
- **WHEN** current UI test utilities render the dashboard with supported providers
- **THEN** tests verify functional dashboard content appears instead of placeholder copy
- **THEN** tests verify metric cards, charts or chart empty states, upcoming deadline list, blocked list, and empty dashboard state where practical

#### Scenario: Test dashboard navigation where supported
- **WHEN** current UI test utilities support navigation assertions
- **THEN** tests verify project-related dashboard items navigate to the related project detail route
- **THEN** tests verify task-related dashboard items navigate only to existing approved routes
