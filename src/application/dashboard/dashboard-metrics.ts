import type { Member, Priority, Project, Subtask, Tag, Task, TaskStatus } from '../../domain'
import {
  PRIORITIES,
  PROJECT_STATUSES,
  TASK_STATUSES,
  calculateProjectProgress,
  getOverdueTasks,
  getUpcomingDeadlineTasks,
} from '../../domain'

export const DEFAULT_DASHBOARD_UPCOMING_DEADLINE_WINDOW_DAYS = 7
export const DEFAULT_DASHBOARD_RECENTLY_COMPLETED_LIMIT = 5

const UNKNOWN_PROJECT_NAME = 'Unknown project'
const MISSING_ASSIGNEE_NAME = 'Unassigned'
const COMPLETED_THIS_WEEK_UNAVAILABLE_REASON =
  'Exact completion timing is unavailable because completion timestamps are not part of the current task model.'

type CompletionTimestampTask = Task & {
  completedAt: string | null
}

export interface ProjectStatusCounts {
  active: number
  paused: number
  completed: number
}

export interface TaskCounts {
  total: number
  pending: number
  completed: number
  blocked: number
}

export interface DashboardDistributionPoint<Value extends string> {
  key: Value
  count: number
}

export interface DashboardTaskOverviewRow {
  taskId: string
  title: string
  projectId: string | null
  projectTitle: string
  status: TaskStatus
  priority: Priority
  dueDate: string | null
  assigneeMemberId: string | null
  assigneeName: string
  tags: Tag[]
}

export interface DashboardProjectHealthRow {
  projectId: string
  title: string
  status: Project['status']
  dueDate: string | null
  progress: number
}

export type CompletedThisWeekMetric =
  | {
      isAvailable: true
      value: number
    }
  | {
      isAvailable: false
      value: null
      reason: string
    }

export type RecentlyCompletedWork =
  | {
      isAvailable: true
      items: Array<
        DashboardTaskOverviewRow & {
          completedAt: string
        }
      >
    }
  | {
      isAvailable: false
      items: []
      reason: string
    }

export interface DashboardMetrics {
  projectStatusCounts: ProjectStatusCounts
  taskCounts: TaskCounts
  overdueTaskCount: number
  upcomingDeadlineTaskCount: number
  averageProjectProgress: number
  taskStatusDistribution: DashboardDistributionPoint<TaskStatus>[]
  taskPriorityDistribution: DashboardDistributionPoint<Priority>[]
  completedThisWeek: CompletedThisWeekMetric
  projectHealthRows: DashboardProjectHealthRow[]
  upcomingDeadlineTasks: DashboardTaskOverviewRow[]
  blockedTasks: DashboardTaskOverviewRow[]
  recentlyCompletedWork: RecentlyCompletedWork
}

export interface BuildDashboardMetricsInput {
  projects: Project[]
  tasks: Task[]
  subtasks: Subtask[]
  members: Member[]
  tags: Tag[]
  referenceDate: string
  upcomingWindowDays?: number
  recentlyCompletedLimit?: number
}

const createIdMap = <Entity extends { id: string }>(entities: Entity[]): Map<string, Entity> =>
  new Map(entities.map((entity) => [entity.id, entity]))

const compareNullableDate = (left: string | null, right: string | null): number => {
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

const compareTaskRows = (left: DashboardTaskOverviewRow, right: DashboardTaskOverviewRow): number => {
  const dueDateComparison = compareNullableDate(left.dueDate, right.dueDate)
  if (dueDateComparison !== 0) {
    return dueDateComparison
  }

  return left.title.localeCompare(right.title, undefined, { sensitivity: 'base' })
}

const isTaskEntity = (item: Task | Subtask): item is Task => 'projectId' in item

const resolveTaskOverviewRow = (
  task: Task,
  projectsById: Map<string, Project>,
  membersById: Map<string, Member>,
  tagsById: Map<string, Tag>,
): DashboardTaskOverviewRow => {
  const project = projectsById.get(task.projectId) ?? null
  const assignee = task.assigneeMemberId === null ? null : membersById.get(task.assigneeMemberId) ?? null

  return {
    assigneeMemberId: task.assigneeMemberId,
    assigneeName: assignee?.name ?? MISSING_ASSIGNEE_NAME,
    dueDate: task.dueDate,
    priority: task.priority,
    projectId: project?.id ?? null,
    projectTitle: project?.title ?? UNKNOWN_PROJECT_NAME,
    status: task.status,
    tags: task.tagIds.map((tagId) => tagsById.get(tagId)).filter((tag): tag is Tag => tag !== undefined),
    taskId: task.id,
    title: task.title,
  }
}

export const getProjectStatusCounts = (projects: Project[]): ProjectStatusCounts => {
  const counts: ProjectStatusCounts = {
    active: 0,
    completed: 0,
    paused: 0,
  }

  for (const project of projects) {
    if (project.status === 'active') {
      counts.active += 1
      continue
    }

    if (project.status === 'paused') {
      counts.paused += 1
      continue
    }

    if (project.status === 'completed') {
      counts.completed += 1
    }
  }

  return counts
}

export const getTaskCounts = (tasks: Task[]): TaskCounts => ({
  blocked: tasks.filter((task) => task.status === 'blocked').length,
  completed: tasks.filter((task) => task.status === 'done').length,
  pending: tasks.filter((task) => task.status !== 'done').length,
  total: tasks.length,
})

export const getOverdueTasksForDashboard = (tasks: Task[], referenceDate: string): Task[] =>
  getOverdueTasks(tasks, referenceDate).filter(isTaskEntity)

export const getUpcomingDeadlineTasksForDashboard = (
  tasks: Task[],
  referenceDate: string,
  upcomingWindowDays = DEFAULT_DASHBOARD_UPCOMING_DEADLINE_WINDOW_DAYS,
): Task[] =>
  getUpcomingDeadlineTasks(tasks, {
    referenceDate,
    windowDays: upcomingWindowDays,
  }).filter(isTaskEntity)

export const getAverageProjectProgress = (projects: Project[], tasks: Task[], subtasks: Subtask[]): number => {
  if (projects.length === 0) {
    return 0
  }

  const totalProgress = projects.reduce(
    (currentTotal, project) =>
      currentTotal +
      calculateProjectProgress({
        project,
        subtasks,
        tasks,
      }),
    0,
  )

  return totalProgress / projects.length
}

export const getTaskStatusDistribution = (tasks: Task[]): DashboardDistributionPoint<TaskStatus>[] => {
  const counts = new Map<TaskStatus, number>(TASK_STATUSES.map((status) => [status, 0]))

  for (const task of tasks) {
    counts.set(task.status, (counts.get(task.status) ?? 0) + 1)
  }

  return TASK_STATUSES.map((status) => ({
    count: counts.get(status) ?? 0,
    key: status,
  }))
}

export const getTaskPriorityDistribution = (tasks: Task[]): DashboardDistributionPoint<Priority>[] => {
  const counts = new Map<Priority, number>(PRIORITIES.map((priority) => [priority, 0]))

  for (const task of tasks) {
    counts.set(task.priority, (counts.get(task.priority) ?? 0) + 1)
  }

  return PRIORITIES.map((priority) => ({
    count: counts.get(priority) ?? 0,
    key: priority,
  }))
}

const asCompletionTimestampTask = (task: Task): CompletionTimestampTask | null => {
  const taskWithCompletionDate = task as Task & {
    completedAt?: unknown
  }

  if (!('completedAt' in taskWithCompletionDate)) {
    return null
  }

  if (taskWithCompletionDate.completedAt === null) {
    return {
      ...task,
      completedAt: null,
    }
  }

  if (typeof taskWithCompletionDate.completedAt !== 'string') {
    return null
  }

  return {
    ...task,
    completedAt: taskWithCompletionDate.completedAt,
  }
}

const toTimestamp = (value: string): number => {
  const timestamp = Date.parse(value)
  if (Number.isNaN(timestamp)) {
    return Number.NaN
  }

  return timestamp
}

const findCompletedTasksInWeek = (tasks: CompletionTimestampTask[], referenceDate: string): CompletionTimestampTask[] => {
  const referenceTime = toTimestamp(referenceDate)

  if (Number.isNaN(referenceTime)) {
    return []
  }

  const windowStart = referenceTime - 6 * 24 * 60 * 60 * 1000

  return tasks.filter((task) => {
    if (task.status !== 'done' || task.completedAt === null) {
      return false
    }

    const completedAtTime = toTimestamp(task.completedAt)
    if (Number.isNaN(completedAtTime)) {
      return false
    }

    return completedAtTime >= windowStart && completedAtTime <= referenceTime
  })
}

const getCompletedThisWeekMetric = (tasks: Task[], referenceDate: string): CompletedThisWeekMetric => {
  const tasksWithCompletionTimestamp = tasks.map(asCompletionTimestampTask).filter((task): task is CompletionTimestampTask => task !== null)

  if (tasksWithCompletionTimestamp.length === 0) {
    return {
      isAvailable: false,
      reason: COMPLETED_THIS_WEEK_UNAVAILABLE_REASON,
      value: null,
    }
  }

  return {
    isAvailable: true,
    value: findCompletedTasksInWeek(tasksWithCompletionTimestamp, referenceDate).length,
  }
}

const getRecentlyCompletedWork = (
  tasks: Task[],
  referenceDate: string,
  projectsById: Map<string, Project>,
  membersById: Map<string, Member>,
  tagsById: Map<string, Tag>,
  recentlyCompletedLimit: number,
): RecentlyCompletedWork => {
  const tasksWithCompletionTimestamp = tasks.map(asCompletionTimestampTask).filter((task): task is CompletionTimestampTask => task !== null)

  if (tasksWithCompletionTimestamp.length === 0) {
    return {
      isAvailable: false,
      items: [],
      reason: COMPLETED_THIS_WEEK_UNAVAILABLE_REASON,
    }
  }

  const referenceTime = toTimestamp(referenceDate)
  if (Number.isNaN(referenceTime)) {
    return {
      isAvailable: true,
      items: [],
    }
  }

  const sortedCompletedTasks = [...tasksWithCompletionTimestamp]
    .filter((task) => {
      if (task.status !== 'done' || task.completedAt === null) {
        return false
      }

      const completedAtTime = toTimestamp(task.completedAt)
      return !Number.isNaN(completedAtTime) && completedAtTime <= referenceTime
    })
    .sort((left, right) => {
      const leftTime = left.completedAt === null ? Number.NEGATIVE_INFINITY : toTimestamp(left.completedAt)
      const rightTime = right.completedAt === null ? Number.NEGATIVE_INFINITY : toTimestamp(right.completedAt)

      return rightTime - leftTime
    })
    .slice(0, recentlyCompletedLimit)
    .map((task) => ({
      ...resolveTaskOverviewRow(task, projectsById, membersById, tagsById),
      completedAt: task.completedAt as string,
    }))

  return {
    isAvailable: true,
    items: sortedCompletedTasks,
  }
}

const getProjectHealthRows = (projects: Project[], tasks: Task[], subtasks: Subtask[]): DashboardProjectHealthRow[] =>
  projects
    .map((project) => ({
      dueDate: project.dueDate,
      progress: calculateProjectProgress({
        project,
        subtasks,
        tasks,
      }),
      projectId: project.id,
      status: project.status,
      title: project.title,
    }))
    .sort((left, right) => {
      const dueDateComparison = compareNullableDate(left.dueDate, right.dueDate)
      if (dueDateComparison !== 0) {
        return dueDateComparison
      }

      return left.title.localeCompare(right.title, undefined, { sensitivity: 'base' })
    })

export const buildDashboardMetrics = ({
  projects,
  tasks,
  subtasks,
  members,
  tags,
  referenceDate,
  upcomingWindowDays = DEFAULT_DASHBOARD_UPCOMING_DEADLINE_WINDOW_DAYS,
  recentlyCompletedLimit = DEFAULT_DASHBOARD_RECENTLY_COMPLETED_LIMIT,
}: BuildDashboardMetricsInput): DashboardMetrics => {
  const projectsById = createIdMap(projects)
  const membersById = createIdMap(members)
  const tagsById = createIdMap(tags)
  const projectStatusCounts = getProjectStatusCounts(projects)
  const taskCounts = getTaskCounts(tasks)
  const overdueTasks = getOverdueTasksForDashboard(tasks, referenceDate)
  const upcomingTasks = getUpcomingDeadlineTasksForDashboard(tasks, referenceDate, upcomingWindowDays)
  const blockedTasks = tasks.filter((task) => task.status === 'blocked')
  const completedThisWeek = getCompletedThisWeekMetric(tasks, referenceDate)

  return {
    averageProjectProgress: getAverageProjectProgress(projects, tasks, subtasks),
    blockedTasks: blockedTasks
      .map((task) => resolveTaskOverviewRow(task, projectsById, membersById, tagsById))
      .sort(compareTaskRows),
    completedThisWeek,
    overdueTaskCount: overdueTasks.length,
    projectHealthRows: getProjectHealthRows(projects, tasks, subtasks),
    projectStatusCounts,
    recentlyCompletedWork: getRecentlyCompletedWork(
      tasks,
      referenceDate,
      projectsById,
      membersById,
      tagsById,
      recentlyCompletedLimit,
    ),
    taskCounts,
    taskPriorityDistribution: getTaskPriorityDistribution(tasks),
    taskStatusDistribution: getTaskStatusDistribution(tasks),
    upcomingDeadlineTaskCount: upcomingTasks.length,
    upcomingDeadlineTasks: upcomingTasks
      .map((task) => resolveTaskOverviewRow(task, projectsById, membersById, tagsById))
      .sort(compareTaskRows),
  }
}

export const DASHBOARD_SUPPORTED_PROJECT_STATUSES = PROJECT_STATUSES
