import type { TaskStatus } from '../../domain'

export const KANBAN_COLUMNS: ReadonlyArray<{ label: string; status: TaskStatus }> = [
  { label: 'Backlog', status: 'backlog' },
  { label: 'To Do', status: 'todo' },
  { label: 'In Progress', status: 'in_progress' },
  { label: 'Blocked', status: 'blocked' },
  { label: 'Review', status: 'review' },
  { label: 'Done', status: 'done' },
]
