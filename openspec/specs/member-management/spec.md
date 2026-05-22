# member-management Specification

## Purpose
TBD - created by archiving change add-member-and-tag-management. Update Purpose after archive.
## Requirements
### Requirement: Member application use cases
The system MUST provide Application-layer use cases for listing members, getting a member by ID, creating a member, updating a member, deleting a member, and detecting whether a member is assigned to projects, tasks, or subtasks before deletion.

#### Scenario: List members through application use case
- **WHEN** member list data is requested by the Presentation layer
- **THEN** the Application layer calls the configured `MemberRepository`
- **THEN** the Presentation layer receives member domain entities without accessing Local Storage directly

#### Scenario: Get member by ID through application use case
- **WHEN** a member detail or edit flow requests a member by ID
- **THEN** the Application layer calls the configured `MemberRepository`
- **THEN** it returns the matching member or `null` when no member exists for that ID

#### Scenario: Create member through application use case
- **WHEN** valid member create input is submitted
- **THEN** the Application layer calls the configured `MemberRepository` create method
- **THEN** the created member is persisted by the repository adapter and returned to the caller

#### Scenario: Update member through application use case
- **WHEN** valid member update input is submitted for an existing member
- **THEN** the Application layer calls the configured `MemberRepository` update method
- **THEN** the updated member is persisted by the repository adapter and returned to the caller

#### Scenario: Delete member through application use case
- **WHEN** member deletion is confirmed
- **THEN** the Application layer calls the configured `MemberRepository` delete method
- **THEN** repository-defined assignment cleanup is used without duplicating cleanup in the UI

#### Scenario: Detect assigned member usage
- **WHEN** the Presentation layer requests deletion context for a member
- **THEN** the Application layer checks projects, tasks, and subtasks through repository ports
- **THEN** it reports whether the member is assigned and includes assignment counts by entity type

### Requirement: Member query hooks
The system MUST provide TanStack Query hooks named `useMembers`, `useMember`, `useCreateMember`, `useUpdateMember`, and `useDeleteMember` for member reads and mutations.

#### Scenario: Read members with query hook
- **WHEN** the Members page renders
- **THEN** it uses `useMembers` to load members
- **THEN** the hook returns loading, error, and data state from TanStack Query

#### Scenario: Read member with query hook
- **WHEN** a member-specific UI surface requests a member by ID
- **THEN** it uses `useMember` to load that member
- **THEN** the hook returns loading, error, and member-or-null state from TanStack Query

#### Scenario: Invalidate member queries after mutation
- **WHEN** a member is created, updated, or deleted through a member mutation hook
- **THEN** member list queries are invalidated
- **THEN** the affected member detail query is invalidated when the mutation targets a specific member ID

#### Scenario: Keep member business data outside Zustand
- **WHEN** member hooks manage query and mutation state
- **THEN** they use TanStack Query rather than Zustand for persisted member entities
- **THEN** business data remains persisted through repositories

### Requirement: Member form validation
The system MUST provide a Zod-backed validation schema for member form data covering name, email, role, and avatar.

#### Scenario: Accept valid member form data
- **WHEN** a member form contains a non-empty name, optional valid email, role, and avatar
- **THEN** the validation schema accepts the form data
- **THEN** the validated data can be transformed into domain member create or update input

#### Scenario: Reject empty member name
- **WHEN** a member form is submitted without a non-empty name
- **THEN** the validation schema rejects the form data
- **THEN** the UI can display a field-level validation message

#### Scenario: Validate provided email format
- **WHEN** a member form contains an email value
- **THEN** the validation schema accepts it only when it is a valid email format

#### Scenario: Allow empty optional member fields
- **WHEN** a member form contains empty email, role, or avatar values
- **THEN** the validation schema accepts those fields as empty strings

### Requirement: Members page
The system MUST replace the Members placeholder with a functional Members page that lists members, displays an empty state, provides create and edit member actions, and supports member deletion.

#### Scenario: Show empty members state
- **WHEN** the member repository contains no members
- **THEN** the Members page shows an empty state
- **THEN** the empty state provides a create member action

#### Scenario: Show member list
- **WHEN** the member repository contains one or more members
- **THEN** the Members page shows each member with name, email, role, avatar information, and enough context to identify the member

#### Scenario: Create member from page
- **WHEN** a user enters valid member details and saves a create form
- **THEN** the member is created through `useCreateMember`
- **THEN** the created member appears in the Members page list

#### Scenario: Edit member from page
- **WHEN** a user edits an existing member with valid details and saves
- **THEN** the member is updated through `useUpdateMember`
- **THEN** the updated member details are visible after the mutation succeeds

#### Scenario: Handle member loading and errors
- **WHEN** the Members page query is loading or errors
- **THEN** the page shows an appropriate loading or error state
- **THEN** it does not present placeholder copy as complete functionality

### Requirement: Assigned member deletion warning
The system MUST require an explicit warning confirmation before deleting a member assigned to any project, task, or subtask.

#### Scenario: Delete unassigned member
- **WHEN** a user deletes a member with no project, task, or subtask assignments
- **THEN** the UI requests normal deletion confirmation
- **THEN** confirmed deletion calls `useDeleteMember`

#### Scenario: Warn before deleting assigned member
- **WHEN** a user attempts to delete a member assigned to one or more projects, tasks, or subtasks
- **THEN** the UI shows an assignment warning with assignment context
- **THEN** no delete mutation is sent until the user explicitly confirms

#### Scenario: Cancel assigned member deletion
- **WHEN** a user cancels an assigned-member deletion warning
- **THEN** no delete mutation is sent
- **THEN** the member remains visible

#### Scenario: Confirm assigned member deletion
- **WHEN** a user confirms deletion for an assigned member
- **THEN** `useDeleteMember` deletes the member through the Application layer and repository adapter
- **THEN** repository-defined cleanup removes the member from projects and unassigns affected tasks and subtasks

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

### Requirement: Member management test coverage
The system MUST include focused automated tests for member use cases, member validation, and assigned-member deletion detection.

#### Scenario: Test member use cases
- **WHEN** member use case tests run
- **THEN** they verify list, get by ID, create, update, delete, and assignment detection behavior against fake repository ports

#### Scenario: Test member form validation
- **WHEN** member form validation tests run
- **THEN** they verify valid data, missing name rejection, optional email acceptance, and invalid email rejection

#### Scenario: Test assigned-member detection
- **WHEN** assigned-member detection tests run
- **THEN** they verify assignments are detected across projects, tasks, and subtasks

### Requirement: Member management feedback
The system MUST use reusable UI feedback patterns for existing member create, update, and delete workflows while preserving assigned-member warning context.

#### Scenario: Confirm unassigned member deletion with reusable dialog
- **WHEN** a user starts deleting a member with no project, task, or subtask assignments
- **THEN** the UI opens the shared `ConfirmDialog`
- **THEN** no delete mutation is sent until the user confirms the dialog

#### Scenario: Confirm assigned member deletion with reusable dialog
- **WHEN** a user starts deleting a member assigned to one or more projects, tasks, or subtasks
- **THEN** the UI opens the shared `ConfirmDialog`
- **THEN** the dialog description includes assignment context
- **THEN** no delete mutation is sent until the user confirms the dialog

#### Scenario: Cancel member deletion dialog
- **WHEN** a user cancels the member deletion dialog
- **THEN** no delete mutation is sent
- **THEN** the member remains visible

#### Scenario: Show member deletion loading state
- **WHEN** a confirmed member deletion is in progress
- **THEN** the confirmation dialog disables conflicting actions
- **THEN** the destructive confirm action communicates the pending state

#### Scenario: Show member created toast
- **WHEN** a member is created successfully
- **THEN** the UI closes or resets the create surface
- **THEN** the UI shows a success toast notification

#### Scenario: Show member updated toast
- **WHEN** a member is updated successfully
- **THEN** the UI closes the edit surface
- **THEN** the UI shows a success toast notification

#### Scenario: Show member deleted toast
- **WHEN** a member is deleted successfully
- **THEN** the UI shows a success toast notification
- **THEN** the notification does not require additional user confirmation

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

