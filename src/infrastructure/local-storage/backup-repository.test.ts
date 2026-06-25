import { describe, expect, it } from 'vitest'
import { LOCAL_STORAGE_DATABASE_KEY } from '../../shared'
import { createEmptyLocalDatabase } from './defaults'
import { LocalStorageDatabase } from './database'
import {
  buildSanitizedBackup,
  LocalStorageBackupRepository,
  sanitizeSettingsForBackup,
  validateBackupImport,
} from './backup-repository'
import { createInMemoryStorage } from './testing'

const createPopulatedDatabase = () => ({
  ...createEmptyLocalDatabase(),
  projects: [
    {
      id: 'project-1',
      title: 'Project',
      description: 'Description',
      objective: 'Objective',
      inScopeContent: 'In scope',
      outOfScopeContent: 'Out of scope',
      status: 'active' as const,
      startDate: null,
      dueDate: null,
      memberIds: [],
      taskIds: ['task-1'],
    },
  ],
  tasks: [
    {
      id: 'task-1',
      projectId: 'project-1',
      title: 'Task',
      description: 'Description',
      inScopeContent: 'In scope',
      outOfScopeContent: 'Out of scope',
      priority: 'medium' as const,
      status: 'todo' as const,
      startDate: null,
      dueDate: null,
      assigneeMemberId: null,
      tagIds: ['tag-1'],
      checklist: [],
      subtaskIds: [],
    },
  ],
  tags: [{ id: 'tag-1', name: 'Frontend', color: '#6366f1' }],
  settings: {
    theme: 'dark' as const,
    aiProvider: {
      provider: 'groq' as const,
      apiKey: 'secret-key',
      selectedModelId: 'llama-3.3-70b',
    },
  },
})

describe('local backup repository', () => {
  it('sanitizes secret settings for export', () => {
    const sanitizedSettings = sanitizeSettingsForBackup(createPopulatedDatabase().settings)

    expect(sanitizedSettings).toEqual({
      theme: 'dark',
      aiProvider: {
        provider: 'groq',
        selectedModelId: 'llama-3.3-70b',
        hasApiKey: true,
      },
    })
  })

  it('builds sanitized backup data with supported entities', () => {
    const backup = buildSanitizedBackup(createPopulatedDatabase())

    expect(backup.version).toBe(1)
    expect(backup.projects).toHaveLength(1)
    expect(backup.tasks).toHaveLength(1)
    expect(backup.subtasks).toHaveLength(0)
    expect(backup.members).toHaveLength(0)
    expect(backup.tags).toHaveLength(1)
    expect(backup.settings.aiProvider).toEqual({
      provider: 'groq',
      selectedModelId: 'llama-3.3-70b',
      hasApiKey: true,
    })
    expect('apiKey' in backup.settings.aiProvider).toBe(false)
  })

  it('validates supported import JSON and strips provider secrets', () => {
    const backup = createPopulatedDatabase()
    const result = validateBackupImport(JSON.stringify(backup))

    expect(result.success).toBe(true)

    if (!result.success) {
      return
    }

    expect(result.database.settings.aiProvider.apiKey).toBeNull()
    expect(result.database.settings.aiProvider.selectedModelId).toBe('llama-3.3-70b')
  })

  it('drops future secret-bearing AI provider fields during import sanitization', () => {
    const backup = {
      ...createPopulatedDatabase(),
      settings: {
        ...createPopulatedDatabase().settings,
        aiProvider: {
          ...createPopulatedDatabase().settings.aiProvider,
          apiKey: 'secret-key',
          refreshToken: 'future-secret',
        },
      },
    }
    const result = validateBackupImport(JSON.stringify(backup))

    expect(result.success).toBe(true)
    if (!result.success) {
      return
    }

    expect(result.database.settings.aiProvider).toEqual({
      provider: 'groq',
      apiKey: null,
      selectedModelId: 'llama-3.3-70b',
    })
  })

  it('rejects malformed JSON imports', () => {
    const result = validateBackupImport('{bad json')

    expect(result).toMatchObject({
      success: false,
      code: 'malformed_json',
    })
  })

  it('rejects unsupported backup versions', () => {
    const result = validateBackupImport(
      JSON.stringify({
        ...createEmptyLocalDatabase(),
        version: 2,
      }),
    )

    expect(result).toMatchObject({
      success: false,
      code: 'unsupported_version',
    })
  })

  it('rejects invalid backup shapes', () => {
    const result = validateBackupImport(
      JSON.stringify({
        version: 1,
        projects: [{ id: 'project-1' }],
      }),
    )

    expect(result).toMatchObject({
      success: false,
      code: 'invalid_shape',
    })
  })

  it('replaces local database only after successful validation and supports reset', async () => {
    const storage = createInMemoryStorage()
    const database = new LocalStorageDatabase(storage)
    const repository = new LocalStorageBackupRepository(database)
    const populatedDatabase = createPopulatedDatabase()
    const validation = validateBackupImport(JSON.stringify(populatedDatabase))

    expect(validation.success).toBe(true)
    if (!validation.success) {
      return
    }

    await repository.replaceWithValidatedImport(validation.database)

    const storedAfterReplace = JSON.parse(storage.entries()[LOCAL_STORAGE_DATABASE_KEY] ?? '{}') as {
      settings: { aiProvider: { apiKey: string | null } }
    }

    expect(storedAfterReplace.settings.aiProvider.apiKey).toBeNull()

    await repository.resetLocalData()

    expect(database.load()).toEqual(createEmptyLocalDatabase())
  })

  it('does not mutate stored data when validation fails', async () => {
    const populatedDatabase = createPopulatedDatabase()
    const storage = createInMemoryStorage({
      [LOCAL_STORAGE_DATABASE_KEY]: JSON.stringify(populatedDatabase),
    })
    const repository = new LocalStorageBackupRepository(new LocalStorageDatabase(storage))

    await repository.validateImport('{not valid')

    expect(JSON.parse(storage.entries()[LOCAL_STORAGE_DATABASE_KEY] ?? '{}')).toEqual(populatedDatabase)
  })
})
