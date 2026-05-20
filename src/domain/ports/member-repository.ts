import type { CreateMemberInput, Member, UpdateMemberInput } from '../entities'

export interface MemberRepository {
  list(): Promise<Member[]>
  getById(id: string): Promise<Member | null>
  create(input: CreateMemberInput): Promise<Member>
  update(id: string, input: UpdateMemberInput): Promise<Member>
  delete(id: string): Promise<void>
}
