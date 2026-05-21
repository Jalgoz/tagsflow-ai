import { z } from 'zod'
import { PRIORITIES, PROJECT_STATUSES, TASK_STATUSES } from '../../domain'
import { LOCAL_DATABASE_VERSION } from './types'

export const checklistItemSchema = z
  .object({
    text: z.string(),
    completed: z.boolean(),
  })
  .strict()

export const projectSchema = z
  .object({
    id: z.string(),
    title: z.string(),
    description: z.string(),
    objective: z.string(),
    inScopeContent: z.string(),
    outOfScopeContent: z.string(),
    status: z.enum(PROJECT_STATUSES),
    startDate: z.string().nullable(),
    dueDate: z.string().nullable(),
    memberIds: z.array(z.string()),
    taskIds: z.array(z.string()),
  })
  .strict()

export const taskSchema = z
  .object({
    id: z.string(),
    projectId: z.string(),
    title: z.string(),
    description: z.string(),
    inScopeContent: z.string(),
    outOfScopeContent: z.string(),
    priority: z.enum(PRIORITIES),
    status: z.enum(TASK_STATUSES),
    startDate: z.string().nullable(),
    dueDate: z.string().nullable(),
    assigneeMemberId: z.string().nullable(),
    tagIds: z.array(z.string()),
    checklist: z.array(checklistItemSchema),
    subtaskIds: z.array(z.string()),
  })
  .strict()

export const subtaskSchema = z
  .object({
    id: z.string(),
    taskId: z.string(),
    title: z.string(),
    description: z.string(),
    inScopeContent: z.string(),
    outOfScopeContent: z.string(),
    priority: z.enum(PRIORITIES),
    status: z.enum(TASK_STATUSES),
    startDate: z.string().nullable(),
    dueDate: z.string().nullable(),
    assigneeMemberId: z.string().nullable(),
    tagIds: z.array(z.string()),
    checklist: z.array(checklistItemSchema),
  })
  .strict()

export const memberSchema = z
  .object({
    id: z.string(),
    name: z.string(),
    email: z.string(),
    role: z.string(),
    avatar: z.string(),
  })
  .strict()

export const tagSchema = z
  .object({
    id: z.string(),
    name: z.string(),
    color: z.string().optional(),
  })
  .strict()

export const settingsSchema = z
  .object({
    theme: z.enum(['light', 'dark']),
    aiProvider: z
      .object({
        provider: z.literal('groq'),
        apiKey: z.string().nullable(),
        selectedModelId: z.string().nullable(),
      })
      .strict(),
  })
  .strict()

export const localDatabaseSchema = z
  .object({
    version: z.literal(LOCAL_DATABASE_VERSION),
    projects: z.array(projectSchema),
    tasks: z.array(taskSchema),
    subtasks: z.array(subtaskSchema),
    members: z.array(memberSchema),
    tags: z.array(tagSchema),
    settings: settingsSchema,
  })
  .strict()
