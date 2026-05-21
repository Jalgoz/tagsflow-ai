import type { AppSettings } from '../../domain'
import { LOCAL_DATABASE_VERSION, type LocalDatabase } from './types'

export const createDefaultSettings = (): AppSettings => ({
  theme: 'light',
  aiProvider: {
    provider: 'groq',
    apiKey: null,
    selectedModelId: null,
  },
})

export const createEmptyLocalDatabase = (): LocalDatabase => ({
  version: LOCAL_DATABASE_VERSION,
  projects: [],
  tasks: [],
  subtasks: [],
  members: [],
  tags: [],
  settings: createDefaultSettings(),
})
