import { z } from 'zod'
import type { CreateMemberInput, Member, UpdateMemberInput } from '../../domain'

const isEmail = (value: string): boolean => z.string().email().safeParse(value).success

const optionalEmailSchema = z.preprocess((value) => {
  if (typeof value !== 'string') {
    return value
  }

  return value.trim()
}, z.union([z.literal(''), z.string().refine(isEmail, 'Email must be a valid email address.')]))

const textSchema = z.string().trim().default('')

export const memberFormSchema = z.object({
  name: z.string().trim().min(1, 'Name is required.'),
  email: optionalEmailSchema,
  role: textSchema,
  avatar: textSchema,
})

export type MemberFormInput = z.input<typeof memberFormSchema>
export type MemberFormValues = z.output<typeof memberFormSchema>

export const createEmptyMemberFormValues = (): MemberFormInput => ({
  name: '',
  email: '',
  role: '',
  avatar: '',
})

export const memberToFormValues = (member: Member): MemberFormInput => ({
  name: member.name,
  email: member.email,
  role: member.role,
  avatar: member.avatar,
})

export const createMemberInputFromFormValues = (values: MemberFormValues): CreateMemberInput => ({
  name: values.name,
  email: values.email,
  role: values.role,
  avatar: values.avatar,
})

export const updateMemberInputFromFormValues = (values: MemberFormValues): UpdateMemberInput => ({
  name: values.name,
  email: values.email,
  role: values.role,
  avatar: values.avatar,
})
