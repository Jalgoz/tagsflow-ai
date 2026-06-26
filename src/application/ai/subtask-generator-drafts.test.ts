import { describe, expect, it } from 'vitest'
import {
  createSubtaskGeneratorDrafts,
  toCreateSubtaskInputFromSubtaskGeneratorDraft,
  updateSubtaskGeneratorDraftField,
  validateSubtaskGeneratorDraft,
} from './subtask-generator-drafts'

describe('subtask-generator-drafts', () => {
  describe('createSubtaskGeneratorDrafts', () => {
    it('creates drafts and maps matching tags', () => {
      const result = {
        subtaskSuggestions: [
          {
            title: 'Sub 1',
            description: 'Desc',
            priority: 'high' as const,
            status: 'todo' as const,
            dueDate: '2026-01-01',
            checklistItems: ['item'],
            existingTagNames: ['backend', 'unknown'],
          },
        ],
      }
      const tags = [
        { id: 'tag-1', name: 'Backend', color: 'blue' },
      ]

      const drafts = createSubtaskGeneratorDrafts(result, tags)
      expect(drafts).toHaveLength(1)
      expect(drafts[0].title).toBe('Sub 1')
      expect(drafts[0].matchedTagNames).toEqual(['Backend'])
      expect(drafts[0].tagIds).toEqual(['tag-1'])
      expect(drafts[0].unappliedTagNames).toEqual(['unknown'])
      expect(drafts[0].checklistItems).toEqual(['item'])
      expect(drafts[0].isSelected).toBe(true)
      expect(drafts[0].isInserted).toBe(false)
    })
  })

  describe('updateSubtaskGeneratorDraftField', () => {
    it('updates text fields with trimming', () => {
      const draft = createSubtaskGeneratorDrafts({ subtaskSuggestions: [{ title: 'T', description: 'D', priority: 'low', status: 'todo', dueDate: null, checklistItems: [], existingTagNames: [] }] }, [])[0]
      const updated = updateSubtaskGeneratorDraftField(draft, 'title', ' New Title ')
      expect(updated.title).toBe('New Title')
    })
  })

  describe('validateSubtaskGeneratorDraft', () => {
    it('validates empty titles', () => {
      const errors = validateSubtaskGeneratorDraft({ title: ' ', description: 'd', priority: 'high', status: 'todo', dueDate: null })
      expect(errors.title).toBeDefined()
    })
  })

  describe('toCreateSubtaskInputFromSubtaskGeneratorDraft', () => {
    it('maps draft to CreateSubtaskInput properly', () => {
      const draft = createSubtaskGeneratorDrafts({ subtaskSuggestions: [{ title: 'T', description: 'D', priority: 'low', status: 'todo', dueDate: null, checklistItems: ['check1'], existingTagNames: [] }] }, [])[0]
      draft.tagIds = ['tag1']
      const input = toCreateSubtaskInputFromSubtaskGeneratorDraft('task-1', draft)

      expect(input.taskId).toBe('task-1')
      expect(input.title).toBe('T')
      expect(input.priority).toBe('low')
      expect(input.tagIds).toEqual(['tag1'])
      expect(input.checklist).toEqual([{ text: 'check1', completed: false }])
    })
  })
})
