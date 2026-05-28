import { z } from 'zod'
import type {
  AppSettings,
  ExportableAppSettings,
  LocalBackupData,
  LocalBackupRepository,
  LocalBackupValidationResult,
  ValidatedLocalBackupData,
} from '../../domain'
import { LOCAL_DATABASE_VERSION, type LocalDatabase } from './types'
import { assertValidLocalDatabase } from './validation'
import { localDatabaseSchema } from './schemas'
import { LocalStorageDatabase } from './database'

const importSettingsSchema = z
  .object({
    theme: z.enum(['light', 'dark']),
    aiProvider: z
      .object({
        provider: z.literal('groq'),
        selectedModelId: z.string().nullable(),
        apiKey: z.string().nullable().optional(),
      })
      .passthrough(),
  })
  .strict()

const importDatabaseSchema = localDatabaseSchema.extend({
  settings: importSettingsSchema,
})

type ImportDatabaseSchema = z.infer<typeof importDatabaseSchema>

const isRecord = (value: unknown): value is Record<string, unknown> => {
  return typeof value === 'object' && value !== null
}

const formatValidationIssue = (issue: z.ZodIssue): string => {
  const path = issue.path.join('.')
  if (path.length === 0) {
    return issue.message
  }

  return `${path}: ${issue.message}`
}

export const sanitizeSettingsForBackup = (settings: AppSettings): ExportableAppSettings => ({
  theme: settings.theme,
  aiProvider: {
    provider: settings.aiProvider.provider,
    selectedModelId: settings.aiProvider.selectedModelId,
    hasApiKey: settings.aiProvider.apiKey !== null && settings.aiProvider.apiKey.trim() !== '',
  },
})

const sanitizeImportedSettings = (settings: ImportDatabaseSchema['settings']): AppSettings => ({
  theme: settings.theme,
  aiProvider: {
    provider: settings.aiProvider.provider,
    apiKey: null,
    selectedModelId: settings.aiProvider.selectedModelId,
  },
})

export const buildSanitizedBackup = (database: LocalDatabase): LocalBackupData => ({
  version: database.version,
  projects: database.projects,
  tasks: database.tasks,
  subtasks: database.subtasks,
  members: database.members,
  tags: database.tags,
  settings: sanitizeSettingsForBackup(database.settings),
})

export const validateBackupImport = (jsonText: string): LocalBackupValidationResult => {
  let parsedJson: unknown

  try {
    parsedJson = JSON.parse(jsonText)
  } catch {
    return {
      success: false,
      code: 'malformed_json',
      message: 'The selected file is not valid JSON.',
      details: [],
    }
  }

  if (isRecord(parsedJson) && typeof parsedJson.version === 'number' && parsedJson.version !== LOCAL_DATABASE_VERSION) {
    return {
      success: false,
      code: 'unsupported_version',
      message: `Unsupported backup version "${parsedJson.version}". Expected version ${LOCAL_DATABASE_VERSION}.`,
      details: [],
    }
  }

  const parseResult = importDatabaseSchema.safeParse(parsedJson)

  if (!parseResult.success) {
    return {
      success: false,
      code: 'invalid_shape',
      message: 'The selected backup does not match the supported TagsFlow AI data shape.',
      details: parseResult.error.issues.map(formatValidationIssue),
    }
  }

  return {
    success: true,
    database: {
      ...parseResult.data,
      settings: sanitizeImportedSettings(parseResult.data.settings),
    },
  }
}

export class LocalStorageBackupRepository implements LocalBackupRepository {
  private readonly database: LocalStorageDatabase

  constructor(database = new LocalStorageDatabase()) {
    this.database = database
  }

  async exportBackup(): Promise<LocalBackupData> {
    return buildSanitizedBackup(this.database.load())
  }

  async validateImport(jsonText: string): Promise<LocalBackupValidationResult> {
    return validateBackupImport(jsonText)
  }

  async replaceWithValidatedImport(database: ValidatedLocalBackupData): Promise<void> {
    const validatedDatabase = assertValidLocalDatabase({
      ...database,
      version: LOCAL_DATABASE_VERSION,
    })
    this.database.replace(validatedDatabase)
  }

  async resetLocalData(): Promise<void> {
    this.database.reset()
  }
}
