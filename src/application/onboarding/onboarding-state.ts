export const ONBOARDING_STATE_VERSION = 1

export interface OnboardingState {
  version: number
  completed: boolean
}

export const createDefaultOnboardingState = (): OnboardingState => ({
  version: ONBOARDING_STATE_VERSION,
  completed: false,
})
