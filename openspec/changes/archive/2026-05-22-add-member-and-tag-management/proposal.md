## Why

TagsFlow AI already has project management, domain repository ports, and Local Storage adapters, but the Members route remains a placeholder and tags only exist as persisted catalog data. Member and Tag Management is the next focused slice because later task, subtask, filtering, and assignment workflows need a reusable local people catalog and tag catalog before they can attach those records to work items.

## What Changes

- Add Application-layer member use cases for listing members, fetching a member by ID, creating members, updating members, deleting members, and detecting whether a member is assigned to projects, tasks, or subtasks before deletion.
- Add Application-layer tag use cases for listing tags, fetching a tag by ID, creating tags, updating tags, deleting tags, and finding or creating a tag by name for future inline tag creation flows.
- Add TanStack Query member hooks: `useMembers`, `useMember`, `useCreateMember`, `useUpdateMember`, and `useDeleteMember`.
- Add TanStack Query tag hooks: `useTags`, `useTag`, `useCreateTag`, `useUpdateTag`, `useDeleteTag`, and `useFindOrCreateTag`.
- Add Zod-backed validation schemas for member form data and tag form data.
- Replace the Members placeholder route with a functional Members page that supports member list, empty state, create, edit, delete, and assigned-member deletion warning behavior.
- Add basic Tag Management UI in the same module slice, including tag list, create, edit, delete, simple visual tag badges, and used-tag deletion confirmation.
- Add focused tests for member use cases, tag use cases, validation schemas, member assignment detection, and find-or-create tag behavior.
- Keep task CRUD, subtask CRUD, project member assignment UI, assigning members or tags through task forms, kanban drag and drop, dashboard metrics, AI features, settings, import/export, and demo data out of scope.

## Capabilities

### New Capabilities

- `member-management`: Application use cases, query hooks, validation, Members page UI, and deletion warning behavior for the local member catalog.
- `tag-management`: Application use cases, query hooks, validation, basic tag catalog UI, tag badges, deletion confirmation, and find-or-create behavior for future inline tag creation.

### Modified Capabilities

- `project-foundation`: The Members route changes from a placeholder to a functional Member and Tag Management screen while unrelated placeholder routes remain unchanged.

## Impact

This change affects the Application, Presentation, app composition, and tests. It uses existing Domain member/tag entities and repository ports plus existing Local Storage repository implementations. It may require adding member and tag repository providers or a generalized application repository composition pattern, but it must not introduce backend behavior, authentication, real collaboration, AI provider calls, task/subtask CRUD, settings implementation, import/export, or new persistence mechanisms. Future HTTP repositories should remain swappable behind the same Domain repository ports.
