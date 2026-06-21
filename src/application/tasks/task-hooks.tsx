import { useMutation, useQuery, useQueryClient, type QueryClient } from '@tanstack/react-query'
import type { ChecklistItem, CreateTaskInput, Task, TaskStatus, UpdateTaskInput } from '../../domain'
import { projectQueryKeys } from '../projects'
import { taskQueryKeys } from './task-query-keys'
import { useTaskRepository } from './task-repository-context'
import { createTaskUseCases } from './task-use-cases'

type UpdateTaskVariables = {
  taskId: string
  input: UpdateTaskInput
  projectId?: string
}

type UpdateTaskStatusVariables = {
  taskId: string
  status: TaskStatus
  projectId?: string
}

type UpdateTaskAssigneeVariables = {
  taskId: string
  memberId: string | null
  projectId?: string
}

type UpdateTaskTagsVariables = {
  taskId: string
  tagIds: string[]
  projectId?: string
}

type UpdateTaskChecklistVariables = {
  taskId: string
  checklist: ChecklistItem[]
  projectId?: string
}

const invalidateTaskQueries = async (queryClient: QueryClient, taskId?: string, projectId?: string) => {
  await Promise.all([
    queryClient.invalidateQueries({ queryKey: taskQueryKeys.list() }),
    taskId === undefined ? Promise.resolve() : queryClient.invalidateQueries({ queryKey: taskQueryKeys.detail(taskId) }),
    projectId === undefined
      ? Promise.resolve()
      : queryClient.invalidateQueries({ queryKey: taskQueryKeys.projectList(projectId) }),
    projectId === undefined
      ? Promise.resolve()
      : queryClient.invalidateQueries({ queryKey: projectQueryKeys.detail(projectId) }),
  ])
}

const upsertTaskInList = (currentTasks: Task[] | undefined, nextTask: Task): Task[] => {
  const tasks = currentTasks ?? []
  const withoutNextTask = tasks.filter((task) => task.id !== nextTask.id)

  return [...withoutNextTask, nextTask]
}

export const useTasks = () => {
  const repository = useTaskRepository()

  return useQuery({
    queryKey: taskQueryKeys.list(),
    queryFn: () => createTaskUseCases(repository).listTasks(),
  })
}

export const useTasksByProject = (projectId: string | undefined) => {
  const repository = useTaskRepository()

  return useQuery({
    enabled: projectId !== undefined,
    queryKey: projectId === undefined ? taskQueryKeys.list() : taskQueryKeys.projectList(projectId),
    queryFn: async () => {
      if (projectId === undefined) {
        return []
      }

      return createTaskUseCases(repository).listTasksByProject(projectId)
    },
  })
}

export const useTask = (taskId: string | undefined) => {
  const repository = useTaskRepository()

  return useQuery({
    enabled: taskId !== undefined,
    queryKey: taskId === undefined ? taskQueryKeys.list() : taskQueryKeys.detail(taskId),
    queryFn: async () => {
      if (taskId === undefined) {
        return null
      }

      return createTaskUseCases(repository).getTaskById(taskId)
    },
  })
}

export const useCreateTask = () => {
  const repository = useTaskRepository()
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: async (input: CreateTaskInput) => createTaskUseCases(repository).createTask(input),
    onSuccess: async (createdTask) => {
      queryClient.setQueryData<Task[]>(taskQueryKeys.list(), (currentTasks) => upsertTaskInList(currentTasks, createdTask))
      queryClient.setQueryData<Task[]>(taskQueryKeys.projectList(createdTask.projectId), (currentTasks) =>
        upsertTaskInList(currentTasks, createdTask),
      )
      await invalidateTaskQueries(queryClient, createdTask.id, createdTask.projectId)
    },
  })
}

export const useUpdateTask = () => {
  const repository = useTaskRepository()
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: async ({ taskId, input }: UpdateTaskVariables) => createTaskUseCases(repository).updateTask(taskId, input),
    onSuccess: async (updatedTask, variables) => {
      const projectId = variables.projectId ?? updatedTask.projectId
      queryClient.setQueryData(taskQueryKeys.detail(variables.taskId), updatedTask)
      queryClient.setQueryData<Task[]>(taskQueryKeys.list(), (currentTasks) => upsertTaskInList(currentTasks, updatedTask))
      queryClient.setQueryData<Task[]>(taskQueryKeys.projectList(projectId), (currentTasks) =>
        upsertTaskInList(currentTasks, updatedTask),
      )
      await invalidateTaskQueries(queryClient, variables.taskId, projectId)
    },
  })
}

export const useDeleteTask = () => {
  const repository = useTaskRepository()
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: async ({ taskId }: { taskId: string; projectId?: string }) =>
      createTaskUseCases(repository).deleteTask(taskId),
    onSuccess: async (_result, variables) => {
      queryClient.setQueryData<Task[]>(taskQueryKeys.list(), (currentTasks = []) =>
        currentTasks.filter((task) => task.id !== variables.taskId),
      )
      if (variables.projectId !== undefined) {
        queryClient.setQueryData<Task[]>(taskQueryKeys.projectList(variables.projectId), (currentTasks = []) =>
          currentTasks.filter((task) => task.id !== variables.taskId),
        )
      }
      queryClient.removeQueries({ queryKey: taskQueryKeys.detail(variables.taskId) })
      await invalidateTaskQueries(queryClient, variables.taskId, variables.projectId)
    },
  })
}

export const useUpdateTaskStatus = () => {
  const repository = useTaskRepository()
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: async ({ taskId, status }: UpdateTaskStatusVariables) =>
      createTaskUseCases(repository).updateTaskStatus(taskId, status),
    onMutate: async ({ projectId, taskId, status }) => {
      if (!projectId) {
        return
      }
      const queryKey = taskQueryKeys.projectList(projectId)
      await queryClient.cancelQueries({ queryKey })

      const previousTasks = queryClient.getQueryData<Task[]>(queryKey)

      if (previousTasks) {
        queryClient.setQueryData<Task[]>(queryKey, (old = []) =>
          old.map((task) => (task.id === taskId ? { ...task, status } : task))
        )
      }

      return { previousTasks }
    },
    onError: (err, variables, context) => {
      if (variables.projectId && context?.previousTasks) {
        queryClient.setQueryData(
          taskQueryKeys.projectList(variables.projectId),
          context.previousTasks
        )
      }
    },
    onSuccess: async (updatedTask, variables) => {
      await invalidateTaskQueries(queryClient, variables.taskId, variables.projectId ?? updatedTask.projectId)
    },
  })
}

export const useUpdateTaskAssignee = () => {
  const repository = useTaskRepository()
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: async ({ taskId, memberId }: UpdateTaskAssigneeVariables) =>
      createTaskUseCases(repository).updateTaskAssignee(taskId, memberId),
    onSuccess: async (updatedTask, variables) => {
      await invalidateTaskQueries(queryClient, variables.taskId, variables.projectId ?? updatedTask.projectId)
    },
  })
}

export const useUpdateTaskTags = () => {
  const repository = useTaskRepository()
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: async ({ taskId, tagIds }: UpdateTaskTagsVariables) =>
      createTaskUseCases(repository).updateTaskTags(taskId, tagIds),
    onSuccess: async (updatedTask, variables) => {
      await invalidateTaskQueries(queryClient, variables.taskId, variables.projectId ?? updatedTask.projectId)
    },
  })
}

export const useUpdateTaskChecklist = () => {
  const repository = useTaskRepository()
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: async ({ taskId, checklist }: UpdateTaskChecklistVariables) =>
      createTaskUseCases(repository).updateTaskChecklist(taskId, checklist),
    onSuccess: async (updatedTask, variables) => {
      await invalidateTaskQueries(queryClient, variables.taskId, variables.projectId ?? updatedTask.projectId)
    },
  })
}
