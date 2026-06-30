import { calculateProjectProgress, getOverdueTasks, getUpcomingDeadlineTasks } from '../../domain/rules'
import type { Member, Project, ProjectSummaryRequest, Subtask, Tag, Task } from '../../domain'

export const PROJECT_SUMMARY_MAX_PROJECT_TEXT_LENGTH = 600
export const PROJECT_SUMMARY_MAX_TASK_TITLE_LENGTH = 120
export const PROJECT_SUMMARY_MAX_TASK_DESCRIPTION_LENGTH = 240
export const PROJECT_SUMMARY_MAX_CONTEXT_TASKS = 8
export const PROJECT_SUMMARY_MAX_WORK_ITEMS = 5
export const PROJECT_SUMMARY_MAX_COMPLETED_TASKS = 5
export const PROJECT_SUMMARY_MAX_SUBTASKS_PER_TASK = 6
export const PROJECT_SUMMARY_MAX_CHECKLIST_ITEMS_PER_TASK = 6
export const PROJECT_SUMMARY_MAX_TAGS = 12
export const PROJECT_SUMMARY_MAX_TAG_NAME_LENGTH = 40
export const PROJECT_SUMMARY_MAX_MEMBERS = 10
export const PROJECT_SUMMARY_MAX_MEMBER_NAME_LENGTH = 60
export const PROJECT_SUMMARY_UPCOMING_DEADLINE_WINDOW_DAYS = 14
export const MAX_PROJECT_SUMMARY_INSTRUCTION_LENGTH = 1000

export class ProjectSummaryInputError extends Error {
  constructor(message: string) {
    super(message)
    this.name = 'ProjectSummaryInputError'
  }
}

const normalizeWhitespace = (value: string): string => value.replace(/\s+/g, ' ').trim()

const truncateText = (value: string, maxLength: number): string => {
  const normalizedValue = normalizeWhitespace(value)

  if (normalizedValue.length <= maxLength) {
    return normalizedValue
  }

  if (maxLength <= 3) {
    return normalizedValue.slice(0, maxLength)
  }

  return `${normalizedValue.slice(0, maxLength - 3).trimEnd()}...`
}

const uniqueSortedNames = (names: string[], maxLength: number, limit: number): string[] => {
  const uniqueNames = new Map<string, string>()

  for (const name of names) {
    const normalizedName = truncateText(name, maxLength)

    if (normalizedName.length === 0) {
      continue
    }

    const comparisonKey = normalizedName.toLocaleLowerCase()

    if (!uniqueNames.has(comparisonKey)) {
      uniqueNames.set(comparisonKey, normalizedName)
    }
  }

  return [...uniqueNames.values()].sort((left, right) => left.localeCompare(right)).slice(0, limit)
}

const clampProgress = (value: number): number => Math.max(0, Math.min(100, Math.round(value)))

const getAssigneeName = (memberMap: Map<string, Member>, assigneeMemberId: string | null): string | null => {
  if (assigneeMemberId === null) {
    return null
  }

  return memberMap.get(assigneeMemberId)?.name ?? null
}

const getTaskSubtasks = (task: Task, subtasks: Subtask[]): Subtask[] =>
  subtasks.filter((subtask) => subtask.taskId === task.id && task.subtaskIds.includes(subtask.id))

const formatChecklistSummary = (task: Task): string => {
  if (task.checklist.length === 0) {
    return 'No checklist items.'
  }

  const completedItems = task.checklist.filter((item) => item.completed).length
  const visibleChecklist = task.checklist
    .slice(0, PROJECT_SUMMARY_MAX_CHECKLIST_ITEMS_PER_TASK)
    .map((item) => `${item.completed ? '[x]' : '[ ]'} ${truncateText(item.text, 80)}`)

  return `${completedItems}/${task.checklist.length} checklist items completed. Items: ${visibleChecklist.join('; ')}`
}

const formatSubtaskSummary = (task: Task, subtasks: Subtask[], memberMap: Map<string, Member>): string => {
  const taskSubtasks = getTaskSubtasks(task, subtasks)

  if (taskSubtasks.length === 0) {
    return 'No subtasks.'
  }

  const completedSubtasks = taskSubtasks.filter((subtask) => subtask.status === 'done').length
  const visibleSubtasks = taskSubtasks
    .slice(0, PROJECT_SUMMARY_MAX_SUBTASKS_PER_TASK)
    .map((subtask) => {
      const assigneeName = getAssigneeName(memberMap, subtask.assigneeMemberId)
      const parts = [
        `${truncateText(subtask.title, PROJECT_SUMMARY_MAX_TASK_TITLE_LENGTH)} (${subtask.status}, ${subtask.priority})`,
      ]

      if (subtask.dueDate !== null) {
        parts.push(`due ${subtask.dueDate}`)
      }

      if (assigneeName !== null) {
        parts.push(`assignee ${truncateText(assigneeName, PROJECT_SUMMARY_MAX_MEMBER_NAME_LENGTH)}`)
      }

      return parts.join(', ')
    })

  return `${completedSubtasks}/${taskSubtasks.length} subtasks completed. Subtasks: ${visibleSubtasks.join('; ')}`
}

const buildTaskCounts = (tasks: Task[]): ProjectSummaryRequest['taskCounts'] =>
  tasks.reduce<ProjectSummaryRequest['taskCounts']>(
    (counts, task) => {
      counts[task.status] += 1
      return counts
    },
    {
      backlog: 0,
      todo: 0,
      in_progress: 0,
      blocked: 0,
      review: 0,
      done: 0,
    },
  )

const buildPriorityCounts = (tasks: Task[]): ProjectSummaryRequest['priorityCounts'] =>
  tasks.reduce<ProjectSummaryRequest['priorityCounts']>(
    (counts, task) => {
      counts[task.priority] += 1
      return counts
    },
    {
      low: 0,
      medium: 0,
      high: 0,
      urgent: 0,
    },
  )

const buildWorkItemContext = (
  tasks: Task[],
  memberMap: Map<string, Member>,
): ProjectSummaryRequest['blockedTasks'] =>
  tasks.slice(0, PROJECT_SUMMARY_MAX_WORK_ITEMS).map((task) => ({
    title: truncateText(task.title, PROJECT_SUMMARY_MAX_TASK_TITLE_LENGTH),
    priority: task.priority,
    status: task.status,
    dueDate: task.dueDate,
    assigneeName: getAssigneeName(memberMap, task.assigneeMemberId),
  }))

type BuildProjectSummaryRequestInput = {
  project: Project
  tasks: Task[]
  subtasks: Subtask[]
  tags: Tag[]
  members: Member[]
  instructions?: string
  referenceDate: string
}

const normalizeAdditionalInstructions = (instructions?: string): string | undefined => {
  const trimmedInstructions = instructions?.trim() ?? ''

  if (trimmedInstructions.length === 0) {
    return undefined
  }

  if (trimmedInstructions.length > MAX_PROJECT_SUMMARY_INSTRUCTION_LENGTH) {
    throw new ProjectSummaryInputError(
      `Additional instructions must be ${MAX_PROJECT_SUMMARY_INSTRUCTION_LENGTH} characters or fewer.`,
    )
  }

  return trimmedInstructions
}

export const buildProjectSummaryRequest = ({
  project,
  tasks,
  subtasks,
  tags,
  members,
  instructions,
  referenceDate,
}: BuildProjectSummaryRequestInput): ProjectSummaryRequest => {
  const projectTasks = tasks.filter((task) => task.projectId === project.id && project.taskIds.includes(task.id))
  const relatedSubtasks = subtasks.filter((subtask) => projectTasks.some((task) => task.id === subtask.taskId))
  const relatedTagIds = new Set<string>()

  for (const task of projectTasks) {
    task.tagIds.forEach((tagId) => relatedTagIds.add(tagId))

    for (const subtask of getTaskSubtasks(task, relatedSubtasks)) {
      subtask.tagIds.forEach((tagId) => relatedTagIds.add(tagId))
    }
  }

  const memberMap = new Map(members.map((member) => [member.id, member] as const))
  const relatedMembers = members.filter((member) => {
    if (project.memberIds.includes(member.id)) {
      return true
    }

    return projectTasks.some((task) => {
      if (task.assigneeMemberId === member.id) {
        return true
      }

      return getTaskSubtasks(task, relatedSubtasks).some((subtask) => subtask.assigneeMemberId === member.id)
    })
  })

  const additionalInstructions = normalizeAdditionalInstructions(instructions)

  return {
    project: {
      title: truncateText(project.title, PROJECT_SUMMARY_MAX_PROJECT_TEXT_LENGTH),
      description: truncateText(project.description, PROJECT_SUMMARY_MAX_PROJECT_TEXT_LENGTH),
      objective: truncateText(project.objective, PROJECT_SUMMARY_MAX_PROJECT_TEXT_LENGTH),
      inScopeContent: truncateText(project.inScopeContent, PROJECT_SUMMARY_MAX_PROJECT_TEXT_LENGTH),
      outOfScopeContent: truncateText(project.outOfScopeContent, PROJECT_SUMMARY_MAX_PROJECT_TEXT_LENGTH),
      status: project.status,
      startDate: project.startDate,
      dueDate: project.dueDate,
      progressPercent: clampProgress(
        calculateProjectProgress({
          project,
          tasks: projectTasks,
          subtasks: relatedSubtasks,
        }),
      ),
    },
    taskCounts: buildTaskCounts(projectTasks),
    priorityCounts: buildPriorityCounts(projectTasks),
    blockedTasks: buildWorkItemContext(
      projectTasks.filter((task) => task.status === 'blocked'),
      memberMap,
    ),
    overdueTasks: buildWorkItemContext(
      getOverdueTasks(projectTasks, referenceDate) as Task[],
      memberMap,
    ),
    upcomingTasks: buildWorkItemContext(
      getUpcomingDeadlineTasks(projectTasks, {
        referenceDate,
        windowDays: PROJECT_SUMMARY_UPCOMING_DEADLINE_WINDOW_DAYS,
      }) as Task[],
      memberMap,
    ),
    completedTasks: projectTasks
      .filter((task) => task.status === 'done')
      .slice(0, PROJECT_SUMMARY_MAX_COMPLETED_TASKS)
      .map((task) => ({
        title: truncateText(task.title, PROJECT_SUMMARY_MAX_TASK_TITLE_LENGTH),
        priority: task.priority,
      })),
    taskDetails: projectTasks.slice(0, PROJECT_SUMMARY_MAX_CONTEXT_TASKS).map((task) => {
      const taskTags = uniqueSortedNames(
        tags.filter((tag) => task.tagIds.includes(tag.id)).map((tag) => tag.name),
        PROJECT_SUMMARY_MAX_TAG_NAME_LENGTH,
        PROJECT_SUMMARY_MAX_TAGS,
      )

      return {
        title: truncateText(task.title, PROJECT_SUMMARY_MAX_TASK_TITLE_LENGTH),
        description: truncateText(task.description, PROJECT_SUMMARY_MAX_TASK_DESCRIPTION_LENGTH),
        priority: task.priority,
        status: task.status,
        dueDate: task.dueDate,
        assigneeName: getAssigneeName(memberMap, task.assigneeMemberId),
        tagNames: taskTags,
        checklistSummary: formatChecklistSummary(task),
        subtaskSummary: formatSubtaskSummary(task, relatedSubtasks, memberMap),
      }
    }),
    existingTagNames: uniqueSortedNames(
      tags.filter((tag) => relatedTagIds.has(tag.id)).map((tag) => tag.name),
      PROJECT_SUMMARY_MAX_TAG_NAME_LENGTH,
      PROJECT_SUMMARY_MAX_TAGS,
    ),
    memberNames: uniqueSortedNames(
      relatedMembers.map((member) => member.name),
      PROJECT_SUMMARY_MAX_MEMBER_NAME_LENGTH,
      PROJECT_SUMMARY_MAX_MEMBERS,
    ),
    referenceDate,
    additionalInstructions,
  }
}
