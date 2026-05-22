## MODIFIED Requirements

### Requirement: Member management scope boundaries
The system MUST keep the Member Management slice limited to member use cases, member hooks, member validation, Members page UI, assigned-member deletion warning behavior, and member catalog data that can be reused by separately approved assignment workflows.

#### Scenario: Allow task and subtask assignment controls through approved task capability
- **WHEN** the Task and Subtask Management capability is implemented
- **THEN** task and subtask forms may load existing members through member hooks for assignee selection
- **THEN** task and subtask assignment controls do not create or edit member catalog records inline

#### Scenario: Exclude project member assignment UI
- **WHEN** this change is implemented
- **THEN** it does not add project member assignment UI

#### Scenario: Exclude unrelated modules
- **WHEN** this change is implemented
- **THEN** it does not add kanban drag and drop, dashboard metrics, AI features, settings implementation, import/export, or demo data

## ADDED Requirements

### Requirement: Member reuse in task and subtask forms
The system MUST allow task and subtask forms to assign existing local members without changing member catalog management behavior.

#### Scenario: Assign existing member to task
- **WHEN** a user selects an existing member in a task form and saves valid task data
- **THEN** the selected member ID is saved as the task assignee
- **THEN** no member create or update mutation is sent by the task form

#### Scenario: Assign existing member to subtask
- **WHEN** a user selects an existing member in a subtask form and saves valid subtask data
- **THEN** the selected member ID is saved as the subtask assignee
- **THEN** no member create or update mutation is sent by the subtask form

#### Scenario: Clear assignee
- **WHEN** a user selects no assignee in a task or subtask form and saves
- **THEN** the saved task or subtask assignee is `null`
