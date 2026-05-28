import { describe, expect, it } from 'vitest'
import type { Member, Project, Subtask, Tag, Task } from '../../domain'
import {
  DEFAULT_DASHBOARD_UPCOMING_DEADLINE_WINDOW_DAYS,
  buildDashboardMetrics,
  getAverageProjectProgress,
  getProjectStatusCounts,
  getTaskCounts,
  getTaskPriorityDistribution,
  getTaskStatusDistribution,
  getOverdueTasksForDashboard,
  getUpcomingDeadlineTasksForDashboard,
} from './dashboard-metrics'

const projectA: Project = {
  description: '',
  dueDate: '2026-05-30',
  id: 'project-a',
  inScopeContent: '',
  memberIds: ['member-1'],
  objective: '',
  outOfScopeContent: '',
  startDate: null,
  status: 'active',
  taskIds: ['task-a', 'task-b'],
  title: 'Project Alpha',
}

const projectB: Project = {
  ...projectA,
  dueDate: null,
  id: 'project-b',
  status: 'paused',
  taskIds: ['task-c'],
  title: 'Project Beta',
}

const projectC: Project = {
  ...projectA,
  id: 'project-c',
  status: 'completed',
  taskIds: ['task-d'],
  title: 'Project Gamma',
}

const member: Member = {
  avatar: '',
  email: 'ada@example.com',
  id: 'member-1',
  name: 'Ada Lovelace',
  role: 'Engineer',
}

const tag: Tag = {
  color: '#4f46e5',
  id: 'tag-1',
  name: 'Frontend',
}

const createTask = (overrides: Partial<Task> = {}): Task => ({
  assigneeMemberId: null,
  checklist: [],
  description: 'Default task description',
  dueDate: null,
  id: 'task-a',
  inScopeContent: '',
  outOfScopeContent: '',
  priority: 'medium',
  projectId: projectA.id,
  startDate: null,
  status: 'todo',
  subtaskIds: [],
  tagIds: [],
  title: 'Default task',
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
  taskId: 'task-a',
  title: 'Default subtask',
  ...overrides,
})

describe('dashboard metrics helpers', () => {
  it('returns project and task counts for approved statuses', () => {
    const projectCounts = getProjectStatusCounts([projectA, projectB, projectC])
    expect(projectCounts).toEqual({
      active: 1,
      completed: 1,
      paused: 1,
    })

    const taskCounts = getTaskCounts([
      createTask({ id: 'task-a', status: 'todo' }),
      createTask({ id: 'task-b', status: 'done' }),
      createTask({ id: 'task-c', status: 'blocked' }),
      createTask({ id: 'task-d', status: 'review' }),
    ])

    expect(taskCounts).toEqual({
      blocked: 1,
      completed: 1,
      pending: 3,
      total: 4,
    })
  })

  it('returns overdue and upcoming task sets using a fixed reference date', () => {
    const referenceDate = '2026-05-20'
    const tasks = [
      createTask({ dueDate: '2026-05-10', id: 'task-overdue', status: 'todo' }),
      createTask({ dueDate: '2026-05-21', id: 'task-upcoming', status: 'in_progress' }),
      createTask({ dueDate: '2026-05-28', id: 'task-window-end', status: 'review' }),
      createTask({ dueDate: '2026-05-10', id: 'task-completed', status: 'done' }),
      createTask({ dueDate: null, id: 'task-no-due-date', status: 'todo' }),
    ]

    expect(getOverdueTasksForDashboard(tasks, referenceDate).map((task) => task.id)).toEqual(['task-overdue'])
    expect(
      getUpcomingDeadlineTasksForDashboard(tasks, referenceDate, DEFAULT_DASHBOARD_UPCOMING_DEADLINE_WINDOW_DAYS).map(
        (task) => task.id,
      ),
    ).toEqual(['task-upcoming'])
  })

  it('derives average project progress from existing task and subtask progress rules', () => {
    const projects = [projectA, projectB]
    const tasks = [
      createTask({ id: 'task-a', projectId: projectA.id, status: 'done' }),
      createTask({ id: 'task-b', projectId: projectA.id, status: 'todo', subtaskIds: ['subtask-1', 'subtask-2'] }),
      createTask({ id: 'task-c', projectId: projectB.id, status: 'todo' }),
    ]
    const subtasks = [
      createSubtask({ id: 'subtask-1', status: 'done', taskId: 'task-b' }),
      createSubtask({ id: 'subtask-2', status: 'todo', taskId: 'task-b' }),
    ]

    expect(getAverageProjectProgress(projects, tasks, subtasks)).toBe(37.5)
  })

  it('returns status and priority distributions with zero-value entries', () => {
    const tasks = [
      createTask({ id: 'task-a', priority: 'low', status: 'todo' }),
      createTask({ id: 'task-b', priority: 'urgent', status: 'blocked' }),
      createTask({ id: 'task-c', priority: 'urgent', status: 'done' }),
    ]

    expect(getTaskStatusDistribution(tasks)).toEqual([
      { count: 0, key: 'backlog' },
      { count: 1, key: 'todo' },
      { count: 0, key: 'in_progress' },
      { count: 1, key: 'blocked' },
      { count: 0, key: 'review' },
      { count: 1, key: 'done' },
    ])

    expect(getTaskPriorityDistribution(tasks)).toEqual([
      { count: 1, key: 'low' },
      { count: 0, key: 'medium' },
      { count: 0, key: 'high' },
      { count: 2, key: 'urgent' },
    ])
  })

  it('reports completed-this-week as unavailable without completion timestamps', () => {
    const metrics = buildDashboardMetrics({
      members: [member],
      projects: [projectA, projectB, projectC],
      referenceDate: '2026-05-20',
      subtasks: [],
      tags: [tag],
      tasks: [
        createTask({
          assigneeMemberId: member.id,
          dueDate: '2026-05-22',
          id: 'task-upcoming',
          priority: 'high',
          projectId: projectA.id,
          status: 'in_progress',
          tagIds: [tag.id],
          title: 'Upcoming launch prep',
        }),
        createTask({
          dueDate: '2026-05-18',
          id: 'task-blocked',
          priority: 'urgent',
          projectId: projectA.id,
          status: 'blocked',
          title: 'Blocked integration',
        }),
        createTask({
          dueDate: '2026-05-14',
          id: 'task-done',
          priority: 'medium',
          projectId: projectB.id,
          status: 'done',
          title: 'Completed cleanup',
        }),
      ],
    })

    expect(metrics.completedThisWeek).toEqual({
      isAvailable: false,
      reason: 'Exact completion timing is unavailable because completion timestamps are not part of the current task model.',
      value: null,
    })

    expect(metrics.recentlyCompletedWork).toEqual({
      isAvailable: false,
      items: [],
      reason: 'Exact completion timing is unavailable because completion timestamps are not part of the current task model.',
    })
    expect(metrics.upcomingDeadlineTasks[0]).toMatchObject({
      assigneeName: 'Ada Lovelace',
      priority: 'high',
      projectTitle: 'Project Alpha',
      status: 'in_progress',
      title: 'Upcoming launch prep',
    })
    expect(metrics.blockedTasks[0]).toMatchObject({
      priority: 'urgent',
      projectTitle: 'Project Alpha',
      status: 'blocked',
      title: 'Blocked integration',
    })
    expect(metrics.projectHealthRows.map((row) => row.projectId)).toEqual(['project-a', 'project-c', 'project-b'])
  })
})
