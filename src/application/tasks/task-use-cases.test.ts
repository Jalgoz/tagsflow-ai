import { describe, expect, it } from 'vitest'
import type { ChecklistItem, CreateTaskInput, Task, TaskRepository, UpdateTaskInput } from '../../domain'
import { createTaskUseCases } from './task-use-cases'

const createTask = (overrides: Partial<Task> = {}): Task => ({
  id: 'task-1',
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

describe('task use cases', () => {
  it('lists all tasks and project tasks', async () => {
    const projectTask = createTask({ id: 'task-1', projectId: 'project-1' })
    const otherTask = createTask({ id: 'task-2', projectId: 'project-2' })
    const useCases = createTaskUseCases(createRepository([projectTask, otherTask]))

    await expect(useCases.listTasks()).resolves.toEqual([projectTask, otherTask])
    await expect(useCases.listTasksByProject('project-1')).resolves.toEqual([projectTask])
  })

  it('gets, creates, updates, and deletes tasks', async () => {
    const repository = createRepository([createTask()])
    const useCases = createTaskUseCases(repository)

    await expect(useCases.getTaskById('task-1')).resolves.toMatchObject({ id: 'task-1' })
    await expect(
      useCases.createTask({
        projectId: 'project-1',
        title: 'Created',
        description: '',
        inScopeContent: '',
        outOfScopeContent: '',
        priority: 'high',
        status: 'todo',
        startDate: null,
        dueDate: null,
      }),
    ).resolves.toMatchObject({ id: 'task-2', title: 'Created' })
    await expect(useCases.updateTask('task-1', { title: 'Updated' })).resolves.toMatchObject({ title: 'Updated' })
    await expect(useCases.deleteTask('task-1')).resolves.toBeUndefined()
    await expect(useCases.getTaskById('task-1')).resolves.toBeNull()
  })

  it('updates task status, assignee, tags, and checklist', async () => {
    const checklist: ChecklistItem[] = [{ completed: false, text: 'Review' }]
    const useCases = createTaskUseCases(createRepository([createTask()]))

    await expect(useCases.updateTaskStatus('task-1', 'done')).resolves.toMatchObject({ status: 'done' })
    await expect(useCases.updateTaskAssignee('task-1', 'member-1')).resolves.toMatchObject({
      assigneeMemberId: 'member-1',
    })
    await expect(useCases.updateTaskTags('task-1', ['tag-1'])).resolves.toMatchObject({ tagIds: ['tag-1'] })
    await expect(useCases.updateTaskChecklist('task-1', checklist)).resolves.toMatchObject({ checklist })
  })
})
