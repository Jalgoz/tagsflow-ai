import { z } from 'zod'
import { PRIORITIES, TASK_STATUSES, type ProjectPlanResult, type ProjectPlanSuggestion, type ProjectPlanTaskContext } from '../../domain'
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

const projectPlanSuggestionSchema = z
  .object({
    title: z.string().trim().min(1, 'Task title is required.'),
    description: z.string().trim().min(1, 'Task description is required.'),
    priority: z.enum(PRIORITIES),
    status: z.enum(TASK_STATUSES).optional().default('todo'),
    dueDate: nullableDateSchema.optional().default(null),
    existingTagNames: z.array(z.string().trim().min(1)).optional().default([]),
  })
  .strict()

export const projectPlanResponseSchema = z
  .object({
    taskSuggestions: z.array(projectPlanSuggestionSchema).min(1, 'At least one task suggestion is required.'),
  })
  .strict()

export const parseProjectPlanResponse = (jsonText: string): StructuredAIResponseResult<ProjectPlanResult> =>
  parseStructuredAIResponse(projectPlanResponseSchema, jsonText)

const formatOptionalText = (value: string): string => (value.trim().length > 0 ? value.trim() : 'Not provided.')

const formatTaskContext = (task: ProjectPlanTaskContext): string => {
  const parts = [
    `Title: ${task.title}`,
    `Priority: ${task.priority}`,
    `Status: ${task.status}`,
    `Due date: ${task.dueDate ?? 'not set'}`,
  ]

  if (task.description.trim().length > 0) {
    parts.push(`Description: ${task.description}`)
  }

  return parts.join(' | ')
}

const createTaskSuggestionExample = (): ProjectPlanSuggestion => ({
  title: 'Define project delivery milestones',
  description: 'Break the current project into concrete top-level milestones that the team can execute next.',
  priority: 'high',
  status: 'todo',
  dueDate: null,
  existingTagNames: ['Planning'],
})

export const buildProjectPlannerSystemPrompt = (): string =>
  [
    'You generate top-level project task proposals for a project management app.',
    'Return valid JSON only.',
    'Do not include markdown, comments, or explanatory text.',
    'Do not generate IDs, subtasks, nested tasks, checklist items, member assignments, or new tags.',
    'Use only these priority values: low, medium, high, urgent.',
    'Use only these status values: backlog, todo, in_progress, blocked, review, done.',
    'Use dueDate only when you can express it as YYYY-MM-DD. Otherwise use null.',
    'Use existingTagNames only when they exactly match one of the provided existing tag names. Otherwise omit them or return an empty array.',
    `Return this JSON shape: ${JSON.stringify({ taskSuggestions: [createTaskSuggestionExample()] })}`,
  ].join(' ')

export const buildProjectPlannerUserPrompt = (request: {
  description: string
  dueDate: string | null
  existingTagNames: string[]
  existingTasks: ProjectPlanTaskContext[]
  inScopeContent: string
  memberNames: string[]
  objective: string
  outOfScopeContent: string
  startDate: string | null
  title: string
  additionalInstructions?: string
}): string => {
  const existingTasksSection =
    request.existingTasks.length === 0
      ? '- None yet.'
      : request.existingTasks.map((task, index) => `${index + 1}. ${formatTaskContext(task)}`).join('\n')

  const existingTagsSection = request.existingTagNames.length === 0 ? 'None available.' : request.existingTagNames.join(', ')
  const memberNamesSection = request.memberNames.length === 0 ? 'None available.' : request.memberNames.join(', ')

  const promptParts = [
    'Project context:',
    `- Title: ${formatOptionalText(request.title)}`,
    `- Description: ${formatOptionalText(request.description)}`,
    `- Objective: ${formatOptionalText(request.objective)}`,
    `- In scope: ${formatOptionalText(request.inScopeContent)}`,
    `- Out of scope: ${formatOptionalText(request.outOfScopeContent)}`,
    `- Start date: ${request.startDate ?? 'Not set.'}`,
    `- Due date: ${request.dueDate ?? 'Not set.'}`,
    `- Existing member names (context only, do not assign): ${memberNamesSection}`,
    `- Existing tag names (reuse only, do not create new tags): ${existingTagsSection}`,
    'Existing top-level tasks to avoid duplicating:',
    existingTasksSection,
  ]

  if (typeof request.additionalInstructions === 'string' && request.additionalInstructions.trim().length > 0) {
    promptParts.push('Additional planning instructions to prioritize (within project scope):')
    promptParts.push(request.additionalInstructions.trim())
  }

  promptParts.push('Generate 3 to 6 actionable top-level tasks for this project.')

  return promptParts.join('\n')
}
