import type { ChecklistItem, CreateTaskInput, Task, TaskRepository, TaskStatus, UpdateTaskInput } from '../../domain'

export interface TaskUseCases {
  listTasks(): Promise<Task[]>
  listTasksByProject(projectId: string): Promise<Task[]>
  getTaskById(taskId: string): Promise<Task | null>
  createTask(input: CreateTaskInput): Promise<Task>
  updateTask(taskId: string, input: UpdateTaskInput): Promise<Task>
  deleteTask(taskId: string): Promise<void>
  updateTaskStatus(taskId: string, status: TaskStatus): Promise<Task>
  updateTaskAssignee(taskId: string, memberId: string | null): Promise<Task>
  updateTaskTags(taskId: string, tagIds: string[]): Promise<Task>
  updateTaskChecklist(taskId: string, checklist: ChecklistItem[]): Promise<Task>
}

export const createTaskUseCases = (repository: TaskRepository): TaskUseCases => {
  return {
    listTasks: async () => repository.list(),
    listTasksByProject: async (projectId) => repository.listByProjectId(projectId),
    getTaskById: async (taskId) => repository.getById(taskId),
    createTask: async (input) => repository.create(input),
    updateTask: async (taskId, input) => repository.update(taskId, input),
    deleteTask: async (taskId) => repository.delete(taskId),
    updateTaskStatus: async (taskId, status) => repository.setStatus(taskId, status),
    updateTaskAssignee: async (taskId, memberId) => repository.assignMember(taskId, memberId),
    updateTaskTags: async (taskId, tagIds) => repository.setTagIds(taskId, tagIds),
    updateTaskChecklist: async (taskId, checklist) => repository.setChecklist(taskId, checklist),
  }
}
