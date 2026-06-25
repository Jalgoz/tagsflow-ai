import { describe, expect, it } from 'vitest'
import {
  buildProjectPlannerSystemPrompt,
  buildProjectPlannerUserPrompt,
  parseProjectPlanResponse,
} from './project-planner'

describe('project planner response parsing', () => {
  it('accepts valid planner output and defaults missing status values to todo', () => {
    const result = parseProjectPlanResponse(
      JSON.stringify({
        taskSuggestions: [
          {
            title: 'Plan milestones',
            description: 'Break the project into delivery milestones.',
            priority: 'high',
            dueDate: '2026-07-01',
            existingTagNames: ['Planning'],
          },
        ],
      }),
    )

    expect(result).toEqual({
      success: true,
      data: {
        taskSuggestions: [
          {
            title: 'Plan milestones',
            description: 'Break the project into delivery milestones.',
            priority: 'high',
            status: 'todo',
            dueDate: '2026-07-01',
            existingTagNames: ['Planning'],
          },
        ],
      },
    })
  })

  it('rejects malformed JSON', () => {
    expect(parseProjectPlanResponse('{bad json')).toEqual({
      success: false,
      code: 'invalid_json',
      message: 'The AI response did not contain valid JSON.',
      details: [],
    })
  })

  it('rejects schema-invalid output', () => {
    const result = parseProjectPlanResponse(JSON.stringify({ taskSuggestions: [{ priority: 'high' }] }))

    expect(result.success).toBe(false)
    if (result.success) {
      return
    }

    expect(result.code).toBe('invalid_schema')
    expect(result.details.some((detail) => detail.includes('title'))).toBe(true)
  })

  it('rejects invalid dates, unsupported status values, generated ids, and subtasks', () => {
    const cases = [
      JSON.stringify({
        taskSuggestions: [
          {
            title: 'Plan milestones',
            description: 'Break the project into delivery milestones.',
            priority: 'high',
            status: 'todo',
            dueDate: '2026-13-01',
            existingTagNames: [],
          },
        ],
      }),
      JSON.stringify({
        taskSuggestions: [
          {
            title: 'Plan milestones',
            description: 'Break the project into delivery milestones.',
            priority: 'high',
            status: 'later',
            dueDate: null,
            existingTagNames: [],
          },
        ],
      }),
      JSON.stringify({
        taskSuggestions: [
          {
            id: 'ai-id-1',
            title: 'Plan milestones',
            description: 'Break the project into delivery milestones.',
            priority: 'high',
            status: 'todo',
            dueDate: null,
            existingTagNames: [],
          },
        ],
      }),
      JSON.stringify({
        taskSuggestions: [
          {
            title: 'Plan milestones',
            description: 'Break the project into delivery milestones.',
            priority: 'high',
            status: 'todo',
            dueDate: null,
            existingTagNames: [],
            subtasks: [{ title: 'Do not allow this' }],
          },
        ],
      }),
    ]

    for (const input of cases) {
      const result = parseProjectPlanResponse(input)

      expect(result.success).toBe(false)
      if (result.success) {
        continue
      }

      expect(result.code).toBe('invalid_schema')
    }
  })

  it('rejects unsupported priority values', () => {
    const result = parseProjectPlanResponse(
      JSON.stringify({
        taskSuggestions: [
          {
            title: 'Plan milestones',
            description: 'Break the project into delivery milestones.',
            priority: 'critical',
            status: 'todo',
            dueDate: null,
            existingTagNames: [],
          },
        ],
      }),
    )

    expect(result.success).toBe(false)
    if (result.success) {
      return
    }

    expect(result.details.some((detail) => detail.includes('priority'))).toBe(true)
  })
})

describe('project planner prompts', () => {
  it('builds safe structured prompts for the Groq request', () => {
    const systemPrompt = buildProjectPlannerSystemPrompt()
    const userPrompt = buildProjectPlannerUserPrompt({
      title: 'Platform refresh',
      description: 'Refresh the product surface.',
      objective: 'Ship the next milestone.',
      inScopeContent: 'Dashboard and tasks.',
      outOfScopeContent: 'Backend services.',
      startDate: '2026-06-01',
      dueDate: '2026-06-30',
      existingTasks: [
        {
          title: 'Audit current UX',
          description: 'Review the current project flows.',
          priority: 'medium',
          status: 'todo',
          dueDate: '2026-06-12',
        },
      ],
      existingTagNames: ['Planning'],
      memberNames: ['Alex Doe'],
    })

    expect(systemPrompt).toContain('Return valid JSON only.')
    expect(systemPrompt).toContain('Do not generate IDs')
    expect(userPrompt).toContain('Platform refresh')
    expect(userPrompt).toContain('Existing tag names')
    expect(userPrompt).toContain('Audit current UX')
  })
})
