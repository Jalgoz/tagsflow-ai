import { describe, expect, it } from 'vitest'
import type { Member, Project, Subtask, Tag, Task } from '../../domain'
import {
  buildProjectSummaryRequest,
  MAX_PROJECT_SUMMARY_INSTRUCTION_LENGTH,
  PROJECT_SUMMARY_MAX_CONTEXT_TASKS,
  PROJECT_SUMMARY_MAX_PROJECT_TEXT_LENGTH,
  ProjectSummaryInputError,
} from './project-summary-input'

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
  memberIds: ['member-1'],
  taskIds: ['task-1', 'task-2', 'task-3'],
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

const createSubtask = (overrides: Partial<Subtask> = {}): Subtask => ({
  id: 'subtask-1',
  taskId: 'task-1',
  title: 'Audit navigation',
  description: 'Review nav states.',
  inScopeContent: '',
  outOfScopeContent: '',
  priority: 'medium',
  status: 'todo',
  startDate: null,
  dueDate: '2026-06-10',
  assigneeMemberId: null,
  tagIds: [],
  checklist: [],
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

describe('buildProjectSummaryRequest', () => {
  it('builds bounded summary context from current project data only', () => {
    const request = buildProjectSummaryRequest({
      project: createProject(),
      tasks: [
        createTask({
          id: 'task-1',
          status: 'blocked',
          priority: 'high',
          assigneeMemberId: 'member-1',
          tagIds: ['tag-1'],
          checklist: [
            { text: 'Audit active states', completed: true },
            { text: 'Audit empty states', completed: false },
          ],
          subtaskIds: ['subtask-1', 'subtask-2'],
        }),
        createTask({
          id: 'task-2',
          title: 'Resolve broken filters',
          priority: 'urgent',
          status: 'todo',
          dueDate: '2026-06-08',
        }),
        createTask({
          id: 'task-3',
          title: 'Ship quick fixes',
          priority: 'medium',
          status: 'done',
          dueDate: '2026-06-18',
        }),
        createTask({
          id: 'task-outside',
          projectId: 'other-project',
          title: 'Ignore me',
        }),
      ],
      subtasks: [
        createSubtask({
          id: 'subtask-1',
          taskId: 'task-1',
          status: 'done',
        }),
        createSubtask({
          id: 'subtask-2',
          taskId: 'task-1',
          title: 'Check modals',
          assigneeMemberId: 'member-2',
          status: 'blocked',
        }),
        createSubtask({
          id: 'subtask-outside',
          taskId: 'task-outside',
          title: 'Ignore me too',
        }),
      ],
      tags: [createTag(), createTag({ id: 'tag-2', name: 'Frontend' })],
      members: [createMember(), createMember({ id: 'member-2', name: 'Casey Smith' })],
      referenceDate: '2026-06-09',
    })

    expect(request.project.progressPercent).toBe(50)
    expect(request.taskCounts).toEqual({
      backlog: 0,
      todo: 1,
      in_progress: 0,
      blocked: 1,
      review: 0,
      done: 1,
    })
    expect(request.priorityCounts).toEqual({
      low: 0,
      medium: 1,
      high: 1,
      urgent: 1,
    })
    expect(request.blockedTasks).toEqual([
      {
        title: 'Review current UX',
        priority: 'high',
        status: 'blocked',
        dueDate: '2026-06-12',
        assigneeName: 'Alex Doe',
      },
    ])
    expect(request.overdueTasks.map((task) => task.title)).toEqual(['Resolve broken filters'])
    expect(request.upcomingTasks.map((task) => task.title)).toEqual(['Review current UX'])
    expect(request.completedTasks).toEqual([{ title: 'Ship quick fixes', priority: 'medium' }])
    expect(request.taskDetails[0]?.tagNames).toEqual(['Planning'])
    expect(request.taskDetails[0]?.checklistSummary).toContain('1/2 checklist items completed')
    expect(request.taskDetails[0]?.subtaskSummary).toContain('1/2 subtasks completed')
    expect(request.existingTagNames).toEqual(['Planning'])
    expect(request.memberNames).toEqual(['Alex Doe', 'Casey Smith'])
  })

  it('keeps missing optional fields safe without blocking generation', () => {
    const request = buildProjectSummaryRequest({
      project: createProject({
        description: '',
        objective: '',
        inScopeContent: '',
        outOfScopeContent: '',
        startDate: null,
        dueDate: null,
        taskIds: [],
      }),
      tasks: [],
      subtasks: [],
      tags: [],
      members: [],
      referenceDate: '2026-06-09',
    })

    expect(request.project.description).toBe('')
    expect(request.project.objective).toBe('')
    expect(request.project.inScopeContent).toBe('')
    expect(request.project.outOfScopeContent).toBe('')
    expect(request.project.startDate).toBeNull()
    expect(request.project.dueDate).toBeNull()
    expect(request.taskDetails).toEqual([])
    expect(request.blockedTasks).toEqual([])
    expect(request.overdueTasks).toEqual([])
    expect(request.upcomingTasks).toEqual([])
    expect(request.existingTagNames).toEqual([])
    expect(request.memberNames).toEqual([])
  })

  it('applies deterministic truncation, task limits, and name de-duplication', () => {
    const longText = 'A'.repeat(PROJECT_SUMMARY_MAX_PROJECT_TEXT_LENGTH + 20)
    const tasks = Array.from({ length: PROJECT_SUMMARY_MAX_CONTEXT_TASKS + 2 }, (_, index) =>
      createTask({
        id: `task-${index + 1}`,
        title: `Task ${index + 1}`,
        dueDate: null,
      }),
    )

    const request = buildProjectSummaryRequest({
      project: createProject({
        title: longText,
        taskIds: tasks.map((task) => task.id),
      }),
      tasks,
      subtasks: [],
      tags: [createTag({ name: 'Planning' }), createTag({ id: 'tag-2', name: 'planning' })],
      members: [createMember({ name: 'Casey Smith' }), createMember({ id: 'member-2', name: 'Casey Smith' })],
      referenceDate: '2026-06-09',
    })

    expect(request.project.title.length).toBe(PROJECT_SUMMARY_MAX_PROJECT_TEXT_LENGTH)
    expect(request.project.title.endsWith('...')).toBe(true)
    expect(request.taskDetails).toHaveLength(PROJECT_SUMMARY_MAX_CONTEXT_TASKS)
    expect(request.taskDetails[0]?.title).toBe('Task 1')
    expect(request.taskDetails.at(-1)?.title).toBe(`Task ${PROJECT_SUMMARY_MAX_CONTEXT_TASKS}`)
    expect(request.memberNames).toEqual(['Casey Smith'])
  })

  it('includes valid trimmed instructions and omits empty values', () => {
    const withInstructions = buildProjectSummaryRequest({
      project: createProject({ taskIds: [] }),
      tasks: [],
      subtasks: [],
      tags: [],
      members: [],
      instructions: '   Summarize this for a weekly stakeholder update.   ',
      referenceDate: '2026-06-09',
    })

    const withoutInstructions = buildProjectSummaryRequest({
      project: createProject({ taskIds: [] }),
      tasks: [],
      subtasks: [],
      tags: [],
      members: [],
      instructions: '   \n\t  ',
      referenceDate: '2026-06-09',
    })

    expect(withInstructions.additionalInstructions).toBe('Summarize this for a weekly stakeholder update.')
    expect(withoutInstructions.additionalInstructions).toBeUndefined()
  })

  it('rejects over-limit instructions instead of silently truncating them', () => {
    expect(() =>
      buildProjectSummaryRequest({
        project: createProject({ taskIds: [] }),
        tasks: [],
        subtasks: [],
        tags: [],
        members: [],
        instructions: 'A'.repeat(MAX_PROJECT_SUMMARY_INSTRUCTION_LENGTH + 1),
        referenceDate: '2026-06-09',
      }),
    ).toThrowError(ProjectSummaryInputError)
  })
})
