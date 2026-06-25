import { z } from 'zod'
import { PRIORITIES, TASK_STATUSES, type CreateTaskInput, type Priority, type ProjectPlanResult, type Tag, type TaskStatus } from '../../domain'

const isIsoDate = (value: string): boolean => /^\d{4}-\d{2}-\d{2}$/.test(value) && !Number.isNaN(Date.parse(`${value}T00:00:00`))

const nullableDateSchema = z.preprocess((value) => {
  if (value === null || value === undefined) {
    return null
  }

  if (typeof value !== 'string') {
    return value
  }

  const trimmedValue = value.trim()

  return trimmedValue === '' ? null : trimmedValue
}, z.union([z.string().refine(isIsoDate, 'Use a valid date in YYYY-MM-DD format.'), z.null()]))

export const projectPlannerDraftSchema = z.object({
  title: z.string().trim().min(1, 'Title is required.'),
  description: z.string().trim().default(''),
  priority: z.enum(PRIORITIES),
  status: z.enum(TASK_STATUSES),
  dueDate: nullableDateSchema,
})

export type ProjectPlannerDraftInput = z.output<typeof projectPlannerDraftSchema>

export interface ProjectPlannerDraft extends ProjectPlannerDraftInput {
  id: string
  isInserted: boolean
  isSelected: boolean
  matchedTagNames: string[]
  tagIds: string[]
  unappliedTagNames: string[]
}

export type ProjectPlannerDraftValidation = Partial<Record<'description' | 'dueDate' | 'priority' | 'status' | 'title', string>>

const createPlannerDraftId = (): string => {
  if (typeof crypto !== 'undefined' && typeof crypto.randomUUID === 'function') {
    return crypto.randomUUID()
  }

  return `planner-draft-${Date.now()}-${Math.random().toString(16).slice(2)}`
}

const uniqueNames = (names: string[]): string[] => {
  const seen = new Set<string>()
  const result: string[] = []

  for (const name of names) {
    const normalizedName = name.trim()

    if (normalizedName.length === 0) {
      continue
    }

    const comparisonKey = normalizedName.toLocaleLowerCase()

    if (seen.has(comparisonKey)) {
      continue
    }

    seen.add(comparisonKey)
    result.push(normalizedName)
  }

  return result
}

export const createProjectPlannerDrafts = (result: ProjectPlanResult, tags: Tag[]): ProjectPlannerDraft[] => {
  const tagsByLowerName = new Map(tags.map((tag) => [tag.name.trim().toLocaleLowerCase(), tag] as const))

  return result.taskSuggestions.map((suggestion) => {
    const matchedTagIds: string[] = []
    const matchedTagNames: string[] = []
    const unappliedTagNames: string[] = []

    for (const tagName of uniqueNames(suggestion.existingTagNames)) {
      const matchingTag = tagsByLowerName.get(tagName.toLocaleLowerCase())

      if (matchingTag === undefined) {
        unappliedTagNames.push(tagName)
        continue
      }

      matchedTagIds.push(matchingTag.id)
      matchedTagNames.push(matchingTag.name)
    }

    return {
      id: createPlannerDraftId(),
      title: suggestion.title,
      description: suggestion.description,
      priority: suggestion.priority,
      status: suggestion.status,
      dueDate: suggestion.dueDate,
      isInserted: false,
      isSelected: true,
      matchedTagNames,
      tagIds: matchedTagIds,
      unappliedTagNames,
    }
  })
}

export const validateProjectPlannerDraft = (draft: ProjectPlannerDraftInput): ProjectPlannerDraftValidation => {
  const validationResult = projectPlannerDraftSchema.safeParse(draft)

  if (validationResult.success) {
    return {}
  }

  const errors: ProjectPlannerDraftValidation = {}

  for (const issue of validationResult.error.issues) {
    const fieldName = issue.path[0]

    if (
      fieldName === 'title' ||
      fieldName === 'description' ||
      fieldName === 'priority' ||
      fieldName === 'status' ||
      fieldName === 'dueDate'
    ) {
      errors[fieldName] = issue.message
    }
  }

  return errors
}

const normalizeText = (value: string): string => value.trim()

export const updateProjectPlannerDraftField = <TField extends keyof ProjectPlannerDraftInput>(
  draft: ProjectPlannerDraft,
  field: TField,
  value: ProjectPlannerDraftInput[TField],
): ProjectPlannerDraft => ({
  ...draft,
  [field]: field === 'title' || field === 'description' ? normalizeText(value as string) : value,
})

export const toCreateTaskInputFromProjectPlannerDraft = (
  projectId: string,
  draft: ProjectPlannerDraft,
): CreateTaskInput => ({
  projectId,
  title: draft.title.trim(),
  description: draft.description.trim(),
  inScopeContent: '',
  outOfScopeContent: '',
  priority: draft.priority as Priority,
  status: draft.status as TaskStatus,
  startDate: null,
  dueDate: draft.dueDate,
  assigneeMemberId: null,
  tagIds: draft.tagIds,
  checklist: [],
  subtaskIds: [],
})
