import { z } from 'zod'
import type { CreateTaskInput, Task, UpdateTaskInput } from '../../domain'
import { PRIORITIES, TASK_STATUSES } from '../../domain'
import {
  checklistFormSchema,
  checklistItemsFromFormValues,
  checklistItemsToFormValues,
  type ChecklistFormItemValues,
} from './checklist-form-schema'

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

export const taskFormSchema = z
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

export interface TaskFormInput {
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

export type TaskFormValues = z.output<typeof taskFormSchema>

export const createEmptyTaskFormValues = (): TaskFormInput => ({
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

export const taskToFormValues = (task: Task): TaskFormInput => ({
  title: task.title,
  description: task.description,
  inScopeContent: task.inScopeContent,
  outOfScopeContent: task.outOfScopeContent,
  status: task.status,
  priority: task.priority,
  startDate: task.startDate ?? '',
  dueDate: task.dueDate ?? '',
  assigneeMemberId: task.assigneeMemberId ?? '',
  tagIds: task.tagIds,
  checklist: checklistItemsToFormValues(task.checklist),
})

export const createTaskInputFromFormValues = (projectId: string, values: TaskFormValues): CreateTaskInput => ({
  projectId,
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
  subtaskIds: [],
})

export const updateTaskInputFromFormValues = (values: TaskFormValues): UpdateTaskInput => ({
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
