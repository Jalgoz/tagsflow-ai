## ADDED Requirements

### Requirement: Dashboard metrics
The system MUST show active projects, pending tasks, overdue tasks, blocked tasks, tasks completed this week, tasks by status chart, priorities chart, and upcoming deadlines. These values MUST be derived from stored projects, tasks, and subtasks.

#### Scenario: Update dashboard after task change
- **WHEN** a user changes task status, priority, or due date
- **THEN** dashboard metrics reflect the current stored data
- **THEN** the system does not persist metric snapshots

### Requirement: Project progress calculation
The system MUST calculate task progress and project progress from current task and subtask state. A task without subtasks MUST be 0 percent unless done, then 100 percent. A task with subtasks MUST use completed subtasks divided by total subtasks. Project progress MUST be the average progress of top-level tasks.

#### Scenario: Calculate project progress
- **WHEN** a project has top-level tasks with and without subtasks
- **THEN** the system calculates each task progress from the defined rules
- **THEN** the system calculates project progress as the average of top-level task progress

### Requirement: AI project summary insight
The system MUST provide AI project summaries that include a project summary, risks, and next steps using project data, tasks, subtasks, due dates, blocked work, priorities, and computed progress.

#### Scenario: Generate project summary
- **WHEN** a user requests an AI summary for a project
- **THEN** the system sends current project context through the AI provider interface
- **THEN** the validated result includes summary, risks, and next steps
