import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { renderHook, waitFor } from '@testing-library/react'
import { act, type ReactNode } from 'react'
import { describe, expect, it } from 'vitest'
import type { CreateSubtaskInput, Subtask, SubtaskRepository, UpdateSubtaskInput } from '../../domain'
import {
  SubtaskRepositoryProvider,
  useCreateSubtask,
  useDeleteSubtask,
  useSubtasksByTask,
  useUpdateSubtask,
} from './index'

;(globalThis as typeof globalThis & { IS_REACT_ACT_ENVIRONMENT: boolean }).IS_REACT_ACT_ENVIRONMENT = true

const createSubtask = (overrides: Partial<Subtask> = {}): Subtask => ({
  id: 'subtask-1',
  taskId: 'task-1',
  title: 'Subtask',
  description: '',
  inScopeContent: '',
  outOfScopeContent: '',
  priority: 'medium',
  status: 'todo',
  startDate: null,
  dueDate: null,
  assigneeMemberId: null,
  tagIds: [],
  checklist: [],
  ...overrides,
})

const createRepository = (initialSubtasks: Subtask[] = []): SubtaskRepository => {
  const state = {
    subtasks: [...initialSubtasks],
  }

  const updateSubtask = (id: string, input: UpdateSubtaskInput): Subtask => {
    const subtask = state.subtasks.find((currentSubtask) => currentSubtask.id === id)

    if (subtask === undefined) {
      throw new Error(`Subtask with ID "${id}" was not found.`)
    }

    const updatedSubtask = { ...subtask, ...input }
    state.subtasks = state.subtasks.map((currentSubtask) =>
      currentSubtask.id === id ? updatedSubtask : currentSubtask,
    )
    return updatedSubtask
  }

  return {
    list: async () => state.subtasks,
    listByTaskId: async (taskId) => state.subtasks.filter((subtask) => subtask.taskId === taskId),
    getById: async (id) => state.subtasks.find((subtask) => subtask.id === id) ?? null,
    create: async (input: CreateSubtaskInput) => {
      const subtask = createSubtask({ ...input, id: `subtask-${state.subtasks.length + 1}` })
      state.subtasks.push(subtask)
      return subtask
    },
    update: async (id, input) => updateSubtask(id, input),
    delete: async (id) => {
      state.subtasks = state.subtasks.filter((subtask) => subtask.id !== id)
    },
    setStatus: async (id, status) => updateSubtask(id, { status }),
    assignMember: async (id, memberId) => updateSubtask(id, { assigneeMemberId: memberId }),
    setTagIds: async (id, tagIds) => updateSubtask(id, { tagIds }),
    setChecklist: async (id, checklist) => updateSubtask(id, { checklist }),
  }
}

const createWrapper = (repository: SubtaskRepository) => {
  const queryClient = new QueryClient({ defaultOptions: { queries: { retry: false } } })

  const Wrapper = ({ children }: { children: ReactNode }) => (
    <QueryClientProvider client={queryClient}>
      <SubtaskRepositoryProvider repository={repository}>{children}</SubtaskRepositoryProvider>
    </QueryClientProvider>
  )

  return Wrapper
}

describe('subtask hooks', () => {
  it('loads and mutates parent task subtasks', async () => {
    const repository = createRepository([createSubtask()])
    const wrapper = createWrapper(repository)
    const subtasksResult = renderHook(() => useSubtasksByTask('task-1'), { wrapper })
    const createResult = renderHook(() => useCreateSubtask(), { wrapper })
    const updateResult = renderHook(() => useUpdateSubtask(), { wrapper })
    const deleteResult = renderHook(() => useDeleteSubtask(), { wrapper })

    await waitFor(() => expect(subtasksResult.result.current.isSuccess).toBe(true))
    expect(subtasksResult.result.current.data).toHaveLength(1)

    await act(async () => {
      await createResult.result.current.mutateAsync({
        taskId: 'task-1',
        title: 'Created',
        description: '',
        inScopeContent: '',
        outOfScopeContent: '',
        priority: 'medium',
        status: 'todo',
        startDate: null,
        dueDate: null,
      })
    })
    await expect(repository.listByTaskId('task-1')).resolves.toHaveLength(2)

    await act(async () => {
      await updateResult.result.current.mutateAsync({
        input: { title: 'Updated' },
        subtaskId: 'subtask-1',
        taskId: 'task-1',
      })
    })
    await expect(repository.getById('subtask-1')).resolves.toMatchObject({ title: 'Updated' })

    await act(async () => {
      await deleteResult.result.current.mutateAsync({ subtaskId: 'subtask-1', taskId: 'task-1' })
    })
    await expect(repository.getById('subtask-1')).resolves.toBeNull()
  })
})
