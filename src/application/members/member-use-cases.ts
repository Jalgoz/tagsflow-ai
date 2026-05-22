import type { CreateMemberInput, Member, MemberRepository, ProjectRepository, SubtaskRepository, TaskRepository, UpdateMemberInput } from '../../domain'

export interface MemberUsageSummary {
  projectCount: number
  taskCount: number
  subtaskCount: number
  totalCount: number
  isAssigned: boolean
}

export interface MemberUseCaseDependencies {
  members: MemberRepository
  projects: ProjectRepository
  tasks: TaskRepository
  subtasks: SubtaskRepository
}

export interface MemberUseCases {
  listMembers(): Promise<Member[]>
  getMemberById(memberId: string): Promise<Member | null>
  createMember(input: CreateMemberInput): Promise<Member>
  updateMember(memberId: string, input: UpdateMemberInput): Promise<Member>
  deleteMember(memberId: string): Promise<void>
  getMemberUsageSummary(memberId: string): Promise<MemberUsageSummary>
}

export const createMemberUseCases = (dependencies: MemberUseCaseDependencies): MemberUseCases => {
  const getMemberUsageSummary = async (memberId: string): Promise<MemberUsageSummary> => {
    const [projects, tasks, subtasks] = await Promise.all([
      dependencies.projects.list(),
      dependencies.tasks.list(),
      dependencies.subtasks.list(),
    ])

    const projectCount = projects.filter((project) => project.memberIds.includes(memberId)).length
    const taskCount = tasks.filter((task) => task.assigneeMemberId === memberId).length
    const subtaskCount = subtasks.filter((subtask) => subtask.assigneeMemberId === memberId).length
    const totalCount = projectCount + taskCount + subtaskCount

    return {
      projectCount,
      taskCount,
      subtaskCount,
      totalCount,
      isAssigned: totalCount > 0,
    }
  }

  return {
    listMembers: async () => dependencies.members.list(),
    getMemberById: async (memberId) => dependencies.members.getById(memberId),
    createMember: async (input) => dependencies.members.create(input),
    updateMember: async (memberId, input) => dependencies.members.update(memberId, input),
    deleteMember: async (memberId) => dependencies.members.delete(memberId),
    getMemberUsageSummary,
  }
}
