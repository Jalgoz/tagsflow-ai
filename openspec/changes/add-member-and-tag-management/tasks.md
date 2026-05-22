## 1. Application Composition

- [x] 1.1 Review existing project Application module exports, repository provider patterns, and hook tests to match local conventions.
- [x] 1.2 Add member and tag Application feature folders with use cases, query keys, hooks, validation, provider/context utilities, tests, and barrel exports.
- [x] 1.3 Wire app composition so member and tag hooks receive `MemberRepository`, `TagRepository`, and the read-only related repositories needed for assignment or usage detection.
- [x] 1.4 Ensure Presentation imports member and tag behavior from Application exports rather than Infrastructure adapters.

## 2. Member Use Cases

- [x] 2.1 Implement `listMembers` using the `MemberRepository` port.
- [x] 2.2 Implement `getMemberById` using the `MemberRepository` port and returning `Member | null`.
- [x] 2.3 Implement `createMember` using the `MemberRepository` port and domain create input.
- [x] 2.4 Implement `updateMember` using the `MemberRepository` port and domain update input.
- [x] 2.5 Implement `deleteMember` using the `MemberRepository` port without duplicating repository assignment cleanup.
- [x] 2.6 Implement assigned-member detection across `ProjectRepository`, `TaskRepository`, and `SubtaskRepository` with counts for projects, tasks, and subtasks.
- [x] 2.7 Add focused member use case tests with fake repositories covering list, get by ID, create, update, delete, and assignment detection.

## 3. Tag Use Cases

- [x] 3.1 Implement `listTags` using the `TagRepository` port.
- [x] 3.2 Implement `getTagById` using the `TagRepository` port and returning `Tag | null`.
- [x] 3.3 Implement `createTag` using the `TagRepository` port and domain create input.
- [x] 3.4 Implement `updateTag` using the `TagRepository` port and domain update input.
- [x] 3.5 Implement `deleteTag` using the `TagRepository` port without duplicating repository tag cleanup.
- [x] 3.6 Implement used-tag detection across `TaskRepository` and `SubtaskRepository` with counts for tasks and subtasks.
- [x] 3.7 Implement `findOrCreateTagByName` with trimming, case-insensitive matching, existing tag reuse, new tag creation, and empty-name rejection.
- [x] 3.8 Add focused tag use case tests with fake repositories covering CRUD, usage detection, and find-or-create behavior.

## 4. Query Hooks

- [x] 4.1 Define centralized member query keys for member list and member detail queries.
- [x] 4.2 Implement `useMembers` and `useMember` with loading, error, and data state.
- [x] 4.3 Implement `useCreateMember`, `useUpdateMember`, and `useDeleteMember` with list/detail query updates or invalidation after successful mutations.
- [x] 4.4 Define centralized tag query keys for tag list and tag detail queries.
- [x] 4.5 Implement `useTags` and `useTag` with loading, error, and data state.
- [x] 4.6 Implement `useCreateTag`, `useUpdateTag`, `useDeleteTag`, and `useFindOrCreateTag` with list/detail query updates or invalidation after successful mutations.
- [x] 4.7 Add hook tests where the existing test setup supports QueryClient and repository provider rendering without broad new test infrastructure.

## 5. Form Validation and Mapping

- [x] 5.1 Implement a Zod member form schema where name is required, email is optional but validated when provided, and role/avatar can be empty strings.
- [x] 5.2 Add member form value helpers for empty form values, entity-to-form mapping, create input mapping, and update input mapping.
- [x] 5.3 Implement a Zod tag form schema where name is required and color is optional.
- [x] 5.4 Add tag form value helpers for empty form values, entity-to-form mapping, create input mapping, and update input mapping.
- [x] 5.5 Normalize empty tag color input to `undefined` or omit it from domain create/update input.
- [x] 5.6 Add validation tests for valid member data, missing member name, optional email, invalid email, valid tag data, missing tag name, and optional color.

## 6. Reusable UI Components

- [x] 6.1 Create a reusable `MemberForm` component using React Hook Form and the member Zod schema.
- [x] 6.2 Add member form fields for name, email, role, and avatar with field-level validation messages.
- [x] 6.3 Create a reusable `TagForm` component using React Hook Form and the tag Zod schema.
- [x] 6.4 Add tag form fields for name and optional color with field-level validation messages.
- [x] 6.5 Create a simple tag badge presentation that displays the tag name and optional color without adding tag assignment controls.
- [x] 6.6 Ensure form cancel behavior discards unsaved changes and does not send create or update mutations.

## 7. Members Page

- [x] 7.1 Replace the Members placeholder with a functional page that loads members through `useMembers`.
- [x] 7.2 Add member loading and error states.
- [x] 7.3 Add a member empty state with a create member action.
- [x] 7.4 Add a compact member list showing name, email, role, avatar context, and edit/delete actions.
- [x] 7.5 Add create member UI from the Members page and close or reset it after successful creation.
- [x] 7.6 Add edit member UI from the Members page and refresh visible data after successful update.
- [x] 7.7 Add member deletion confirmation for unassigned members.
- [x] 7.8 Add assigned-member deletion warning that displays assignment context and requires explicit confirmation before calling `useDeleteMember`.

## 8. Tag Management UI

- [x] 8.1 Add a clearly separated Tag Management section or tab inside the Members page.
- [x] 8.2 Load tags through `useTags` and add tag loading and error states.
- [x] 8.3 Add a tag empty state with a create tag action.
- [x] 8.4 Add a compact tag list showing tag badges and edit/delete actions.
- [x] 8.5 Add create tag UI and close or reset it after successful creation.
- [x] 8.6 Add edit tag UI and refresh visible data after successful update.
- [x] 8.7 Add tag deletion confirmation for unused tags.
- [x] 8.8 Add used-tag deletion warning that displays usage context and requires explicit confirmation before calling `useDeleteTag`.

## 9. Scope and Verification

- [x] 9.1 Verify no task CRUD, subtask CRUD, task assignment UI, subtask assignment UI, project member assignment UI, task tag assignment UI, kanban drag and drop, dashboard metrics, AI features, settings implementation, import/export, or demo data were added.
- [x] 9.2 Verify member deletion relies on repository cleanup for project member references and task/subtask unassignment.
- [x] 9.3 Verify tag deletion relies on repository cleanup for task/subtask tag references.
- [x] 9.4 Run `npm run test`.
- [x] 9.5 Run `npm run lint`.
- [x] 9.6 Run `npm run build`.
- [x] 9.7 Review the diff for architecture boundaries, focused scope, and removal of temporary or unrelated changes.
