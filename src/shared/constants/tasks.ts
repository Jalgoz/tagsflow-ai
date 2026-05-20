import type { Priority, TaskStatus } from '../../domain'

export const TASK_STATUS_LABELS: Record<TaskStatus, string> = {
  backlog: 'Backlog',
  blocked: 'Blocked',
  done: 'Done',
  in_progress: 'In Progress',
  review: 'Review',
  todo: 'To Do',
}

export const TASK_PRIORITY_LABELS: Record<Priority, string> = {
  low: 'Low',
  medium: 'Medium',
  high: 'High',
  urgent: 'Urgent',
}
