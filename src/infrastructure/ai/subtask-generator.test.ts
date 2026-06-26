import { describe, expect, it } from 'vitest'
import {
  buildSubtaskGeneratorSystemPrompt,
  buildSubtaskGeneratorUserPrompt,
  parseSubtaskGenerationResponse,
} from './subtask-generator'
import type { SubtaskGenerationRequest } from '../../domain'

describe('subtask-generator', () => {
  describe('prompts', () => {
    it('builds system prompt with strict rules', () => {
      const prompt = buildSubtaskGeneratorSystemPrompt()
      expect(prompt).toContain('one-level-deep subtasks')
      expect(prompt).toContain('Do not generate IDs, nested subtasks, member assignments, or new tags.')
      expect(prompt).toContain('valid JSON only')
    })

    it('builds user prompt with instructions and context', () => {
      const request: SubtaskGenerationRequest = {
        project: {
          title: 'Project 1',
          description: 'Desc',
          objective: '',
          inScopeContent: '',
          outOfScopeContent: '',
          startDate: null,
          dueDate: null,
          status: 'active',
        },
        task: {
          title: 'Task 1',
          description: 'Desc',
          inScopeContent: '',
          outOfScopeContent: '',
          priority: 'high',
          status: 'todo',
          startDate: null,
          dueDate: null,
        },
        existingSubtasks: [],
        existingTagNames: ['tag1'],
        memberNames: ['user1'],
        additionalInstructions: 'Generate backend tasks',
      }

      const prompt = buildSubtaskGeneratorUserPrompt(request)
      expect(prompt).toContain('Project 1')
      expect(prompt).toContain('Task 1')
      expect(prompt).toContain('tag1')
      expect(prompt).toContain('user1')
      expect(prompt).toContain('Generate backend tasks')
      expect(prompt).toContain('subordinate to one-level-subtask and review rules')
    })
  })

  describe('parsing', () => {
    it('parses valid subtask response', () => {
      const json = JSON.stringify({
        subtaskSuggestions: [
          {
            title: 'Subtask 1',
            description: 'Desc',
            priority: 'high',
            status: 'todo',
            dueDate: '2025-10-10',
            checklistItems: ['item 1'],
            existingTagNames: ['tag1'],
          },
        ],
      })

      const result = parseSubtaskGenerationResponse(json)
      expect(result.success).toBe(true)
      if (result.success) {
        expect(result.data.subtaskSuggestions).toHaveLength(1)
        expect(result.data.subtaskSuggestions[0].title).toBe('Subtask 1')
        expect(result.data.subtaskSuggestions[0].dueDate).toBe('2025-10-10')
      }
    })

    it('rejects nested subtasks by not allowing them in schema', () => {
      const json = JSON.stringify({
        subtaskSuggestions: [
          {
            title: 'Subtask 1',
            description: 'Desc',
            priority: 'high',
            nestedSubtasks: [],
          },
        ],
      })

      const result = parseSubtaskGenerationResponse(json)
      expect(result.success).toBe(false)
    })

    it('rejects invalid dates', () => {
      const json = JSON.stringify({
        subtaskSuggestions: [
          {
            title: 'Subtask 1',
            description: 'Desc',
            priority: 'high',
            dueDate: 'invalid-date',
          },
        ],
      })

      const result = parseSubtaskGenerationResponse(json)
      expect(result.success).toBe(false)
    })

    it('rejects malformed JSON', () => {
      const result = parseSubtaskGenerationResponse('{ invalid')
      expect(result.success).toBe(false)
      if (!result.success) {
        expect(result.code).toBe('invalid_json')
      }
    })
  })
})
