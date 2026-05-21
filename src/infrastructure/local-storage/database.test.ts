import { describe, expect, it } from 'vitest'

import { LOCAL_STORAGE_DATABASE_KEY } from '../../shared'
import { createEmptyLocalDatabase } from './defaults'
import { LocalStorageDatabase } from './database'
import { createInMemoryStorage } from './testing'
import type { LocalDatabase } from './types'

const createPopulatedDatabase = (): LocalDatabase => ({
  ...createEmptyLocalDatabase(),
  projects: [
    {
      id: 'project-1',
      title: 'Project',
      description: 'Description',
      objective: 'Objective',
      inScopeContent: 'In scope',
      outOfScopeContent: 'Out of scope',
      status: 'active',
      startDate: '2026-05-20',
      dueDate: '2026-06-20',
      memberIds: ['member-1'],
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
      priority: 'high',
      status: 'todo',
      startDate: null,
      dueDate: null,
      assigneeMemberId: 'member-1',
      tagIds: ['tag-1'],
      checklist: [{ text: 'Check', completed: false }],
      subtaskIds: ['subtask-1'],
    },
  ],
  subtasks: [
    {
      id: 'subtask-1',
      taskId: 'task-1',
      title: 'Subtask',
      description: 'Description',
      inScopeContent: 'In scope',
      outOfScopeContent: 'Out of scope',
      priority: 'medium',
      status: 'in_progress',
      startDate: null,
      dueDate: null,
      assigneeMemberId: 'member-1',
      tagIds: ['tag-1'],
      checklist: [],
    },
  ],
  members: [
    {
      id: 'member-1',
      name: 'Ada Lovelace',
      email: 'ada@example.com',
      role: 'Engineer',
      avatar: 'AL',
    },
  ],
  tags: [
    {
      id: 'tag-1',
      name: 'Frontend',
      color: '#6366f1',
    },
  ],
  settings: {
    theme: 'dark',
    aiProvider: {
      provider: 'groq',
      apiKey: 'local-key',
      selectedModelId: 'llama-3.3-70b-versatile',
    },
  },
})

describe('LocalStorageDatabase', () => {
  it('initializes an empty database when storage is missing data', () => {
    const storage = createInMemoryStorage()
    const database = new LocalStorageDatabase(storage)

    const initializedDatabase = database.initialize()

    expect(initializedDatabase).toEqual(createEmptyLocalDatabase())
    expect(JSON.parse(storage.entries()[LOCAL_STORAGE_DATABASE_KEY] ?? '')).toEqual(createEmptyLocalDatabase())
  })

  it('serializes and hydrates a populated database', () => {
    const storage = createInMemoryStorage()
    const database = new LocalStorageDatabase(storage)
    const populatedDatabase = createPopulatedDatabase()

    database.save(populatedDatabase)

    expect(new LocalStorageDatabase(storage).load()).toEqual(populatedDatabase)
  })

  it('recovers from malformed JSON without throwing', () => {
    const storage = createInMemoryStorage({
      [LOCAL_STORAGE_DATABASE_KEY]: '{not-json',
    })
    const database = new LocalStorageDatabase(storage)

    expect(database.load()).toEqual(createEmptyLocalDatabase())
  })

  it('recovers from invalid database shape without exposing invalid data', () => {
    const storage = createInMemoryStorage({
      [LOCAL_STORAGE_DATABASE_KEY]: JSON.stringify({ version: 1, projects: [{ id: 'project-1' }] }),
    })
    const database = new LocalStorageDatabase(storage)

    expect(database.load()).toEqual(createEmptyLocalDatabase())
  })
})
