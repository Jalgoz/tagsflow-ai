export interface Member {
  id: string
  name: string
  email: string
  role: string
  avatar: string
}

export interface CreateMemberInput {
  name: string
  email: string
  role: string
  avatar: string
}

export type UpdateMemberInput = Partial<CreateMemberInput>
