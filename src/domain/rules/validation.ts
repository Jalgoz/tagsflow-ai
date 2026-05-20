export interface ValidationResult {
  valid: boolean
  errors: string[]
}

const createResult = (errors: string[]): ValidationResult => ({
  errors,
  valid: errors.length === 0,
})

export interface PendingSubtaskResult {
  requiresConfirmation: boolean
  pendingSubtaskCount: number
}

export const requiresTaskCompletionConfirmation = (
  subtasks: Array<{ status: 'backlog' | 'todo' | 'in_progress' | 'blocked' | 'review' | 'done' }>,
): PendingSubtaskResult => {
  const pendingSubtaskCount = subtasks.filter((subtask) => subtask.status !== 'done').length

  return {
    pendingSubtaskCount,
    requiresConfirmation: pendingSubtaskCount > 0,
  }
}

export const validateOneLevelSubtaskInput = (input: {
  parentSubtaskId?: unknown
  subtasks?: unknown
}): ValidationResult => {
  const errors: string[] = []

  if (input.parentSubtaskId !== undefined && input.parentSubtaskId !== null) {
    errors.push('Nested subtasks are not allowed.')
  }

  if (Array.isArray(input.subtasks) && input.subtasks.length > 0) {
    errors.push('Subtasks cannot contain nested subtasks.')
  }

  return createResult(errors)
}

export const validateChecklistItem = (input: unknown): ValidationResult => {
  if (typeof input !== 'object' || input === null || Array.isArray(input)) {
    return createResult(['Checklist items must be objects.'])
  }

  const keys = Object.keys(input)
  const allowedKeys = ['text', 'completed']

  if (keys.length !== allowedKeys.length || !allowedKeys.every((key) => keys.includes(key))) {
    return createResult(['Checklist items may only contain text and completed.'])
  }

  const typedInput = input as Record<string, unknown>
  const errors: string[] = []

  if (typeof typedInput.text !== 'string' || typedInput.text.trim().length === 0) {
    errors.push('Checklist text must be a non-empty string.')
  }

  if (typeof typedInput.completed !== 'boolean') {
    errors.push('Checklist completed must be a boolean.')
  }

  return createResult(errors)
}
