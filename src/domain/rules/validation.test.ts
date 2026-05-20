import { describe, expect, it } from 'vitest'

import { requiresTaskCompletionConfirmation, validateChecklistItem, validateOneLevelSubtaskInput } from './validation'

describe('completion and validation rules', () => {
  it('requires confirmation when subtasks are pending', () => {
    expect(
      requiresTaskCompletionConfirmation([
        { status: 'done' },
        { status: 'in_progress' },
      ]),
    ).toEqual({
      pendingSubtaskCount: 1,
      requiresConfirmation: true,
    })
  })

  it('does not require confirmation when all subtasks are done', () => {
    expect(
      requiresTaskCompletionConfirmation([
        { status: 'done' },
        { status: 'done' },
      ]),
    ).toEqual({
      pendingSubtaskCount: 0,
      requiresConfirmation: false,
    })
  })

  it('rejects nested subtask input', () => {
    expect(validateOneLevelSubtaskInput({ subtasks: [{}] })).toEqual({
      errors: ['Subtasks cannot contain nested subtasks.'],
      valid: false,
    })
  })

  it('rejects parent subtask relationships', () => {
    expect(validateOneLevelSubtaskInput({ parentSubtaskId: 'subtask-1' })).toEqual({
      errors: ['Nested subtasks are not allowed.'],
      valid: false,
    })
  })

  it('accepts valid checklist items', () => {
    expect(validateChecklistItem({ text: 'Review PR', completed: false })).toEqual({
      errors: [],
      valid: true,
    })
  })

  it('rejects checklist items with task-like fields', () => {
    expect(
      validateChecklistItem({
        completed: false,
        dueDate: '2026-05-21',
        priority: 'high',
        text: 'Review PR',
      }),
    ).toEqual({
      errors: ['Checklist items may only contain text and completed.'],
      valid: false,
    })
  })
})
