import type { CreateTagInput, Tag, UpdateTagInput } from '../entities'

export interface TagRepository {
  list(): Promise<Tag[]>
  getById(id: string): Promise<Tag | null>
  create(input: CreateTagInput): Promise<Tag>
  update(id: string, input: UpdateTagInput): Promise<Tag>
  delete(id: string): Promise<void>
}
