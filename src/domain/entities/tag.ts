export interface Tag {
  id: string
  name: string
  color?: string
}

export interface CreateTagInput {
  name: string
  color?: string
}

export type UpdateTagInput = Partial<CreateTagInput>
