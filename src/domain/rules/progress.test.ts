import { describe, expect, it } from 'vitest'

import type { Project, Subtask, Task } from '../entities'
import { calculateProjectProgress, calculateTaskProgress } from './progress'

const makeTask = (overrides: Partial<Task> = {}): Task => ({
  assigneeMemberId: null,
  checklist: [],
  description: 'Task description',
  dueDate: null,
  id: 'task-1',
  inScopeContent: 'In scope',
  outOfScopeContent: 'Out of scope',
  priority: 'medium',
  projectId: 'project-1',
  startDate: null,
  status: 'todo',
  subtaskIds: [],
  tagIds: [],
  title: 'Task title',
  ...overrides,
})

const makeSubtask = (overrides: Partial<Subtask> = {}): Subtask => ({
  assigneeMemberId: null,
  checklist: [],
  description: 'Subtask description',
  dueDate: null,
  id: 'subtask-1',
  inScopeContent: 'In scope',
  outOfScopeContent: 'Out of scope',
  priority: 'medium',
  startDate: null,
  status: 'todo',
  tagIds: [],
  taskId: 'task-1',
  title: 'Subtask title',
  ...overrides,
})

const makeProject = (overrides: Partial<Project> = {}): Project => ({
  description: 'Project description',
  dueDate: null,
  id: 'project-1',
  inScopeContent: 'In scope',
  memberIds: [],
  objective: 'Objective',
  outOfScopeContent: 'Out of scope',
  startDate: null,
  status: 'active',
  taskIds: ['task-1', 'task-2'],
  title: 'Project title',
  ...overrides,
})

describe('calculateTaskProgress', () => {
  it('returns 100 when a task without subtasks is done', () => {
    const task = makeTask({ status: 'done' })

    expect(calculateTaskProgress({ task })).toBe(100)
  })

  it('returns 0 when a task without subtasks is not done', () => {
    const task = makeTask({ status: 'in_progress' })

    expect(calculateTaskProgress({ task })).toBe(0)
  })

  it('returns the completion percentage for subtasks', () => {
    const task = makeTask({ subtaskIds: ['subtask-1', 'subtask-2', 'subtask-3'] })
    const subtasks = [
      makeSubtask({ id: 'subtask-1', status: 'done' }),
      makeSubtask({ id: 'subtask-2', status: 'todo' }),
      makeSubtask({ id: 'subtask-3', status: 'done' }),
    ]

    expect(calculateTaskProgress({ task, subtasks })).toBeCloseTo(66.66666666666666)
  })
})

describe('calculateProjectProgress', () => {
  it('returns the average of top-level task progress', () => {
    const project = makeProject()
    const tasks = [
      makeTask({ id: 'task-1', projectId: project.id, status: 'done' }),
      makeTask({ id: 'task-2', projectId: project.id, subtaskIds: ['subtask-1', 'subtask-2'] }),
    ]
    const subtasks = [
      makeSubtask({ id: 'subtask-1', taskId: 'task-2', status: 'done' }),
      makeSubtask({ id: 'subtask-2', taskId: 'task-2', status: 'todo' }),
    ]

    expect(calculateProjectProgress({ project, tasks, subtasks })).toBe(75)
  })

  it('returns 0 for an empty project', () => {
    const project = makeProject({ taskIds: [] })

    expect(calculateProjectProgress({ project, tasks: [] })).toBe(0)
  })
})
