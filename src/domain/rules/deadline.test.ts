import { describe, expect, it } from 'vitest'

import type { Subtask, Task } from '../entities'
import { getOverdueTasks, getUpcomingDeadlineTasks, isOverdueItem } from './deadline'

const makeTask = (overrides: Partial<Task> = {}): Task => ({
  assigneeMemberId: null,
  checklist: [],
  description: 'Task description',
  dueDate: '2026-05-10',
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
  dueDate: '2026-05-10',
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

describe('deadline rules', () => {
  it('detects overdue open work', () => {
    const task = makeTask({ dueDate: '2026-05-19', status: 'in_progress' })

    expect(isOverdueItem(task, '2026-05-20')).toBe(true)
  })

  it('does not flag completed overdue work', () => {
    const task = makeTask({ dueDate: '2026-05-19', status: 'done' })

    expect(isOverdueItem(task, '2026-05-20')).toBe(false)
  })

  it('returns overdue tasks and subtasks from a mixed list', () => {
    const overdueTask = makeTask({ id: 'task-1', dueDate: '2026-05-19' })
    const overdueSubtask = makeSubtask({ id: 'subtask-1', dueDate: '2026-05-18' })
    const completedTask = makeTask({ id: 'task-2', dueDate: '2026-05-18', status: 'done' })

    expect(getOverdueTasks([overdueTask, overdueSubtask, completedTask], '2026-05-20')).toEqual([
      overdueTask,
      overdueSubtask,
    ])
  })

  it('includes upcoming deadlines inside the configured window', () => {
    const task = makeTask({ dueDate: '2026-05-24' })
    const subtask = makeSubtask({ dueDate: '2026-05-28' })
    const completedTask = makeTask({ dueDate: '2026-05-21', status: 'done' })

    expect(
      getUpcomingDeadlineTasks([task, subtask, completedTask], {
        referenceDate: '2026-05-20',
        windowDays: 10,
      }),
    ).toEqual([task, subtask])
  })
})
