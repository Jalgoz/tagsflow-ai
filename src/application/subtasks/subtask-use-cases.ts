import type {
  ChecklistItem,
  CreateSubtaskInput,
  Subtask,
  SubtaskRepository,
  TaskStatus,
  UpdateSubtaskInput,
} from '../../domain'

export interface SubtaskUseCases {
  listSubtasks(): Promise<Subtask[]>
  listSubtasksByTask(taskId: string): Promise<Subtask[]>
  getSubtaskById(subtaskId: string): Promise<Subtask | null>
  createSubtask(input: CreateSubtaskInput): Promise<Subtask>
  updateSubtask(subtaskId: string, input: UpdateSubtaskInput): Promise<Subtask>
  deleteSubtask(subtaskId: string): Promise<void>
  updateSubtaskStatus(subtaskId: string, status: TaskStatus): Promise<Subtask>
  updateSubtaskAssignee(subtaskId: string, memberId: string | null): Promise<Subtask>
  updateSubtaskTags(subtaskId: string, tagIds: string[]): Promise<Subtask>
  updateSubtaskChecklist(subtaskId: string, checklist: ChecklistItem[]): Promise<Subtask>
}

export const createSubtaskUseCases = (repository: SubtaskRepository): SubtaskUseCases => {
  return {
    listSubtasks: async () => repository.list(),
    listSubtasksByTask: async (taskId) => repository.listByTaskId(taskId),
    getSubtaskById: async (subtaskId) => repository.getById(subtaskId),
    createSubtask: async (input) => repository.create(input),
    updateSubtask: async (subtaskId, input) => repository.update(subtaskId, input),
    deleteSubtask: async (subtaskId) => repository.delete(subtaskId),
    updateSubtaskStatus: async (subtaskId, status) => repository.setStatus(subtaskId, status),
    updateSubtaskAssignee: async (subtaskId, memberId) => repository.assignMember(subtaskId, memberId),
    updateSubtaskTags: async (subtaskId, tagIds) => repository.setTagIds(subtaskId, tagIds),
    updateSubtaskChecklist: async (subtaskId, checklist) => repository.setChecklist(subtaskId, checklist),
  }
}
