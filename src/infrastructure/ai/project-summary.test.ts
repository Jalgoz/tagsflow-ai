import { describe, expect, it } from 'vitest'
import {
  buildProjectSummarySystemPrompt,
  buildProjectSummaryUserPrompt,
  parseProjectSummaryResponse,
} from './project-summary'

const createRequest = () => ({
  project: {
    title: 'Platform refresh',
    description: 'Refresh the product surface.',
    objective: 'Ship the next milestone.',
    inScopeContent: 'Dashboard and tasks.',
    outOfScopeContent: 'Backend services.',
    status: 'active' as const,
    startDate: '2026-06-01',
    dueDate: '2026-06-30',
    progressPercent: 58,
  },
  taskCounts: {
    backlog: 1,
    todo: 2,
    in_progress: 1,
    blocked: 1,
    review: 0,
    done: 3,
  },
  priorityCounts: {
    low: 1,
    medium: 2,
    high: 2,
    urgent: 1,
  },
  blockedTasks: [
    {
      title: 'Resolve design review',
      priority: 'high' as const,
      status: 'blocked' as const,
      dueDate: '2026-06-12',
      assigneeName: 'Alex Doe',
    },
  ],
  overdueTasks: [
    {
      title: 'Fix regression',
      priority: 'urgent' as const,
      status: 'todo' as const,
      dueDate: '2026-06-08',
      assigneeName: 'Casey Smith',
    },
  ],
  upcomingTasks: [],
  completedTasks: [{ title: 'Set up project workspace', priority: 'medium' as const }],
  taskDetails: [
    {
      title: 'Resolve design review',
      description: 'Finish the review cycle for the updated forms.',
      priority: 'high' as const,
      status: 'blocked' as const,
      dueDate: '2026-06-12',
      assigneeName: 'Alex Doe',
      tagNames: ['Frontend'],
      checklistSummary: '1/2 checklist items completed. Items: [x] Audit; [ ] Sign off',
      subtaskSummary: '1/2 subtasks completed. Subtasks: Review copy (done); Review spacing (todo)',
    },
  ],
  existingTagNames: ['Frontend'],
  memberNames: ['Alex Doe', 'Casey Smith'],
  referenceDate: '2026-06-09',
  additionalInstructions: 'Summarize this for a weekly stakeholder update.',
})

describe('project summary response parsing', () => {
  it('accepts valid summary output', () => {
    const result = parseProjectSummaryResponse(
      JSON.stringify({
        summary: 'The project is moving, but an overdue urgent task keeps it at risk.',
        health: 'at_risk',
        risks: ['An overdue urgent task may delay the next milestone.'],
        blockers: ['One blocked review item needs design clarification.'],
        nextSteps: ['Resolve the blocked review item.', 'Close the overdue urgent task.'],
        notableCompletedWork: ['Completed the workspace setup.'],
      }),
    )

    expect(result).toEqual({
      success: true,
      data: {
        summary: 'The project is moving, but an overdue urgent task keeps it at risk.',
        health: 'at_risk',
        risks: ['An overdue urgent task may delay the next milestone.'],
        blockers: ['One blocked review item needs design clarification.'],
        nextSteps: ['Resolve the blocked review item.', 'Close the overdue urgent task.'],
        notableCompletedWork: ['Completed the workspace setup.'],
      },
    })
  })

  it('rejects malformed JSON', () => {
    expect(parseProjectSummaryResponse('{bad json')).toEqual({
      success: false,
      code: 'invalid_json',
      message: 'The AI response did not contain valid JSON.',
      details: [],
    })
  })

  it('rejects schema-invalid output and unsupported health labels', () => {
    const cases = [
      JSON.stringify({ summary: 'Only summary' }),
      JSON.stringify({
        summary: 'Something happened.',
        health: 'healthy',
        risks: [],
        blockers: [],
        nextSteps: [],
      }),
    ]

    for (const input of cases) {
      const result = parseProjectSummaryResponse(input)

      expect(result.success).toBe(false)
      if (result.success) {
        continue
      }

      expect(result.code).toBe('invalid_schema')
    }
  })

  it('rejects generated ids and mutation-shaped payloads', () => {
    const cases = [
      JSON.stringify({
        id: 'ai-id-1',
        summary: 'Summary',
        health: 'on_track',
        risks: [],
        blockers: [],
        nextSteps: [],
      }),
      JSON.stringify({
        summary: 'Summary',
        health: 'blocked',
        risks: [],
        blockers: [],
        nextSteps: ['Create a task for the backend team.'],
      }),
      JSON.stringify({
        summary: 'Summary',
        health: 'blocked',
        risks: [],
        blockers: [],
        nextSteps: [],
        tasks: [{ title: 'Do not allow this' }],
      }),
    ]

    for (const input of cases) {
      const result = parseProjectSummaryResponse(input)

      expect(result.success).toBe(false)
      if (result.success) {
        continue
      }

      expect(result.code).toBe('invalid_schema')
    }
  })
})

describe('project summary prompts', () => {
  it('builds safe structured prompts for the Groq request', () => {
    const systemPrompt = buildProjectSummarySystemPrompt()
    const userPrompt = buildProjectSummaryUserPrompt(createRequest())

    expect(systemPrompt).toContain('Return valid JSON only.')
    expect(systemPrompt).toContain('Do not generate IDs, tasks, subtasks, assignments, tags')
    expect(userPrompt).toContain('Platform refresh')
    expect(userPrompt).toContain('Derived progress: 58%')
    expect(userPrompt).toContain('Additional summary instructions to consider')
    expect(userPrompt).toContain('Resolve design review')
  })
})
