import type { Member, Subtask, Tag, Task, TaskStatus } from '../../domain'
import { KANBAN_COLUMNS, TASK_PRIORITY_LABELS } from '../../shared/constants'

export type KanbanColumnGroup = {
  label: string
  status: TaskStatus
  tasks: Task[]
}

export type TaskCardMetadata = {
  assignee: string
  checklistSummary: string
  dueDate: string
  priority: string
  subtaskSummary: string
  tags: Tag[]
}

const EMPTY_VALUE = 'Not set'

export const groupTasksByKanbanColumn = (tasks: Task[]): KanbanColumnGroup[] => {
  const grouped = new Map<TaskStatus, Task[]>()

  for (const column of KANBAN_COLUMNS) {
    grouped.set(column.status, [])
  }

  for (const task of tasks) {
    grouped.get(task.status)?.push(task)
  }

  return KANBAN_COLUMNS.map((column) => ({
    label: column.label,
    status: column.status,
    tasks: grouped.get(column.status) ?? [],
  }))
}

const formatChecklistSummary = (task: Task): string => {
  if (task.checklist.length === 0) {
    return 'No checklist'
  }

  const completedItems = task.checklist.filter((item) => item.completed).length
  return `${completedItems}/${task.checklist.length} complete`
}

const formatSubtaskSummary = (task: Task, subtasks: Subtask[]): string => {
  const taskSubtasks = subtasks.filter((subtask) => subtask.taskId === task.id)

  if (taskSubtasks.length === 0) {
    return 'No subtasks'
  }

  const doneCount = taskSubtasks.filter((subtask) => subtask.status === 'done').length
  return `${doneCount}/${taskSubtasks.length} done`
}

export const hasPendingSubtasks = (task: Task, subtasks: Subtask[]): boolean =>
  subtasks.some((subtask) => subtask.taskId === task.id && subtask.status !== 'done')

export const getTaskCardMetadata = (task: Task, members: Member[], tags: Tag[], subtasks: Subtask[]): TaskCardMetadata => {
  const taskTags = tags.filter((tag) => task.tagIds.includes(tag.id))
  const assignee = task.assigneeMemberId === null ? 'Unassigned' : members.find((member) => member.id === task.assigneeMemberId)?.name ?? EMPTY_VALUE

  return {
    assignee,
    checklistSummary: formatChecklistSummary(task),
    dueDate: task.dueDate ?? EMPTY_VALUE,
    priority: TASK_PRIORITY_LABELS[task.priority],
    subtaskSummary: formatSubtaskSummary(task, subtasks),
    tags: taskTags,
  }
}
