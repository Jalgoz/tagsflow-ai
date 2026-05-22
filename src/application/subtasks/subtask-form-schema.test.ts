import { describe, expect, it } from 'vitest'
import {
  createSubtaskInputFromFormValues,
  subtaskFormSchema,
} from './subtask-form-schema'

const validSubtaskFormInput = {
  title: 'Subtask',
  description: '',
  inScopeContent: '',
  outOfScopeContent: '',
  status: 'todo',
  priority: 'medium',
  startDate: null,
  dueDate: null,
  assigneeMemberId: null,
  tagIds: [],
  checklist: [],
}

describe('subtask form schema', () => {
  it('accepts valid data and maps create input', () => {
    const values = subtaskFormSchema.parse({
      ...validSubtaskFormInput,
      checklist: [{ completed: false, text: ' Review ' }],
    })

    expect(createSubtaskInputFromFormValues('task-1', values)).toMatchObject({
      taskId: 'task-1',
      title: 'Subtask',
      status: 'todo',
      priority: 'medium',
      assigneeMemberId: null,
      tagIds: [],
      checklist: [{ completed: false, text: 'Review' }],
    })
  })

  it('defaults status, priority, tags, and checklist', () => {
    expect(
      subtaskFormSchema.parse({
        title: 'Subtask',
        description: '',
        inScopeContent: '',
        outOfScopeContent: '',
        startDate: null,
        dueDate: null,
        assigneeMemberId: null,
      }),
    ).toMatchObject({
      status: 'todo',
      priority: 'medium',
      tagIds: [],
      checklist: [],
    })
  })

  it('rejects missing title, invalid status, invalid priority, invalid date range, and invalid checklist', () => {
    expect(subtaskFormSchema.safeParse({ ...validSubtaskFormInput, title: '' }).success).toBe(false)
    expect(subtaskFormSchema.safeParse({ ...validSubtaskFormInput, status: 'planned' }).success).toBe(false)
    expect(subtaskFormSchema.safeParse({ ...validSubtaskFormInput, priority: 'critical' }).success).toBe(false)
    expect(subtaskFormSchema.safeParse({ ...validSubtaskFormInput, checklist: [{ completed: false, text: '' }] }).success).toBe(false)

    const result = subtaskFormSchema.safeParse({
      ...validSubtaskFormInput,
      startDate: '2026-06-10',
      dueDate: '2026-06-01',
    })

    expect(result.success).toBe(false)
    if (!result.success) {
      expect(result.error.issues[0]?.path).toEqual(['dueDate'])
    }
  })
})
