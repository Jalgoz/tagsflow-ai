import { describe, expect, it } from 'vitest'
import { projectFormSchema } from './project-form-schema'

describe('project form schema', () => {
  it('accepts valid data and defaults status', () => {
    expect(
      projectFormSchema.parse({
        title: 'Project',
        description: '',
        objective: '',
        inScopeContent: '',
        outOfScopeContent: '',
        startDate: null,
        dueDate: null,
      }),
    ).toEqual({
      title: 'Project',
      description: '',
      objective: '',
      inScopeContent: '',
      outOfScopeContent: '',
      status: 'active',
      startDate: null,
      dueDate: null,
    })
  })

  it('rejects missing title', () => {
    expect(
      projectFormSchema.safeParse({
        title: '',
        description: '',
        objective: '',
        inScopeContent: '',
        outOfScopeContent: '',
        status: 'active',
        startDate: null,
        dueDate: null,
      }).success,
    ).toBe(false)
  })

  it('rejects invalid status', () => {
    expect(
      projectFormSchema.safeParse({
        title: 'Project',
        description: '',
        objective: '',
        inScopeContent: '',
        outOfScopeContent: '',
        status: 'planned',
        startDate: null,
        dueDate: null,
      }).success,
    ).toBe(false)
  })

  it('rejects due date before start date', () => {
    const result = projectFormSchema.safeParse({
      title: 'Project',
      description: '',
      objective: '',
      inScopeContent: '',
      outOfScopeContent: '',
      status: 'active',
      startDate: '2026-06-10',
      dueDate: '2026-06-01',
    })

    expect(result.success).toBe(false)
    if (!result.success) {
      expect(result.error.issues[0]?.path).toEqual(['dueDate'])
    }
  })
})
