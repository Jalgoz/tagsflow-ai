import type { ReactNode } from 'react'
import { OnboardingStateRepositoryContextProvider } from './onboarding-state-context'
import type { OnboardingStateRepository } from './onboarding-state-repository'

interface OnboardingStateRepositoryProviderProps {
  children: ReactNode
  repository: OnboardingStateRepository
}

export const OnboardingStateRepositoryProvider = ({ children, repository }: OnboardingStateRepositoryProviderProps) => (
  <OnboardingStateRepositoryContextProvider value={repository}>{children}</OnboardingStateRepositoryContextProvider>
)
