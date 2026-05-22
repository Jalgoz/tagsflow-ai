import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import type { CreateMemberInput, Member, UpdateMemberInput } from '../../domain'
import { memberQueryKeys } from './member-query-keys'
import { createMemberUseCases } from './member-use-cases'
import { useMemberManagementRepositories } from './member-repository-context'

type UpdateMemberVariables = {
  memberId: string
  input: UpdateMemberInput
}

const invalidateMemberQueries = async (queryClient: ReturnType<typeof useQueryClient>, memberId?: string) => {
  await Promise.all([
    queryClient.invalidateQueries({ queryKey: memberQueryKeys.list() }),
    memberId === undefined
      ? Promise.resolve()
      : queryClient.invalidateQueries({ queryKey: memberQueryKeys.detail(memberId) }),
  ])
}

const upsertMemberInList = (currentMembers: Member[] | undefined, nextMember: Member): Member[] => {
  const members = currentMembers ?? []
  const withoutNextMember = members.filter((member) => member.id !== nextMember.id)

  return [...withoutNextMember, nextMember]
}

export const useMembers = () => {
  const repositories = useMemberManagementRepositories()

  return useQuery({
    queryKey: memberQueryKeys.list(),
    queryFn: () => createMemberUseCases(repositories).listMembers(),
  })
}

export const useMember = (memberId: string | undefined) => {
  const repositories = useMemberManagementRepositories()

  return useQuery({
    enabled: memberId !== undefined,
    queryKey: memberId === undefined ? memberQueryKeys.list() : memberQueryKeys.detail(memberId),
    queryFn: async () => {
      if (memberId === undefined) {
        return null
      }

      return createMemberUseCases(repositories).getMemberById(memberId)
    },
  })
}

export const useCreateMember = () => {
  const repositories = useMemberManagementRepositories()
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: async (input: CreateMemberInput) => createMemberUseCases(repositories).createMember(input),
    onSuccess: async (createdMember) => {
      queryClient.setQueryData<Member[]>(memberQueryKeys.list(), (currentMembers) =>
        upsertMemberInList(currentMembers, createdMember),
      )
      await invalidateMemberQueries(queryClient)
    },
  })
}

export const useUpdateMember = () => {
  const repositories = useMemberManagementRepositories()
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: async ({ memberId, input }: UpdateMemberVariables) =>
      createMemberUseCases(repositories).updateMember(memberId, input),
    onSuccess: async (updatedMember, variables) => {
      queryClient.setQueryData(memberQueryKeys.detail(variables.memberId), updatedMember)
      queryClient.setQueryData<Member[]>(memberQueryKeys.list(), (currentMembers) =>
        upsertMemberInList(currentMembers, updatedMember),
      )
      await invalidateMemberQueries(queryClient, variables.memberId)
    },
  })
}

export const useDeleteMember = () => {
  const repositories = useMemberManagementRepositories()
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: async (memberId: string) => createMemberUseCases(repositories).deleteMember(memberId),
    onSuccess: async (_result, memberId) => {
      queryClient.setQueryData<Member[]>(memberQueryKeys.list(), (currentMembers = []) =>
        currentMembers.filter((member) => member.id !== memberId),
      )
      queryClient.removeQueries({ queryKey: memberQueryKeys.detail(memberId) })
      await invalidateMemberQueries(queryClient, memberId)
    },
  })
}
