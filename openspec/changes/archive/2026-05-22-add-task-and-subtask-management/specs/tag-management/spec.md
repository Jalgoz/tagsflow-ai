## MODIFIED Requirements

### Requirement: Tag management scope boundaries
The system MUST keep this Tag Management slice limited to tag use cases, tag hooks, tag validation, basic tag catalog UI, tag badges, used-tag deletion confirmation, find-or-create tag behavior for future inline flows, and tag catalog data that can be reused by separately approved assignment workflows.

#### Scenario: Allow task and subtask tag assignment controls through approved task capability
- **WHEN** the Task and Subtask Management capability is implemented
- **THEN** task and subtask forms may load existing tags through tag hooks for tag selection
- **THEN** task and subtask tag assignment controls do not require inline tag creation

#### Scenario: Exclude unrelated modules
- **WHEN** this change is implemented
- **THEN** it does not add kanban drag and drop, dashboard metrics, AI features, settings implementation, import/export, or demo data

## ADDED Requirements

### Requirement: Tag reuse in task and subtask forms
The system MUST allow task and subtask forms to assign existing reusable tags without changing tag catalog management behavior.

#### Scenario: Assign existing tags to task
- **WHEN** a user selects existing tags in a task form and saves valid task data
- **THEN** the selected tag IDs are saved on the task
- **THEN** no tag create or update mutation is required by the task form

#### Scenario: Assign existing tags to subtask
- **WHEN** a user selects existing tags in a subtask form and saves valid subtask data
- **THEN** the selected tag IDs are saved on the subtask
- **THEN** no tag create or update mutation is required by the subtask form

#### Scenario: Save no tags
- **WHEN** a user selects no tags in a task or subtask form and saves
- **THEN** the saved task or subtask tag list is empty
