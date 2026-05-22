import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { cleanup, fireEvent, render, screen, waitFor } from '@testing-library/react'
import type { ReactNode } from 'react'
import { MemoryRouter, Route, Routes } from 'react-router-dom'
import { afterEach, describe, expect, it } from 'vitest'
import type { CreateProjectInput, Project, ProjectRepository, UpdateProjectInput } from '../../domain'
import { ProjectRepositoryProvider } from '../../application'
import { ToastProvider } from '../feedback'
import { ProjectDetailPage } from './ProjectDetailPage'

afterEach(() => {
  cleanup()
})

const createProject = (overrides: Partial<Project> = {}): Project => ({
  id: 'project-1',
  title: 'Project Atlas',
  description: 'Build the project module.',
  objective: 'Ship the MVP',
  inScopeContent: 'Frontend implementation',
  outOfScopeContent: 'Backend work',
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
    update: async (id: string, input: UpdateProjectInput) => updateProjectState(id, (project) => ({ ...project, ...input })),
    delete: async (id: string) => {
      state.projects = state.projects.filter((project) => project.id !== id)
    },
    assignMember: async (projectId: string, memberId: string) =>
      updateProjectState(projectId, (project) => ({
        ...project,
        memberIds: [...project.memberIds, memberId],
      })),
    unassignMember: async (projectId: string, memberId: string) =>
      updateProjectState(projectId, (project) => ({
        ...project,
        memberIds: project.memberIds.filter((currentMemberId) => currentMemberId !== memberId),
      })),
    setMemberIds: async (projectId: string, memberIds: string[]) =>
      updateProjectState(projectId, (project) => ({
        ...project,
        memberIds,
      })),
  }
}

const createWrapper = (repository: ProjectRepository, initialEntries = ['/projects/project-1']) => {
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
        <ToastProvider>
          <ProjectRepositoryProvider repository={repository}>
            <MemoryRouter initialEntries={initialEntries}>{children}</MemoryRouter>
          </ProjectRepositoryProvider>
        </ToastProvider>
      </QueryClientProvider>
    )
  }

  return Wrapper
}

describe('ProjectDetailPage', () => {
  it('keeps the edit surface and delete confirmation mutually exclusive', async () => {
    const wrapper = createWrapper(createRepository([createProject()]))

    render(
      <Routes>
        <Route path="/projects/:projectId" element={<ProjectDetailPage />} />
      </Routes>,
      { wrapper },
    )

    await waitFor(() => expect(screen.getByRole('heading', { name: 'Project Atlas' })).not.toBeNull())

    fireEvent.click(screen.getByRole('button', { name: 'Edit' }))
    expect(screen.getByRole('heading', { name: 'Edit project' })).not.toBeNull()

    fireEvent.click(screen.getByRole('button', { name: 'Delete' }))

    expect(screen.queryByRole('heading', { name: 'Edit project' })).toBeNull()
    expect(screen.getByRole('alertdialog', { name: 'Delete this project?' })).not.toBeNull()
  })

  it('shows a success toast and returns to the projects route after deletion', async () => {
    const repository = createRepository([createProject()])
    const wrapper = createWrapper(repository)

    render(
      <Routes>
        <Route path="/projects" element={<div>Projects route</div>} />
        <Route path="/projects/:projectId" element={<ProjectDetailPage />} />
      </Routes>,
      { wrapper },
    )

    await waitFor(() => expect(screen.getByRole('heading', { name: 'Project Atlas' })).not.toBeNull())

    fireEvent.click(screen.getByRole('button', { name: 'Delete' }))
    fireEvent.click(screen.getByRole('button', { name: 'Delete project' }))

    await waitFor(() => expect(screen.getByText('Projects route')).not.toBeNull())
    expect(screen.getByRole('status').textContent).toContain('Project deleted.')
    await expect(repository.list()).resolves.toEqual([])
  })
})
