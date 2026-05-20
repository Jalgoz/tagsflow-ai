export const KANBAN_COLUMNS = [
  { label: 'Backlog', status: 'backlog' },
  { label: 'To Do', status: 'todo' },
  { label: 'In Progress', status: 'in_progress' },
  { label: 'Blocked', status: 'blocked' },
  { label: 'Review', status: 'review' },
  { label: 'Done', status: 'done' },
] as const
