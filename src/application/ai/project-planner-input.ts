import type { Member, Project, ProjectPlanRequest, ProjectPlanTaskContext, Tag, Task } from '../../domain'

export const PROJECT_PLANNER_MAX_PROJECT_TEXT_LENGTH = 600
export const PROJECT_PLANNER_MAX_TASK_TITLE_LENGTH = 120
export const PROJECT_PLANNER_MAX_TASK_DESCRIPTION_LENGTH = 240
export const PROJECT_PLANNER_MAX_CONTEXT_TASKS = 8
export const PROJECT_PLANNER_MAX_TAGS = 12
export const PROJECT_PLANNER_MAX_TAG_NAME_LENGTH = 40
export const PROJECT_PLANNER_MAX_MEMBERS = 10
export const PROJECT_PLANNER_MAX_MEMBER_NAME_LENGTH = 60

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

const buildExistingTaskContext = (task: Task): ProjectPlanTaskContext => ({
  title: truncateText(task.title, PROJECT_PLANNER_MAX_TASK_TITLE_LENGTH),
  description: truncateText(task.description, PROJECT_PLANNER_MAX_TASK_DESCRIPTION_LENGTH),
  priority: task.priority,
  status: task.status,
  dueDate: task.dueDate,
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

type BuildProjectPlannerInput = {
  members: Member[]
  project: Project
  tags: Tag[]
  tasks: Task[]
}

export const buildProjectPlannerRequest = ({
  members,
  project,
  tags,
  tasks,
}: BuildProjectPlannerInput): ProjectPlanRequest => ({
  title: truncateText(project.title, PROJECT_PLANNER_MAX_PROJECT_TEXT_LENGTH),
  description: truncateText(project.description, PROJECT_PLANNER_MAX_PROJECT_TEXT_LENGTH),
  objective: truncateText(project.objective, PROJECT_PLANNER_MAX_PROJECT_TEXT_LENGTH),
  inScopeContent: truncateText(project.inScopeContent, PROJECT_PLANNER_MAX_PROJECT_TEXT_LENGTH),
  outOfScopeContent: truncateText(project.outOfScopeContent, PROJECT_PLANNER_MAX_PROJECT_TEXT_LENGTH),
  startDate: project.startDate,
  dueDate: project.dueDate,
  existingTasks: tasks.slice(0, PROJECT_PLANNER_MAX_CONTEXT_TASKS).map(buildExistingTaskContext),
  existingTagNames: uniqueSortedNames(
    tags.map((tag) => tag.name),
    PROJECT_PLANNER_MAX_TAG_NAME_LENGTH,
    PROJECT_PLANNER_MAX_TAGS,
  ),
  memberNames: uniqueSortedNames(
    members.map((member) => member.name),
    PROJECT_PLANNER_MAX_MEMBER_NAME_LENGTH,
    PROJECT_PLANNER_MAX_MEMBERS,
  ),
})
