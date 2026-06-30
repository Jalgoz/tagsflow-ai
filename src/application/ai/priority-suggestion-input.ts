import type { Member, PrioritySuggestionRequest, Project, Subtask, Tag, Task } from '../../domain'

export const MAX_PRIORITY_PROJECT_TEXT_LENGTH = 600
export const MAX_PRIORITY_TASK_TEXT_LENGTH = 600
export const MAX_PRIORITY_SIBLING_TASK_CONTEXT_COUNT = 5
export const MAX_PRIORITY_CHECKLIST_CONTEXT_COUNT = 5
export const MAX_PRIORITY_SUBTASK_CONTEXT_COUNT = 5
export const MAX_PRIORITY_TAG_CONTEXT_COUNT = 12
export const MAX_PRIORITY_INSTRUCTION_LENGTH = 800

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

const toOptionalText = (value: string | null | undefined): string | null => {
  if (value === null || value === undefined) {
    return null
  }

  const normalizedValue = normalizeWhitespace(value)

  return normalizedValue.length > 0 ? normalizedValue : null
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

const formatChecklistSummary = (task: Task): string => {
  if (task.checklist.length === 0) {
    return 'No checklist items.'
  }

  const completedCount = task.checklist.filter((item) => item.completed).length
  const visibleItems = task.checklist.slice(0, MAX_PRIORITY_CHECKLIST_CONTEXT_COUNT).map((item) => {
    const text = truncateText(item.text, 80)

    return item.completed ? `${text} (done)` : text
  })
  const suffix = task.checklist.length > visibleItems.length ? '...' : ''

  return `${completedCount}/${task.checklist.length} complete. Items: ${visibleItems.join('; ')}${suffix}`
}

const formatSubtaskProgressSummary = (task: Task, subtasks: Subtask[]): string => {
  const relatedSubtasks = subtasks.filter((subtask) => task.subtaskIds.includes(subtask.id))

  if (relatedSubtasks.length === 0) {
    return 'No subtasks.'
  }

  const completedCount = relatedSubtasks.filter((subtask) => subtask.status === 'done').length
  const visibleSubtasks = relatedSubtasks.slice(0, MAX_PRIORITY_SUBTASK_CONTEXT_COUNT).map((subtask) => {
    const title = truncateText(subtask.title, 80)

    return `${title} (${subtask.status})`
  })
  const suffix = relatedSubtasks.length > visibleSubtasks.length ? '...' : ''

  return `${completedCount}/${relatedSubtasks.length} complete. Subtasks: ${visibleSubtasks.join('; ')}${suffix}`
}

const formatAssigneeName = (members: Member[], memberId: string | null): string | null => {
  if (memberId === null) {
    return null
  }

  const assignee = members.find((member) => member.id === memberId)

  return assignee === undefined ? 'Unknown member' : truncateText(assignee.name, 60)
}

const buildSiblingTaskContexts = (task: Task, tasks: Task[]): PrioritySuggestionRequest['siblingTasks'] =>
  tasks
    .filter((candidateTask) => candidateTask.projectId === task.projectId && candidateTask.id !== task.id)
    .slice(0, MAX_PRIORITY_SIBLING_TASK_CONTEXT_COUNT)
    .map((candidateTask) => ({
      title: truncateText(candidateTask.title, MAX_PRIORITY_TASK_TEXT_LENGTH),
      priority: candidateTask.priority,
      status: candidateTask.status,
      dueDate: candidateTask.dueDate,
    }))

export class PrioritySuggestionInputError extends Error {
  readonly code = 'invalid_priority_instruction_length'

  constructor() {
    super(`Additional instructions must be ${MAX_PRIORITY_INSTRUCTION_LENGTH} characters or fewer.`)
    this.name = 'PrioritySuggestionInputError'
  }
}

type BuildPrioritySuggestionRequestInput = {
  members: Member[]
  project: Project
  subtasks: Subtask[]
  tags: Tag[]
  task: Task
  tasks: Task[]
  additionalInstructions?: string
}

export const buildPrioritySuggestionRequest = ({
  members,
  project,
  subtasks,
  tags,
  task,
  tasks,
  additionalInstructions,
}: BuildPrioritySuggestionRequestInput): PrioritySuggestionRequest => {
  const normalizedInstructions = toOptionalText(additionalInstructions)

  if (normalizedInstructions !== null && normalizedInstructions.length > MAX_PRIORITY_INSTRUCTION_LENGTH) {
    throw new PrioritySuggestionInputError()
  }

  return {
    project: {
      title: truncateText(project.title, MAX_PRIORITY_PROJECT_TEXT_LENGTH),
      description: truncateText(project.description, MAX_PRIORITY_PROJECT_TEXT_LENGTH),
      objective: truncateText(project.objective, MAX_PRIORITY_PROJECT_TEXT_LENGTH),
      inScopeContent: truncateText(project.inScopeContent, MAX_PRIORITY_PROJECT_TEXT_LENGTH),
      outOfScopeContent: truncateText(project.outOfScopeContent, MAX_PRIORITY_PROJECT_TEXT_LENGTH),
      status: project.status,
      startDate: project.startDate,
      dueDate: project.dueDate,
    },
    selectedTask: {
      title: truncateText(task.title, MAX_PRIORITY_TASK_TEXT_LENGTH),
      description: truncateText(task.description, MAX_PRIORITY_TASK_TEXT_LENGTH),
      inScopeContent: truncateText(task.inScopeContent, MAX_PRIORITY_TASK_TEXT_LENGTH),
      outOfScopeContent: truncateText(task.outOfScopeContent, MAX_PRIORITY_TASK_TEXT_LENGTH),
      currentPriority: task.priority,
      status: task.status,
      startDate: task.startDate,
      dueDate: task.dueDate,
      checklistSummary: formatChecklistSummary(task),
      tagNames: uniqueSortedNames(
        tags.filter((tag) => task.tagIds.includes(tag.id)).map((tag) => tag.name),
        40,
        MAX_PRIORITY_TAG_CONTEXT_COUNT,
      ),
      assigneeName: formatAssigneeName(members, task.assigneeMemberId),
      subtaskProgressSummary: formatSubtaskProgressSummary(task, subtasks),
    },
    siblingTasks: buildSiblingTaskContexts(task, tasks),
    additionalInstructions: normalizedInstructions ?? undefined,
  }
}
