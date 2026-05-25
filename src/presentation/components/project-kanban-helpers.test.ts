import { describe, expect, it } from 'vitest'
import type { Member, Subtask, Tag, Task } from '../../domain'
import { getTaskCardMetadata, groupTasksByKanbanColumn, hasPendingSubtasks } from './project-kanban-helpers'

const createTask = (overrides: Partial<Task> = {}): Task => ({
  assigneeMemberId: null,
  checklist: [],
  description: '',
  dueDate: null,
  id: 'task-1',
  inScopeContent: '',
  outOfScopeContent: '',
  priority: 'medium',
  projectId: 'project-1',
  startDate: null,
  status: 'todo',
  subtaskIds: [],
  tagIds: [],
  title: 'Task',
  ...overrides,
})

const createSubtask = (overrides: Partial<Subtask> = {}): Subtask => ({
  assigneeMemberId: null,
  checklist: [],
  description: '',
  dueDate: null,
  id: 'subtask-1',
  inScopeContent: '',
  outOfScopeContent: '',
  priority: 'medium',
  startDate: null,
  status: 'todo',
  tagIds: [],
  taskId: 'task-1',
  title: 'Subtask',
  ...overrides,
})

describe('project kanban helpers', () => {
  it('groups tasks by configured statuses and keeps empty columns', () => {
    const groups = groupTasksByKanbanColumn([createTask({ id: 'task-1', status: 'todo' }), createTask({ id: 'task-2', status: 'done' })])

    expect(groups).toHaveLength(6)
    expect(groups.find((group) => group.status === 'todo')?.tasks.map((task) => task.id)).toEqual(['task-1'])
    expect(groups.find((group) => group.status === 'done')?.tasks.map((task) => task.id)).toEqual(['task-2'])
    expect(groups.find((group) => group.status === 'blocked')?.tasks).toEqual([])
  })

  it('builds neutral metadata values and summaries', () => {
    const members: Member[] = []
    const tags: Tag[] = []
    const metadata = getTaskCardMetadata(
      createTask({
        checklist: [{ completed: true, text: 'A' }, { completed: false, text: 'B' }],
      }),
      members,
      tags,
      [createSubtask({ status: 'done' }), createSubtask({ id: 'subtask-2', status: 'todo' })],
    )

    expect(metadata.assignee).toBe('Unassigned')
    expect(metadata.dueDate).toBe('Not set')
    expect(metadata.checklistSummary).toBe('1/2 complete')
    expect(metadata.subtaskSummary).toBe('1/2 done')
  })

  it('detects pending subtasks for done warning', () => {
    const task = createTask()
    expect(hasPendingSubtasks(task, [createSubtask({ status: 'done' })])).toBe(false)
    expect(hasPendingSubtasks(task, [createSubtask({ status: 'todo' })])).toBe(true)
  })
})
