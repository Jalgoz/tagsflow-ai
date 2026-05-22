import { z } from 'zod'
import type { CreateSubtaskInput, Subtask, UpdateSubtaskInput } from '../../domain'
import { PRIORITIES, TASK_STATUSES } from '../../domain'
import {
  checklistFormSchema,
  checklistItemsFromFormValues,
  checklistItemsToFormValues,
  type ChecklistFormItemValues,
} from '../tasks/checklist-form-schema'

const isIsoDate = (value: string): boolean => {
  return /^\d{4}-\d{2}-\d{2}$/.test(value) && !Number.isNaN(Date.parse(`${value}T00:00:00`))
}

const nullableDateSchema = z.preprocess((value) => {
  if (value === null || value === undefined) {
    return null
  }

  if (typeof value !== 'string') {
    return value
  }

  const trimmedValue = value.trim()

  return trimmedValue === '' ? null : trimmedValue
}, z.union([z.string().refine(isIsoDate, 'Use a valid date in YYYY-MM-DD format.'), z.null()]))

const nullableIdSchema = z.preprocess((value) => {
  if (value === null || value === undefined) {
    return null
  }

  if (typeof value !== 'string') {
    return value
  }

  const trimmedValue = value.trim()

  return trimmedValue === '' ? null : trimmedValue
}, z.union([z.string(), z.null()]))

const textSchema = z.string().trim().default('')

export const subtaskFormSchema = z
  .object({
    title: z.string().trim().min(1, 'Title is required.'),
    description: textSchema,
    inScopeContent: textSchema,
    outOfScopeContent: textSchema,
    status: z.enum(TASK_STATUSES).default('todo'),
    priority: z.enum(PRIORITIES).default('medium'),
    startDate: nullableDateSchema,
    dueDate: nullableDateSchema,
    assigneeMemberId: nullableIdSchema,
    tagIds: z.array(z.string()).default([]),
    checklist: checklistFormSchema,
  })
  .superRefine((values, context) => {
    if (values.startDate !== null && values.dueDate !== null && values.dueDate < values.startDate) {
      context.addIssue({
        code: z.ZodIssueCode.custom,
        message: 'Due date must be on or after start date.',
        path: ['dueDate'],
      })
    }
  })

export interface SubtaskFormInput {
  title: string
  description: string
  inScopeContent: string
  outOfScopeContent: string
  status: (typeof TASK_STATUSES)[number]
  priority: (typeof PRIORITIES)[number]
  startDate: string
  dueDate: string
  assigneeMemberId: string
  tagIds: string[]
  checklist: ChecklistFormItemValues[]
}

export type SubtaskFormValues = z.output<typeof subtaskFormSchema>

export const createEmptySubtaskFormValues = (): SubtaskFormInput => ({
  title: '',
  description: '',
  inScopeContent: '',
  outOfScopeContent: '',
  status: 'todo',
  priority: 'medium',
  startDate: '',
  dueDate: '',
  assigneeMemberId: '',
  tagIds: [],
  checklist: [],
})

export const subtaskToFormValues = (subtask: Subtask): SubtaskFormInput => ({
  title: subtask.title,
  description: subtask.description,
  inScopeContent: subtask.inScopeContent,
  outOfScopeContent: subtask.outOfScopeContent,
  status: subtask.status,
  priority: subtask.priority,
  startDate: subtask.startDate ?? '',
  dueDate: subtask.dueDate ?? '',
  assigneeMemberId: subtask.assigneeMemberId ?? '',
  tagIds: subtask.tagIds,
  checklist: checklistItemsToFormValues(subtask.checklist),
})

export const createSubtaskInputFromFormValues = (taskId: string, values: SubtaskFormValues): CreateSubtaskInput => ({
  taskId,
  title: values.title,
  description: values.description,
  inScopeContent: values.inScopeContent,
  outOfScopeContent: values.outOfScopeContent,
  status: values.status,
  priority: values.priority,
  startDate: values.startDate,
  dueDate: values.dueDate,
  assigneeMemberId: values.assigneeMemberId,
  tagIds: values.tagIds,
  checklist: checklistItemsFromFormValues(values.checklist),
})

export const updateSubtaskInputFromFormValues = (values: SubtaskFormValues): UpdateSubtaskInput => ({
  title: values.title,
  description: values.description,
  inScopeContent: values.inScopeContent,
  outOfScopeContent: values.outOfScopeContent,
  status: values.status,
  priority: values.priority,
  startDate: values.startDate,
  dueDate: values.dueDate,
  assigneeMemberId: values.assigneeMemberId,
  tagIds: values.tagIds,
  checklist: checklistItemsFromFormValues(values.checklist),
})
