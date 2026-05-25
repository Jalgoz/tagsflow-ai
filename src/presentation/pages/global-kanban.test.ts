import { describe, expect, it } from 'vitest'
import type { Member, Project, Subtask, Tag, Task } from '../../domain'
import {
  UNASSIGNED_FILTER_VALUE,
  buildGlobalKanbanCards,
  createEmptyGlobalKanbanFilters,
  filterGlobalKanbanCards,
  groupGlobalKanbanCards,
} from './global-kanban'

const project: Project = {
  description: '',
  dueDate: null,
  id: 'project-1',
  inScopeContent: '',
  memberIds: [],
  objective: '',
  outOfScopeContent: '',
  startDate: null,
  status: 'active',
  taskIds: ['task-1', 'task-2'],
  title: 'SaaS Platform',
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

describe('global kanban helpers', () => {
  it('projects card metadata and derives summaries', () => {
    const cards = buildGlobalKanbanCards({
      members: [member],
      projects: [project],
      subtasks: [createSubtask({ status: 'done' }), createSubtask({ id: 'subtask-2', status: 'todo' })],
      tags: [tag],
      tasks: [
        createTask({
          assigneeMemberId: member.id,
          checklist: [{ completed: true, text: 'A' }, { completed: false, text: 'B' }],
          dueDate: '2026-05-25',
          priority: 'high',
          status: 'in_progress',
          subtaskIds: ['subtask-1', 'subtask-2'],
          tagIds: [tag.id],
          title: 'Build board',
        }),
      ],
    })

    expect(cards[0].projectName).toBe('SaaS Platform')
    expect(cards[0].assigneeName).toBe('Ada Lovelace')
    expect(cards[0].checklistSummary).toBe('1/2 complete')
    expect(cards[0].subtaskSummary).toBe('1/2 done')
    expect(cards[0].tagNames).toEqual(['Frontend'])
  })

  it('groups by configured columns and keeps empty ones', () => {
    const cards = buildGlobalKanbanCards({
      members: [],
      projects: [project],
      subtasks: [],
      tags: [],
      tasks: [createTask({ id: 'task-1', status: 'todo' }), createTask({ id: 'task-2', status: 'done' })],
    })

    const columns = groupGlobalKanbanCards(cards)
    expect(columns).toHaveLength(6)
    expect(columns.find((column) => column.status === 'todo')?.cards.map((card) => card.id)).toEqual(['task-1'])
    expect(columns.find((column) => column.status === 'done')?.cards.map((card) => card.id)).toEqual(['task-2'])
    expect(columns.find((column) => column.status === 'blocked')?.cards).toEqual([])
  })

  it('filters by project, priority, assignee, and tag', () => {
    const cards = buildGlobalKanbanCards({
      members: [member],
      projects: [project, { ...project, id: 'project-2', title: 'Infra', taskIds: ['task-2'] }],
      subtasks: [],
      tags: [tag],
      tasks: [
        createTask({ id: 'task-1', assigneeMemberId: member.id, priority: 'high', tagIds: [tag.id], projectId: project.id }),
        createTask({ id: 'task-2', projectId: 'project-2', priority: 'low' }),
      ],
    })

    const filters = createEmptyGlobalKanbanFilters()
    const byProject = filterGlobalKanbanCards(cards, { ...filters, projectId: 'project-2' })
    const byPriority = filterGlobalKanbanCards(cards, { ...filters, priority: 'high' })
    const byAssignee = filterGlobalKanbanCards(cards, { ...filters, assigneeId: member.id })
    const byUnassigned = filterGlobalKanbanCards(cards, { ...filters, assigneeId: UNASSIGNED_FILTER_VALUE })
    const byTag = filterGlobalKanbanCards(cards, { ...filters, tagId: tag.id })

    expect(byProject.map((card) => card.id)).toEqual(['task-2'])
    expect(byPriority.map((card) => card.id)).toEqual(['task-1'])
    expect(byAssignee.map((card) => card.id)).toEqual(['task-1'])
    expect(byUnassigned.map((card) => card.id)).toEqual(['task-2'])
    expect(byTag.map((card) => card.id)).toEqual(['task-1'])
  })
})
