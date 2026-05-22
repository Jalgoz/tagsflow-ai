import { z } from 'zod'
import type { CreateTagInput, Tag, UpdateTagInput } from '../../domain'

const textSchema = z.string().trim().default('')

export const tagFormSchema = z.object({
  name: z.string().trim().min(1, 'Name is required.'),
  color: textSchema,
})

export type TagFormInput = z.input<typeof tagFormSchema>
export type TagFormValues = z.output<typeof tagFormSchema>

export const createEmptyTagFormValues = (): TagFormInput => ({
  name: '',
  color: '',
})

export const tagToFormValues = (tag: Tag): TagFormInput => ({
  name: tag.name,
  color: tag.color ?? '',
})

const normalizeTagColor = (color: string): string | undefined => {
  const trimmedColor = color.trim()
  return trimmedColor === '' ? undefined : trimmedColor
}

export const createTagInputFromFormValues = (values: TagFormValues): CreateTagInput => ({
  name: values.name,
  color: normalizeTagColor(values.color),
})

export const updateTagInputFromFormValues = (values: TagFormValues): UpdateTagInput => ({
  name: values.name,
  color: normalizeTagColor(values.color),
})
