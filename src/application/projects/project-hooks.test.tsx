import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { renderHook, waitFor } from '@testing-library/react'
import { act, type ReactNode } from 'react'
import { describe, expect, it } from 'vitest'
import type { CreateProjectInput, Project, ProjectRepository, UpdateProjectInput } from '../../domain'
import {
  ProjectRepositoryProvider,
  useCreateProject,
  useDeleteProject,
  useProject,
  useProjects,
  useUpdateProject,
} from './index'

const createProject = (overrides: Partial<Project> = {}): Project => ({
  id: 'project-1',
  title: 'Project',
  description: 'Description',
  objective: 'Objective',
  inScopeContent: 'In scope',
  outOfScopeContent: 'Out of scope',
  status: 'active',
  startDate: null,
  dueDate: null,
  memberIds: [],
  taskIds: [],
  ...overrides,
})

const createRepository = (initialProjects: Project[] = []): ProjectRepository => {
  const state = {
    projects: [...initialProjects],
  }

  const updateProjectState = (projectId: string, updater: (project: Project) => Project): Project => {
    const currentProject = state.projects.find((project) => project.id === projectId)

    if (currentProject === undefined) {
      throw new Error(`Project with ID "${projectId}" was not found.`)
    }

    const updatedProject = updater(currentProject)
    state.projects = state.projects.map((project) => (project.id === projectId ? updatedProject : project))

    return updatedProject
  }

  return {
    list: async () => state.projects,
    getById: async (id) => state.projects.find((project) => project.id === id) ?? null,
    create: async (input: CreateProjectInput) => {
      const project = createProject({
        ...input,
        id: `project-${state.projects.length + 1}`,
        memberIds: input.memberIds ?? [],
        taskIds: input.taskIds ?? [],
      })

      state.projects.push(project)
      return project
    },
    update: async (id: string, input: UpdateProjectInput) => {
      return updateProjectState(id, (project) => ({ ...project, ...input }))
    },
    delete: async (id: string) => {
      state.projects = state.projects.filter((project) => project.id !== id)
    },
    assignMember: async (projectId: string, memberId: string) => {
      return updateProjectState(projectId, (project) => ({
        ...project,
        memberIds: [...project.memberIds, memberId],
      }))
    },
    unassignMember: async (projectId: string, memberId: string) => {
      return updateProjectState(projectId, (project) => ({
        ...project,
        memberIds: project.memberIds.filter((currentMemberId) => currentMemberId !== memberId),
      }))
    },
    setMemberIds: async (projectId: string, memberIds: string[]) => {
      return updateProjectState(projectId, (project) => ({
        ...project,
        memberIds,
      }))
    },
  }
}

const createWrapper = (repository: ProjectRepository) => {
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
        <ProjectRepositoryProvider repository={repository}>{children}</ProjectRepositoryProvider>
      </QueryClientProvider>
    )
  }

  return Wrapper
}

describe('project hooks', () => {
  it('loads project lists and individual projects', async () => {
    const project = createProject({ id: 'project-1' })
    const wrapper = createWrapper(createRepository([project]))

    const projectsResult = renderHook(() => useProjects(), { wrapper })
    const projectResult = renderHook(() => useProject('project-1'), { wrapper })

    await waitFor(() => expect(projectsResult.result.current.isSuccess).toBe(true))
    await waitFor(() => expect(projectResult.result.current.isSuccess).toBe(true))

    expect(projectsResult.result.current.data).toEqual([project])
    expect(projectResult.result.current.data).toEqual(project)
  })

  it('creates projects and refreshes the project list', async () => {
    const wrapper = createWrapper(createRepository())
    const projectsResult = renderHook(() => useProjects(), { wrapper })
    const createResult = renderHook(() => useCreateProject(), { wrapper })

    await waitFor(() => expect(projectsResult.result.current.isSuccess).toBe(true))

    await act(async () => {
      await createResult.result.current.mutateAsync({
        title: 'Created project',
        description: 'Description',
        objective: 'Objective',
        inScopeContent: 'In scope',
        outOfScopeContent: 'Out of scope',
        status: 'active',
        startDate: null,
        dueDate: null,
      })
    })

    await waitFor(() => expect(projectsResult.result.current.data).toHaveLength(1))
    expect(projectsResult.result.current.data?.[0]?.title).toBe('Created project')
  })

  it('updates projects and refreshes the detail view', async () => {
    const project = createProject({ id: 'project-1' })
    const repository = createRepository([project])
    const wrapper = createWrapper(repository)
    const projectResult = renderHook(() => useProject('project-1'), { wrapper })
    const updateResult = renderHook(() => useUpdateProject(), { wrapper })

    await waitFor(() => expect(projectResult.result.current.isSuccess).toBe(true))

    await act(async () => {
      await updateResult.result.current.mutateAsync({
        projectId: 'project-1',
        input: { title: 'Updated project' },
      })
    })

    await expect(repository.getById('project-1')).resolves.toMatchObject({
      title: 'Updated project',
    })
  })

  it('deletes projects and refreshes the project list', async () => {
    const project = createProject({ id: 'project-1' })
    const repository = createRepository([project])
    const wrapper = createWrapper(repository)
    const projectsResult = renderHook(() => useProjects(), { wrapper })
    const deleteResult = renderHook(() => useDeleteProject(), { wrapper })

    await waitFor(() => expect(projectsResult.result.current.isSuccess).toBe(true))

    await act(async () => {
      await deleteResult.result.current.mutateAsync('project-1')
    })

    await expect(repository.list()).resolves.toEqual([])
  })
})
