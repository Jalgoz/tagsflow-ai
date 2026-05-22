import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { renderHook, waitFor } from '@testing-library/react'
import { act, type ReactNode } from 'react'
import { describe, expect, it } from 'vitest'
import type { CreateTaskInput, Task, TaskRepository, UpdateTaskInput } from '../../domain'
import { TaskRepositoryProvider, useCreateTask, useDeleteTask, useTasksByProject, useUpdateTaskStatus } from './index'

;(globalThis as typeof globalThis & { IS_REACT_ACT_ENVIRONMENT: boolean }).IS_REACT_ACT_ENVIRONMENT = true

const createTask = (overrides: Partial<Task> = {}): Task => ({
  id: 'task-1',
  projectId: 'project-1',
  title: 'Task',
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
  subtaskIds: [],
  ...overrides,
})

const createRepository = (initialTasks: Task[] = []): TaskRepository => {
  const state = {
    tasks: [...initialTasks],
  }

  const updateTask = (id: string, input: UpdateTaskInput): Task => {
    const task = state.tasks.find((currentTask) => currentTask.id === id)

    if (task === undefined) {
      throw new Error(`Task with ID "${id}" was not found.`)
    }

    const updatedTask = { ...task, ...input }
    state.tasks = state.tasks.map((currentTask) => (currentTask.id === id ? updatedTask : currentTask))
    return updatedTask
  }

  return {
    list: async () => state.tasks,
    listByProjectId: async (projectId) => state.tasks.filter((task) => task.projectId === projectId),
    getById: async (id) => state.tasks.find((task) => task.id === id) ?? null,
    create: async (input: CreateTaskInput) => {
      const task = createTask({ ...input, id: `task-${state.tasks.length + 1}` })
      state.tasks.push(task)
      return task
    },
    update: async (id, input) => updateTask(id, input),
    delete: async (id) => {
      state.tasks = state.tasks.filter((task) => task.id !== id)
    },
    setStatus: async (id, status) => updateTask(id, { status }),
    assignMember: async (id, memberId) => updateTask(id, { assigneeMemberId: memberId }),
    setTagIds: async (id, tagIds) => updateTask(id, { tagIds }),
    setChecklist: async (id, checklist) => updateTask(id, { checklist }),
    setSubtaskIds: async (id, subtaskIds) => updateTask(id, { subtaskIds }),
  }
}

const createWrapper = (repository: TaskRepository) => {
  const queryClient = new QueryClient({ defaultOptions: { queries: { retry: false } } })

  const Wrapper = ({ children }: { children: ReactNode }) => (
    <QueryClientProvider client={queryClient}>
      <TaskRepositoryProvider repository={repository}>{children}</TaskRepositoryProvider>
    </QueryClientProvider>
  )

  return Wrapper
}

describe('task hooks', () => {
  it('loads and mutates project tasks', async () => {
    const repository = createRepository([createTask()])
    const wrapper = createWrapper(repository)
    const tasksResult = renderHook(() => useTasksByProject('project-1'), { wrapper })
    const createResult = renderHook(() => useCreateTask(), { wrapper })
    const statusResult = renderHook(() => useUpdateTaskStatus(), { wrapper })
    const deleteResult = renderHook(() => useDeleteTask(), { wrapper })

    await waitFor(() => expect(tasksResult.result.current.isSuccess).toBe(true))
    expect(tasksResult.result.current.data).toHaveLength(1)

    await act(async () => {
      await createResult.result.current.mutateAsync({
        projectId: 'project-1',
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

    await expect(repository.listByProjectId('project-1')).resolves.toHaveLength(2)

    await act(async () => {
      await statusResult.result.current.mutateAsync({ projectId: 'project-1', status: 'done', taskId: 'task-1' })
    })
    await expect(repository.getById('task-1')).resolves.toMatchObject({ status: 'done' })

    await act(async () => {
      await deleteResult.result.current.mutateAsync({ projectId: 'project-1', taskId: 'task-1' })
    })
    await expect(repository.getById('task-1')).resolves.toBeNull()
  })
})
