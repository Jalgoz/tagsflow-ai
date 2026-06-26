import type { Member, Project, Subtask, SubtaskContext, SubtaskGenerationRequest, Tag, Task } from '../../domain'

export const SUBTASK_GENERATOR_MAX_PROJECT_TEXT_LENGTH = 600
export const SUBTASK_GENERATOR_MAX_TASK_TEXT_LENGTH = 600
export const SUBTASK_GENERATOR_MAX_SUBTASK_TITLE_LENGTH = 120
export const SUBTASK_GENERATOR_MAX_SUBTASK_DESCRIPTION_LENGTH = 240
export const SUBTASK_GENERATOR_MAX_CONTEXT_SUBTASKS = 15
export const SUBTASK_GENERATOR_MAX_TAGS = 12
export const SUBTASK_GENERATOR_MAX_TAG_NAME_LENGTH = 40
export const SUBTASK_GENERATOR_MAX_MEMBERS = 10
export const SUBTASK_GENERATOR_MAX_MEMBER_NAME_LENGTH = 60
export const MAX_SUBTASK_INSTRUCTION_LENGTH = 1200

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

const buildExistingSubtaskContext = (subtask: Subtask): SubtaskContext => ({
  title: truncateText(subtask.title, SUBTASK_GENERATOR_MAX_SUBTASK_TITLE_LENGTH),
  description: truncateText(subtask.description, SUBTASK_GENERATOR_MAX_SUBTASK_DESCRIPTION_LENGTH),
  priority: subtask.priority,
  status: subtask.status,
})

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

type BuildSubtaskGeneratorInput = {
  members: Member[]
  project: Project
  tags: Tag[]
  task: Task
  subtasks: Subtask[]
  instructions?: string
}

export const buildSubtaskGenerationRequest = ({
  members,
  project,
  tags,
  task,
  subtasks,
  instructions,
}: BuildSubtaskGeneratorInput): SubtaskGenerationRequest => {
  const normalizedInstructions = instructions?.trim() ?? ''
  const additionalInstructions =
    normalizedInstructions.length > 0
      ? normalizedInstructions.slice(0, MAX_SUBTASK_INSTRUCTION_LENGTH)
      : undefined

  return {
    project: {
      title: truncateText(project.title, SUBTASK_GENERATOR_MAX_PROJECT_TEXT_LENGTH),
      description: truncateText(project.description, SUBTASK_GENERATOR_MAX_PROJECT_TEXT_LENGTH),
      objective: truncateText(project.objective, SUBTASK_GENERATOR_MAX_PROJECT_TEXT_LENGTH),
      inScopeContent: truncateText(project.inScopeContent, SUBTASK_GENERATOR_MAX_PROJECT_TEXT_LENGTH),
      outOfScopeContent: truncateText(project.outOfScopeContent, SUBTASK_GENERATOR_MAX_PROJECT_TEXT_LENGTH),
      startDate: project.startDate,
      dueDate: project.dueDate,
      status: project.status,
    },
    task: {
      title: truncateText(task.title, SUBTASK_GENERATOR_MAX_TASK_TEXT_LENGTH),
      description: truncateText(task.description, SUBTASK_GENERATOR_MAX_TASK_TEXT_LENGTH),
      inScopeContent: truncateText(task.inScopeContent, SUBTASK_GENERATOR_MAX_TASK_TEXT_LENGTH),
      outOfScopeContent: truncateText(task.outOfScopeContent, SUBTASK_GENERATOR_MAX_TASK_TEXT_LENGTH),
      priority: task.priority,
      status: task.status,
      startDate: task.startDate,
      dueDate: task.dueDate,
    },
    existingSubtasks: subtasks.slice(0, SUBTASK_GENERATOR_MAX_CONTEXT_SUBTASKS).map(buildExistingSubtaskContext),
    existingTagNames: uniqueSortedNames(
      tags.map((tag) => tag.name),
      SUBTASK_GENERATOR_MAX_TAG_NAME_LENGTH,
      SUBTASK_GENERATOR_MAX_TAGS,
    ),
    memberNames: uniqueSortedNames(
      members.map((member) => member.name),
      SUBTASK_GENERATOR_MAX_MEMBER_NAME_LENGTH,
      SUBTASK_GENERATOR_MAX_MEMBERS,
    ),
    additionalInstructions,
  }
}
