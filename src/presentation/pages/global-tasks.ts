import type { Member, Priority, Project, Subtask, Tag, Task, TaskStatus } from '../../domain'
import { PRIORITIES, TASK_STATUSES, calculateTaskProgress, isOverdueItem } from '../../domain'

export const DEFAULT_UPCOMING_DEADLINE_WINDOW_DAYS = 7

export const UNASSIGNED_FILTER_VALUE = '__unassigned__'

export type GlobalTaskSortField = 'dueDate' | 'priority' | 'status' | 'project' | 'title'
export type SortDirection = 'asc' | 'desc'

export interface GlobalTaskFilters {
  assigneeId: string
  overdueOnly: boolean
  priority: Priority | ''
  projectId: string
  status: TaskStatus | ''
  tagId: string
  upcomingOnly: boolean
}

export interface GlobalTaskSort {
  direction: SortDirection
  field: GlobalTaskSortField
}

export interface ChecklistSummary {
  completed: number
  total: number
}

export interface GlobalSubtaskRow {
  assignee: Member | null
  checklistSummary: ChecklistSummary
  dueDate: string | null
  id: string
  priority: Priority
  status: TaskStatus
  tags: Tag[]
  title: string
}

export interface GlobalTaskRow {
  assignee: Member | null
  checklistSummary: ChecklistSummary
  dueDate: string | null
  id: string
  priority: Priority
  project: Project | null
  projectName: string
  startDate: string | null
  status: TaskStatus
  subtaskProgress: ChecklistSummary
  subtasks: GlobalSubtaskRow[]
  tags: Tag[]
  task: Task
  taskProgress: number
  title: string
}

export interface BuildGlobalTaskRowsInput {
  members: Member[]
  projects: Project[]
  subtasks: Subtask[]
  tags: Tag[]
  tasks: Task[]
}

const missingProjectName = 'Unknown project'

const createIdMap = <Entity extends { id: string }>(entities: Entity[]): Map<string, Entity> =>
  new Map(entities.map((entity) => [entity.id, entity]))

const getChecklistSummary = (items: Array<{ completed: boolean }>): ChecklistSummary => ({
  completed: items.filter((item) => item.completed).length,
  total: items.length,
})

const resolveTags = (tagIds: string[], tagsById: Map<string, Tag>): Tag[] =>
  tagIds.map((tagId) => tagsById.get(tagId)).filter((tag): tag is Tag => tag !== undefined)

const getTaskSubtasks = (task: Task, subtasks: Subtask[]): Subtask[] =>
  subtasks.filter((subtask) => subtask.taskId === task.id && task.subtaskIds.includes(subtask.id))

export const buildGlobalTaskRows = ({
  members,
  projects,
  subtasks,
  tags,
  tasks,
}: BuildGlobalTaskRowsInput): GlobalTaskRow[] => {
  const projectsById = createIdMap(projects)
  const membersById = createIdMap(members)
  const tagsById = createIdMap(tags)

  return tasks.map((task) => {
    const project = projectsById.get(task.projectId) ?? null
    const taskSubtasks = getTaskSubtasks(task, subtasks)
    const subtaskRows = taskSubtasks.map((subtask) => ({
      assignee: subtask.assigneeMemberId === null ? null : membersById.get(subtask.assigneeMemberId) ?? null,
      checklistSummary: getChecklistSummary(subtask.checklist),
      dueDate: subtask.dueDate,
      id: subtask.id,
      priority: subtask.priority,
      status: subtask.status,
      tags: resolveTags(subtask.tagIds, tagsById),
      title: subtask.title,
    }))

    return {
      assignee: task.assigneeMemberId === null ? null : membersById.get(task.assigneeMemberId) ?? null,
      checklistSummary: getChecklistSummary(task.checklist),
      dueDate: task.dueDate,
      id: task.id,
      priority: task.priority,
      project,
      projectName: project?.title ?? missingProjectName,
      startDate: task.startDate,
      status: task.status,
      subtaskProgress: {
        completed: taskSubtasks.filter((subtask) => subtask.status === 'done').length,
        total: taskSubtasks.length,
      },
      subtasks: subtaskRows,
      tags: resolveTags(task.tagIds, tagsById),
      task,
      taskProgress: calculateTaskProgress({ task, subtasks: taskSubtasks }),
      title: task.title,
    }
  })
}

export const createEmptyGlobalTaskFilters = (): GlobalTaskFilters => ({
  assigneeId: '',
  overdueOnly: false,
  priority: '',
  projectId: '',
  status: '',
  tagId: '',
  upcomingOnly: false,
})

const isUpcomingTask = (task: Task, referenceDate: string, windowDays: number): boolean => {
  if (task.dueDate === null || task.status === 'done') {
    return false
  }

  const referenceTime = Date.parse(referenceDate)
  const dueTime = Date.parse(task.dueDate)

  if (Number.isNaN(referenceTime) || Number.isNaN(dueTime)) {
    return false
  }

  const windowEnd = referenceTime + windowDays * 24 * 60 * 60 * 1000
  return dueTime >= referenceTime && dueTime <= windowEnd
}

export const filterGlobalTaskRows = (
  rows: GlobalTaskRow[],
  filters: GlobalTaskFilters,
  referenceDate: string,
  upcomingWindowDays = DEFAULT_UPCOMING_DEADLINE_WINDOW_DAYS,
): GlobalTaskRow[] =>
  rows.filter((row) => {
    if (filters.projectId !== '' && row.task.projectId !== filters.projectId) {
      return false
    }

    if (filters.status !== '' && row.status !== filters.status) {
      return false
    }

    if (filters.priority !== '' && row.priority !== filters.priority) {
      return false
    }

    if (filters.assigneeId === UNASSIGNED_FILTER_VALUE && row.task.assigneeMemberId !== null) {
      return false
    }

    if (
      filters.assigneeId !== '' &&
      filters.assigneeId !== UNASSIGNED_FILTER_VALUE &&
      row.task.assigneeMemberId !== filters.assigneeId
    ) {
      return false
    }

    if (filters.tagId !== '' && !row.task.tagIds.includes(filters.tagId)) {
      return false
    }

    if (filters.overdueOnly && !isOverdueItem(row.task, referenceDate)) {
      return false
    }

    if (filters.upcomingOnly && !isUpcomingTask(row.task, referenceDate, upcomingWindowDays)) {
      return false
    }

    return true
  })

export const searchGlobalTaskRows = (rows: GlobalTaskRow[], searchText: string): GlobalTaskRow[] => {
  const normalizedSearch = searchText.trim().toLocaleLowerCase()

  if (normalizedSearch.length === 0) {
    return rows
  }

  return rows.filter((row) => {
    const searchableText = `${row.task.title} ${row.task.description}`.toLocaleLowerCase()
    return searchableText.includes(normalizedSearch)
  })
}

const priorityRank = new Map<Priority, number>(PRIORITIES.map((priority, index) => [priority, index]))
const statusRank = new Map<TaskStatus, number>(TASK_STATUSES.map((status, index) => [status, index]))

const compareStrings = (left: string, right: string): number => left.localeCompare(right, undefined, { sensitivity: 'base' })

const compareNullableDates = (left: string | null, right: string | null): number => {
  if (left === null && right === null) {
    return 0
  }

  if (left === null) {
    return 1
  }

  if (right === null) {
    return -1
  }

  return left.localeCompare(right)
}

const compareRows = (left: GlobalTaskRow, right: GlobalTaskRow, field: GlobalTaskSortField): number => {
  switch (field) {
    case 'dueDate':
      return compareNullableDates(left.dueDate, right.dueDate)
    case 'priority':
      return (priorityRank.get(left.priority) ?? 0) - (priorityRank.get(right.priority) ?? 0)
    case 'project':
      return compareStrings(left.projectName, right.projectName)
    case 'status':
      return (statusRank.get(left.status) ?? 0) - (statusRank.get(right.status) ?? 0)
    case 'title':
      return compareStrings(left.title, right.title)
  }
}

export const sortGlobalTaskRows = (rows: GlobalTaskRow[], sort: GlobalTaskSort): GlobalTaskRow[] => {
  const directionMultiplier = sort.direction === 'asc' ? 1 : -1

  return [...rows].sort((left, right) => {
    const result = compareRows(left, right, sort.field)
    const fallback = compareStrings(left.title, right.title)
    return (result === 0 ? fallback : result) * directionMultiplier
  })
}

export const applyGlobalTaskView = (
  rows: GlobalTaskRow[],
  filters: GlobalTaskFilters,
  searchText: string,
  sort: GlobalTaskSort,
  referenceDate: string,
): GlobalTaskRow[] => sortGlobalTaskRows(searchGlobalTaskRows(filterGlobalTaskRows(rows, filters, referenceDate), searchText), sort)
