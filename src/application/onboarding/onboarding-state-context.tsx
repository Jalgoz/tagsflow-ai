import { createContext, useContext } from 'react'
import type { OnboardingStateRepository } from './onboarding-state-repository'

const OnboardingStateRepositoryContext = createContext<OnboardingStateRepository | null>(null)

export const OnboardingStateRepositoryContextProvider = OnboardingStateRepositoryContext.Provider

export const useOnboardingStateRepository = (): OnboardingStateRepository => {
  const repository = useContext(OnboardingStateRepositoryContext)

  if (repository === null) {
    throw new Error('OnboardingStateRepositoryContext was not provided.')
  }

  return repository
}
