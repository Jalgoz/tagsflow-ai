import { describe, expect, it } from 'vitest'
import type { PrioritySuggestionRequest } from '../../domain'
import {
  buildPrioritySuggestionSystemPrompt,
  buildPrioritySuggestionUserPrompt,
  parsePrioritySuggestionResponse,
} from './priority-suggestion'

const request: PrioritySuggestionRequest = {
  project: {
    title: 'Platform refresh',
    description: 'Refresh the main platform experience.',
    objective: 'Ship the MVP',
    inScopeContent: 'Dashboard and tasks',
    outOfScopeContent: 'Backend services',
    status: 'active',
    startDate: '2026-06-01',
    dueDate: '2026-06-30',
  },
  selectedTask: {
    title: 'Review current UX',
    description: 'Audit the current task flows and identify gaps.',
    inScopeContent: 'Selected scope',
    outOfScopeContent: 'Outside scope',
    currentPriority: 'medium',
    status: 'todo',
    startDate: '2026-06-02',
    dueDate: '2026-06-12',
    checklistSummary: '2/3 complete. Items: Define scope (done); Review metrics; Prepare release notes',
    tagNames: ['Frontend', 'Planning'],
    assigneeName: 'Alex Doe',
    subtaskProgressSummary: '1/3 complete. Subtasks: First pass (done); Second pass (todo); Third pass (todo)',
  },
  siblingTasks: [
    {
      title: 'Ship onboarding',
      priority: 'high',
      status: 'blocked',
      dueDate: '2026-06-18',
    },
  ],
  additionalInstructions: '   Focus on release blockers first.   ',
}

describe('priority suggestion parsing', () => {
  it('accepts valid provider output', () => {
    const result = parsePrioritySuggestionResponse(
      JSON.stringify({
        suggestedPriority: 'high',
        rationale: 'The task is blocking the release and should be prioritized next.',
      }),
    )

    expect(result).toEqual({
      success: true,
      data: {
        suggestedPriority: 'high',
        rationale: 'The task is blocking the release and should be prioritized next.',
      },
    })
  })

  it('rejects malformed JSON', () => {
    expect(parsePrioritySuggestionResponse('{bad json')).toEqual({
      success: false,
      code: 'invalid_json',
      message: 'The AI response did not contain valid JSON.',
      details: [],
    })
  })

  it('rejects schema-invalid and unsupported priority output', () => {
    const cases = [
      JSON.stringify({ suggestedPriority: 'high' }),
      JSON.stringify({
        suggestedPriority: 'critical',
        rationale: 'Invalid priority.',
      }),
    ]

    for (const input of cases) {
      const result = parsePrioritySuggestionResponse(input)

      expect(result.success).toBe(false)
      if (result.success) {
        continue
      }

      expect(result.code).toBe('invalid_schema')
    }
  })

  it('rejects generated ids, task payloads, project mutations, and member or tag creation payloads', () => {
    const cases = [
      {
        suggestedPriority: 'high',
        rationale: 'Valid rationale.',
        id: 'ai-generated-id',
      },
      {
        suggestedPriority: 'high',
        rationale: 'Valid rationale.',
        taskSuggestions: [{ title: 'Create task' }],
      },
      {
        suggestedPriority: 'high',
        rationale: 'Valid rationale.',
        projectUpdates: { status: 'active' },
      },
      {
        suggestedPriority: 'high',
        rationale: 'Valid rationale.',
        generatedSubtasks: [{ title: 'Create subtask' }],
      },
      {
        suggestedPriority: 'high',
        rationale: 'Valid rationale.',
        memberCreation: { name: 'New member' },
      },
      {
        suggestedPriority: 'high',
        rationale: 'Valid rationale.',
        tagCreation: { name: 'New tag' },
      },
    ]

    for (const input of cases) {
      const result = parsePrioritySuggestionResponse(JSON.stringify(input))

      expect(result.success).toBe(false)
      if (result.success) {
        continue
      }

      expect(result.code).toBe('invalid_schema')
    }
  })
})

describe('priority suggestion prompts', () => {
  it('builds strict safety prompts for the Groq request', () => {
    const systemPrompt = buildPrioritySuggestionSystemPrompt()
    const userPrompt = buildPrioritySuggestionUserPrompt(request)

    expect(systemPrompt).toContain('Return valid JSON only.')
    expect(systemPrompt).toContain('Do not generate IDs, tasks, subtasks, project updates, tag creation, member assignments, checklist edits, or other mutation instructions.')
    expect(systemPrompt).toContain('"suggestedPriority":"high"')
    expect(userPrompt).toContain('Platform refresh')
    expect(userPrompt).toContain('Current priority: medium')
    expect(userPrompt).toContain('Focus on release blockers first.')
    expect(userPrompt).toContain('Sibling task priority context')
  })
})

