import { describe, expect, it } from 'vitest'
import type { Member, Project, Subtask, Tag, Task } from '../../domain'
import {
  DEFAULT_UPCOMING_DEADLINE_WINDOW_DAYS,
  UNASSIGNED_FILTER_VALUE,
  applyGlobalTaskView,
  buildGlobalTaskRows,
  createEmptyGlobalTaskFilters,
  filterGlobalTaskRows,
  searchGlobalTaskRows,
  sortGlobalTaskRows,
} from './global-tasks'

const projectA: Project = {
  description: '',
  dueDate: null,
  id: 'project-a',
  inScopeContent: '',
  memberIds: [],
  objective: '',
  outOfScopeContent: '',
  startDate: null,
  status: 'active',
  taskIds: ['task-a', 'task-b'],
  title: 'Alpha Platform',
}

const projectB: Project = {
  ...projectA,
  id: 'project-b',
  taskIds: ['task-c'],
  title: 'Beta Tools',
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
  priority: 'low',
  startDate: null,
  status: 'todo',
  tagIds: [],
  taskId: 'task-a',
  title: 'Default subtask',
  ...overrides,
})

const buildRows = () =>
  buildGlobalTaskRows({
    members: [member],
    projects: [projectA, projectB],
    subtasks: [
      createSubtask({
        assigneeMemberId: member.id,
        checklist: [{ completed: true, text: 'Done item' }],
        id: 'subtask-1',
        status: 'done',
        tagIds: [tag.id],
      }),
      createSubtask({ id: 'subtask-2', status: 'todo' }),
    ],
    tags: [tag],
    tasks: [
      createTask({
        assigneeMemberId: member.id,
        checklist: [
          { completed: true, text: 'First' },
          { completed: false, text: 'Second' },
        ],
        description: 'Build the global task index',
        dueDate: '2026-05-25',
        id: 'task-a',
        priority: 'high',
        status: 'in_progress',
        subtaskIds: ['subtask-1', 'subtask-2'],
        tagIds: [tag.id],
        title: 'Build task view',
      }),
      createTask({
        description: 'Fix delayed user feedback',
        dueDate: '2026-05-10',
        id: 'task-b',
        priority: 'urgent',
        status: 'blocked',
        title: 'Fix overdue toast',
      }),
      createTask({
        dueDate: null,
        id: 'task-c',
        priority: 'low',
        projectId: projectB.id,
        status: 'done',
        title: 'Archive complete work',
      }),
    ],
  })

describe('global task helpers', () => {
  it('projects task rows with project, member, tag, checklist, and subtask progress data', () => {
    const [row] = buildRows()

    expect(row.projectName).toBe('Alpha Platform')
    expect(row.assignee?.name).toBe('Ada Lovelace')
    expect(row.tags.map((currentTag) => currentTag.name)).toEqual(['Frontend'])
    expect(row.checklistSummary).toEqual({ completed: 1, total: 2 })
    expect(row.subtaskProgress).toEqual({ completed: 1, total: 2 })
    expect(row.taskProgress).toBe(50)
    expect(row.subtasks[0]).toMatchObject({
      assignee: member,
      checklistSummary: { completed: 1, total: 1 },
      tags: [tag],
      title: 'Default subtask',
    })
  })

  it('keeps tasks visible with missing optional metadata', () => {
    const [row] = buildGlobalTaskRows({
      members: [],
      projects: [],
      subtasks: [],
      tags: [],
      tasks: [createTask({ projectId: 'missing-project', title: 'Orphaned task' })],
    })

    expect(row.projectName).toBe('Unknown project')
    expect(row.assignee).toBeNull()
    expect(row.tags).toEqual([])
    expect(row.checklistSummary).toEqual({ completed: 0, total: 0 })
  })

  it('filters by project, status, priority, assignee, tag, overdue, and upcoming deadlines', () => {
    const rows = buildRows()
    const baseFilters = createEmptyGlobalTaskFilters()

    expect(filterGlobalTaskRows(rows, { ...baseFilters, projectId: projectB.id }, '2026-05-20').map((row) => row.id)).toEqual([
      'task-c',
    ])
    expect(filterGlobalTaskRows(rows, { ...baseFilters, status: 'blocked' }, '2026-05-20').map((row) => row.id)).toEqual([
      'task-b',
    ])
    expect(filterGlobalTaskRows(rows, { ...baseFilters, priority: 'high' }, '2026-05-20').map((row) => row.id)).toEqual([
      'task-a',
    ])
    expect(filterGlobalTaskRows(rows, { ...baseFilters, assigneeId: member.id }, '2026-05-20').map((row) => row.id)).toEqual([
      'task-a',
    ])
    expect(
      filterGlobalTaskRows(rows, { ...baseFilters, assigneeId: UNASSIGNED_FILTER_VALUE }, '2026-05-20').map((row) => row.id),
    ).toEqual(['task-b', 'task-c'])
    expect(filterGlobalTaskRows(rows, { ...baseFilters, tagId: tag.id }, '2026-05-20').map((row) => row.id)).toEqual([
      'task-a',
    ])
    expect(filterGlobalTaskRows(rows, { ...baseFilters, overdueOnly: true }, '2026-05-20').map((row) => row.id)).toEqual([
      'task-b',
    ])
    expect(
      filterGlobalTaskRows(rows, { ...baseFilters, upcomingOnly: true }, '2026-05-20', DEFAULT_UPCOMING_DEADLINE_WINDOW_DAYS).map(
        (row) => row.id,
      ),
    ).toEqual(['task-a'])
  })

  it('combines filters and search before sorting', () => {
    const result = applyGlobalTaskView(
      buildRows(),
      { ...createEmptyGlobalTaskFilters(), projectId: projectA.id, upcomingOnly: true },
      'global',
      { direction: 'asc', field: 'title' },
      '2026-05-20',
    )

    expect(result.map((row) => row.id)).toEqual(['task-a'])
  })

  it('searches task title and description case-insensitively', () => {
    const rows = buildRows()

    expect(searchGlobalTaskRows(rows, 'TASK VIEW').map((row) => row.id)).toEqual(['task-a'])
    expect(searchGlobalTaskRows(rows, 'delayed user').map((row) => row.id)).toEqual(['task-b'])
    expect(searchGlobalTaskRows(rows, '').map((row) => row.id)).toEqual(['task-a', 'task-b', 'task-c'])
  })

  it('sorts by due date, priority, status, project, title, and direction', () => {
    const rows = buildRows()

    expect(sortGlobalTaskRows(rows, { direction: 'asc', field: 'dueDate' }).map((row) => row.id)).toEqual([
      'task-b',
      'task-a',
      'task-c',
    ])
    expect(sortGlobalTaskRows(rows, { direction: 'desc', field: 'dueDate' }).map((row) => row.id)).toEqual([
      'task-c',
      'task-a',
      'task-b',
    ])
    expect(sortGlobalTaskRows(rows, { direction: 'asc', field: 'priority' }).map((row) => row.id)).toEqual([
      'task-c',
      'task-a',
      'task-b',
    ])
    expect(sortGlobalTaskRows(rows, { direction: 'asc', field: 'status' }).map((row) => row.id)).toEqual([
      'task-a',
      'task-b',
      'task-c',
    ])
    expect(sortGlobalTaskRows(rows, { direction: 'asc', field: 'project' }).map((row) => row.id)).toEqual([
      'task-a',
      'task-b',
      'task-c',
    ])
    expect(sortGlobalTaskRows(rows, { direction: 'asc', field: 'title' }).map((row) => row.id)).toEqual([
      'task-c',
      'task-a',
      'task-b',
    ])
  })
})
