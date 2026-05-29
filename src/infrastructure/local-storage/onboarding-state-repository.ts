import { z } from 'zod'
import type { OnboardingStateRepository } from '../../application/onboarding/onboarding-state-repository'
import { LOCAL_STORAGE_ONBOARDING_KEY } from '../../shared'
import { createBrowserLocalStorageAdapter } from './database'
import type { LocalStorageAdapter } from './types'
import { createDefaultOnboardingState } from '../../application/onboarding/onboarding-state'

const onboardingStorageSchema = z
  .object({
    version: z.number(),
    completed: z.boolean(),
  })
  .strict()

export class LocalStorageOnboardingStateRepository implements OnboardingStateRepository {
  private readonly key: string
  private readonly storage: LocalStorageAdapter

  constructor(storage: LocalStorageAdapter = createBrowserLocalStorageAdapter(), key = LOCAL_STORAGE_ONBOARDING_KEY) {
    this.storage = storage
    this.key = key
  }

  async getState() {
    const rawState = this.storage.getItem(this.key)

    if (rawState === null || rawState.trim() === '') {
      return createDefaultOnboardingState()
    }

    try {
      const parsedState: unknown = JSON.parse(rawState)
      const result = onboardingStorageSchema.safeParse(parsedState)

      if (!result.success) {
        return createDefaultOnboardingState()
      }

      return {
        version: result.data.version,
        completed: result.data.completed,
      }
    } catch {
      return createDefaultOnboardingState()
    }
  }

  async markCompleted() {
    const completedState = {
      ...createDefaultOnboardingState(),
      completed: true,
    }

    this.storage.setItem(this.key, JSON.stringify(completedState))

    return completedState
  }

  async clear(): Promise<void> {
    this.storage.removeItem(this.key)
  }
}
