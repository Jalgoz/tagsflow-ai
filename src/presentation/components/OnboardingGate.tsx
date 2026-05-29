import { Outlet } from 'react-router-dom'
import { useOnboardingStatus } from '../../application'
import { OnboardingPage } from '../pages/OnboardingPage'

export const OnboardingGate = () => {
  const onboardingStatusQuery = useOnboardingStatus()

  if (onboardingStatusQuery.isLoading) {
    return <div className="project-state">Loading workspace onboarding...</div>
  }

  if (onboardingStatusQuery.isError) {
    return (
      <div className="project-state project-state--error">
        Unable to load onboarding state.
        <span>{onboardingStatusQuery.error instanceof Error ? onboardingStatusQuery.error.message : 'Unknown error'}</span>
      </div>
    )
  }

  if (onboardingStatusQuery.data?.shouldShowOnboarding) {
    return <OnboardingPage />
  }

  return <Outlet />
}
