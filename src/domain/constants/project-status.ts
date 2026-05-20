export const PROJECT_STATUSES = ['active', 'paused', 'completed'] as const

export type ProjectStatus = (typeof PROJECT_STATUSES)[number]
