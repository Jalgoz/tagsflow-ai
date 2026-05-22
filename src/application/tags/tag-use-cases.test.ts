import { describe, expect, it } from 'vitest'
import type { CreateTagInput, SubtaskRepository, Tag, TagRepository, TaskRepository, UpdateTagInput } from '../../domain'
import { createTagUseCases } from './tag-use-cases'

const createTag = (overrides: Partial<Tag> = {}): Tag => ({
  id: 'tag-1',
  name: 'Frontend',
  color: '#6366f1',
  ...overrides,
})

const createTagRepository = (initialTags: Tag[] = []): TagRepository => {
  const state = {
    tags: [...initialTags],
  }

  return {
    list: async () => state.tags,
    getById: async (id) => state.tags.find((tag) => tag.id === id) ?? null,
    create: async (input: CreateTagInput) => {
      const tag = createTag({
        ...input,
        id: `tag-${state.tags.length + 1}`,
      })
      state.tags.push(tag)
      return tag
    },
    update: async (id: string, input: UpdateTagInput) => {
      const index = state.tags.findIndex((tag) => tag.id === id)

      if (index < 0) {
        throw new Error(`Tag with ID "${id}" was not found.`)
      }

      const updatedTag = { ...state.tags[index], ...input }
      state.tags[index] = updatedTag
      return updatedTag
    },
    delete: async (id: string) => {
      state.tags = state.tags.filter((tag) => tag.id !== id)
    },
  }
}

const createTaskRepository = (tagIdsByTaskId: Record<string, string[]> = {}): TaskRepository => ({
  list: async () =>
    Object.entries(tagIdsByTaskId).map(([id, tagIds]) => ({
      id,
      projectId: 'project-1',
      title: 'Task',
      description: 'Description',
      inScopeContent: 'In scope',
      outOfScopeContent: 'Out of scope',
      priority: 'medium',
      status: 'todo',
      startDate: null,
      dueDate: null,
      assigneeMemberId: null,
      tagIds,
      checklist: [],
      subtaskIds: [],
    })),
  listByProjectId: async () => [],
  getById: async () => null,
  create: async () => {
    throw new Error('Not implemented in test repository.')
  },
  update: async () => {
    throw new Error('Not implemented in test repository.')
  },
  delete: async () => {},
  setStatus: async () => {
    throw new Error('Not implemented in test repository.')
  },
  assignMember: async () => {
    throw new Error('Not implemented in test repository.')
  },
  setTagIds: async () => {
    throw new Error('Not implemented in test repository.')
  },
  setChecklist: async () => {
    throw new Error('Not implemented in test repository.')
  },
  setSubtaskIds: async () => {
    throw new Error('Not implemented in test repository.')
  },
})

const createSubtaskRepository = (tagIdsBySubtaskId: Record<string, string[]> = {}): SubtaskRepository => ({
  list: async () =>
    Object.entries(tagIdsBySubtaskId).map(([id, tagIds]) => ({
      id,
      taskId: 'task-1',
      title: 'Subtask',
      description: 'Description',
      inScopeContent: 'In scope',
      outOfScopeContent: 'Out of scope',
      priority: 'low',
      status: 'backlog',
      startDate: null,
      dueDate: null,
      assigneeMemberId: null,
      tagIds,
      checklist: [],
    })),
  listByTaskId: async () => [],
  getById: async () => null,
  create: async () => {
    throw new Error('Not implemented in test repository.')
  },
  update: async () => {
    throw new Error('Not implemented in test repository.')
  },
  delete: async () => {},
  setStatus: async () => {
    throw new Error('Not implemented in test repository.')
  },
  assignMember: async () => {
    throw new Error('Not implemented in test repository.')
  },
  setTagIds: async () => {
    throw new Error('Not implemented in test repository.')
  },
  setChecklist: async () => {
    throw new Error('Not implemented in test repository.')
  },
})

describe('tag use cases', () => {
  it('lists tags', async () => {
    const tag = createTag({ id: 'tag-1' })
    const useCases = createTagUseCases({
      tags: createTagRepository([tag]),
      tasks: createTaskRepository(),
      subtasks: createSubtaskRepository(),
    })

    await expect(useCases.listTags()).resolves.toEqual([tag])
  })

  it('gets a tag by id', async () => {
    const tag = createTag({ id: 'tag-1' })
    const useCases = createTagUseCases({
      tags: createTagRepository([tag]),
      tasks: createTaskRepository(),
      subtasks: createSubtaskRepository(),
    })

    await expect(useCases.getTagById('tag-1')).resolves.toEqual(tag)
    await expect(useCases.getTagById('missing')).resolves.toBeNull()
  })

  it('creates a tag', async () => {
    const useCases = createTagUseCases({
      tags: createTagRepository(),
      tasks: createTaskRepository(),
      subtasks: createSubtaskRepository(),
    })

    await expect(useCases.createTag({ name: 'Backend', color: '#111827' })).resolves.toMatchObject({
      id: 'tag-1',
      name: 'Backend',
    })
  })

  it('updates a tag', async () => {
    const tag = createTag({ id: 'tag-1' })
    const useCases = createTagUseCases({
      tags: createTagRepository([tag]),
      tasks: createTaskRepository(),
      subtasks: createSubtaskRepository(),
    })

    await expect(useCases.updateTag('tag-1', { name: 'Platform' })).resolves.toMatchObject({
      id: 'tag-1',
      name: 'Platform',
    })
  })

  it('deletes a tag', async () => {
    const tag = createTag({ id: 'tag-1' })
    const repository = createTagRepository([tag])
    const useCases = createTagUseCases({
      tags: repository,
      tasks: createTaskRepository(),
      subtasks: createSubtaskRepository(),
    })

    await expect(useCases.deleteTag('tag-1')).resolves.toBeUndefined()
    await expect(useCases.listTags()).resolves.toEqual([])
  })

  it('detects tag usage before deletion', async () => {
    const useCases = createTagUseCases({
      tags: createTagRepository(),
      tasks: createTaskRepository({
        'task-1': ['tag-1', 'tag-2'],
        'task-2': ['tag-2'],
      }),
      subtasks: createSubtaskRepository({
        'subtask-1': ['tag-1'],
      }),
    })

    await expect(useCases.getTagUsageSummary('tag-1')).resolves.toEqual({
      taskCount: 1,
      subtaskCount: 1,
      totalCount: 2,
      isUsed: true,
    })
  })

  it('finds an existing tag by normalized name', async () => {
    const tag = createTag({ id: 'tag-1', name: 'Frontend' })
    const useCases = createTagUseCases({
      tags: createTagRepository([tag]),
      tasks: createTaskRepository(),
      subtasks: createSubtaskRepository(),
    })

    await expect(useCases.findOrCreateTagByName('  frontend  ')).resolves.toEqual(tag)
  })

  it('creates a tag when no existing tag matches', async () => {
    const useCases = createTagUseCases({
      tags: createTagRepository(),
      tasks: createTaskRepository(),
      subtasks: createSubtaskRepository(),
    })

    await expect(useCases.findOrCreateTagByName('Frontend')).resolves.toMatchObject({
      id: 'tag-1',
      name: 'Frontend',
    })
  })

  it('rejects empty tag names for find-or-create', async () => {
    const useCases = createTagUseCases({
      tags: createTagRepository(),
      tasks: createTaskRepository(),
      subtasks: createSubtaskRepository(),
    })

    await expect(useCases.findOrCreateTagByName('   ')).rejects.toThrow('Tag name is required.')
  })
})
