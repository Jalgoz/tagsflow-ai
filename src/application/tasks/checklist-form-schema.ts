import { z } from 'zod'
import type { ChecklistItem } from '../../domain'

export const checklistFormItemSchema = z.object({
  text: z.string().trim().min(1, 'Checklist item text is required.'),
  completed: z.boolean(),
})

export const checklistFormSchema = z.array(checklistFormItemSchema).default([])

export type ChecklistFormItemInput = z.input<typeof checklistFormItemSchema>
export type ChecklistFormItemValues = z.output<typeof checklistFormItemSchema>

export const checklistItemsFromFormValues = (values: ChecklistFormItemValues[]): ChecklistItem[] =>
  values.map((item) => ({
    completed: item.completed,
    text: item.text,
  }))

export const checklistItemsToFormValues = (items: ChecklistItem[]): ChecklistFormItemValues[] =>
  items.map((item) => ({
    completed: item.completed,
    text: item.text,
  }))
