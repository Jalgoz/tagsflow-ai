import { describe, expect, it } from 'vitest'
import {
  createTaskInputFromFormValues,
  taskFormSchema,
} from './task-form-schema'
import { checklistItemsFromFormValues } from './checklist-form-schema'

const validTaskFormInput = {
  title: 'Task',
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

describe('task form schema', () => {
  it('accepts valid data and maps create input', () => {
    const values = taskFormSchema.parse({
      ...validTaskFormInput,
      checklist: [{ completed: false, text: ' Review ' }],
    })

    expect(createTaskInputFromFormValues('project-1', values)).toMatchObject({
      projectId: 'project-1',
      title: 'Task',
      status: 'todo',
      priority: 'medium',
      assigneeMemberId: null,
      tagIds: [],
      checklist: [{ completed: false, text: 'Review' }],
    })
  })

  it('defaults status, priority, tags, and checklist', () => {
    expect(
      taskFormSchema.parse({
        title: 'Task',
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

  it('rejects missing title, invalid status, invalid priority, and invalid date range', () => {
    expect(taskFormSchema.safeParse({ ...validTaskFormInput, title: '' }).success).toBe(false)
    expect(taskFormSchema.safeParse({ ...validTaskFormInput, status: 'planned' }).success).toBe(false)
    expect(taskFormSchema.safeParse({ ...validTaskFormInput, priority: 'critical' }).success).toBe(false)

    const result = taskFormSchema.safeParse({
      ...validTaskFormInput,
      startDate: '2026-06-10',
      dueDate: '2026-06-01',
    })

    expect(result.success).toBe(false)
    if (!result.success) {
      expect(result.error.issues[0]?.path).toEqual(['dueDate'])
    }
  })

  it('validates checklist item text and maps only checklist fields', () => {
    expect(taskFormSchema.safeParse({ ...validTaskFormInput, checklist: [{ completed: false, text: '' }] }).success).toBe(false)
    expect(checklistItemsFromFormValues([{ completed: true, text: 'Done' }])).toEqual([
      { completed: true, text: 'Done' },
    ])
  })
})
