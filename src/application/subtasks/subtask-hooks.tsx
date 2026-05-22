import { useMutation, useQuery, useQueryClient, type QueryClient } from '@tanstack/react-query'
import type { ChecklistItem, CreateSubtaskInput, Subtask, TaskStatus, UpdateSubtaskInput } from '../../domain'
import { taskQueryKeys } from '../tasks'
import { subtaskQueryKeys } from './subtask-query-keys'
import { useSubtaskRepository } from './subtask-repository-context'
import { createSubtaskUseCases } from './subtask-use-cases'

type UpdateSubtaskVariables = {
  subtaskId: string
  input: UpdateSubtaskInput
  taskId?: string
}

type UpdateSubtaskStatusVariables = {
  subtaskId: string
  status: TaskStatus
  taskId?: string
}

type UpdateSubtaskAssigneeVariables = {
  subtaskId: string
  memberId: string | null
  taskId?: string
}

type UpdateSubtaskTagsVariables = {
  subtaskId: string
  tagIds: string[]
  taskId?: string
}

type UpdateSubtaskChecklistVariables = {
  subtaskId: string
  checklist: ChecklistItem[]
  taskId?: string
}

const invalidateSubtaskQueries = async (queryClient: QueryClient, subtaskId?: string, taskId?: string) => {
  await Promise.all([
    queryClient.invalidateQueries({ queryKey: subtaskQueryKeys.list() }),
    subtaskId === undefined
      ? Promise.resolve()
      : queryClient.invalidateQueries({ queryKey: subtaskQueryKeys.detail(subtaskId) }),
    taskId === undefined
      ? Promise.resolve()
      : queryClient.invalidateQueries({ queryKey: subtaskQueryKeys.taskList(taskId) }),
    taskId === undefined ? Promise.resolve() : queryClient.invalidateQueries({ queryKey: taskQueryKeys.detail(taskId) }),
  ])
}

const upsertSubtaskInList = (currentSubtasks: Subtask[] | undefined, nextSubtask: Subtask): Subtask[] => {
  const subtasks = currentSubtasks ?? []
  const withoutNextSubtask = subtasks.filter((subtask) => subtask.id !== nextSubtask.id)

  return [...withoutNextSubtask, nextSubtask]
}

export const useSubtasksByTask = (taskId: string | undefined) => {
  const repository = useSubtaskRepository()

  return useQuery({
    enabled: taskId !== undefined,
    queryKey: taskId === undefined ? subtaskQueryKeys.list() : subtaskQueryKeys.taskList(taskId),
    queryFn: async () => {
      if (taskId === undefined) {
        return []
      }

      return createSubtaskUseCases(repository).listSubtasksByTask(taskId)
    },
  })
}

export const useCreateSubtask = () => {
  const repository = useSubtaskRepository()
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: async (input: CreateSubtaskInput) => createSubtaskUseCases(repository).createSubtask(input),
    onSuccess: async (createdSubtask) => {
      queryClient.setQueryData<Subtask[]>(subtaskQueryKeys.list(), (currentSubtasks) =>
        upsertSubtaskInList(currentSubtasks, createdSubtask),
      )
      queryClient.setQueryData<Subtask[]>(subtaskQueryKeys.taskList(createdSubtask.taskId), (currentSubtasks) =>
        upsertSubtaskInList(currentSubtasks, createdSubtask),
      )
      await invalidateSubtaskQueries(queryClient, createdSubtask.id, createdSubtask.taskId)
    },
  })
}

export const useUpdateSubtask = () => {
  const repository = useSubtaskRepository()
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: async ({ subtaskId, input }: UpdateSubtaskVariables) =>
      createSubtaskUseCases(repository).updateSubtask(subtaskId, input),
    onSuccess: async (updatedSubtask, variables) => {
      const taskId = variables.taskId ?? updatedSubtask.taskId
      queryClient.setQueryData(subtaskQueryKeys.detail(variables.subtaskId), updatedSubtask)
      queryClient.setQueryData<Subtask[]>(subtaskQueryKeys.list(), (currentSubtasks) =>
        upsertSubtaskInList(currentSubtasks, updatedSubtask),
      )
      queryClient.setQueryData<Subtask[]>(subtaskQueryKeys.taskList(taskId), (currentSubtasks) =>
        upsertSubtaskInList(currentSubtasks, updatedSubtask),
      )
      await invalidateSubtaskQueries(queryClient, variables.subtaskId, taskId)
    },
  })
}

export const useDeleteSubtask = () => {
  const repository = useSubtaskRepository()
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: async ({ subtaskId }: { subtaskId: string; taskId?: string }) =>
      createSubtaskUseCases(repository).deleteSubtask(subtaskId),
    onSuccess: async (_result, variables) => {
      queryClient.setQueryData<Subtask[]>(subtaskQueryKeys.list(), (currentSubtasks = []) =>
        currentSubtasks.filter((subtask) => subtask.id !== variables.subtaskId),
      )
      if (variables.taskId !== undefined) {
        queryClient.setQueryData<Subtask[]>(subtaskQueryKeys.taskList(variables.taskId), (currentSubtasks = []) =>
          currentSubtasks.filter((subtask) => subtask.id !== variables.subtaskId),
        )
      }
      queryClient.removeQueries({ queryKey: subtaskQueryKeys.detail(variables.subtaskId) })
      await invalidateSubtaskQueries(queryClient, variables.subtaskId, variables.taskId)
    },
  })
}

export const useUpdateSubtaskStatus = () => {
  const repository = useSubtaskRepository()
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: async ({ subtaskId, status }: UpdateSubtaskStatusVariables) =>
      createSubtaskUseCases(repository).updateSubtaskStatus(subtaskId, status),
    onSuccess: async (updatedSubtask, variables) => {
      await invalidateSubtaskQueries(queryClient, variables.subtaskId, variables.taskId ?? updatedSubtask.taskId)
    },
  })
}

export const useUpdateSubtaskAssignee = () => {
  const repository = useSubtaskRepository()
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: async ({ subtaskId, memberId }: UpdateSubtaskAssigneeVariables) =>
      createSubtaskUseCases(repository).updateSubtaskAssignee(subtaskId, memberId),
    onSuccess: async (updatedSubtask, variables) => {
      await invalidateSubtaskQueries(queryClient, variables.subtaskId, variables.taskId ?? updatedSubtask.taskId)
    },
  })
}

export const useUpdateSubtaskTags = () => {
  const repository = useSubtaskRepository()
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: async ({ subtaskId, tagIds }: UpdateSubtaskTagsVariables) =>
      createSubtaskUseCases(repository).updateSubtaskTags(subtaskId, tagIds),
    onSuccess: async (updatedSubtask, variables) => {
      await invalidateSubtaskQueries(queryClient, variables.subtaskId, variables.taskId ?? updatedSubtask.taskId)
    },
  })
}

export const useUpdateSubtaskChecklist = () => {
  const repository = useSubtaskRepository()
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: async ({ subtaskId, checklist }: UpdateSubtaskChecklistVariables) =>
      createSubtaskUseCases(repository).updateSubtaskChecklist(subtaskId, checklist),
    onSuccess: async (updatedSubtask, variables) => {
      await invalidateSubtaskQueries(queryClient, variables.subtaskId, variables.taskId ?? updatedSubtask.taskId)
    },
  })
}
