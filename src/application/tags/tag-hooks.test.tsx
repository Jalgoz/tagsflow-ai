import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { act, renderHook, waitFor } from '@testing-library/react'
import type { ReactNode } from 'react'
import { describe, expect, it } from 'vitest'
import type { CreateTagInput, SubtaskRepository, Tag, TagRepository, TaskRepository, UpdateTagInput } from '../../domain'
import { TagManagementRepositoryProvider, useCreateTag, useDeleteTag, useFindOrCreateTag, useTag, useTags, useUpdateTag } from './index'

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

const createTaskRepository = (): TaskRepository => ({
  list: async () => [],
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

const createSubtaskRepository = (): SubtaskRepository => ({
  list: async () => [],
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

const createWrapper = (repository: TagRepository) => {
  const queryClient = new QueryClient({
    defaultOptions: {
      queries: {
        retry: false,
      },
    },
  })

  const Wrapper = ({ children }: { children: ReactNode }) => {
    return (
      <QueryClientProvider client={queryClient}>
        <TagManagementRepositoryProvider
          repositories={{
            tags: repository,
            tasks: createTaskRepository(),
            subtasks: createSubtaskRepository(),
          }}
        >
          {children}
        </TagManagementRepositoryProvider>
      </QueryClientProvider>
    )
  }

  return Wrapper
}

describe('tag hooks', () => {
  it('loads tags and individual tags', async () => {
    const tag = createTag({ id: 'tag-1' })
    const wrapper = createWrapper(createTagRepository([tag]))

    const tagsResult = renderHook(() => useTags(), { wrapper })
    const tagResult = renderHook(() => useTag('tag-1'), { wrapper })

    await waitFor(() => expect(tagsResult.result.current.isSuccess).toBe(true))
    await waitFor(() => expect(tagResult.result.current.isSuccess).toBe(true))

    expect(tagsResult.result.current.data).toEqual([tag])
    expect(tagResult.result.current.data).toEqual(tag)
  })

  it('creates tags and refreshes the list', async () => {
    const wrapper = createWrapper(createTagRepository())
    const tagsResult = renderHook(() => useTags(), { wrapper })
    const createResult = renderHook(() => useCreateTag(), { wrapper })

    await waitFor(() => expect(tagsResult.result.current.isSuccess).toBe(true))

    await act(async () => {
      await createResult.result.current.mutateAsync({
        name: 'Backend',
        color: '#111827',
      })
    })

    await waitFor(() => expect(tagsResult.result.current.data).toHaveLength(1))
    expect(tagsResult.result.current.data?.[0]?.name).toBe('Backend')
  })

  it('updates tags and refreshes the detail view', async () => {
    const tag = createTag({ id: 'tag-1' })
    const repository = createTagRepository([tag])
    const wrapper = createWrapper(repository)
    const tagResult = renderHook(() => useTag('tag-1'), { wrapper })
    const updateResult = renderHook(() => useUpdateTag(), { wrapper })

    await waitFor(() => expect(tagResult.result.current.isSuccess).toBe(true))

    await act(async () => {
      await updateResult.result.current.mutateAsync({
        tagId: 'tag-1',
        input: { name: 'Platform' },
      })
    })

    await expect(repository.getById('tag-1')).resolves.toMatchObject({
      name: 'Platform',
    })
  })

  it('deletes tags and refreshes the list', async () => {
    const tag = createTag({ id: 'tag-1' })
    const repository = createTagRepository([tag])
    const wrapper = createWrapper(repository)
    const tagsResult = renderHook(() => useTags(), { wrapper })
    const deleteResult = renderHook(() => useDeleteTag(), { wrapper })

    await waitFor(() => expect(tagsResult.result.current.isSuccess).toBe(true))

    await act(async () => {
      await deleteResult.result.current.mutateAsync('tag-1')
    })

    await expect(repository.list()).resolves.toEqual([])
  })

  it('finds or creates tags by name', async () => {
    const wrapper = createWrapper(createTagRepository())
    const findOrCreateResult = renderHook(() => useFindOrCreateTag(), { wrapper })

    await act(async () => {
      await findOrCreateResult.result.current.mutateAsync({
        name: 'Frontend',
      })
    })

    expect(findOrCreateResult.result.current.data).toMatchObject({
      name: 'Frontend',
    })
  })
})
