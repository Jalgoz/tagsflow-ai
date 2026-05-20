import type { TaskStatus } from '../constants'
import type { ChecklistItem } from '../entities/checklist-item'
import type { CreateSubtaskInput, Subtask, UpdateSubtaskInput } from '../entities'

export interface SubtaskRepository {
  list(): Promise<Subtask[]>
  listByTaskId(taskId: string): Promise<Subtask[]>
  getById(id: string): Promise<Subtask | null>
  create(input: CreateSubtaskInput): Promise<Subtask>
  update(id: string, input: UpdateSubtaskInput): Promise<Subtask>
  delete(id: string): Promise<void>
  setStatus(id: string, status: TaskStatus): Promise<Subtask>
  assignMember(id: string, memberId: string | null): Promise<Subtask>
  setTagIds(id: string, tagIds: string[]): Promise<Subtask>
  setChecklist(id: string, checklist: ChecklistItem[]): Promise<Subtask>
}
