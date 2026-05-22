import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import type { CreateTagInput, Tag, UpdateTagInput } from '../../domain'
import { tagQueryKeys } from './tag-query-keys'
import { createTagUseCases } from './tag-use-cases'
import { useTagManagementRepositories } from './tag-repository-context'

type UpdateTagVariables = {
  tagId: string
  input: UpdateTagInput
}

type FindOrCreateTagVariables = {
  name: string
  color?: string
}

const invalidateTagQueries = async (queryClient: ReturnType<typeof useQueryClient>, tagId?: string) => {
  await Promise.all([
    queryClient.invalidateQueries({ queryKey: tagQueryKeys.list() }),
    tagId === undefined ? Promise.resolve() : queryClient.invalidateQueries({ queryKey: tagQueryKeys.detail(tagId) }),
  ])
}

const upsertTagInList = (currentTags: Tag[] | undefined, nextTag: Tag): Tag[] => {
  const tags = currentTags ?? []
  const withoutNextTag = tags.filter((tag) => tag.id !== nextTag.id)

  return [...withoutNextTag, nextTag]
}

export const useTags = () => {
  const repositories = useTagManagementRepositories()

  return useQuery({
    queryKey: tagQueryKeys.list(),
    queryFn: () => createTagUseCases(repositories).listTags(),
  })
}

export const useTag = (tagId: string | undefined) => {
  const repositories = useTagManagementRepositories()

  return useQuery({
    enabled: tagId !== undefined,
    queryKey: tagId === undefined ? tagQueryKeys.list() : tagQueryKeys.detail(tagId),
    queryFn: async () => {
      if (tagId === undefined) {
        return null
      }

      return createTagUseCases(repositories).getTagById(tagId)
    },
  })
}

export const useCreateTag = () => {
  const repositories = useTagManagementRepositories()
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: async (input: CreateTagInput) => createTagUseCases(repositories).createTag(input),
    onSuccess: async (createdTag) => {
      queryClient.setQueryData<Tag[]>(tagQueryKeys.list(), (currentTags) => upsertTagInList(currentTags, createdTag))
      await invalidateTagQueries(queryClient)
    },
  })
}

export const useUpdateTag = () => {
  const repositories = useTagManagementRepositories()
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: async ({ tagId, input }: UpdateTagVariables) => createTagUseCases(repositories).updateTag(tagId, input),
    onSuccess: async (updatedTag, variables) => {
      queryClient.setQueryData(tagQueryKeys.detail(variables.tagId), updatedTag)
      queryClient.setQueryData<Tag[]>(tagQueryKeys.list(), (currentTags) => upsertTagInList(currentTags, updatedTag))
      await invalidateTagQueries(queryClient, variables.tagId)
    },
  })
}

export const useDeleteTag = () => {
  const repositories = useTagManagementRepositories()
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: async (tagId: string) => createTagUseCases(repositories).deleteTag(tagId),
    onSuccess: async (_result, tagId) => {
      queryClient.setQueryData<Tag[]>(tagQueryKeys.list(), (currentTags = []) =>
        currentTags.filter((tag) => tag.id !== tagId),
      )
      queryClient.removeQueries({ queryKey: tagQueryKeys.detail(tagId) })
      await invalidateTagQueries(queryClient, tagId)
    },
  })
}

export const useFindOrCreateTag = () => {
  const repositories = useTagManagementRepositories()
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: async (variables: FindOrCreateTagVariables) =>
      createTagUseCases(repositories).findOrCreateTagByName(variables.name, variables.color),
    onSuccess: async (tag) => {
      queryClient.setQueryData<Tag[]>(tagQueryKeys.list(), (currentTags) => upsertTagInList(currentTags, tag))
      queryClient.setQueryData(tagQueryKeys.detail(tag.id), tag)
      await invalidateTagQueries(queryClient, tag.id)
    },
  })
}
