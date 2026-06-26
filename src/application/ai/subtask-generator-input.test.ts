import { describe, expect, it } from 'vitest'
import {
  MAX_SUBTASK_INSTRUCTION_LENGTH,
  buildSubtaskGenerationRequest,
} from './subtask-generator-input'
import type { Member, Project, Subtask, Tag, Task } from '../../domain'

const mockProject: Project = {
  id: 'project-1',
  title: 'Project Title',
  description: 'Project Description',
  objective: 'Project Objective',
  inScopeContent: 'In Scope',
  outOfScopeContent: 'Out of Scope',
  startDate: '2025-01-01',
  dueDate: '2025-12-31',
  status: 'active',
  memberIds: [],
  taskIds: [],
}

const mockTask: Task = {
  id: 'task-1',
  projectId: 'project-1',
  title: 'Task Title',
  description: 'Task Description',
  inScopeContent: 'Task In Scope',
  outOfScopeContent: 'Task Out of Scope',
  priority: 'high',
  status: 'todo',
  startDate: null,
  dueDate: null,
  assigneeMemberId: null,
  tagIds: [],
  checklist: [],
  subtaskIds: [],
}

const mockSubtask: Subtask = {
  id: 'subtask-1',
  taskId: 'task-1',
  title: 'Subtask Title',
  description: 'Subtask Description',
  inScopeContent: '',
  outOfScopeContent: '',
  priority: 'medium',
  status: 'todo',
  startDate: null,
  dueDate: null,
  assigneeMemberId: null,
  tagIds: [],
  checklist: [],
}

const mockTag: Tag = {
  id: 'tag-1',
  name: 'frontend',
}

const mockMember: Member = {
  id: 'member-1',
  name: 'Alice',
  email: 'alice@example.com',
  role: 'developer',
  avatar: 'A',
}

describe('buildSubtaskGenerationRequest', () => {
  it('builds context correctly with no instructions', () => {
    const request = buildSubtaskGenerationRequest({
      project: mockProject,
      task: mockTask,
      subtasks: [mockSubtask],
      tags: [mockTag],
      members: [mockMember],
    })

    expect(request.project.title).toBe('Project Title')
    expect(request.task.title).toBe('Task Title')
    expect(request.existingSubtasks).toHaveLength(1)
    expect(request.existingSubtasks[0].title).toBe('Subtask Title')
    expect(request.existingTagNames).toEqual(['frontend'])
    expect(request.memberNames).toEqual(['Alice'])
    expect(request.additionalInstructions).toBeUndefined()
  })

  it('includes trimmed instructions', () => {
    const request = buildSubtaskGenerationRequest({
      project: mockProject,
      task: mockTask,
      subtasks: [],
      tags: [],
      members: [],
      instructions: '   Please add API subtasks   ',
    })

    expect(request.additionalInstructions).toBe('Please add API subtasks')
  })

  it('omits whitespace-only instructions', () => {
    const request = buildSubtaskGenerationRequest({
      project: mockProject,
      task: mockTask,
      subtasks: [],
      tags: [],
      members: [],
      instructions: '   \n  \t  ',
    })

    expect(request.additionalInstructions).toBeUndefined()
  })

  it('truncates over-limit instructions', () => {
    const longInstruction = 'A'.repeat(MAX_SUBTASK_INSTRUCTION_LENGTH + 100)
    const request = buildSubtaskGenerationRequest({
      project: mockProject,
      task: mockTask,
      subtasks: [],
      tags: [],
      members: [],
      instructions: longInstruction,
    })

    expect(request.additionalInstructions?.length).toBe(MAX_SUBTASK_INSTRUCTION_LENGTH)
    expect(request.additionalInstructions).toBe('A'.repeat(MAX_SUBTASK_INSTRUCTION_LENGTH))
  })

  it('truncates project and task text and handles unique sorted names', () => {
    const request = buildSubtaskGenerationRequest({
      project: {
        ...mockProject,
        description: '   Spaced   Description   ',
      },
      task: {
        ...mockTask,
        title: '   Spaced   Task   ',
      },
      subtasks: [],
      tags: [{ id: '1', name: 'Zeta' }, { id: '2', name: 'alpha' }, { id: '3', name: 'ZETA' }],
      members: [],
    })

    expect(request.project.description).toBe('Spaced Description')
    expect(request.task.title).toBe('Spaced Task')
    expect(request.existingTagNames).toEqual(['alpha', 'Zeta'])
  })
})
