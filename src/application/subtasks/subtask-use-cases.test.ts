import { describe, expect, it } from 'vitest'
import type { ChecklistItem, CreateSubtaskInput, Subtask, SubtaskRepository, UpdateSubtaskInput } from '../../domain'
import { createSubtaskUseCases } from './subtask-use-cases'

const createSubtask = (overrides: Partial<Subtask> = {}): Subtask => ({
  id: 'subtask-1',
  taskId: 'task-1',
  title: 'Subtask',
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

describe('subtask use cases', () => {
  it('lists all subtasks and parent task subtasks', async () => {
    const parentSubtask = createSubtask({ id: 'subtask-1', taskId: 'task-1' })
    const otherSubtask = createSubtask({ id: 'subtask-2', taskId: 'task-2' })
    const useCases = createSubtaskUseCases(createRepository([parentSubtask, otherSubtask]))

    await expect(useCases.listSubtasks()).resolves.toEqual([parentSubtask, otherSubtask])
    await expect(useCases.listSubtasksByTask('task-1')).resolves.toEqual([parentSubtask])
  })

  it('gets, creates, updates, and deletes subtasks', async () => {
    const useCases = createSubtaskUseCases(createRepository([createSubtask()]))

    await expect(useCases.getSubtaskById('subtask-1')).resolves.toMatchObject({ id: 'subtask-1' })
    await expect(
      useCases.createSubtask({
        taskId: 'task-1',
        title: 'Created',
        description: '',
        inScopeContent: '',
        outOfScopeContent: '',
        priority: 'high',
        status: 'todo',
        startDate: null,
        dueDate: null,
      }),
    ).resolves.toMatchObject({ id: 'subtask-2', title: 'Created' })
    await expect(useCases.updateSubtask('subtask-1', { title: 'Updated' })).resolves.toMatchObject({
      title: 'Updated',
    })
    await expect(useCases.deleteSubtask('subtask-1')).resolves.toBeUndefined()
    await expect(useCases.getSubtaskById('subtask-1')).resolves.toBeNull()
  })

  it('updates subtask status, assignee, tags, and checklist', async () => {
    const checklist: ChecklistItem[] = [{ completed: false, text: 'Review' }]
    const useCases = createSubtaskUseCases(createRepository([createSubtask()]))

    await expect(useCases.updateSubtaskStatus('subtask-1', 'done')).resolves.toMatchObject({ status: 'done' })
    await expect(useCases.updateSubtaskAssignee('subtask-1', 'member-1')).resolves.toMatchObject({
      assigneeMemberId: 'member-1',
    })
    await expect(useCases.updateSubtaskTags('subtask-1', ['tag-1'])).resolves.toMatchObject({ tagIds: ['tag-1'] })
    await expect(useCases.updateSubtaskChecklist('subtask-1', checklist)).resolves.toMatchObject({ checklist })
  })
})
