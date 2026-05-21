import { z } from 'zod'
import type { CreateProjectInput, Project, UpdateProjectInput } from '../../domain'
import { PROJECT_STATUSES } from '../../domain'

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

const textSchema = z.string().trim().default('')

export const projectFormSchema = z
  .object({
    title: z.string().trim().min(1, 'Title is required.'),
    description: textSchema,
    objective: textSchema,
    inScopeContent: textSchema,
    outOfScopeContent: textSchema,
    status: z.enum(PROJECT_STATUSES).default('active'),
    startDate: nullableDateSchema,
    dueDate: nullableDateSchema,
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

export interface ProjectFormInput {
  title: string
  description: string
  objective: string
  inScopeContent: string
  outOfScopeContent: string
  status: (typeof PROJECT_STATUSES)[number]
  startDate: string
  dueDate: string
}

export type ProjectFormValues = z.output<typeof projectFormSchema>

export const createEmptyProjectFormValues = (): ProjectFormInput => ({
  title: '',
  description: '',
  objective: '',
  inScopeContent: '',
  outOfScopeContent: '',
  status: 'active',
  startDate: '',
  dueDate: '',
})

export const projectToFormValues = (project: Project): ProjectFormInput => ({
  title: project.title,
  description: project.description,
  objective: project.objective,
  inScopeContent: project.inScopeContent,
  outOfScopeContent: project.outOfScopeContent,
  status: project.status,
  startDate: project.startDate ?? '',
  dueDate: project.dueDate ?? '',
})

export const createProjectInputFromFormValues = (values: ProjectFormValues): CreateProjectInput => ({
  title: values.title,
  description: values.description,
  objective: values.objective,
  inScopeContent: values.inScopeContent,
  outOfScopeContent: values.outOfScopeContent,
  status: values.status,
  startDate: values.startDate,
  dueDate: values.dueDate,
  memberIds: [],
  taskIds: [],
})

export const updateProjectInputFromFormValues = (values: ProjectFormValues): UpdateProjectInput => ({
  title: values.title,
  description: values.description,
  objective: values.objective,
  inScopeContent: values.inScopeContent,
  outOfScopeContent: values.outOfScopeContent,
  status: values.status,
  startDate: values.startDate,
  dueDate: values.dueDate,
})
