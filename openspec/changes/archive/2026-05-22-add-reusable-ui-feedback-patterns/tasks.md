## 1. Shared Feedback Foundation

- [x] 1.1 Inspect existing presentation component exports and app provider wiring to choose the local location for shared feedback primitives.
- [x] 1.2 Implement a shared `ConfirmDialog` component with title, description, cancel action, destructive confirm action, and pending/disabled support.
- [x] 1.3 Implement a shared toast notification provider with success and error variants, accessible text, manual dismissal, and auto-dismiss behavior.
- [x] 1.4 Add a `useToast` hook or equivalent local API for pages to enqueue toast notifications.
- [x] 1.5 Wire the toast provider into the app root or shell so all routed pages can use it.
- [x] 1.6 Add focused styles for the confirmation dialog and toast stack using the existing visual system.

## 2. Project Feedback Integration

- [x] 2.1 Replace the Project Detail inline project deletion confirmation with `ConfirmDialog`.
- [x] 2.2 Preserve project deletion pending state and navigation back to `/projects` after successful deletion.
- [x] 2.3 Show a success toast after project creation succeeds.
- [x] 2.4 Show a success toast after project update succeeds from the Projects page and Project Detail page.
- [x] 2.5 Show a success toast after project deletion succeeds.
- [x] 2.6 Ensure opening project edit and delete confirmation remain mutually exclusive.

## 3. Member Feedback Integration

- [x] 3.1 Replace the member deletion inline confirmation with `ConfirmDialog`.
- [x] 3.2 Preserve assigned-member usage context in the member deletion dialog description.
- [x] 3.3 Preserve member deletion pending state and repository-defined assignment cleanup behavior.
- [x] 3.4 Show a success toast after member creation succeeds.
- [x] 3.5 Show a success toast after member update succeeds.
- [x] 3.6 Show a success toast after member deletion succeeds.
- [x] 3.7 Ensure opening member edit/create and delete confirmation remain mutually exclusive.

## 4. Tag Feedback Integration

- [x] 4.1 Replace the tag deletion inline confirmation with `ConfirmDialog`.
- [x] 4.2 Preserve used-tag context in the tag deletion dialog description.
- [x] 4.3 Preserve tag deletion pending state and repository-defined tag cleanup behavior.
- [x] 4.4 Show a success toast after tag creation succeeds.
- [x] 4.5 Show a success toast after tag update succeeds.
- [x] 4.6 Show a success toast after tag deletion succeeds.
- [x] 4.7 Ensure opening tag edit/create and delete confirmation remain mutually exclusive.

## 5. Tests

- [x] 5.1 Add `ConfirmDialog` tests for rendering, cancel, confirm, and pending/disabled behavior.
- [x] 5.2 Add toast provider or hook tests for success rendering, error rendering, dismissal, and auto-dismiss when supported by current test utilities.
- [x] 5.3 Update existing project/member/tag page or hook tests only where current test utilities already support the flow without broad infrastructure changes.

## 6. Cleanup and Verification

- [x] 6.1 Remove obsolete inline confirmation styles if they are no longer used.
- [x] 6.2 Verify no domain, repository, Local Storage, or AI provider code was changed for UI-only feedback behavior.
- [x] 6.3 Run the relevant test suite.
- [x] 6.4 Run lint and build checks.
- [x] 6.5 Update this task list as implementation steps are completed.
