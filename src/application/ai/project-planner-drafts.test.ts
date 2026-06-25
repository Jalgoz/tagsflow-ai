import { describe, expect, it } from 'vitest'
import type { Tag } from '../../domain'
import { createProjectPlannerDrafts, validateProjectPlannerDraft } from './project-planner-drafts'

const createTag = (overrides: Partial<Tag> = {}): Tag => ({
  id: 'tag-1',
  name: 'Planning',
  color: '#4f46e5',
  ...overrides,
})

describe('project planner drafts', () => {
  it('transforms validated planner output into local review drafts with matched tags and warnings', () => {
    const drafts = createProjectPlannerDrafts(
      {
        taskSuggestions: [
          {
            title: 'Plan milestones',
            description: 'Break the work into reviewable milestones.',
            priority: 'high',
            status: 'todo',
            dueDate: '2026-07-01',
            existingTagNames: ['Planning', 'Unknown tag', 'planning'],
          },
        ],
      },
      [createTag(), createTag({ id: 'tag-2', name: 'Frontend' })],
    )

    expect(drafts).toHaveLength(1)
    expect(drafts[0]).toMatchObject({
      title: 'Plan milestones',
      status: 'todo',
      tagIds: ['tag-1'],
      matchedTagNames: ['Planning'],
      unappliedTagNames: ['Unknown tag'],
      isInserted: false,
      isSelected: true,
    })
  })

  it('validates edited planner drafts before insertion', () => {
    expect(
      validateProjectPlannerDraft({
        title: '',
        description: 'Ready',
        priority: 'medium',
        status: 'todo',
        dueDate: '2026-40-01',
      }),
    ).toEqual({
      title: 'Title is required.',
      dueDate: 'Use a valid date in YYYY-MM-DD format.',
    })
  })
})
