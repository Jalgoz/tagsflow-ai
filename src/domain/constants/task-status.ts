export const TASK_STATUSES = ['backlog', 'todo', 'in_progress', 'blocked', 'review', 'done'] as const

export type TaskStatus = (typeof TASK_STATUSES)[number]
