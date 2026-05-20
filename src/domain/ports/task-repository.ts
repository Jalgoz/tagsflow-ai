import type { CreateTaskInput, Task, UpdateTaskInput } from '../entities'
import type { ChecklistItem } from '../entities/checklist-item'
import type { TaskStatus } from '../constants'

export interface TaskRepository {
  list(): Promise<Task[]>
  listByProjectId(projectId: string): Promise<Task[]>
  getById(id: string): Promise<Task | null>
  create(input: CreateTaskInput): Promise<Task>
  update(id: string, input: UpdateTaskInput): Promise<Task>
  delete(id: string): Promise<void>
  setStatus(id: string, status: TaskStatus): Promise<Task>
  assignMember(id: string, memberId: string | null): Promise<Task>
  setTagIds(id: string, tagIds: string[]): Promise<Task>
  setChecklist(id: string, checklist: ChecklistItem[]): Promise<Task>
  setSubtaskIds(id: string, subtaskIds: string[]): Promise<Task>
}
