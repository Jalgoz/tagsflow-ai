import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { act, renderHook, waitFor } from '@testing-library/react'
import type { ReactNode } from 'react'
import { describe, expect, it } from 'vitest'
import type { CreateMemberInput, Member, MemberRepository, ProjectRepository, SubtaskRepository, TaskRepository, UpdateMemberInput } from '../../domain'
import { MemberManagementRepositoryProvider, useCreateMember, useDeleteMember, useMember, useMembers, useUpdateMember } from './index'

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

const createProjectRepository = (): ProjectRepository => ({
  list: async () => [],
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
})

const createTaskRepository = (): TaskRepository => ({
  list: async () => [],
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
})

const createSubtaskRepository = (): SubtaskRepository => ({
  list: async () => [],
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
})

const createWrapper = (repository: MemberRepository) => {
  const queryClient = new QueryClient({
    defaultOptions: {
      queries: {
        retry: false,
      },
    },
  })

  const Wrapper = ({ children }: { children: ReactNode }) => {
    return (
      <QueryClientProvider client={queryClient}>
        <MemberManagementRepositoryProvider
          repositories={{
            members: repository,
            projects: createProjectRepository(),
            tasks: createTaskRepository(),
            subtasks: createSubtaskRepository(),
          }}
        >
          {children}
        </MemberManagementRepositoryProvider>
      </QueryClientProvider>
    )
  }

  return Wrapper
}

describe('member hooks', () => {
  it('loads members and individual members', async () => {
    const member = createMember({ id: 'member-1' })
    const wrapper = createWrapper(createMemberRepository([member]))

    const membersResult = renderHook(() => useMembers(), { wrapper })
    const memberResult = renderHook(() => useMember('member-1'), { wrapper })

    await waitFor(() => expect(membersResult.result.current.isSuccess).toBe(true))
    await waitFor(() => expect(memberResult.result.current.isSuccess).toBe(true))

    expect(membersResult.result.current.data).toEqual([member])
    expect(memberResult.result.current.data).toEqual(member)
  })

  it('creates members and refreshes the list', async () => {
    const wrapper = createWrapper(createMemberRepository())
    const membersResult = renderHook(() => useMembers(), { wrapper })
    const createResult = renderHook(() => useCreateMember(), { wrapper })

    await waitFor(() => expect(membersResult.result.current.isSuccess).toBe(true))

    await act(async () => {
      await createResult.result.current.mutateAsync({
        name: 'Grace Hopper',
        email: 'grace@example.com',
        role: 'Engineer',
        avatar: 'GH',
      })
    })

    await waitFor(() => expect(membersResult.result.current.data).toHaveLength(1))
    expect(membersResult.result.current.data?.[0]?.name).toBe('Grace Hopper')
  })

  it('updates members and refreshes the detail view', async () => {
    const member = createMember({ id: 'member-1' })
    const repository = createMemberRepository([member])
    const wrapper = createWrapper(repository)
    const memberResult = renderHook(() => useMember('member-1'), { wrapper })
    const updateResult = renderHook(() => useUpdateMember(), { wrapper })

    await waitFor(() => expect(memberResult.result.current.isSuccess).toBe(true))

    await act(async () => {
      await updateResult.result.current.mutateAsync({
        memberId: 'member-1',
        input: { role: 'Lead engineer' },
      })
    })

    await expect(repository.getById('member-1')).resolves.toMatchObject({
      role: 'Lead engineer',
    })
  })

  it('deletes members and refreshes the list', async () => {
    const member = createMember({ id: 'member-1' })
    const repository = createMemberRepository([member])
    const wrapper = createWrapper(repository)
    const membersResult = renderHook(() => useMembers(), { wrapper })
    const deleteResult = renderHook(() => useDeleteMember(), { wrapper })

    await waitFor(() => expect(membersResult.result.current.isSuccess).toBe(true))

    await act(async () => {
      await deleteResult.result.current.mutateAsync('member-1')
    })

    await expect(repository.list()).resolves.toEqual([])
  })
})
