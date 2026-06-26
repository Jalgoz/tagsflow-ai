import { z } from 'zod'
import { PRIORITIES, TASK_STATUSES, type SubtaskContext, type SubtaskGenerationRequest, type SubtaskGenerationResult, type SubtaskSuggestion } from '../../domain'
import { parseStructuredAIResponse, type StructuredAIResponseResult } from './structured-output'

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

const subtaskSuggestionSchema = z
  .object({
    title: z.string().trim().min(1, 'Subtask title is required.'),
    description: z.string().trim().min(1, 'Subtask description is required.'),
    priority: z.enum(PRIORITIES),
    status: z.enum(TASK_STATUSES).optional().default('todo'),
    dueDate: nullableDateSchema.optional().default(null),
    checklistItems: z.array(z.string().trim().min(1)).optional().default([]),
    existingTagNames: z.array(z.string().trim().min(1)).optional().default([]),
  })
  .strict()

export const subtaskGenerationResponseSchema = z
  .object({
    subtaskSuggestions: z.array(subtaskSuggestionSchema).min(1, 'At least one subtask suggestion is required.'),
  })
  .strict()

export const parseSubtaskGenerationResponse = (jsonText: string): StructuredAIResponseResult<SubtaskGenerationResult> =>
  parseStructuredAIResponse(subtaskGenerationResponseSchema, jsonText)

const formatOptionalText = (value: string | null | undefined): string => ((value ?? '').trim().length > 0 ? (value ?? '').trim() : 'Not provided.')

const formatSubtaskContext = (subtask: SubtaskContext): string => {
  const parts = [
    `Title: ${subtask.title}`,
    `Priority: ${subtask.priority}`,
    `Status: ${subtask.status}`,
  ]

  if (subtask.description.trim().length > 0) {
    parts.push(`Description: ${subtask.description}`)
  }

  return parts.join(' | ')
}

const createSubtaskSuggestionExample = (): SubtaskSuggestion => ({
  title: 'Implement login API endpoint',
  description: 'Create the backend route for user authentication using JWT.',
  priority: 'high',
  status: 'todo',
  dueDate: null,
  checklistItems: ['Validate email format', 'Hash password'],
  existingTagNames: ['Backend'],
})

export const buildSubtaskGeneratorSystemPrompt = (): string =>
  [
    'You generate one-level-deep subtasks for a parent task in a project management app.',
    'Return valid JSON only.',
    'Do not include markdown, comments, or explanatory text.',
    'Do not generate IDs, nested subtasks, member assignments, or new tags.',
    'Do not provide any automatic insertion guidance.',
    'Use only these priority values: low, medium, high, urgent.',
    'Use only these status values: backlog, todo, in_progress, blocked, review, done.',
    'Use dueDate only when you can express it as YYYY-MM-DD. Otherwise use null.',
    'Use existingTagNames only when they exactly match one of the provided existing tag names. Otherwise omit them or return an empty array.',
    `Return this JSON shape: ${JSON.stringify({ subtaskSuggestions: [createSubtaskSuggestionExample()] })}`,
  ].join(' ')

export const buildSubtaskGeneratorUserPrompt = (request: SubtaskGenerationRequest): string => {
  const existingSubtasksSection =
    request.existingSubtasks.length === 0
      ? '- None yet.'
      : request.existingSubtasks.map((subtask, index) => `${index + 1}. ${formatSubtaskContext(subtask)}`).join('\n')

  const existingTagsSection = request.existingTagNames.length === 0 ? 'None available.' : request.existingTagNames.join(', ')
  const memberNamesSection = request.memberNames.length === 0 ? 'None available.' : request.memberNames.join(', ')

  const promptParts = [
    'Project context:',
    `- Title: ${formatOptionalText(request.project.title)}`,
    `- Description: ${formatOptionalText(request.project.description)}`,
    `- Objective: ${formatOptionalText(request.project.objective)}`,
    `- In scope: ${formatOptionalText(request.project.inScopeContent)}`,
    `- Out of scope: ${formatOptionalText(request.project.outOfScopeContent)}`,
    `- Status: ${request.project.status}`,
    'Parent task context:',
    `- Title: ${formatOptionalText(request.task.title)}`,
    `- Description: ${formatOptionalText(request.task.description)}`,
    `- In scope: ${formatOptionalText(request.task.inScopeContent)}`,
    `- Out of scope: ${formatOptionalText(request.task.outOfScopeContent)}`,
    `- Priority: ${request.task.priority}`,
    `- Status: ${request.task.status}`,
    `- Start date: ${request.task.startDate ?? 'Not set.'}`,
    `- Due date: ${request.task.dueDate ?? 'Not set.'}`,
    `- Existing member names (context only, do not assign): ${memberNamesSection}`,
    `- Existing tag names (reuse only, do not create new tags): ${existingTagsSection}`,
    'Existing subtasks to avoid duplicating:',
    existingSubtasksSection,
  ]

  if (typeof request.additionalInstructions === 'string' && request.additionalInstructions.trim().length > 0) {
    promptParts.push('Additional subtask generation instructions to prioritize (within parent task scope, but subordinate to one-level-subtask and review rules):')
    promptParts.push(request.additionalInstructions.trim())
  }

  promptParts.push('Generate 3 to 6 actionable subtasks for this parent task.')

  return promptParts.join('\n')
}
