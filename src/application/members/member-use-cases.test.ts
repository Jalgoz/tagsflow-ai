import { describe, expect, it } from 'vitest'
import type { CreateMemberInput, Member, MemberRepository, ProjectRepository, SubtaskRepository, TaskRepository, UpdateMemberInput } from '../../domain'
import { createMemberUseCases } from './member-use-cases'

const createMember = (overrides: Partial<Member> = {}): Member => ({
  id: 'member-1',
  name: 'Ada Lovelace',
  email: 'ada@example.com',
  role: 'Engineer',
  avatar: 'AL',
  ...overrides,
})

const createMemberRepository = (initialMembers: Member[] = []): MemberRepository => {
  const state = {
    members: [...initialMembers],
  }

  return {
    list: async () => state.members,
    getById: async (id) => state.members.find((member) => member.id === id) ?? null,
    create: async (input: CreateMemberInput) => {
      const member = createMember({ ...input, id: `member-${state.members.length + 1}` })
      state.members.push(member)
      return member
    },
    update: async (id: string, input: UpdateMemberInput) => {
      const index = state.members.findIndex((member) => member.id === id)

      if (index < 0) {
        throw new Error(`Member with ID "${id}" was not found.`)
      }

      const updatedMember = { ...state.members[index], ...input }
      state.members[index] = updatedMember
      return updatedMember
    },
    delete: async (id: string) => {
      state.members = state.members.filter((member) => member.id !== id)
    },
  }
}

const createProjectRepository = (memberIdsByProjectId: Record<string, string[]> = {}): ProjectRepository => {
  return {
    list: async () =>
      Object.entries(memberIdsByProjectId).map(([id, memberIds]) => ({
        id,
        title: 'Project',
        description: 'Description',
        objective: 'Objective',
        inScopeContent: 'In scope',
        outOfScopeContent: 'Out of scope',
        status: 'active',
        startDate: null,
        dueDate: null,
        memberIds,
        taskIds: [],
      })),
    getById: async () => null,
    create: async () => {
      throw new Error('Not implemented in test repository.')
    },
    update: async () => {
      throw new Error('Not implemented in test repository.')
    },
    delete: async () => {},
    assignMember: async () => {
      throw new Error('Not implemented in test repository.')
    },
    unassignMember: async () => {
      throw new Error('Not implemented in test repository.')
    },
    setMemberIds: async () => {
      throw new Error('Not implemented in test repository.')
    },
  }
}

const createTaskRepository = (
  assigneeByTaskId: Record<string, string | null> = {},
): TaskRepository => {
  return {
    list: async () =>
      Object.entries(assigneeByTaskId).map(([id, assigneeMemberId]) => ({
        id,
        projectId: 'project-1',
        title: 'Task',
        description: 'Description',
        inScopeContent: 'In scope',
        outOfScopeContent: 'Out of scope',
        priority: 'medium',
        status: 'todo',
        startDate: null,
        dueDate: null,
        assigneeMemberId,
        tagIds: [],
        checklist: [],
        subtaskIds: [],
      })),
    listByProjectId: async () => [],
    getById: async () => null,
    create: async () => {
      throw new Error('Not implemented in test repository.')
    },
    update: async () => {
      throw new Error('Not implemented in test repository.')
    },
    delete: async () => {},
    setStatus: async () => {
      throw new Error('Not implemented in test repository.')
    },
    assignMember: async () => {
      throw new Error('Not implemented in test repository.')
    },
    setTagIds: async () => {
      throw new Error('Not implemented in test repository.')
    },
    setChecklist: async () => {
      throw new Error('Not implemented in test repository.')
    },
    setSubtaskIds: async () => {
      throw new Error('Not implemented in test repository.')
    },
  }
}

const createSubtaskRepository = (
  assigneeBySubtaskId: Record<string, string | null> = {},
): SubtaskRepository => {
  return {
    list: async () =>
      Object.entries(assigneeBySubtaskId).map(([id, assigneeMemberId]) => ({
        id,
        taskId: 'task-1',
        title: 'Subtask',
        description: 'Description',
        inScopeContent: 'In scope',
        outOfScopeContent: 'Out of scope',
        priority: 'low',
        status: 'backlog',
        startDate: null,
        dueDate: null,
        assigneeMemberId,
        tagIds: [],
        checklist: [],
      })),
    listByTaskId: async () => [],
    getById: async () => null,
    create: async () => {
      throw new Error('Not implemented in test repository.')
    },
    update: async () => {
      throw new Error('Not implemented in test repository.')
    },
    delete: async () => {},
    setStatus: async () => {
      throw new Error('Not implemented in test repository.')
    },
    assignMember: async () => {
      throw new Error('Not implemented in test repository.')
    },
    setTagIds: async () => {
      throw new Error('Not implemented in test repository.')
    },
    setChecklist: async () => {
      throw new Error('Not implemented in test repository.')
    },
  }
}

describe('member use cases', () => {
  it('lists members', async () => {
    const member = createMember({ id: 'member-1' })
    const useCases = createMemberUseCases({
      members: createMemberRepository([member]),
      projects: createProjectRepository(),
      tasks: createTaskRepository(),
      subtasks: createSubtaskRepository(),
    })

    await expect(useCases.listMembers()).resolves.toEqual([member])
  })

  it('gets a member by id', async () => {
    const member = createMember({ id: 'member-1' })
    const useCases = createMemberUseCases({
      members: createMemberRepository([member]),
      projects: createProjectRepository(),
      tasks: createTaskRepository(),
      subtasks: createSubtaskRepository(),
    })

    await expect(useCases.getMemberById('member-1')).resolves.toEqual(member)
    await expect(useCases.getMemberById('missing')).resolves.toBeNull()
  })

  it('creates a member', async () => {
    const useCases = createMemberUseCases({
      members: createMemberRepository(),
      projects: createProjectRepository(),
      tasks: createTaskRepository(),
      subtasks: createSubtaskRepository(),
    })

    await expect(
      useCases.createMember({
        name: 'Grace Hopper',
        email: 'grace@example.com',
        role: 'Engineer',
        avatar: 'GH',
      }),
    ).resolves.toMatchObject({
      id: 'member-1',
      name: 'Grace Hopper',
    })
  })

  it('updates a member', async () => {
    const member = createMember({ id: 'member-1' })
    const useCases = createMemberUseCases({
      members: createMemberRepository([member]),
      projects: createProjectRepository(),
      tasks: createTaskRepository(),
      subtasks: createSubtaskRepository(),
    })

    await expect(useCases.updateMember('member-1', { role: 'Lead engineer' })).resolves.toMatchObject({
      id: 'member-1',
      role: 'Lead engineer',
    })
  })

  it('deletes a member', async () => {
    const member = createMember({ id: 'member-1' })
    const repository = createMemberRepository([member])
    const useCases = createMemberUseCases({
      members: repository,
      projects: createProjectRepository(),
      tasks: createTaskRepository(),
      subtasks: createSubtaskRepository(),
    })

    await expect(useCases.deleteMember('member-1')).resolves.toBeUndefined()
    await expect(useCases.listMembers()).resolves.toEqual([])
  })

  it('detects assignments before member deletion', async () => {
    const useCases = createMemberUseCases({
      members: createMemberRepository(),
      projects: createProjectRepository({
        'project-1': ['member-1'],
        'project-2': ['member-2'],
      }),
      tasks: createTaskRepository({
        'task-1': 'member-1',
        'task-2': 'member-1',
      }),
      subtasks: createSubtaskRepository({
        'subtask-1': 'member-1',
      }),
    })

    await expect(useCases.getMemberUsageSummary('member-1')).resolves.toEqual({
      projectCount: 1,
      taskCount: 2,
      subtaskCount: 1,
      totalCount: 4,
      isAssigned: true,
    })
  })
})
