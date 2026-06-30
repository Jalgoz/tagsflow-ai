import { z } from 'zod'
import {
  PRIORITIES,
  type PrioritySuggestionRequest,
  type PrioritySuggestionResult,
  type PrioritySuggestionSiblingTaskContext,
} from '../../domain'
import { parseStructuredAIResponse, type StructuredAIResponseResult } from './structured-output'

const formatOptionalText = (value: string | null | undefined): string =>
  (value ?? '').trim().length > 0 ? (value ?? '').trim() : 'Not set.'

const prioritySuggestionResponseSchema = z
  .object({
    suggestedPriority: z.enum(PRIORITIES),
    rationale: z.string().trim().min(1, 'Priority rationale is required.').max(240, 'Priority rationale must be 240 characters or fewer.'),
  })
  .strict()

export const parsePrioritySuggestionResponse = (
  jsonText: string,
): StructuredAIResponseResult<PrioritySuggestionResult> => parseStructuredAIResponse(prioritySuggestionResponseSchema, jsonText)

const formatSiblingTaskContext = (task: PrioritySuggestionSiblingTaskContext): string =>
  [
    `Title: ${task.title}`,
    `Priority: ${task.priority}`,
    `Status: ${task.status}`,
    `Due date: ${task.dueDate ?? 'Not set.'}`,
  ].join(' | ')

const createPrioritySuggestionExample = (): PrioritySuggestionResult => ({
  suggestedPriority: 'high',
  rationale: 'The task is time-sensitive and should be completed before lower-impact work.',
})

export const buildPrioritySuggestionSystemPrompt = (): string =>
  [
    'You suggest a priority for one existing task in a project management app.',
    'Return valid JSON only.',
    'Do not include markdown, comments, or explanatory text.',
    'Do not generate IDs, tasks, subtasks, project updates, tag creation, member assignments, checklist edits, or other mutation instructions.',
    'Do not include confidence or additional fields.',
    'Use only these priority values: low, medium, high, urgent.',
    `Return this JSON shape: ${JSON.stringify(createPrioritySuggestionExample())}`,
  ].join(' ')

export const buildPrioritySuggestionUserPrompt = (request: PrioritySuggestionRequest): string => {
  const siblingTasksSection =
    request.siblingTasks.length === 0
      ? '- None.'
      : request.siblingTasks.map((task, index) => `${index + 1}. ${formatSiblingTaskContext(task)}`).join('\n')

  const promptParts = [
    'Project context:',
    `- Title: ${formatOptionalText(request.project.title)}`,
    `- Description: ${formatOptionalText(request.project.description)}`,
    `- Objective: ${formatOptionalText(request.project.objective)}`,
    `- In scope: ${formatOptionalText(request.project.inScopeContent)}`,
    `- Out of scope: ${formatOptionalText(request.project.outOfScopeContent)}`,
    `- Status: ${request.project.status}`,
    `- Start date: ${request.project.startDate ?? 'Not set.'}`,
    `- Due date: ${request.project.dueDate ?? 'Not set.'}`,
    'Selected task context:',
    `- Title: ${formatOptionalText(request.selectedTask.title)}`,
    `- Description: ${formatOptionalText(request.selectedTask.description)}`,
    `- In scope: ${formatOptionalText(request.selectedTask.inScopeContent)}`,
    `- Out of scope: ${formatOptionalText(request.selectedTask.outOfScopeContent)}`,
    `- Current priority: ${request.selectedTask.currentPriority}`,
    `- Status: ${request.selectedTask.status}`,
    `- Start date: ${request.selectedTask.startDate ?? 'Not set.'}`,
    `- Due date: ${request.selectedTask.dueDate ?? 'Not set.'}`,
    `- Assignee context: ${request.selectedTask.assigneeName ?? 'Unassigned'}`,
    `- Tag context: ${request.selectedTask.tagNames.length === 0 ? 'None.' : request.selectedTask.tagNames.join(', ')}`,
    `- Checklist summary: ${request.selectedTask.checklistSummary}`,
    `- Subtask progress summary: ${request.selectedTask.subtaskProgressSummary}`,
    'Sibling task priority context (for comparison only):',
    siblingTasksSection,
  ]

  if (typeof request.additionalInstructions === 'string' && request.additionalInstructions.trim().length > 0) {
    promptParts.push('Additional priority instructions to prioritize (within selected task scope only):')
    promptParts.push(request.additionalInstructions.trim())
  }

  promptParts.push('Recommend exactly one priority for the selected task and explain why in one short rationale.')

  return promptParts.join('\n')
}

