import { describe, expect, it } from 'vitest'
import type { Member, Project, Subtask, Tag, Task } from '../../domain'
import {
  MAX_PRIORITY_INSTRUCTION_LENGTH,
  MAX_PRIORITY_PROJECT_TEXT_LENGTH,
  MAX_PRIORITY_SIBLING_TASK_CONTEXT_COUNT,
  MAX_PRIORITY_SUBTASK_CONTEXT_COUNT,
  buildPrioritySuggestionRequest,
  PrioritySuggestionInputError,
} from './priority-suggestion-input'

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
  inScopeContent: 'Selected scope',
  outOfScopeContent: 'Outside scope',
  priority: 'medium',
  status: 'todo',
  startDate: '2026-06-02',
  dueDate: '2026-06-12',
  assigneeMemberId: 'member-1',
  tagIds: ['tag-1', 'tag-2'],
  checklist: [
    { text: 'Define scope', completed: true },
    { text: 'Review metrics', completed: false },
    { text: 'Prepare release notes', completed: false },
  ],
  subtaskIds: ['subtask-1', 'subtask-2', 'subtask-3'],
  ...overrides,
})

const createSubtask = (overrides: Partial<Subtask> = {}): Subtask => ({
  id: 'subtask-1',
  taskId: 'task-1',
  title: 'Implement first pass',
  description: '',
  inScopeContent: '',
  outOfScopeContent: '',
  priority: 'high',
  status: 'done',
  startDate: null,
  dueDate: null,
  assigneeMemberId: null,
  tagIds: [],
  checklist: [],
  ...overrides,
})

const createTag = (overrides: Partial<Tag> = {}): Tag => ({
  id: 'tag-1',
  name: 'Planning',
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

describe('buildPrioritySuggestionRequest', () => {
  it('builds selected-task context and omits unrelated tasks', () => {
    const request = buildPrioritySuggestionRequest({
      project: createProject(),
      task: createTask({ tagIds: ['tag-1', 'tag-3'] }),
      tasks: [
        createTask(),
        createTask({ id: 'task-2', title: 'Same project sibling', priority: 'high', status: 'blocked', dueDate: '2026-06-18' }),
        createTask({
          id: 'task-3',
          projectId: 'project-2',
          title: 'Unrelated project task',
          priority: 'urgent',
          status: 'done',
        }),
      ],
      subtasks: [
        createSubtask(),
        createSubtask({ id: 'subtask-2', title: 'Second pass', status: 'todo' }),
        createSubtask({ id: 'subtask-3', title: 'Third pass', status: 'todo' }),
      ],
      tags: [createTag(), createTag({ id: 'tag-2', name: 'planning' }), createTag({ id: 'tag-3', name: 'Frontend' })],
      members: [createMember(), createMember({ id: 'member-2', name: 'Casey Smith' })],
    })

    expect(request.project.title).toBe('Platform refresh')
    expect(request.selectedTask.currentPriority).toBe('medium')
    expect(request.selectedTask.assigneeName).toBe('Alex Doe')
    expect(request.selectedTask.tagNames).toEqual(['Frontend', 'Planning'])
    expect(request.selectedTask.checklistSummary).toContain('1/3 complete')
    expect(request.selectedTask.subtaskProgressSummary).toContain('1/3 complete')
    expect(request.siblingTasks).toHaveLength(1)
    expect(request.siblingTasks[0]).toMatchObject({
      title: 'Same project sibling',
      priority: 'high',
      status: 'blocked',
    })
  })

  it('truncates project and task text, uses deterministic limits, and keeps ordering stable', () => {
    const siblingTasks = Array.from({ length: MAX_PRIORITY_SIBLING_TASK_CONTEXT_COUNT + 2 }, (_, index) =>
      createTask({
        id: `task-${index + 2}`,
        title: `Sibling ${index + 1}`,
      }),
    )
    const subtasks = Array.from({ length: MAX_PRIORITY_SUBTASK_CONTEXT_COUNT + 2 }, (_, index) =>
      createSubtask({
        id: `subtask-${index + 1}`,
        title: `Subtask ${index + 1}`,
        status: index === 0 ? 'done' : 'todo',
      }),
    )
    const longText = 'A'.repeat(MAX_PRIORITY_PROJECT_TEXT_LENGTH + 25)

    const request = buildPrioritySuggestionRequest({
      project: createProject({ title: longText, description: longText }),
      task: createTask({
        title: longText,
        description: longText,
        checklist: Array.from({ length: 7 }, (_, index) => ({
          text: `Checklist item ${index + 1}`,
          completed: index === 0,
        })),
        subtaskIds: subtasks.map((subtask) => subtask.id),
      }),
      tasks: [createTask(), ...siblingTasks, createTask({ id: 'task-unrelated', projectId: 'project-2' })],
      subtasks,
      tags: [],
      members: [],
    })

    expect(request.project.title.length).toBe(MAX_PRIORITY_PROJECT_TEXT_LENGTH)
    expect(request.project.title.endsWith('...')).toBe(true)
    expect(request.siblingTasks).toHaveLength(MAX_PRIORITY_SIBLING_TASK_CONTEXT_COUNT)
    expect(request.siblingTasks[0]?.title).toBe('Sibling 1')
    expect(request.selectedTask.checklistSummary).toContain('Checklist item 1')
    expect(request.selectedTask.checklistSummary).toContain('...')
    expect(request.selectedTask.subtaskProgressSummary).toContain('...')
  })

  it('trims instructions, omits whitespace-only instructions, and blocks over-limit input', () => {
    const request = buildPrioritySuggestionRequest({
      project: createProject(),
      task: createTask(),
      tasks: [createTask()],
      subtasks: [],
      tags: [],
      members: [],
      additionalInstructions: '   Prioritize release blockers first.   ',
    })

    expect(request.additionalInstructions).toBe('Prioritize release blockers first.')

    const whitespaceRequest = buildPrioritySuggestionRequest({
      project: createProject(),
      task: createTask(),
      tasks: [createTask()],
      subtasks: [],
      tags: [],
      members: [],
      additionalInstructions: '   \n\t  ',
    })

    expect(whitespaceRequest.additionalInstructions).toBeUndefined()

    expect(() =>
      buildPrioritySuggestionRequest({
        project: createProject(),
        task: createTask(),
        tasks: [createTask()],
        subtasks: [],
        tags: [],
        members: [],
        additionalInstructions: 'A'.repeat(MAX_PRIORITY_INSTRUCTION_LENGTH + 1),
      }),
    ).toThrow(PrioritySuggestionInputError)
  })
})
