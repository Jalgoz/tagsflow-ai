import { describe, expect, it } from 'vitest'
import { LOCAL_STORAGE_ONBOARDING_KEY } from '../../shared'
import { createInMemoryStorage } from './testing'
import { LocalStorageOnboardingStateRepository } from './onboarding-state-repository'

describe('LocalStorageOnboardingStateRepository', () => {
  it('returns default incomplete state when key is missing', async () => {
    const repository = new LocalStorageOnboardingStateRepository(createInMemoryStorage())

    const state = await repository.getState()

    expect(state.completed).toBe(false)
  })

  it('persists completion and reloads it from storage', async () => {
    const storage = createInMemoryStorage()
    const repository = new LocalStorageOnboardingStateRepository(storage)

    await repository.markCompleted()

    expect(JSON.parse(storage.entries()[LOCAL_STORAGE_ONBOARDING_KEY] ?? '{}')).toMatchObject({
      completed: true,
    })
    await expect(repository.getState()).resolves.toMatchObject({
      completed: true,
    })
  })

  it('clears completion state', async () => {
    const storage = createInMemoryStorage({
      [LOCAL_STORAGE_ONBOARDING_KEY]: JSON.stringify({
        version: 1,
        completed: true,
      }),
    })
    const repository = new LocalStorageOnboardingStateRepository(storage)

    await repository.clear()

    expect(storage.getItem(LOCAL_STORAGE_ONBOARDING_KEY)).toBeNull()
    await expect(repository.getState()).resolves.toMatchObject({
      completed: false,
    })
  })
})
