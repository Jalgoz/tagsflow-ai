## ADDED Requirements

### Requirement: Tag application use cases
The system MUST provide Application-layer use cases for listing tags, getting a tag by ID, creating a tag, updating a tag, deleting a tag, detecting whether a tag is used by tasks or subtasks, and finding or creating a tag by name.

#### Scenario: List tags through application use case
- **WHEN** tag list data is requested by the Presentation layer
- **THEN** the Application layer calls the configured `TagRepository`
- **THEN** the Presentation layer receives tag domain entities without accessing Local Storage directly

#### Scenario: Get tag by ID through application use case
- **WHEN** a tag-specific UI surface requests a tag by ID
- **THEN** the Application layer calls the configured `TagRepository`
- **THEN** it returns the matching tag or `null` when no tag exists for that ID

#### Scenario: Create tag through application use case
- **WHEN** valid tag create input is submitted
- **THEN** the Application layer calls the configured `TagRepository` create method
- **THEN** the created tag is persisted by the repository adapter and returned to the caller

#### Scenario: Update tag through application use case
- **WHEN** valid tag update input is submitted for an existing tag
- **THEN** the Application layer calls the configured `TagRepository` update method
- **THEN** the updated tag is persisted by the repository adapter and returned to the caller

#### Scenario: Delete tag through application use case
- **WHEN** tag deletion is confirmed
- **THEN** the Application layer calls the configured `TagRepository` delete method
- **THEN** repository-defined tag cleanup is used without duplicating cleanup in the UI

#### Scenario: Detect used tag
- **WHEN** the Presentation layer requests deletion context for a tag
- **THEN** the Application layer checks tasks and subtasks through repository ports
- **THEN** it reports whether the tag is used and includes usage counts by entity type

### Requirement: Find or create tag by name
The system MUST provide a tag use case that trims a requested tag name, finds an existing tag by name using case-insensitive comparison, or creates a new tag when no matching tag exists.

#### Scenario: Return existing tag by normalized name
- **WHEN** a find-or-create request uses a name matching an existing tag after trimming and case-insensitive comparison
- **THEN** the Application layer returns the existing tag
- **THEN** no create mutation is sent to the repository

#### Scenario: Create missing tag by name
- **WHEN** a find-or-create request uses a non-empty name with no matching existing tag
- **THEN** the Application layer creates a new tag through `TagRepository`
- **THEN** the created tag is returned to the caller

#### Scenario: Reject empty find-or-create tag name
- **WHEN** a find-or-create request contains an empty or whitespace-only name
- **THEN** the Application layer rejects the request
- **THEN** no tag is created

### Requirement: Tag query hooks
The system MUST provide TanStack Query hooks named `useTags`, `useTag`, `useCreateTag`, `useUpdateTag`, `useDeleteTag`, and `useFindOrCreateTag` for tag reads and mutations.

#### Scenario: Read tags with query hook
- **WHEN** the Tag Management UI renders
- **THEN** it uses `useTags` to load tags
- **THEN** the hook returns loading, error, and data state from TanStack Query

#### Scenario: Read tag with query hook
- **WHEN** a tag-specific UI surface requests a tag by ID
- **THEN** it uses `useTag` to load that tag
- **THEN** the hook returns loading, error, and tag-or-null state from TanStack Query

#### Scenario: Invalidate tag queries after mutation
- **WHEN** a tag is created, updated, deleted, or created through find-or-create
- **THEN** tag list queries are invalidated
- **THEN** the affected tag detail query is invalidated when the mutation targets a specific tag ID

#### Scenario: Keep tag business data outside Zustand
- **WHEN** tag hooks manage query and mutation state
- **THEN** they use TanStack Query rather than Zustand for persisted tag entities
- **THEN** business data remains persisted through repositories

### Requirement: Tag form validation
The system MUST provide a Zod-backed validation schema for tag form data covering name and optional color.

#### Scenario: Accept valid tag form data
- **WHEN** a tag form contains a non-empty name and optional color
- **THEN** the validation schema accepts the form data
- **THEN** the validated data can be transformed into domain tag create or update input

#### Scenario: Reject empty tag name
- **WHEN** a tag form is submitted without a non-empty name
- **THEN** the validation schema rejects the form data
- **THEN** the UI can display a field-level validation message

#### Scenario: Accept omitted tag color
- **WHEN** a tag form is submitted without a color value
- **THEN** the validation schema accepts the form data

### Requirement: Tag Management UI
The system MUST provide basic Tag Management UI that lists tags, displays an empty state, supports creating tags, editing tags, deleting tags, and renders each tag with a simple visual badge.

#### Scenario: Show empty tags state
- **WHEN** the tag repository contains no tags
- **THEN** the Tag Management UI shows an empty state
- **THEN** the empty state provides a create tag action

#### Scenario: Show tag list
- **WHEN** the tag repository contains one or more tags
- **THEN** the Tag Management UI shows each tag with its name and a simple visual badge

#### Scenario: Create tag from UI
- **WHEN** a user enters valid tag details and saves a create form
- **THEN** the tag is created through `useCreateTag`
- **THEN** the created tag appears in the tag list

#### Scenario: Edit tag from UI
- **WHEN** a user edits an existing tag with valid details and saves
- **THEN** the tag is updated through `useUpdateTag`
- **THEN** the updated tag details are visible after the mutation succeeds

#### Scenario: Handle tag loading and errors
- **WHEN** the tag query is loading or errors
- **THEN** the UI shows an appropriate loading or error state
- **THEN** it does not present placeholder copy as complete functionality

### Requirement: Used tag deletion confirmation
The system MUST require confirmation before deleting a tag that is used by any task or subtask.

#### Scenario: Delete unused tag
- **WHEN** a user deletes a tag with no task or subtask usage
- **THEN** the UI requests normal deletion confirmation
- **THEN** confirmed deletion calls `useDeleteTag`

#### Scenario: Warn before deleting used tag
- **WHEN** a user attempts to delete a tag used by one or more tasks or subtasks
- **THEN** the UI shows a usage warning with usage context
- **THEN** no delete mutation is sent until the user explicitly confirms

#### Scenario: Cancel used tag deletion
- **WHEN** a user cancels a used-tag deletion warning
- **THEN** no delete mutation is sent
- **THEN** the tag remains visible

#### Scenario: Confirm used tag deletion
- **WHEN** a user confirms deletion for a used tag
- **THEN** `useDeleteTag` deletes the tag through the Application layer and repository adapter
- **THEN** repository-defined cleanup removes that tag ID from affected tasks and subtasks

### Requirement: Tag management scope boundaries
The system MUST keep this Tag Management slice limited to tag use cases, tag hooks, tag validation, basic tag catalog UI, tag badges, used-tag deletion confirmation, and find-or-create tag behavior for future inline flows.

#### Scenario: Exclude task and subtask tag assignment controls
- **WHEN** this change is implemented
- **THEN** it does not add task or subtask tag assignment UI
- **THEN** it does not add task or subtask editing forms

#### Scenario: Exclude unrelated modules
- **WHEN** this change is implemented
- **THEN** it does not add task CRUD, subtask CRUD, kanban drag and drop, dashboard metrics, AI features, settings implementation, import/export, or demo data

### Requirement: Tag management test coverage
The system MUST include focused automated tests for tag use cases, tag validation, used-tag detection, and find-or-create tag behavior.

#### Scenario: Test tag use cases
- **WHEN** tag use case tests run
- **THEN** they verify list, get by ID, create, update, delete, and usage detection behavior against fake repository ports

#### Scenario: Test tag form validation
- **WHEN** tag form validation tests run
- **THEN** they verify valid data, missing name rejection, and optional color behavior

#### Scenario: Test find-or-create behavior
- **WHEN** find-or-create tag tests run
- **THEN** they verify existing tag reuse, new tag creation, whitespace trimming, case-insensitive matching, and empty name rejection
