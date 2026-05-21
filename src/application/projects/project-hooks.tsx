import { useMutation, useQuery, useQueryClient, type QueryClient } from '@tanstack/react-query'
import type { CreateProjectInput, Project, UpdateProjectInput } from '../../domain'
import { createProjectUseCases } from './project-use-cases'
import { projectQueryKeys } from './project-query-keys'
import { useProjectRepository } from './project-repository-context'

type UpdateProjectVariables = {
  projectId: string
  input: UpdateProjectInput
}

const invalidateProjectQueries = async (queryClient: QueryClient, projectId?: string) => {
  await Promise.all([
    queryClient.invalidateQueries({ queryKey: projectQueryKeys.list() }),
    projectId === undefined
      ? Promise.resolve()
      : queryClient.invalidateQueries({ queryKey: projectQueryKeys.detail(projectId) }),
  ])
}

export const useProjects = () => {
  const repository = useProjectRepository()

  return useQuery({
    queryKey: projectQueryKeys.list(),
    queryFn: () => createProjectUseCases(repository).listProjects(),
  })
}

export const useProject = (projectId: string | undefined) => {
  const repository = useProjectRepository()

  return useQuery({
    enabled: projectId !== undefined,
    queryKey: projectId === undefined ? projectQueryKeys.list() : projectQueryKeys.detail(projectId),
    queryFn: async () => {
      if (projectId === undefined) {
        return null
      }

      return createProjectUseCases(repository).getProjectById(projectId)
    },
  })
}

export const useCreateProject = () => {
  const repository = useProjectRepository()
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: async (input: CreateProjectInput) => createProjectUseCases(repository).createProject(input),
    onSuccess: async (createdProject) => {
      queryClient.setQueryData<Project[]>(projectQueryKeys.list(), (currentProjects = []) => [
        ...currentProjects,
        createdProject,
      ])
      await invalidateProjectQueries(queryClient)
    },
  })
}

export const useUpdateProject = () => {
  const repository = useProjectRepository()
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: async ({ projectId, input }: UpdateProjectVariables) =>
      createProjectUseCases(repository).updateProject(projectId, input),
    onSuccess: async (updatedProject, variables) => {
      queryClient.setQueryData(projectQueryKeys.detail(variables.projectId), updatedProject)
      queryClient.setQueryData<Project[]>(projectQueryKeys.list(), (currentProjects = []) =>
        currentProjects.map((project) => (project.id === variables.projectId ? updatedProject : project)),
      )
      await invalidateProjectQueries(queryClient, variables.projectId)
    },
  })
}

export const useDeleteProject = () => {
  const repository = useProjectRepository()
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: async (projectId: string) => createProjectUseCases(repository).deleteProject(projectId),
    onSuccess: async (_result, projectId) => {
      queryClient.setQueryData<Project[]>(projectQueryKeys.list(), (currentProjects = []) =>
        currentProjects.filter((project) => project.id !== projectId),
      )
      queryClient.removeQueries({ queryKey: projectQueryKeys.detail(projectId) })
      await invalidateProjectQueries(queryClient, projectId)
    },
  })
}
