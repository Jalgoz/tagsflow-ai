import { describe, expect, it } from 'vitest'
import type { CreateProjectInput, Project, ProjectRepository, UpdateProjectInput } from '../../domain'
import { createProjectUseCases } from './project-use-cases'

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

  return {
    list: async () => state.projects,
    getById: async (id) => state.projects.find((project) => project.id === id) ?? null,
    create: async (input: CreateProjectInput) => {
      const project = createProject({ ...input, id: `project-${state.projects.length + 1}` })
      state.projects.push(project)
      return project
    },
    update: async (id: string, input: UpdateProjectInput) => {
      const projectIndex = state.projects.findIndex((project) => project.id === id)

      if (projectIndex < 0) {
        throw new Error(`Project with ID "${id}" was not found.`)
      }

      const updatedProject = {
        ...state.projects[projectIndex],
        ...input,
      }

      state.projects[projectIndex] = updatedProject

      return updatedProject
    },
    delete: async (id: string) => {
      state.projects = state.projects.filter((project) => project.id !== id)
    },
    assignMember: async (projectId: string, memberId: string) => {
      const project = state.projects.find((currentProject) => currentProject.id === projectId)

      if (project === undefined) {
        throw new Error(`Project with ID "${projectId}" was not found.`)
      }

      const updatedProject = {
        ...project,
        memberIds: [...project.memberIds, memberId],
      }

      state.projects = state.projects.map((currentProject) =>
        currentProject.id === projectId ? updatedProject : currentProject,
      )

      return updatedProject
    },
    unassignMember: async (projectId: string, memberId: string) => {
      const project = state.projects.find((currentProject) => currentProject.id === projectId)

      if (project === undefined) {
        throw new Error(`Project with ID "${projectId}" was not found.`)
      }

      const updatedProject = {
        ...project,
        memberIds: project.memberIds.filter((currentMemberId) => currentMemberId !== memberId),
      }

      state.projects = state.projects.map((currentProject) =>
        currentProject.id === projectId ? updatedProject : currentProject,
      )

      return updatedProject
    },
    setMemberIds: async (projectId: string, memberIds: string[]) => {
      const project = state.projects.find((currentProject) => currentProject.id === projectId)

      if (project === undefined) {
        throw new Error(`Project with ID "${projectId}" was not found.`)
      }

      const updatedProject = {
        ...project,
        memberIds,
      }

      state.projects = state.projects.map((currentProject) =>
        currentProject.id === projectId ? updatedProject : currentProject,
      )

      return updatedProject
    },
  }
}

describe('project use cases', () => {
  it('lists projects', async () => {
    const project = createProject({ id: 'project-1' })
    const useCases = createProjectUseCases(createRepository([project]))

    await expect(useCases.listProjects()).resolves.toEqual([project])
  })

  it('gets a project by id', async () => {
    const project = createProject({ id: 'project-1' })
    const useCases = createProjectUseCases(createRepository([project]))

    await expect(useCases.getProjectById('project-1')).resolves.toEqual(project)
    await expect(useCases.getProjectById('missing')).resolves.toBeNull()
  })

  it('creates a project', async () => {
    const useCases = createProjectUseCases(createRepository())

    await expect(
      useCases.createProject({
        title: 'New project',
        description: 'Description',
        objective: 'Objective',
        inScopeContent: 'In scope',
        outOfScopeContent: 'Out of scope',
        status: 'active',
        startDate: null,
        dueDate: null,
      }),
    ).resolves.toMatchObject({
      id: 'project-1',
      title: 'New project',
    })
  })

  it('updates a project', async () => {
    const project = createProject({ id: 'project-1' })
    const useCases = createProjectUseCases(createRepository([project]))

    await expect(useCases.updateProject('project-1', { title: 'Updated' })).resolves.toMatchObject({
      id: 'project-1',
      title: 'Updated',
    })
  })

  it('deletes a project', async () => {
    const project = createProject({ id: 'project-1' })
    const repository = createRepository([project])
    const useCases = createProjectUseCases(repository)

    await expect(useCases.deleteProject('project-1')).resolves.toBeUndefined()
    await expect(useCases.listProjects()).resolves.toEqual([])
  })
})
