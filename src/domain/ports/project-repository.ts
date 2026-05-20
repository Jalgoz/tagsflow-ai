import type { CreateProjectInput, Project, UpdateProjectInput } from '../entities'

export interface ProjectRepository {
  list(): Promise<Project[]>
  getById(id: string): Promise<Project | null>
  create(input: CreateProjectInput): Promise<Project>
  update(id: string, input: UpdateProjectInput): Promise<Project>
  delete(id: string): Promise<void>
  assignMember(projectId: string, memberId: string): Promise<Project>
  unassignMember(projectId: string, memberId: string): Promise<Project>
  setMemberIds(projectId: string, memberIds: string[]): Promise<Project>
}
