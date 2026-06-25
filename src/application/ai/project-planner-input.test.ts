import { describe, expect, it } from 'vitest'
import type { Member, Project, Tag, Task } from '../../domain'
import {
  PROJECT_PLANNER_MAX_CONTEXT_TASKS,
  PROJECT_PLANNER_MAX_PROJECT_TEXT_LENGTH,
  buildProjectPlannerRequest,
} from './project-planner-input'

const createProject = (overrides: Partial<Project> = {}): Project => ({
  id: 'project-1',
  title: 'Platform refresh',
  description: 'Refresh the main platform experience.',
  objective: 'Ship a stable frontend milestone.',
  inScopeContent: 'Dashboard, project detail, and settings.',
  outOfScopeContent: 'Backend services.',
  status: 'active',
  startDate: '2026-06-01',
  dueDate: '2026-06-30',
  memberIds: [],
  taskIds: [],
  ...overrides,
})

const createTask = (overrides: Partial<Task> = {}): Task => ({
  id: 'task-1',
  projectId: 'project-1',
  title: 'Review current UX',
  description: 'Audit the current task flows and identify gaps.',
  inScopeContent: '',
  outOfScopeContent: '',
  priority: 'medium',
  status: 'todo',
  startDate: null,
  dueDate: '2026-06-12',
  assigneeMemberId: null,
  tagIds: [],
  checklist: [],
  subtaskIds: [],
  ...overrides,
})

const createTag = (overrides: Partial<Tag> = {}): Tag => ({
  id: 'tag-1',
  name: 'Planning',
  color: '#4f46e5',
  ...overrides,
})

const createMember = (overrides: Partial<Member> = {}): Member => ({
  id: 'member-1',
  name: 'Alex Doe',
  email: 'alex@example.com',
  role: 'Engineer',
  avatar: '',
  ...overrides,
})

describe('buildProjectPlannerRequest', () => {
  it('builds full planner context from existing project data', () => {
    const request = buildProjectPlannerRequest({
      project: createProject(),
      tasks: [createTask()],
      tags: [createTag(), createTag({ id: 'tag-2', name: 'Frontend' })],
      members: [createMember(), createMember({ id: 'member-2', name: 'Casey Smith' })],
    })

    expect(request).toEqual({
      title: 'Platform refresh',
      description: 'Refresh the main platform experience.',
      objective: 'Ship a stable frontend milestone.',
      inScopeContent: 'Dashboard, project detail, and settings.',
      outOfScopeContent: 'Backend services.',
      startDate: '2026-06-01',
      dueDate: '2026-06-30',
      existingTasks: [
        {
          title: 'Review current UX',
          description: 'Audit the current task flows and identify gaps.',
          priority: 'medium',
          status: 'todo',
          dueDate: '2026-06-12',
        },
      ],
      existingTagNames: ['Frontend', 'Planning'],
      memberNames: ['Alex Doe', 'Casey Smith'],
    })
  })

  it('keeps missing optional fields safe without blocking generation', () => {
    const request = buildProjectPlannerRequest({
      project: createProject({
        description: '',
        objective: '',
        inScopeContent: '',
        outOfScopeContent: '',
        startDate: null,
        dueDate: null,
      }),
      tasks: [],
      tags: [],
      members: [],
    })

    expect(request.description).toBe('')
    expect(request.objective).toBe('')
    expect(request.inScopeContent).toBe('')
    expect(request.outOfScopeContent).toBe('')
    expect(request.startDate).toBeNull()
    expect(request.dueDate).toBeNull()
    expect(request.existingTasks).toEqual([])
    expect(request.existingTagNames).toEqual([])
    expect(request.memberNames).toEqual([])
  })

  it('applies deterministic truncation, task limits, and name de-duplication', () => {
    const longText = 'A'.repeat(PROJECT_PLANNER_MAX_PROJECT_TEXT_LENGTH + 20)
    const tasks = Array.from({ length: PROJECT_PLANNER_MAX_CONTEXT_TASKS + 2 }, (_, index) =>
      createTask({
        id: `task-${index + 1}`,
        title: `Task ${index + 1}`,
      }),
    )

    const request = buildProjectPlannerRequest({
      project: createProject({
        title: longText,
      }),
      tasks,
      tags: [createTag({ name: 'Planning' }), createTag({ id: 'tag-2', name: 'planning' })],
      members: [createMember({ name: 'Casey Smith' }), createMember({ id: 'member-2', name: 'Casey Smith' })],
    })

    expect(request.title.length).toBe(PROJECT_PLANNER_MAX_PROJECT_TEXT_LENGTH)
    expect(request.title.endsWith('...')).toBe(true)
    expect(request.existingTasks).toHaveLength(PROJECT_PLANNER_MAX_CONTEXT_TASKS)
    expect(request.existingTasks[0]?.title).toBe('Task 1')
    expect(request.existingTasks.at(-1)?.title).toBe(`Task ${PROJECT_PLANNER_MAX_CONTEXT_TASKS}`)
    expect(request.existingTagNames).toEqual(['Planning'])
    expect(request.memberNames).toEqual(['Casey Smith'])
  })
})
