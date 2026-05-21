import type { CreateProjectInput, Project, ProjectRepository, UpdateProjectInput } from '../../domain'

export interface ProjectUseCases {
  listProjects(): Promise<Project[]>
  getProjectById(projectId: string): Promise<Project | null>
  createProject(input: CreateProjectInput): Promise<Project>
  updateProject(projectId: string, input: UpdateProjectInput): Promise<Project>
  deleteProject(projectId: string): Promise<void>
}

export const createProjectUseCases = (repository: ProjectRepository): ProjectUseCases => {
  return {
    listProjects: async () => repository.list(),
    getProjectById: async (projectId) => repository.getById(projectId),
    createProject: async (input) => repository.create(input),
    updateProject: async (projectId, input) => repository.update(projectId, input),
    deleteProject: async (projectId) => repository.delete(projectId),
  }
}
