import type { Priority, TaskStatus } from '../../domain'
import { KANBAN_COLUMNS, TASK_PRIORITY_LABELS } from '../../shared/constants'
import { UNASSIGNED_FILTER_VALUE, buildGlobalTaskRows, type BuildGlobalTaskRowsInput } from './global-tasks'

export { UNASSIGNED_FILTER_VALUE }

const EMPTY_VALUE = 'Not set'

export interface GlobalKanbanCard {
  assigneeId: string | null
  assigneeName: string
  checklistSummary: string
  dueDate: string
  id: string
  priority: Priority
  priorityLabel: string
  projectId: string
  projectName: string
  status: TaskStatus
  subtaskSummary: string
  tagIds: string[]
  tagNames: string[]
  title: string
}

export interface GlobalKanbanFilters {
  assigneeId: string
  priority: Priority | ''
  projectId: string
  tagId: string
}

export interface GlobalKanbanColumn {
  cards: GlobalKanbanCard[]
  label: string
  status: TaskStatus
}

export const createEmptyGlobalKanbanFilters = (): GlobalKanbanFilters => ({
  assigneeId: '',
  priority: '',
  projectId: '',
  tagId: '',
})

const formatChecklistSummary = (completed: number, total: number): string => {
  if (total === 0) {
    return 'No checklist'
  }

  return `${completed}/${total} complete`
}

const formatSubtaskSummary = (completed: number, total: number): string => {
  if (total === 0) {
    return 'No subtasks'
  }

  return `${completed}/${total} done`
}

export const buildGlobalKanbanCards = (input: BuildGlobalTaskRowsInput): GlobalKanbanCard[] => {
  const rows = buildGlobalTaskRows(input)

  return rows.map((row) => ({
    assigneeId: row.task.assigneeMemberId,
    assigneeName: row.assignee?.name ?? 'Unassigned',
    checklistSummary: formatChecklistSummary(row.checklistSummary.completed, row.checklistSummary.total),
    dueDate: row.dueDate ?? EMPTY_VALUE,
    id: row.id,
    priority: row.priority,
    priorityLabel: TASK_PRIORITY_LABELS[row.priority],
    projectId: row.task.projectId,
    projectName: row.projectName,
    status: row.status,
    subtaskSummary: formatSubtaskSummary(row.subtaskProgress.completed, row.subtaskProgress.total),
    tagIds: row.tags.map((tag) => tag.id),
    tagNames: row.tags.map((tag) => tag.name),
    title: row.title,
  }))
}

export const filterGlobalKanbanCards = (cards: GlobalKanbanCard[], filters: GlobalKanbanFilters): GlobalKanbanCard[] =>
  cards.filter((card) => {
    if (filters.projectId !== '' && card.projectId !== filters.projectId) {
      return false
    }

    if (filters.priority !== '' && card.priority !== filters.priority) {
      return false
    }

    if (filters.assigneeId === UNASSIGNED_FILTER_VALUE && card.assigneeId !== null) {
      return false
    }

    if (
      filters.assigneeId !== '' &&
      filters.assigneeId !== UNASSIGNED_FILTER_VALUE &&
      card.assigneeId !== filters.assigneeId
    ) {
      return false
    }

    if (filters.tagId !== '' && !card.tagIds.includes(filters.tagId)) {
      return false
    }

    return true
  })

export const groupGlobalKanbanCards = (cards: GlobalKanbanCard[]): GlobalKanbanColumn[] => {
  const grouped = new Map<TaskStatus, GlobalKanbanCard[]>()

  for (const column of KANBAN_COLUMNS) {
    grouped.set(column.status, [])
  }

  for (const card of cards) {
    grouped.get(card.status)?.push(card)
  }

  return KANBAN_COLUMNS.map((column) => ({
    cards: grouped.get(column.status) ?? [],
    label: column.label,
    status: column.status,
  }))
}
