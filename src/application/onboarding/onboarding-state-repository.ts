import type { OnboardingState } from './onboarding-state'

export interface OnboardingStateRepository {
  getState(): Promise<OnboardingState>
  markCompleted(): Promise<OnboardingState>
  clear(): Promise<void>
}
