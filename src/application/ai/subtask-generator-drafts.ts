import { z } from 'zod'
import { PRIORITIES, TASK_STATUSES, type CreateSubtaskInput, type Priority, type SubtaskGenerationResult, type Tag, type TaskStatus } from '../../domain'

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

export const subtaskGeneratorDraftSchema = z.object({
  title: z.string().trim().min(1, 'Title is required.'),
  description: z.string().trim().default(''),
  priority: z.enum(PRIORITIES),
  status: z.enum(TASK_STATUSES),
  dueDate: nullableDateSchema,
})

export type SubtaskGeneratorDraftInput = z.output<typeof subtaskGeneratorDraftSchema>

export interface SubtaskGeneratorDraft extends SubtaskGeneratorDraftInput {
  id: string
  isInserted: boolean
  isSelected: boolean
  checklistItems: string[]
  matchedTagNames: string[]
  tagIds: string[]
  unappliedTagNames: string[]
}

export type SubtaskGeneratorDraftValidation = Partial<Record<'description' | 'dueDate' | 'priority' | 'status' | 'title', string>>

const createSubtaskDraftId = (): string => {
  if (typeof crypto !== 'undefined' && typeof crypto.randomUUID === 'function') {
    return crypto.randomUUID()
  }

  return `subtask-draft-${Date.now()}-${Math.random().toString(16).slice(2)}`
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

export const createSubtaskGeneratorDrafts = (result: SubtaskGenerationResult, tags: Tag[]): SubtaskGeneratorDraft[] => {
  const tagsByLowerName = new Map(tags.map((tag) => [tag.name.trim().toLocaleLowerCase(), tag] as const))

  return result.subtaskSuggestions.map((suggestion) => {
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
      id: createSubtaskDraftId(),
      title: suggestion.title,
      description: suggestion.description,
      priority: suggestion.priority,
      status: suggestion.status ?? 'todo',
      dueDate: suggestion.dueDate ?? null,
      checklistItems: suggestion.checklistItems ?? [],
      isInserted: false,
      isSelected: true,
      matchedTagNames,
      tagIds: matchedTagIds,
      unappliedTagNames,
    }
  })
}

export const validateSubtaskGeneratorDraft = (draft: SubtaskGeneratorDraftInput): SubtaskGeneratorDraftValidation => {
  const validationResult = subtaskGeneratorDraftSchema.safeParse(draft)

  if (validationResult.success) {
    return {}
  }

  const errors: SubtaskGeneratorDraftValidation = {}

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

export const updateSubtaskGeneratorDraftField = <TField extends keyof SubtaskGeneratorDraftInput>(
  draft: SubtaskGeneratorDraft,
  field: TField,
  value: SubtaskGeneratorDraftInput[TField],
): SubtaskGeneratorDraft => ({
  ...draft,
  [field]: field === 'title' || field === 'description' ? normalizeText(value as string) : value,
})

export const toCreateSubtaskInputFromSubtaskGeneratorDraft = (
  taskId: string,
  draft: SubtaskGeneratorDraft,
): CreateSubtaskInput => ({
  taskId,
  title: draft.title.trim(),
  description: draft.description.trim(),
  priority: draft.priority as Priority,
  status: draft.status as TaskStatus,
  startDate: null,
  dueDate: draft.dueDate,
  inScopeContent: '',
  outOfScopeContent: '',
  assigneeMemberId: null,
  tagIds: draft.tagIds,
  checklist: draft.checklistItems.map((text) => ({ text, completed: false })),
})
